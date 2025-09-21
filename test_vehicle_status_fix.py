#!/usr/bin/env python3
"""
Test the Vehicle Status Update Fix
Testing the new PUT /api/vehicles/{vehicle_id}/status endpoint
"""

import requests
import json
from datetime import datetime, timezone

class VehicleStatusFixTester:
    def __init__(self, base_url="https://mmmotors-invoicing.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        
    def authenticate(self, username="admin", password="admin123"):
        """Authenticate and get JWT token"""
        url = f"{self.base_url}/auth/login"
        response = requests.post(url, json={"username": username, "password": password})
        
        if response.status_code == 200:
            data = response.json()
            self.token = data['access_token']
            print(f"✅ Authentication successful")
            return True
        else:
            print(f"❌ Authentication failed: {response.status_code}")
            return False
    
    def get_headers(self):
        """Get headers with authentication"""
        headers = {'Content-Type': 'application/json'}
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'
        return headers
    
    def run_test(self, test_name, expected_result=True):
        """Track test results"""
        self.tests_run += 1
        if expected_result:
            self.tests_passed += 1
            print(f"✅ {test_name}")
        else:
            print(f"❌ {test_name}")
        return expected_result
    
    def create_test_vehicle(self):
        """Create a test vehicle for status testing"""
        url = f"{self.base_url}/vehicles"
        data = {
            "brand": "TVS",
            "model": "Status Fix Test Vehicle",
            "chassis_no": f"FIX_TEST_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            "engine_no": f"ENG_FIX_{datetime.now().strftime('%H%M%S')}",
            "color": "Blue",
            "key_no": "FIX_KEY_001",
            "inbound_location": "Fix Test Warehouse"
        }
        
        response = requests.post(url, json=data, headers=self.get_headers())
        
        if response.status_code == 200:
            vehicle_data = response.json()
            print(f"✅ Test vehicle created: {vehicle_data['id']}")
            print(f"   Initial Status: {vehicle_data.get('status', 'N/A')}")
            return vehicle_data
        else:
            print(f"❌ Failed to create test vehicle: {response.status_code}")
            return None
    
    def get_vehicle(self, vehicle_id):
        """Get vehicle by ID"""
        url = f"{self.base_url}/vehicles/{vehicle_id}"
        response = requests.get(url, headers=self.get_headers())
        
        if response.status_code == 200:
            return response.json()
        else:
            print(f"❌ Failed to get vehicle {vehicle_id}: {response.status_code}")
            return None
    
    def update_vehicle_status(self, vehicle_id, status, return_date=None, outbound_location=None):
        """Update vehicle status using new endpoint"""
        url = f"{self.base_url}/vehicles/{vehicle_id}/status"
        data = {"status": status}
        
        if return_date:
            data["return_date"] = return_date
        if outbound_location:
            data["outbound_location"] = outbound_location
        
        response = requests.put(url, json=data, headers=self.get_headers())
        
        if response.status_code == 200:
            return response.json()
        else:
            print(f"❌ Status update failed: {response.status_code}")
            try:
                error_detail = response.json()
                print(f"   Error: {error_detail}")
            except:
                print(f"   Error: {response.text}")
            return None
    
    def test_status_update_to_sold(self, vehicle_id):
        """Test updating status to sold"""
        print(f"\n🔄 Testing status update: in_stock → sold")
        
        # Get initial status
        initial_vehicle = self.get_vehicle(vehicle_id)
        if not initial_vehicle:
            return self.run_test("Get initial vehicle data", False)
        
        initial_status = initial_vehicle.get('status')
        print(f"   Initial Status: {initial_status}")
        
        # Update to sold
        updated_vehicle = self.update_vehicle_status(vehicle_id, "sold")
        if not updated_vehicle:
            return self.run_test("Update status to sold", False)
        
        new_status = updated_vehicle.get('status')
        date_sold = updated_vehicle.get('date_sold')
        
        print(f"   New Status: {new_status}")
        print(f"   Date Sold: {date_sold}")
        
        # Verify status change
        if new_status == "sold":
            self.run_test("Status updated to sold", True)
        else:
            self.run_test("Status updated to sold", False)
        
        # Verify date_sold is set
        if date_sold:
            self.run_test("Date sold is set", True)
        else:
            self.run_test("Date sold is set", False)
        
        return new_status == "sold" and date_sold is not None
    
    def test_status_update_to_returned(self, vehicle_id):
        """Test updating status to returned"""
        print(f"\n🔄 Testing status update: sold → returned")
        
        # Update to returned with custom return date
        return_date = "2024-01-15T10:30:00Z"
        outbound_location = "Customer Location"
        
        updated_vehicle = self.update_vehicle_status(
            vehicle_id, 
            "returned", 
            return_date=return_date,
            outbound_location=outbound_location
        )
        
        if not updated_vehicle:
            return self.run_test("Update status to returned", False)
        
        new_status = updated_vehicle.get('status')
        date_returned = updated_vehicle.get('date_returned')
        outbound_loc = updated_vehicle.get('outbound_location')
        
        print(f"   New Status: {new_status}")
        print(f"   Date Returned: {date_returned}")
        print(f"   Outbound Location: {outbound_loc}")
        
        # Verify status change
        if new_status == "returned":
            self.run_test("Status updated to returned", True)
        else:
            self.run_test("Status updated to returned", False)
        
        # Verify date_returned is set
        if date_returned:
            self.run_test("Date returned is set", True)
        else:
            self.run_test("Date returned is set", False)
        
        # Verify outbound location is set
        if outbound_loc == outbound_location:
            self.run_test("Outbound location is set", True)
        else:
            self.run_test("Outbound location is set", False)
        
        return new_status == "returned" and date_returned is not None
    
    def test_status_update_to_in_stock(self, vehicle_id):
        """Test updating status back to in_stock"""
        print(f"\n🔄 Testing status update: returned → in_stock")
        
        updated_vehicle = self.update_vehicle_status(vehicle_id, "in_stock")
        
        if not updated_vehicle:
            return self.run_test("Update status to in_stock", False)
        
        new_status = updated_vehicle.get('status')
        date_sold = updated_vehicle.get('date_sold')
        date_returned = updated_vehicle.get('date_returned')
        customer_id = updated_vehicle.get('customer_id')
        outbound_location = updated_vehicle.get('outbound_location')
        
        print(f"   New Status: {new_status}")
        print(f"   Date Sold: {date_sold}")
        print(f"   Date Returned: {date_returned}")
        print(f"   Customer ID: {customer_id}")
        print(f"   Outbound Location: {outbound_location}")
        
        # Verify status change
        if new_status == "in_stock":
            self.run_test("Status updated to in_stock", True)
        else:
            self.run_test("Status updated to in_stock", False)
        
        # Verify dates are cleared
        if date_sold is None:
            self.run_test("Date sold cleared", True)
        else:
            self.run_test("Date sold cleared", False)
        
        if date_returned is None:
            self.run_test("Date returned cleared", True)
        else:
            self.run_test("Date returned cleared", False)
        
        return new_status == "in_stock" and date_sold is None and date_returned is None
    
    def test_error_handling(self, vehicle_id):
        """Test error handling for invalid requests"""
        print(f"\n⚠️ Testing error handling")
        
        # Test invalid status
        url = f"{self.base_url}/vehicles/{vehicle_id}/status"
        response = requests.put(url, json={"status": "invalid_status"}, headers=self.get_headers())
        
        if response.status_code == 400:
            self.run_test("Invalid status rejected", True)
        else:
            self.run_test("Invalid status rejected", False)
        
        # Test missing status
        response = requests.put(url, json={}, headers=self.get_headers())
        
        if response.status_code == 400:
            self.run_test("Missing status rejected", True)
        else:
            self.run_test("Missing status rejected", False)
        
        # Test invalid vehicle ID
        url = f"{self.base_url}/vehicles/invalid-vehicle-id/status"
        response = requests.put(url, json={"status": "sold"}, headers=self.get_headers())
        
        if response.status_code == 404:
            self.run_test("Invalid vehicle ID rejected", True)
        else:
            self.run_test("Invalid vehicle ID rejected", False)
    
    def test_comprehensive_status_updates(self):
        """Run comprehensive status update tests"""
        print("🚀 COMPREHENSIVE VEHICLE STATUS UPDATE TESTING")
        print("=" * 60)
        print("Testing the NEW PUT /api/vehicles/{vehicle_id}/status endpoint")
        print()
        
        # Create test vehicle
        vehicle = self.create_test_vehicle()
        if not vehicle:
            return False
        
        vehicle_id = vehicle['id']
        
        # Test all status transitions
        success1 = self.test_status_update_to_sold(vehicle_id)
        success2 = self.test_status_update_to_returned(vehicle_id)
        success3 = self.test_status_update_to_in_stock(vehicle_id)
        
        # Test error handling
        self.test_error_handling(vehicle_id)
        
        return success1 and success2 and success3
    
    def test_persistence_verification(self):
        """Test that status changes persist across API calls"""
        print(f"\n🔍 Testing status persistence")
        
        # Create test vehicle
        vehicle = self.create_test_vehicle()
        if not vehicle:
            return False
        
        vehicle_id = vehicle['id']
        
        # Update status to sold
        self.update_vehicle_status(vehicle_id, "sold")
        
        # Get vehicle again to verify persistence
        verified_vehicle = self.get_vehicle(vehicle_id)
        if verified_vehicle and verified_vehicle.get('status') == 'sold':
            self.run_test("Status persistence verified", True)
            return True
        else:
            self.run_test("Status persistence verified", False)
            return False

def main():
    print("🔧 TESTING VEHICLE STATUS UPDATE FIX")
    print("=" * 60)
    print("Testing the solution for: 'Status column is not changing after changing the status in vehicle stock page'")
    print()
    
    tester = VehicleStatusFixTester()
    
    # Authenticate
    if not tester.authenticate():
        return 1
    
    # Run comprehensive tests
    success1 = tester.test_comprehensive_status_updates()
    success2 = tester.test_persistence_verification()
    
    # Print results
    print("\n" + "=" * 60)
    print(f"📊 TEST RESULTS:")
    print(f"   Tests Run: {tester.tests_run}")
    print(f"   Tests Passed: {tester.tests_passed}")
    print(f"   Tests Failed: {tester.tests_run - tester.tests_passed}")
    print(f"   Success Rate: {(tester.tests_passed/tester.tests_run)*100:.1f}%")
    
    if success1 and success2:
        print("\n✅ VEHICLE STATUS UPDATE BUG FIXED!")
        print("   The new PUT /api/vehicles/{vehicle_id}/status endpoint is working correctly")
        print("   Status changes are persisting in the database")
        print("   All status transitions (in_stock ↔ sold ↔ returned) are working")
        return 0
    else:
        print("\n❌ SOME TESTS FAILED")
        print("   The vehicle status update fix needs more work")
        return 1

if __name__ == "__main__":
    exit(main())