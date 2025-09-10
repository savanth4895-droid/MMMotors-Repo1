import requests
import sys
import json
from datetime import datetime
import uuid

class TwoWheelerAPITester:
    def __init__(self, base_url="https://moto-management.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.created_ids = {
            'customers': [],
            'vehicles': [],
            'sales': [],
            'services': [],
            'spare_parts': [],
            'bills': []
        }

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)

            print(f"   Status Code: {response.status_code}")
            
            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    if isinstance(response_data, dict) and 'id' in response_data:
                        print(f"   Created ID: {response_data['id']}")
                    return True, response_data
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_detail = response.json()
                    print(f"   Error: {error_detail}")
                except:
                    print(f"   Error: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test root API endpoint"""
        return self.run_test("Root Endpoint", "GET", "", 200)

    def test_register_user(self, username, email, password, role="admin", full_name="Test User"):
        """Test user registration"""
        success, response = self.run_test(
            "User Registration",
            "POST",
            "auth/register",
            200,
            data={
                "username": username,
                "email": email,
                "password": password,
                "role": role,
                "full_name": full_name
            }
        )
        return success, response

    def test_login_user(self, username, password):
        """Test user login and get token"""
        success, response = self.run_test(
            "User Login",
            "POST",
            "auth/login",
            200,
            data={"username": username, "password": password}
        )
        if success and 'access_token' in response:
            self.token = response['access_token']
            print(f"   Token obtained: {self.token[:20]}...")
            return True, response
        return False, response

    def test_get_current_user(self):
        """Test getting current user info"""
        return self.run_test("Get Current User", "GET", "auth/me", 200)

    def test_create_customer(self, name, phone, email, address):
        """Test customer creation"""
        success, response = self.run_test(
            "Create Customer",
            "POST",
            "customers",
            200,
            data={
                "name": name,
                "phone": phone,
                "email": email,
                "address": address
            }
        )
        if success and 'id' in response:
            self.created_ids['customers'].append(response['id'])
        return success, response

    def test_get_customers(self):
        """Test getting all customers"""
        return self.run_test("Get Customers", "GET", "customers", 200)

    def test_get_customer_by_id(self, customer_id):
        """Test getting customer by ID"""
        return self.run_test(f"Get Customer {customer_id}", "GET", f"customers/{customer_id}", 200)

    def test_create_vehicle(self, brand, model, chassis_no, engine_no, color, key_no, inbound_location):
        """Test vehicle creation"""
        success, response = self.run_test(
            "Create Vehicle",
            "POST",
            "vehicles",
            200,
            data={
                "brand": brand,
                "model": model,
                "chassis_no": chassis_no,
                "engine_no": engine_no,
                "color": color,
                "key_no": key_no,
                "inbound_location": inbound_location
            }
        )
        if success and 'id' in response:
            self.created_ids['vehicles'].append(response['id'])
        return success, response

    def test_get_vehicles(self):
        """Test getting all vehicles"""
        return self.run_test("Get Vehicles", "GET", "vehicles", 200)

    def test_get_vehicle_brands(self):
        """Test getting vehicle brands"""
        return self.run_test("Get Vehicle Brands", "GET", "vehicles/brands", 200)

    def test_create_sale(self, customer_id, vehicle_id, amount, payment_method):
        """Test sale creation"""
        success, response = self.run_test(
            "Create Sale",
            "POST",
            "sales",
            200,
            data={
                "customer_id": customer_id,
                "vehicle_id": vehicle_id,
                "amount": amount,
                "payment_method": payment_method
            }
        )
        if success and 'id' in response:
            self.created_ids['sales'].append(response['id'])
        return success, response

    def test_get_sales(self):
        """Test getting all sales"""
        return self.run_test("Get Sales", "GET", "sales", 200)

    def test_create_service(self, customer_id, vehicle_number, service_type, description, amount):
        """Test service creation"""
        success, response = self.run_test(
            "Create Service",
            "POST",
            "services",
            200,
            data={
                "customer_id": customer_id,
                "vehicle_number": vehicle_number,
                "service_type": service_type,
                "description": description,
                "amount": amount
            }
        )
        if success and 'id' in response:
            self.created_ids['services'].append(response['id'])
        return success, response

    def test_get_services(self):
        """Test getting all services"""
        return self.run_test("Get Services", "GET", "services", 200)

    def test_update_service_status(self, service_id, status):
        """Test updating service status"""
        return self.run_test(
            f"Update Service Status to {status}",
            "PUT",
            f"services/{service_id}/status",
            200,
            data={"status": status}
        )

    def test_create_spare_part(self, name, part_number, brand, quantity, unit_price):
        """Test spare part creation"""
        success, response = self.run_test(
            "Create Spare Part",
            "POST",
            "spare-parts",
            200,
            data={
                "name": name,
                "part_number": part_number,
                "brand": brand,
                "quantity": quantity,
                "unit_price": unit_price
            }
        )
        if success and 'id' in response:
            self.created_ids['spare_parts'].append(response['id'])
        return success, response

    def test_get_spare_parts(self):
        """Test getting all spare parts"""
        return self.run_test("Get Spare Parts", "GET", "spare-parts", 200)

    def test_create_spare_part_bill(self, customer_id, items):
        """Test spare part bill creation"""
        success, response = self.run_test(
            "Create Spare Part Bill",
            "POST",
            "spare-parts/bills",
            200,
            data={
                "customer_id": customer_id,
                "items": items
            }
        )
        if success and 'id' in response:
            self.created_ids['bills'].append(response['id'])
        return success, response

    def test_get_spare_part_bills(self):
        """Test getting all spare part bills"""
        return self.run_test("Get Spare Part Bills", "GET", "spare-parts/bills", 200)

    def test_get_dashboard_stats(self):
        """Test getting dashboard statistics"""
        return self.run_test("Get Dashboard Stats", "GET", "dashboard/stats", 200)

def main():
    print("🚀 Starting Two Wheeler Business Management System API Tests")
    print("=" * 60)
    
    tester = TwoWheelerAPITester()
    
    # Test basic connectivity
    print("\n📡 Testing Basic Connectivity...")
    success, _ = tester.test_root_endpoint()
    if not success:
        print("❌ Cannot connect to API. Stopping tests.")
        return 1

    # Test authentication with known credentials
    print("\n🔐 Testing Authentication...")
    success, _ = tester.test_login_user("admin", "admin123")
    if not success:
        print("❌ Login failed with known credentials. Stopping tests.")
        return 1

    # Test getting current user
    tester.test_get_current_user()

    # Test customer operations
    print("\n👥 Testing Customer Operations...")
    success, customer_data = tester.test_create_customer(
        "John Doe", 
        "9876543210", 
        "john@example.com", 
        "123 Main St, City"
    )
    customer_id = customer_data.get('id') if success else None
    
    tester.test_get_customers()
    if customer_id:
        tester.test_get_customer_by_id(customer_id)

    # Test vehicle operations
    print("\n🏍️ Testing Vehicle Operations...")
    tester.test_get_vehicle_brands()
    success, vehicle_data = tester.test_create_vehicle(
        "TVS", 
        "Apache RTR 160", 
        "CHASSIS123", 
        "ENGINE123", 
        "Red", 
        "KEY123", 
        "Warehouse A"
    )
    vehicle_id = vehicle_data.get('id') if success else None
    
    tester.test_get_vehicles()

    # Test sales operations
    print("\n💰 Testing Sales Operations...")
    if customer_id and vehicle_id:
        tester.test_create_sale(customer_id, vehicle_id, 85000.0, "Cash")
    tester.test_get_sales()

    # Test service operations
    print("\n🔧 Testing Service Operations...")
    if customer_id:
        success, service_data = tester.test_create_service(
            customer_id, 
            "TN01AB1234", 
            "General Service", 
            "Oil change and general checkup", 
            1500.0
        )
        service_id = service_data.get('id') if success else None
        
        if service_id:
            tester.test_update_service_status(service_id, "in_progress")
    
    tester.test_get_services()

    # Test spare parts operations
    print("\n🔩 Testing Spare Parts Operations...")
    success, spare_part_data = tester.test_create_spare_part(
        "Brake Pad", 
        "BP001", 
        "TVS", 
        50, 
        250.0
    )
    spare_part_id = spare_part_data.get('id') if success else None
    
    tester.test_get_spare_parts()
    
    if customer_id and spare_part_id:
        tester.test_create_spare_part_bill(
            customer_id, 
            [{"part_id": spare_part_id, "quantity": 2, "unit_price": 250.0}]
        )
    
    tester.test_get_spare_part_bills()

    # Test dashboard stats
    print("\n📊 Testing Dashboard Statistics...")
    tester.test_get_dashboard_stats()

    # Print final results
    print("\n" + "=" * 60)
    print(f"📊 Final Test Results:")
    print(f"   Tests Run: {tester.tests_run}")
    print(f"   Tests Passed: {tester.tests_passed}")
    print(f"   Tests Failed: {tester.tests_run - tester.tests_passed}")
    print(f"   Success Rate: {(tester.tests_passed/tester.tests_run)*100:.1f}%")
    
    if tester.created_ids['customers']:
        print(f"   Created Customers: {len(tester.created_ids['customers'])}")
    if tester.created_ids['vehicles']:
        print(f"   Created Vehicles: {len(tester.created_ids['vehicles'])}")
    if tester.created_ids['sales']:
        print(f"   Created Sales: {len(tester.created_ids['sales'])}")
    if tester.created_ids['services']:
        print(f"   Created Services: {len(tester.created_ids['services'])}")
    if tester.created_ids['spare_parts']:
        print(f"   Created Spare Parts: {len(tester.created_ids['spare_parts'])}")
    if tester.created_ids['bills']:
        print(f"   Created Bills: {len(tester.created_ids['bills'])}")

    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())