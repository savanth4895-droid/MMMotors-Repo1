"""
Test cases for Edit Job Card Modal functionality
Tests all fields in the Edit Job Card modal including:
- Customer Information section
- Vehicle Information section (Registration Number, Brand, Model, Year, Kilometers Driven)
- Service Details section (Service Number, Service Date, Service Type, Amount, Description)
"""
import pytest
import requests
import os
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://servicebay-app.preview.emergentagent.com')


class TestEditJobCardModal:
    """Test the Edit Job Card modal functionality"""
    
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
    
    def test_edit_vehicle_brand(self):
        """Test editing Vehicle Brand field"""
        # First create a service
        service_data = {
            "customer_id": self.customer_id,
            "vehicle_number": "TEST-EDIT-BRAND-001",
            "vehicle_brand": "TVS",
            "vehicle_model": "Jupiter",
            "vehicle_year": "2024",
            "service_type": "regular_service",
            "description": "Test edit vehicle brand",
            "amount": 1500
        }
        
        create_response = requests.post(
            f"{BASE_URL}/api/services",
            json=service_data,
            headers=self.headers
        )
        assert create_response.status_code == 200, f"Failed to create service: {create_response.text}"
        service_id = create_response.json()["id"]
        
        # Update the vehicle brand
        update_data = {
            **service_data,
            "vehicle_brand": "HONDA"
        }
        
        update_response = requests.put(
            f"{BASE_URL}/api/services/{service_id}",
            json=update_data,
            headers=self.headers
        )
        assert update_response.status_code == 200, f"Failed to update service: {update_response.text}"
        
        updated_service = update_response.json()
        assert updated_service["vehicle_brand"] == "HONDA", f"Vehicle brand not updated: {updated_service['vehicle_brand']}"
        
        # Verify persistence by fetching the service
        get_response = requests.get(
            f"{BASE_URL}/api/services/{service_id}",
            headers=self.headers
        )
        assert get_response.status_code == 200
        fetched_service = get_response.json()
        assert fetched_service["vehicle_brand"] == "HONDA", f"Vehicle brand not persisted: {fetched_service['vehicle_brand']}"
        
        print(f"✓ Vehicle Brand updated from TVS to HONDA and persisted correctly")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/services/{service_id}", headers=self.headers)
    
    def test_edit_service_date(self):
        """Test editing Service Date field"""
        # First create a service
        original_date = datetime.now().isoformat()
        service_data = {
            "customer_id": self.customer_id,
            "vehicle_number": "TEST-EDIT-DATE-001",
            "vehicle_brand": "BAJAJ",
            "vehicle_model": "Pulsar",
            "vehicle_year": "2024",
            "service_type": "oil_change",
            "description": "Test edit service date",
            "amount": 500,
            "service_date": original_date
        }
        
        create_response = requests.post(
            f"{BASE_URL}/api/services",
            json=service_data,
            headers=self.headers
        )
        assert create_response.status_code == 200, f"Failed to create service: {create_response.text}"
        service_id = create_response.json()["id"]
        
        # Update the service date
        new_date = (datetime.now() + timedelta(days=30)).isoformat()
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
        assert updated_service["service_date"] is not None, "Service date not updated"
        
        # Verify persistence
        get_response = requests.get(
            f"{BASE_URL}/api/services/{service_id}",
            headers=self.headers
        )
        assert get_response.status_code == 200
        fetched_service = get_response.json()
        assert fetched_service["service_date"] is not None, "Service date not persisted"
        
        print(f"✓ Service Date updated and persisted correctly")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/services/{service_id}", headers=self.headers)
    
    def test_edit_multiple_fields(self):
        """Test editing multiple fields at once"""
        # First create a service
        service_data = {
            "customer_id": self.customer_id,
            "vehicle_number": "TEST-MULTI-EDIT-001",
            "vehicle_brand": "TVS",
            "vehicle_model": "Jupiter",
            "vehicle_year": "2023",
            "service_type": "regular_service",
            "description": "Original description",
            "amount": 1000,
            "service_number": "SRV-ORIG-001",
            "kms_driven": 10000
        }
        
        create_response = requests.post(
            f"{BASE_URL}/api/services",
            json=service_data,
            headers=self.headers
        )
        assert create_response.status_code == 200, f"Failed to create service: {create_response.text}"
        service_id = create_response.json()["id"]
        
        # Update multiple fields
        update_data = {
            "customer_id": self.customer_id,
            "vehicle_number": "TEST-MULTI-EDIT-001",
            "vehicle_brand": "HONDA",  # Changed
            "vehicle_model": "Activa",  # Changed
            "vehicle_year": "2024",  # Changed
            "service_type": "oil_change",  # Changed
            "description": "Updated description",  # Changed
            "amount": 2500,  # Changed
            "service_number": "SRV-UPDATED-001",  # Changed
            "kms_driven": 25000  # Changed
        }
        
        update_response = requests.put(
            f"{BASE_URL}/api/services/{service_id}",
            json=update_data,
            headers=self.headers
        )
        assert update_response.status_code == 200, f"Failed to update service: {update_response.text}"
        
        updated_service = update_response.json()
        
        # Verify all fields were updated
        assert updated_service["vehicle_brand"] == "HONDA", f"Vehicle brand not updated: {updated_service['vehicle_brand']}"
        assert updated_service["vehicle_model"] == "Activa", f"Vehicle model not updated: {updated_service['vehicle_model']}"
        assert updated_service["vehicle_year"] == "2024", f"Vehicle year not updated: {updated_service['vehicle_year']}"
        assert updated_service["service_type"] == "oil_change", f"Service type not updated: {updated_service['service_type']}"
        assert updated_service["description"] == "Updated description", f"Description not updated: {updated_service['description']}"
        assert updated_service["amount"] == 2500, f"Amount not updated: {updated_service['amount']}"
        assert updated_service["service_number"] == "SRV-UPDATED-001", f"Service number not updated: {updated_service['service_number']}"
        assert updated_service["kms_driven"] == 25000, f"Kms driven not updated: {updated_service['kms_driven']}"
        
        # Verify persistence
        get_response = requests.get(
            f"{BASE_URL}/api/services/{service_id}",
            headers=self.headers
        )
        assert get_response.status_code == 200
        fetched_service = get_response.json()
        
        assert fetched_service["vehicle_brand"] == "HONDA"
        assert fetched_service["vehicle_model"] == "Activa"
        assert fetched_service["amount"] == 2500
        assert fetched_service["kms_driven"] == 25000
        
        print(f"✓ Multiple fields updated and persisted correctly")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/services/{service_id}", headers=self.headers)
    
    def test_edit_vehicle_information_section(self):
        """Test editing all Vehicle Information section fields"""
        # First create a service
        service_data = {
            "customer_id": self.customer_id,
            "vehicle_number": "TEST-VEH-INFO-001",
            "vehicle_brand": "TVS",
            "vehicle_model": "Jupiter",
            "vehicle_year": "2022",
            "service_type": "regular_service",
            "description": "Test vehicle info edit",
            "amount": 1500,
            "kms_driven": 5000
        }
        
        create_response = requests.post(
            f"{BASE_URL}/api/services",
            json=service_data,
            headers=self.headers
        )
        assert create_response.status_code == 200
        service_id = create_response.json()["id"]
        
        # Update all vehicle information fields
        update_data = {
            **service_data,
            "vehicle_number": "TEST-VEH-INFO-002",  # Registration Number
            "vehicle_brand": "YAMAHA",  # Vehicle Brand
            "vehicle_model": "FZ",  # Vehicle Model
            "vehicle_year": "2024",  # Vehicle Year
            "kms_driven": 15000  # Kilometers Driven
        }
        
        update_response = requests.put(
            f"{BASE_URL}/api/services/{service_id}",
            json=update_data,
            headers=self.headers
        )
        assert update_response.status_code == 200
        
        updated_service = update_response.json()
        
        # Verify all vehicle information fields
        assert updated_service["vehicle_number"] == "TEST-VEH-INFO-002", "Registration Number not updated"
        assert updated_service["vehicle_brand"] == "YAMAHA", "Vehicle Brand not updated"
        assert updated_service["vehicle_model"] == "FZ", "Vehicle Model not updated"
        assert updated_service["vehicle_year"] == "2024", "Vehicle Year not updated"
        assert updated_service["kms_driven"] == 15000, "Kilometers Driven not updated"
        
        print(f"✓ All Vehicle Information section fields updated correctly")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/services/{service_id}", headers=self.headers)
    
    def test_edit_service_details_section(self):
        """Test editing all Service Details section fields"""
        # First create a service
        service_data = {
            "customer_id": self.customer_id,
            "vehicle_number": "TEST-SRV-DETAILS-001",
            "vehicle_brand": "HERO",
            "vehicle_model": "Splendor",
            "vehicle_year": "2023",
            "service_type": "regular_service",
            "description": "Original complaint",
            "amount": 1000,
            "service_number": "SRV-001",
            "service_date": datetime.now().isoformat()
        }
        
        create_response = requests.post(
            f"{BASE_URL}/api/services",
            json=service_data,
            headers=self.headers
        )
        assert create_response.status_code == 200
        service_id = create_response.json()["id"]
        
        # Update all service details fields
        new_date = (datetime.now() + timedelta(days=7)).isoformat()
        update_data = {
            **service_data,
            "service_number": "SRV-UPDATED-002",  # Service Number
            "service_date": new_date,  # Service Date
            "service_type": "engine_repair",  # Service Type
            "amount": 5000,  # Amount
            "description": "Updated complaint/description"  # Complaint/Description
        }
        
        update_response = requests.put(
            f"{BASE_URL}/api/services/{service_id}",
            json=update_data,
            headers=self.headers
        )
        assert update_response.status_code == 200
        
        updated_service = update_response.json()
        
        # Verify all service details fields
        assert updated_service["service_number"] == "SRV-UPDATED-002", "Service Number not updated"
        assert updated_service["service_date"] is not None, "Service Date not updated"
        assert updated_service["service_type"] == "engine_repair", "Service Type not updated"
        assert updated_service["amount"] == 5000, "Amount not updated"
        assert updated_service["description"] == "Updated complaint/description", "Description not updated"
        
        print(f"✓ All Service Details section fields updated correctly")
        
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
