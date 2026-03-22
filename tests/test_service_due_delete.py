"""
Test Service Due Delete Functionality
Tests for single delete and bulk delete of service due records
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://servicebay-app.preview.emergentagent.com').rstrip('/')

class TestServiceDueDelete:
    """Test dismissed service due endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup - get auth token"""
        # Login to get token
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        self.token = response.json()["access_token"]
        self.headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }
        
    def test_01_get_dismissed_service_due_empty_or_existing(self):
        """Test GET /api/dismissed-service-due - should return list"""
        response = requests.get(f"{BASE_URL}/api/dismissed-service-due", headers=self.headers)
        assert response.status_code == 200, f"Failed to get dismissed records: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"✓ GET dismissed-service-due returned {len(data)} records")
        
    def test_02_dismiss_single_service_due(self):
        """Test POST /api/dismissed-service-due - dismiss single record"""
        test_key = f"TEST-{uuid.uuid4().hex[:8]}"
        payload = {
            "service_due_key": test_key,
            "customer_id": "test-customer-123",
            "customer_name": "Test Customer",
            "vehicle_reg_no": "TEST-VEH-001",
            "reason": "Test dismissal"
        }
        
        response = requests.post(f"{BASE_URL}/api/dismissed-service-due", 
                                json=payload, 
                                headers=self.headers)
        assert response.status_code == 200, f"Failed to dismiss record: {response.text}"
        data = response.json()
        assert "message" in data, "Response should contain message"
        assert "id" in data, "Response should contain id"
        print(f"✓ Single dismiss successful: {data['message']}")
        
        # Store for cleanup
        self.test_key = test_key
        
    def test_03_verify_dismissed_record_exists(self):
        """Verify the dismissed record was created"""
        response = requests.get(f"{BASE_URL}/api/dismissed-service-due", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        
        # Check if any TEST- prefixed records exist
        test_records = [r for r in data if r.get('service_due_key', '').startswith('TEST-')]
        assert len(test_records) > 0, "Test dismissed record should exist"
        print(f"✓ Found {len(test_records)} test dismissed records")
        
    def test_04_bulk_dismiss_service_due(self):
        """Test POST /api/dismissed-service-due/bulk - bulk dismiss records"""
        items = [
            {
                "service_due_key": f"BULK-TEST-{uuid.uuid4().hex[:8]}",
                "customer_id": "bulk-customer-1",
                "customer_name": "Bulk Customer 1",
                "vehicle_reg_no": "BULK-VEH-001",
                "reason": "Bulk test dismissal"
            },
            {
                "service_due_key": f"BULK-TEST-{uuid.uuid4().hex[:8]}",
                "customer_id": "bulk-customer-2",
                "customer_name": "Bulk Customer 2",
                "vehicle_reg_no": "BULK-VEH-002",
                "reason": "Bulk test dismissal"
            },
            {
                "service_due_key": f"BULK-TEST-{uuid.uuid4().hex[:8]}",
                "customer_id": "bulk-customer-3",
                "customer_name": "Bulk Customer 3",
                "vehicle_reg_no": "BULK-VEH-003",
                "reason": "Bulk test dismissal"
            }
        ]
        
        response = requests.post(f"{BASE_URL}/api/dismissed-service-due/bulk",
                                json={"items": items},
                                headers=self.headers)
        assert response.status_code == 200, f"Bulk dismiss failed: {response.text}"
        data = response.json()
        assert "count" in data, "Response should contain count"
        assert data["count"] == 3, f"Should have dismissed 3 records, got {data['count']}"
        print(f"✓ Bulk dismiss successful: {data['message']}")
        
    def test_05_verify_bulk_dismissed_records(self):
        """Verify bulk dismissed records were created"""
        response = requests.get(f"{BASE_URL}/api/dismissed-service-due", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        
        # Check for BULK-TEST- prefixed records
        bulk_records = [r for r in data if r.get('service_due_key', '').startswith('BULK-TEST-')]
        assert len(bulk_records) >= 3, f"Should have at least 3 bulk test records, found {len(bulk_records)}"
        print(f"✓ Found {len(bulk_records)} bulk test dismissed records")
        
    def test_06_restore_dismissed_record(self):
        """Test DELETE /api/dismissed-service-due/{key} - restore a dismissed record"""
        # First get all dismissed records
        response = requests.get(f"{BASE_URL}/api/dismissed-service-due", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        
        # Find a test record to restore
        test_records = [r for r in data if r.get('service_due_key', '').startswith('TEST-') or 
                       r.get('service_due_key', '').startswith('BULK-TEST-')]
        
        if test_records:
            key_to_restore = test_records[0]['service_due_key']
            response = requests.delete(f"{BASE_URL}/api/dismissed-service-due/{key_to_restore}",
                                      headers=self.headers)
            assert response.status_code == 200, f"Failed to restore record: {response.text}"
            data = response.json()
            assert "message" in data, "Response should contain message"
            print(f"✓ Restore successful: {data['message']}")
        else:
            print("⚠ No test records to restore")
            
    def test_07_bulk_dismiss_empty_items(self):
        """Test bulk dismiss with empty items - should return 400"""
        response = requests.post(f"{BASE_URL}/api/dismissed-service-due/bulk",
                                json={"items": []},
                                headers=self.headers)
        assert response.status_code == 400, f"Should return 400 for empty items, got {response.status_code}"
        print("✓ Empty bulk dismiss correctly returns 400")
        
    def test_08_restore_nonexistent_record(self):
        """Test restore of non-existent record - should return 404"""
        response = requests.delete(f"{BASE_URL}/api/dismissed-service-due/nonexistent-key-12345",
                                  headers=self.headers)
        assert response.status_code == 404, f"Should return 404 for non-existent key, got {response.status_code}"
        print("✓ Non-existent restore correctly returns 404")


class TestServiceDueEndpointsAuth:
    """Test authentication requirements for dismissed service due endpoints"""
    
    def test_get_without_auth(self):
        """GET without auth should return 401 or 403"""
        response = requests.get(f"{BASE_URL}/api/dismissed-service-due")
        assert response.status_code in [401, 403], f"Should return 401/403 without auth, got {response.status_code}"
        print(f"✓ GET without auth correctly returns {response.status_code}")
        
    def test_post_without_auth(self):
        """POST without auth should return 401 or 403"""
        response = requests.post(f"{BASE_URL}/api/dismissed-service-due", json={
            "service_due_key": "test",
            "customer_name": "test"
        })
        assert response.status_code in [401, 403], f"Should return 401/403 without auth, got {response.status_code}"
        print(f"✓ POST without auth correctly returns {response.status_code}")
        
    def test_bulk_without_auth(self):
        """Bulk POST without auth should return 401 or 403"""
        response = requests.post(f"{BASE_URL}/api/dismissed-service-due/bulk", json={
            "items": []
        })
        assert response.status_code in [401, 403], f"Should return 401/403 without auth, got {response.status_code}"
        print(f"✓ Bulk POST without auth correctly returns {response.status_code}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
