#!/usr/bin/env python3
"""
Final Comprehensive Vehicle Status Update Testing
Testing all the requirements from the review request
"""

import requests
import json
from datetime import datetime

class FinalVehicleStatusTester:
    def __init__(self, base_url="https://moto-business-suite.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        
    def authenticate(self, username="admin", password="admin123"):
        """Authenticate with admin/admin123 credentials as requested"""
        url = f"{self.base_url}/auth/login"
        response = requests.post(url, json={"username": username, "password": password})
        
        if response.status_code == 200:
            data = response.json()
            self.token = data['access_token']
            print(f"✅ Authentication successful with {username}/{password}")
            return True
        else:
            print(f"❌ Authentication failed: {response.status_code}")
            return False
    
    def get_headers(self):
        """Get headers with JWT token in Authorization headers"""
        headers = {'Content-Type': 'application/json'}
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'
        return headers
    
    def test_get_vehicles_endpoint(self):
        """Test GET /api/vehicles endpoint returns current vehicles with status fields"""
        print("\n1️⃣ Testing GET /api/vehicles endpoint with status fields")
        
        url = f"{self.base_url}/vehicles"
        response = requests.get(url, headers=self.get_headers())
        
        if response.status_code == 200:
            vehicles = response.json()
            print(f"✅ GET /api/vehicles successful - Retrieved {len(vehicles)} vehicles")
            
            if vehicles:
                # Check first vehicle for status field
                first_vehicle = vehicles[0]
                if 'status' in first_vehicle:
                    print(f"✅ Status field present: {first_vehicle['status']}")
                    print(f"   Sample vehicle fields: {list(first_vehicle.keys())}")
                    return True, vehicles
                else:
                    print(f"❌ Status field missing from vehicle data")
                    return False, vehicles
            else:
                print(f"⚠️ No vehicles found in database")
                return True, vehicles
        else:
            print(f"❌ GET /api/vehicles failed: {response.status_code}")
            return False, []
    
    def create_test_vehicle(self):
        """Create a test vehicle for status testing"""
        url = f"{self.base_url}/vehicles"
        data = {
            "brand": "TVS",
            "model": "Final Test Vehicle",
            "chassis_no": f"FINAL_TEST_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            "engine_no": f"ENG_FINAL_{datetime.now().strftime('%H%M%S')}",
            "color": "Green",
            "key_no": "FINAL_KEY_001",
            "inbound_location": "Final Test Warehouse"
        }
        
        response = requests.post(url, json=data, headers=self.get_headers())
        
        if response.status_code == 200:
            vehicle_data = response.json()
            print(f"✅ Test vehicle created: {vehicle_data['id']}")
            return vehicle_data
        else:
            print(f"❌ Failed to create test vehicle: {response.status_code}")
            return None
    
    def test_put_vehicle_status_endpoint(self, vehicle_id):
        """Test PUT /api/vehicles/{vehicle_id}/status endpoint with status updates"""
        print(f"\n2️⃣ Testing PUT /api/vehicles/{{vehicle_id}}/status endpoint")
        
        # Test updating to 'sold'
        url = f"{self.base_url}/vehicles/{vehicle_id}/status"
        response = requests.put(url, json={"status": "sold"}, headers=self.get_headers())
        
        if response.status_code == 200:
            updated_vehicle = response.json()
            new_status = updated_vehicle.get('status')
            print(f"✅ PUT status update successful - Status: {new_status}")
            return True, updated_vehicle
        else:
            print(f"❌ PUT status update failed: {response.status_code}")
            try:
                error_detail = response.json()
                print(f"   Error: {error_detail}")
            except:
                print(f"   Error: {response.text}")
            return False, None
    
    def test_status_persistence(self, vehicle_id, expected_status):
        """Test that status changes are persisted in the database"""
        print(f"\n3️⃣ Testing status persistence in database")
        
        url = f"{self.base_url}/vehicles/{vehicle_id}"
        response = requests.get(url, headers=self.get_headers())
        
        if response.status_code == 200:
            vehicle = response.json()
            actual_status = vehicle.get('status')
            
            if actual_status == expected_status:
                print(f"✅ Status persistence confirmed: {actual_status}")
                return True
            else:
                print(f"❌ Status persistence failed: Expected {expected_status}, got {actual_status}")
                return False
        else:
            print(f"❌ Failed to retrieve vehicle for persistence check: {response.status_code}")
            return False
    
    def test_different_status_values(self, vehicle_id):
        """Test different status values: 'in_stock', 'sold', 'returned'"""
        print(f"\n4️⃣ Testing different status values")
        
        statuses_to_test = ['sold', 'returned', 'in_stock']
        results = []
        
        for status in statuses_to_test:
            print(f"   Testing status: {status}")
            
            url = f"{self.base_url}/vehicles/{vehicle_id}/status"
            payload = {"status": status}
            
            # Add return date for returned status
            if status == 'returned':
                payload["return_date"] = "2024-01-15T10:30:00Z"
                payload["outbound_location"] = "Customer Location"
            
            response = requests.put(url, json=payload, headers=self.get_headers())
            
            if response.status_code == 200:
                updated_vehicle = response.json()
                actual_status = updated_vehicle.get('status')
                
                if actual_status == status:
                    print(f"   ✅ Status '{status}' update successful")
                    results.append(True)
                    
                    # Check additional fields for returned status
                    if status == 'returned':
                        date_returned = updated_vehicle.get('date_returned')
                        outbound_location = updated_vehicle.get('outbound_location')
                        print(f"      Date Returned: {date_returned}")
                        print(f"      Outbound Location: {outbound_location}")
                else:
                    print(f"   ❌ Status '{status}' update failed: Expected {status}, got {actual_status}")
                    results.append(False)
            else:
                print(f"   ❌ Status '{status}' update failed: {response.status_code}")
                results.append(False)
        
        return all(results)
    
    def test_edge_cases(self, vehicle_id):
        """Test edge cases like invalid status values"""
        print(f"\n5️⃣ Testing edge cases")
        
        # Test invalid status value
        url = f"{self.base_url}/vehicles/{vehicle_id}/status"
        response = requests.put(url, json={"status": "invalid_status"}, headers=self.get_headers())
        
        if response.status_code == 400:
            print(f"✅ Invalid status value properly rejected (400)")
        else:
            print(f"❌ Invalid status value not properly rejected: {response.status_code}")
            return False
        
        # Test missing status field
        response = requests.put(url, json={}, headers=self.get_headers())
        
        if response.status_code == 400:
            print(f"✅ Missing status field properly rejected (400)")
        else:
            print(f"❌ Missing status field not properly rejected: {response.status_code}")
            return False
        
        # Test invalid vehicle ID
        invalid_url = f"{self.base_url}/vehicles/invalid-vehicle-id/status"
        response = requests.put(invalid_url, json={"status": "sold"}, headers=self.get_headers())
        
        if response.status_code == 404:
            print(f"✅ Invalid vehicle ID properly rejected (404)")
        else:
            print(f"❌ Invalid vehicle ID not properly rejected: {response.status_code}")
            return False
        
        return True
    
    def run_comprehensive_test(self):
        """Run all the tests from the review request"""
        print("🚀 FINAL COMPREHENSIVE VEHICLE STATUS UPDATE API TESTING")
        print("=" * 70)
        print("Testing all requirements from the review request:")
        print("1. GET /api/vehicles endpoint returns current vehicles with status fields")
        print("2. PUT /api/vehicles/{vehicle_id}/status endpoint with status updates")
        print("3. Status changes are persisted in the database")
        print("4. Different status values: 'in_stock', 'sold', 'returned'")
        print("5. Authentication with admin/admin123 credentials")
        print("6. Edge cases like invalid status values")
        
        # Authenticate
        if not self.authenticate():
            return False
        
        # Test 1: GET vehicles endpoint
        success1, vehicles = self.test_get_vehicles_endpoint()
        
        # Create test vehicle
        test_vehicle = self.create_test_vehicle()
        if not test_vehicle:
            return False
        
        vehicle_id = test_vehicle['id']
        
        # Test 2: PUT status endpoint
        success2, updated_vehicle = self.test_put_vehicle_status_endpoint(vehicle_id)
        
        # Test 3: Status persistence
        success3 = self.test_status_persistence(vehicle_id, 'sold')
        
        # Test 4: Different status values
        success4 = self.test_different_status_values(vehicle_id)
        
        # Test 5: Edge cases
        success5 = self.test_edge_cases(vehicle_id)
        
        # Final verification - get updated vehicle data
        print(f"\n6️⃣ Final verification - retrieving updated vehicle data")
        final_vehicle = requests.get(f"{self.base_url}/vehicles/{vehicle_id}", headers=self.get_headers()).json()
        print(f"✅ Final vehicle status: {final_vehicle.get('status')}")
        print(f"   Date received: {final_vehicle.get('date_received')}")
        print(f"   Date sold: {final_vehicle.get('date_sold')}")
        print(f"   Date returned: {final_vehicle.get('date_returned')}")
        print(f"   Customer ID: {final_vehicle.get('customer_id')}")
        print(f"   Outbound location: {final_vehicle.get('outbound_location')}")
        
        return all([success1, success2, success3, success4, success5])

def main():
    print("🎯 FINAL VEHICLE STATUS UPDATE API TESTING")
    print("=" * 60)
    print("Comprehensive testing of the vehicle status update bug fix")
    print("Testing all requirements from the original review request")
    print()
    
    tester = FinalVehicleStatusTester()
    
    success = tester.run_comprehensive_test()
    
    print("\n" + "=" * 70)
    if success:
        print("🎉 ALL TESTS PASSED!")
        print("✅ Vehicle status update functionality is working perfectly")
        print("✅ All requirements from the review request have been met")
        print("✅ The reported bug has been completely resolved")
        print()
        print("📋 SUMMARY OF WHAT WAS FIXED:")
        print("   • Added new PUT /api/vehicles/{vehicle_id}/status endpoint")
        print("   • Proper status validation and error handling")
        print("   • Date management for sold/returned statuses")
        print("   • Complete data persistence in database")
        print("   • Support for all status values: in_stock, sold, returned")
        print("   • Authentication working with admin/admin123")
        print("   • Comprehensive edge case handling")
        return 0
    else:
        print("❌ SOME TESTS FAILED")
        print("   The vehicle status update fix needs more investigation")
        return 1

if __name__ == "__main__":
    exit(main())