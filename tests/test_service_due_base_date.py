"""
Test Service Due Base Date Edit Feature
Tests the editable Base Date column in the Service Due Schedule table
"""
import pytest
import requests
import os
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://autofix-system-9.preview.emergentagent.com')

class TestServiceDueBaseDateAPI:
    """Test the service-due-base-date API endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup - login and get token"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login to get token
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        assert login_response.status_code == 200, f"Login failed: {login_response.text}"
        
        token = login_response.json().get("access_token")
        assert token, "No access token received"
        
        self.session.headers.update({"Authorization": f"Bearer {token}"})
        self.token = token
        
        # Test key for cleanup
        self.test_key = f"TEST-BASE-DATE-{datetime.now().strftime('%Y%m%d%H%M%S')}"
        
        yield
        
        # Cleanup - delete test records
        try:
            self.session.delete(f"{BASE_URL}/api/service-due-base-date/{self.test_key}")
        except:
            pass
    
    def test_get_base_date_overrides_empty_or_list(self):
        """Test GET /api/service-due-base-date returns list"""
        response = self.session.get(f"{BASE_URL}/api/service-due-base-date")
        assert response.status_code == 200, f"Failed to get base date overrides: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"✓ GET /api/service-due-base-date returns list with {len(data)} items")
    
    def test_create_base_date_override(self):
        """Test POST /api/service-due-base-date creates new override"""
        custom_date = (datetime.now() - timedelta(days=30)).isoformat()
        
        response = self.session.post(f"{BASE_URL}/api/service-due-base-date", json={
            "service_due_key": self.test_key,
            "custom_base_date": custom_date,
            "notes": "Test override"
        })
        
        assert response.status_code == 200, f"Failed to create base date override: {response.text}"
        
        data = response.json()
        assert "message" in data, "Response should contain message"
        assert "created" in data["message"].lower() or "updated" in data["message"].lower(), \
            f"Unexpected message: {data['message']}"
        print(f"✓ POST /api/service-due-base-date creates override successfully")
    
    def test_update_existing_base_date_override(self):
        """Test POST /api/service-due-base-date updates existing override"""
        # First create
        initial_date = (datetime.now() - timedelta(days=30)).isoformat()
        self.session.post(f"{BASE_URL}/api/service-due-base-date", json={
            "service_due_key": self.test_key,
            "custom_base_date": initial_date,
            "notes": "Initial"
        })
        
        # Then update
        updated_date = (datetime.now() - timedelta(days=60)).isoformat()
        response = self.session.post(f"{BASE_URL}/api/service-due-base-date", json={
            "service_due_key": self.test_key,
            "custom_base_date": updated_date,
            "notes": "Updated"
        })
        
        assert response.status_code == 200, f"Failed to update base date override: {response.text}"
        
        data = response.json()
        assert "updated" in data["message"].lower(), f"Expected update message, got: {data['message']}"
        print(f"✓ POST /api/service-due-base-date updates existing override")
    
    def test_verify_override_persisted(self):
        """Test that created override is persisted and retrievable"""
        custom_date = (datetime.now() - timedelta(days=45)).isoformat()
        
        # Create override
        self.session.post(f"{BASE_URL}/api/service-due-base-date", json={
            "service_due_key": self.test_key,
            "custom_base_date": custom_date,
            "notes": "Persistence test"
        })
        
        # Verify it's in the list
        response = self.session.get(f"{BASE_URL}/api/service-due-base-date")
        assert response.status_code == 200
        
        data = response.json()
        found = any(item.get("service_due_key") == self.test_key for item in data)
        assert found, f"Override with key {self.test_key} not found in list"
        print(f"✓ Base date override is persisted and retrievable")
    
    def test_delete_base_date_override(self):
        """Test DELETE /api/service-due-base-date/{key} removes override"""
        # First create
        custom_date = datetime.now().isoformat()
        self.session.post(f"{BASE_URL}/api/service-due-base-date", json={
            "service_due_key": self.test_key,
            "custom_base_date": custom_date
        })
        
        # Then delete
        response = self.session.delete(f"{BASE_URL}/api/service-due-base-date/{self.test_key}")
        assert response.status_code == 200, f"Failed to delete base date override: {response.text}"
        
        data = response.json()
        assert "removed" in data["message"].lower() or "deleted" in data["message"].lower(), \
            f"Unexpected message: {data['message']}"
        print(f"✓ DELETE /api/service-due-base-date/{{key}} removes override")
    
    def test_delete_nonexistent_override_returns_404(self):
        """Test DELETE for non-existent key returns 404"""
        response = self.session.delete(f"{BASE_URL}/api/service-due-base-date/NONEXISTENT-KEY-12345")
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print(f"✓ DELETE non-existent key returns 404")
    
    def test_create_without_required_fields_returns_400(self):
        """Test POST without required fields returns 400"""
        # Missing custom_base_date
        response = self.session.post(f"{BASE_URL}/api/service-due-base-date", json={
            "service_due_key": self.test_key
        })
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        
        # Missing service_due_key
        response = self.session.post(f"{BASE_URL}/api/service-due-base-date", json={
            "custom_base_date": datetime.now().isoformat()
        })
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        print(f"✓ POST without required fields returns 400")
    
    def test_invalid_date_format_returns_400(self):
        """Test POST with invalid date format returns 400"""
        response = self.session.post(f"{BASE_URL}/api/service-due-base-date", json={
            "service_due_key": self.test_key,
            "custom_base_date": "not-a-valid-date"
        })
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        print(f"✓ POST with invalid date format returns 400")
    
    def test_unauthorized_access_returns_401(self):
        """Test endpoints without auth return 401"""
        # Create new session without auth
        unauth_session = requests.Session()
        unauth_session.headers.update({"Content-Type": "application/json"})
        
        # GET
        response = unauth_session.get(f"{BASE_URL}/api/service-due-base-date")
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        
        # POST
        response = unauth_session.post(f"{BASE_URL}/api/service-due-base-date", json={
            "service_due_key": "test",
            "custom_base_date": datetime.now().isoformat()
        })
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        
        # DELETE
        response = unauth_session.delete(f"{BASE_URL}/api/service-due-base-date/test")
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        
        print(f"✓ Unauthorized access returns 401/403")


class TestServiceDueBaseDateIntegration:
    """Integration tests for base date feature with service due data"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup - login and get token"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        assert login_response.status_code == 200
        
        token = login_response.json().get("access_token")
        self.session.headers.update({"Authorization": f"Bearer {token}"})
        
        yield
    
    def test_services_endpoint_available(self):
        """Test that services endpoint is available for service due calculation"""
        response = self.session.get(f"{BASE_URL}/api/services")
        assert response.status_code == 200, f"Services endpoint failed: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Services should return a list"
        print(f"✓ Services endpoint returns {len(data)} services")
    
    def test_sales_endpoint_available(self):
        """Test that sales endpoint is available for service due calculation"""
        response = self.session.get(f"{BASE_URL}/api/sales")
        assert response.status_code == 200, f"Sales endpoint failed: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Sales should return a list"
        print(f"✓ Sales endpoint returns {len(data)} sales")
    
    def test_customers_endpoint_available(self):
        """Test that customers endpoint is available for service due calculation"""
        response = self.session.get(f"{BASE_URL}/api/customers", params={
            "page": 1,
            "limit": 10
        })
        assert response.status_code == 200, f"Customers endpoint failed: {response.text}"
        print(f"✓ Customers endpoint is available")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
