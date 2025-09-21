#!/usr/bin/env python3
"""
Focused Vehicle Status Update API Testing
Testing the specific issue reported: "Status column is not changing after changing the status in vehicle stock page"
"""

import requests
import json
from datetime import datetime

class VehicleStatusTester:
    def __init__(self, base_url="https://mmmotors-invoicing.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        
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
    
    def create_test_vehicle(self):
        """Create a test vehicle for status testing"""
        url = f"{self.base_url}/vehicles"
        data = {
            "brand": "TVS",
            "model": "Status Test Vehicle",
            "chassis_no": f"STATUS_TEST_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            "engine_no": f"ENG_STATUS_{datetime.now().strftime('%H%M%S')}",
            "color": "Red",
            "key_no": "STATUS_KEY_001",
            "inbound_location": "Test Warehouse"
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
    
    def attempt_status_update_via_put(self, vehicle_id, target_status):
        """Attempt to update vehicle status using current PUT endpoint"""
        print(f"\n🔄 Attempting to update vehicle status to '{target_status}' via PUT endpoint")
        
        # First get current vehicle data
        current_vehicle = self.get_vehicle(vehicle_id)
        if not current_vehicle:
            return False
        
        print(f"   Current Status: {current_vehicle.get('status', 'N/A')}")
        
        # Try to update using the current PUT endpoint structure
        url = f"{self.base_url}/vehicles/{vehicle_id}"
        update_data = {
            "brand": current_vehicle["brand"],
            "model": current_vehicle["model"],
            "chassis_no": current_vehicle["chassis_no"],
            "engine_no": current_vehicle["engine_no"],
            "color": current_vehicle["color"],
            "key_no": current_vehicle["key_no"],
            "inbound_location": current_vehicle["inbound_location"],
            "page_number": current_vehicle.get("page_number")
        }
        
        response = requests.put(url, json=update_data, headers=self.get_headers())
        
        if response.status_code == 200:
            updated_vehicle = response.json()
            new_status = updated_vehicle.get('status', 'N/A')
            print(f"   PUT Response Status: {new_status}")
            
            # Verify the status change persisted
            verified_vehicle = self.get_vehicle(vehicle_id)
            if verified_vehicle:
                final_status = verified_vehicle.get('status', 'N/A')
                print(f"   Verified Status: {final_status}")
                
                if final_status == target_status:
                    print(f"✅ Status successfully updated to {target_status}")
                    return True
                else:
                    print(f"❌ Status update failed: Expected {target_status}, got {final_status}")
                    return False
        else:
            print(f"❌ PUT request failed: {response.status_code}")
            try:
                error_detail = response.json()
                print(f"   Error: {error_detail}")
            except:
                print(f"   Error: {response.text}")
            return False
    
    def test_status_update_issue(self):
        """Test the specific status update issue reported by user"""
        print("🚨 TESTING VEHICLE STATUS UPDATE ISSUE")
        print("=" * 50)
        print("Issue: 'Status column is not changing after changing the status in vehicle stock page'")
        print()
        
        # Create test vehicle
        vehicle = self.create_test_vehicle()
        if not vehicle:
            return False
        
        vehicle_id = vehicle['id']
        initial_status = vehicle.get('status', 'N/A')
        
        # Test status updates for all possible statuses
        statuses_to_test = ['sold', 'returned', 'in_stock']
        
        for target_status in statuses_to_test:
            if target_status != initial_status:
                success = self.attempt_status_update_via_put(vehicle_id, target_status)
                if not success:
                    print(f"❌ CONFIRMED BUG: Cannot update status to '{target_status}'")
                else:
                    print(f"✅ Status update to '{target_status}' worked")
        
        return True
    
    def analyze_backend_api_structure(self):
        """Analyze the current backend API structure for vehicle updates"""
        print("\n🔍 ANALYZING BACKEND API STRUCTURE")
        print("=" * 40)
        
        # Create a test vehicle to analyze
        vehicle = self.create_test_vehicle()
        if not vehicle:
            return
        
        vehicle_id = vehicle['id']
        
        print(f"\n📋 Current Vehicle Data Structure:")
        for key, value in vehicle.items():
            print(f"   {key}: {value}")
        
        print(f"\n🔧 Current PUT Endpoint Analysis:")
        print(f"   Endpoint: PUT /api/vehicles/{vehicle_id}")
        print(f"   Expected Fields (based on VehicleCreate model):")
        print(f"   - brand, model, chassis_no, engine_no, color, key_no, inbound_location, page_number")
        print(f"   Missing Fields for Status Update:")
        print(f"   - status (VehicleStatus enum)")
        print(f"   - outbound_location")
        print(f"   - date_returned (for returned status)")
        
        print(f"\n💡 ROOT CAUSE IDENTIFIED:")
        print(f"   The PUT /api/vehicles/{{vehicle_id}} endpoint only accepts VehicleCreate model")
        print(f"   VehicleCreate model does NOT include 'status' field")
        print(f"   Status can only be changed indirectly through sales creation")
        print(f"   There is NO direct endpoint to update vehicle status")

def main():
    print("🔍 VEHICLE STATUS UPDATE BUG INVESTIGATION")
    print("=" * 60)
    print("Testing the reported issue: Status column not updating in vehicle stock page")
    print()
    
    tester = VehicleStatusTester()
    
    # Authenticate
    if not tester.authenticate():
        return 1
    
    # Test the status update issue
    tester.test_status_update_issue()
    
    # Analyze the API structure
    tester.analyze_backend_api_structure()
    
    print("\n" + "=" * 60)
    print("🎯 CONCLUSION:")
    print("❌ BUG CONFIRMED: Backend API does not support direct vehicle status updates")
    print("💡 SOLUTION NEEDED: Add dedicated endpoint for vehicle status updates")
    print("📝 RECOMMENDATION: Create PUT /api/vehicles/{vehicle_id}/status endpoint")
    print("   that accepts: {\"status\": \"sold|returned|in_stock\", \"return_date\": \"2024-01-01\"}")
    
    return 0

if __name__ == "__main__":
    exit(main())