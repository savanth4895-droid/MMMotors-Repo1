"""
Test cases for Service Date field functionality in Job Cards
Tests:
1. Service Date field in New Job Card form (defaults to today)
2. Service Date column in Job Cards table
3. Service Date editable in Edit Job Card modal
4. Service Date persisted correctly in database
"""
import pytest
import requests
import os
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://servicebay-app.preview.emergentagent.com')


class TestServiceDateField:
    """Test the Service Date field functionality"""
    
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
    
    def test_create_job_card_with_service_date(self):
        """Test creating a job card with a specific service date"""
        # Create a service with a specific service date
        test_date = "2025-12-15T00:00:00"
        service_data = {
            "customer_id": self.customer_id,
            "vehicle_number": "TEST-SRVDATE-001",
            "vehicle_brand": "TVS",
            "vehicle_model": "Jupiter",
            "vehicle_year": "2024",
            "service_type": "regular_service",
            "description": "TEST: Service Date field testing",
            "amount": 1500,
            "service_date": test_date
        }
        
        create_response = requests.post(
            f"{BASE_URL}/api/services",
            json=service_data,
            headers=self.headers
        )
        assert create_response.status_code == 200, f"Failed to create service: {create_response.text}"
        
        created_service = create_response.json()
        service_id = created_service["id"]
        
        # Verify service_date was saved
        assert created_service.get("service_date") is not None, "Service date not returned in response"
        print(f"✓ Created job card with service_date: {created_service['service_date']}")
        
        # Verify persistence by fetching the service
        get_response = requests.get(
            f"{BASE_URL}/api/services/{service_id}",
            headers=self.headers
        )
        assert get_response.status_code == 200
        fetched_service = get_response.json()
        
        assert fetched_service.get("service_date") is not None, "Service date not persisted"
        # Check if the date matches (comparing date part only)
        fetched_date = fetched_service["service_date"][:10]
        expected_date = test_date[:10]
        assert fetched_date == expected_date, f"Service date mismatch: expected {expected_date}, got {fetched_date}"
        print(f"✓ Service date persisted correctly: {fetched_date}")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/services/{service_id}", headers=self.headers)
    
    def test_create_job_card_with_today_date(self):
        """Test creating a job card with today's date (default behavior)"""
        today = datetime.now().strftime('%Y-%m-%d')
        service_data = {
            "customer_id": self.customer_id,
            "vehicle_number": "TEST-SRVDATE-TODAY",
            "vehicle_brand": "HONDA",
            "vehicle_model": "Activa",
            "vehicle_year": "2024",
            "service_type": "oil_change",
            "description": "TEST: Today's date service",
            "amount": 500,
            "service_date": f"{today}T00:00:00"
        }
        
        create_response = requests.post(
            f"{BASE_URL}/api/services",
            json=service_data,
            headers=self.headers
        )
        assert create_response.status_code == 200, f"Failed to create service: {create_response.text}"
        
        created_service = create_response.json()
        service_id = created_service["id"]
        
        # Verify service_date matches today
        fetched_date = created_service["service_date"][:10]
        assert fetched_date == today, f"Service date should be today: expected {today}, got {fetched_date}"
        print(f"✓ Job card created with today's date: {fetched_date}")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/services/{service_id}", headers=self.headers)
    
    def test_edit_service_date(self):
        """Test editing the service date of an existing job card"""
        # First create a service
        original_date = datetime.now().strftime('%Y-%m-%dT00:00:00')
        service_data = {
            "customer_id": self.customer_id,
            "vehicle_number": "TEST-SRVDATE-EDIT",
            "vehicle_brand": "BAJAJ",
            "vehicle_model": "Pulsar",
            "vehicle_year": "2024",
            "service_type": "brake_service",
            "description": "TEST: Edit service date",
            "amount": 2000,
            "service_date": original_date
        }
        
        create_response = requests.post(
            f"{BASE_URL}/api/services",
            json=service_data,
            headers=self.headers
        )
        assert create_response.status_code == 200, f"Failed to create service: {create_response.text}"
        service_id = create_response.json()["id"]
        
        # Update the service date to a new date
        new_date = (datetime.now() + timedelta(days=30)).strftime('%Y-%m-%dT00:00:00')
        update_data = {
            **service_data,
            "service_date": new_date
        }
        
        update_response = requests.put(
            f"{BASE_URL}/api/services/{service_id}",
            json=update_data,
            headers=self.headers
        )
        assert update_response.status_code == 200, f"Failed to update service: {update_response.text}"
        
        updated_service = update_response.json()
        updated_date = updated_service["service_date"][:10]
        expected_date = new_date[:10]
        assert updated_date == expected_date, f"Service date not updated: expected {expected_date}, got {updated_date}"
        print(f"✓ Service date updated from {original_date[:10]} to {updated_date}")
        
        # Verify persistence
        get_response = requests.get(
            f"{BASE_URL}/api/services/{service_id}",
            headers=self.headers
        )
        assert get_response.status_code == 200
        fetched_service = get_response.json()
        fetched_date = fetched_service["service_date"][:10]
        assert fetched_date == expected_date, f"Service date not persisted after edit: expected {expected_date}, got {fetched_date}"
        print(f"✓ Edited service date persisted correctly: {fetched_date}")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/services/{service_id}", headers=self.headers)
    
    def test_service_date_in_list_response(self):
        """Test that service_date is included in the services list response"""
        # Create a service with a specific date
        test_date = "2025-11-20T00:00:00"
        service_data = {
            "customer_id": self.customer_id,
            "vehicle_number": "TEST-SRVDATE-LIST",
            "vehicle_brand": "HERO",
            "vehicle_model": "Splendor",
            "vehicle_year": "2023",
            "service_type": "general_checkup",
            "description": "TEST: Service date in list",
            "amount": 800,
            "service_date": test_date
        }
        
        create_response = requests.post(
            f"{BASE_URL}/api/services",
            json=service_data,
            headers=self.headers
        )
        assert create_response.status_code == 200
        service_id = create_response.json()["id"]
        
        # Get all services and check if service_date is present
        list_response = requests.get(
            f"{BASE_URL}/api/services",
            headers=self.headers
        )
        assert list_response.status_code == 200
        
        services = list_response.json()
        # Find our test service
        test_service = next((s for s in services if s["id"] == service_id), None)
        assert test_service is not None, "Test service not found in list"
        assert "service_date" in test_service, "service_date field missing from list response"
        assert test_service["service_date"] is not None, "service_date is null in list response"
        
        fetched_date = test_service["service_date"][:10]
        expected_date = test_date[:10]
        assert fetched_date == expected_date, f"Service date in list doesn't match: expected {expected_date}, got {fetched_date}"
        print(f"✓ Service date correctly included in list response: {fetched_date}")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/services/{service_id}", headers=self.headers)
    
    def test_service_date_null_handling(self):
        """Test creating a service without service_date (should default or be null)"""
        service_data = {
            "customer_id": self.customer_id,
            "vehicle_number": "TEST-SRVDATE-NULL",
            "vehicle_brand": "YAMAHA",
            "vehicle_model": "FZ",
            "vehicle_year": "2024",
            "service_type": "tire_replacement",
            "description": "TEST: No service date provided",
            "amount": 3000
            # service_date intentionally omitted
        }
        
        create_response = requests.post(
            f"{BASE_URL}/api/services",
            json=service_data,
            headers=self.headers
        )
        assert create_response.status_code == 200, f"Failed to create service: {create_response.text}"
        
        created_service = create_response.json()
        service_id = created_service["id"]
        
        # Service date can be null or default to current date
        print(f"✓ Service created without explicit service_date. Value: {created_service.get('service_date')}")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/services/{service_id}", headers=self.headers)


class TestHealthCheck:
    """Basic health check tests"""
    
    def test_api_health(self):
        """Test API health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"
        print("✓ API health check passed")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
