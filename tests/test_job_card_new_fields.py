"""
Test cases for Job Card new fields: service_number and kms_driven
These fields were added to the Service model for the 'Open New Job Card' form
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://autofix-system-9.preview.emergentagent.com')

class TestJobCardNewFields:
    """Test the new service_number and kms_driven fields in Job Cards"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test fixtures - login and get token"""
        # Login to get auth token
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"username": "admin", "password": "admin123"}
        )
        assert login_response.status_code == 200, f"Login failed: {login_response.text}"
        
        self.token = login_response.json()["access_token"]
        self.headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }
        
        # Get a customer ID for testing
        customers_response = requests.get(
            f"{BASE_URL}/api/customers?page=1&limit=1",
            headers=self.headers
        )
        assert customers_response.status_code == 200
        customers_data = customers_response.json()
        self.customer_id = customers_data['data'][0]['id']
    
    def test_create_service_with_new_fields(self):
        """Test creating a service/job card with service_number and kms_driven fields"""
        # Create service with new fields
        service_data = {
            "customer_id": self.customer_id,
            "vehicle_number": "TEST-NEW-FIELDS-001",
            "vehicle_brand": "TVS",
            "vehicle_model": "Jupiter",
            "vehicle_year": "2024",
            "service_type": "regular_service",
            "description": "Test service with new fields",
            "amount": 1500,
            "service_number": "SRV-TEST-NEW-001",
            "kms_driven": 30000
        }
        
        response = requests.post(
            f"{BASE_URL}/api/services",
            json=service_data,
            headers=self.headers
        )
        
        # Verify creation was successful
        assert response.status_code == 200, f"Failed to create service: {response.text}"
        
        created_service = response.json()
        
        # Verify new fields are present and have correct values
        assert "service_number" in created_service, "service_number field missing in response"
        assert "kms_driven" in created_service, "kms_driven field missing in response"
        assert created_service["service_number"] == "SRV-TEST-NEW-001", f"service_number mismatch: {created_service['service_number']}"
        assert created_service["kms_driven"] == 30000, f"kms_driven mismatch: {created_service['kms_driven']}"
        
        # Store service ID for cleanup
        self.created_service_id = created_service["id"]
        
        print(f"✓ Created service with service_number={created_service['service_number']}, kms_driven={created_service['kms_driven']}")
    
    def test_create_service_with_null_new_fields(self):
        """Test creating a service without the new optional fields"""
        service_data = {
            "customer_id": self.customer_id,
            "vehicle_number": "TEST-NULL-FIELDS-001",
            "vehicle_brand": "HERO",
            "vehicle_model": "Splendor",
            "vehicle_year": "2023",
            "service_type": "oil_change",
            "description": "Test service without new fields",
            "amount": 500
            # service_number and kms_driven are not provided
        }
        
        response = requests.post(
            f"{BASE_URL}/api/services",
            json=service_data,
            headers=self.headers
        )
        
        assert response.status_code == 200, f"Failed to create service: {response.text}"
        
        created_service = response.json()
        
        # Verify new fields are present but null
        assert "service_number" in created_service, "service_number field missing in response"
        assert "kms_driven" in created_service, "kms_driven field missing in response"
        assert created_service["service_number"] is None, f"service_number should be null: {created_service['service_number']}"
        assert created_service["kms_driven"] is None, f"kms_driven should be null: {created_service['kms_driven']}"
        
        print(f"✓ Created service with null service_number and kms_driven")
    
    def test_get_services_includes_new_fields(self):
        """Test that GET /services returns the new fields"""
        response = requests.get(
            f"{BASE_URL}/api/services",
            headers=self.headers
        )
        
        assert response.status_code == 200, f"Failed to get services: {response.text}"
        
        services = response.json()
        assert len(services) > 0, "No services found"
        
        # Check that all services have the new fields
        for service in services[:5]:  # Check first 5 services
            assert "service_number" in service, f"service_number field missing in service {service.get('id')}"
            assert "kms_driven" in service, f"kms_driven field missing in service {service.get('id')}"
        
        print(f"✓ GET /services returns service_number and kms_driven fields")
    
    def test_update_service_with_new_fields(self):
        """Test updating a service with the new fields"""
        # First create a service
        service_data = {
            "customer_id": self.customer_id,
            "vehicle_number": "TEST-UPDATE-001",
            "vehicle_brand": "BAJAJ",
            "vehicle_model": "Pulsar",
            "vehicle_year": "2024",
            "service_type": "brake_service",
            "description": "Test service for update",
            "amount": 2000,
            "service_number": "SRV-ORIG-001",
            "kms_driven": 10000
        }
        
        create_response = requests.post(
            f"{BASE_URL}/api/services",
            json=service_data,
            headers=self.headers
        )
        assert create_response.status_code == 200
        created_service = create_response.json()
        service_id = created_service["id"]
        
        # Update the service with new values for the new fields
        update_data = {
            "customer_id": self.customer_id,
            "vehicle_number": "TEST-UPDATE-001",
            "vehicle_brand": "BAJAJ",
            "vehicle_model": "Pulsar",
            "vehicle_year": "2024",
            "service_type": "brake_service",
            "description": "Updated test service",
            "amount": 2500,
            "service_number": "SRV-UPDATED-001",
            "kms_driven": 15000
        }
        
        update_response = requests.put(
            f"{BASE_URL}/api/services/{service_id}",
            json=update_data,
            headers=self.headers
        )
        
        assert update_response.status_code == 200, f"Failed to update service: {update_response.text}"
        
        updated_service = update_response.json()
        
        # Verify updated values
        assert updated_service["service_number"] == "SRV-UPDATED-001", f"service_number not updated: {updated_service['service_number']}"
        assert updated_service["kms_driven"] == 15000, f"kms_driven not updated: {updated_service['kms_driven']}"
        
        print(f"✓ Updated service with service_number={updated_service['service_number']}, kms_driven={updated_service['kms_driven']}")


class TestHealthCheck:
    """Basic health check tests"""
    
    def test_api_health(self):
        """Test API health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"
        print("✓ API health check passed")
    
    def test_api_ready(self):
        """Test API readiness endpoint"""
        response = requests.get(f"{BASE_URL}/api/ready")
        assert response.status_code == 200
        assert response.json()["status"] == "ready"
        print("✓ API readiness check passed")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
