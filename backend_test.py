import requests
import sys
import json
from datetime import datetime
import uuid

class TwoWheelerAPITester:
    def __init__(self, base_url="https://bikebiz-admin.preview.emergentagent.com/api"):
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
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, params=params)

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

    def test_update_customer(self, customer_id, name, phone, email, address):
        """Test updating customer information"""
        success, response = self.run_test(
            f"Update Customer {customer_id}",
            "PUT",
            f"customers/{customer_id}",
            200,
            data={
                "name": name,
                "phone": phone,
                "email": email,
                "address": address
            }
        )
        return success, response

    def test_update_customer_not_found(self, invalid_customer_id):
        """Test updating non-existent customer (should return 404)"""
        return self.run_test(
            f"Update Non-existent Customer {invalid_customer_id}",
            "PUT",
            f"customers/{invalid_customer_id}",
            404,
            data={
                "name": "Test Name",
                "phone": "9876543210",
                "email": "test@example.com",
                "address": "Test Address"
            }
        )

    def test_update_customer_without_auth(self, customer_id):
        """Test updating customer without authentication (should return 401/403)"""
        original_token = self.token
        self.token = None  # Remove token temporarily
        
        success, response = self.run_test(
            f"Update Customer Without Auth {customer_id}",
            "PUT",
            f"customers/{customer_id}",
            403,
            data={
                "name": "Test Name",
                "phone": "9876543210",
                "email": "test@example.com",
                "address": "Test Address"
            }
        )
        
        self.token = original_token  # Restore token
        return success, response

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

    def test_get_sale_by_id(self, sale_id):
        """Test getting sale by ID"""
        return self.run_test(f"Get Sale {sale_id}", "GET", f"sales/{sale_id}", 200)

    def test_update_sale(self, sale_id, customer_id, vehicle_id, amount, payment_method):
        """Test updating sale information"""
        success, response = self.run_test(
            f"Update Sale {sale_id}",
            "PUT",
            f"sales/{sale_id}",
            200,
            data={
                "customer_id": customer_id,
                "vehicle_id": vehicle_id,
                "amount": amount,
                "payment_method": payment_method
            }
        )
        return success, response

    def test_update_sale_not_found(self, invalid_sale_id):
        """Test updating non-existent sale (should return 404)"""
        return self.run_test(
            f"Update Non-existent Sale {invalid_sale_id}",
            "PUT",
            f"sales/{invalid_sale_id}",
            404,
            data={
                "customer_id": "test-customer-id",
                "vehicle_id": "test-vehicle-id",
                "amount": 50000.0,
                "payment_method": "Cash"
            }
        )

    def test_update_sale_without_auth(self, sale_id):
        """Test updating sale without authentication (should return 401/403)"""
        original_token = self.token
        self.token = None  # Remove token temporarily
        
        success, response = self.run_test(
            f"Update Sale Without Auth {sale_id}",
            "PUT",
            f"sales/{sale_id}",
            403,
            data={
                "customer_id": "test-customer-id",
                "vehicle_id": "test-vehicle-id",
                "amount": 50000.0,
                "payment_method": "Cash"
            }
        )
        
        self.token = original_token  # Restore token
        return success, response

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

    def test_get_service_by_id(self, service_id):
        """Test getting service by ID"""
        return self.run_test(f"Get Service {service_id}", "GET", f"services/{service_id}", 200)

    def test_update_service(self, service_id, customer_id, vehicle_number, service_type, description, amount):
        """Test updating service information"""
        success, response = self.run_test(
            f"Update Service {service_id}",
            "PUT",
            f"services/{service_id}",
            200,
            data={
                "customer_id": customer_id,
                "vehicle_number": vehicle_number,
                "service_type": service_type,
                "description": description,
                "amount": amount
            }
        )
        return success, response

    def test_update_service_not_found(self, invalid_service_id):
        """Test updating non-existent service (should return 404)"""
        return self.run_test(
            f"Update Non-existent Service {invalid_service_id}",
            "PUT",
            f"services/{invalid_service_id}",
            404,
            data={
                "customer_id": "test-customer-id",
                "vehicle_number": "TN01AB1234",
                "service_type": "General Service",
                "description": "Test service",
                "amount": 1500.0
            }
        )

    def test_update_service_without_auth(self, service_id):
        """Test updating service without authentication (should return 401/403)"""
        original_token = self.token
        self.token = None  # Remove token temporarily
        
        success, response = self.run_test(
            f"Update Service Without Auth {service_id}",
            "PUT",
            f"services/{service_id}",
            403,
            data={
                "customer_id": "test-customer-id",
                "vehicle_number": "TN01AB1234",
                "service_type": "General Service",
                "description": "Test service",
                "amount": 1500.0
            }
        )
        
        self.token = original_token  # Restore token
        return success, response

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

    def test_get_spare_part_by_id(self, part_id):
        """Test getting spare part by ID"""
        return self.run_test(f"Get Spare Part {part_id}", "GET", f"spare-parts/{part_id}", 200)

    def test_update_spare_part(self, part_id, name, part_number, brand, quantity, unit_price, unit="Nos", hsn_sac=None, gst_percentage=18.0):
        """Test updating spare part information"""
        success, response = self.run_test(
            f"Update Spare Part {part_id}",
            "PUT",
            f"spare-parts/{part_id}",
            200,
            data={
                "name": name,
                "part_number": part_number,
                "brand": brand,
                "quantity": quantity,
                "unit": unit,
                "unit_price": unit_price,
                "hsn_sac": hsn_sac,
                "gst_percentage": gst_percentage
            }
        )
        return success, response

    def test_update_spare_part_not_found(self, invalid_part_id):
        """Test updating non-existent spare part (should return 404)"""
        return self.run_test(
            f"Update Non-existent Spare Part {invalid_part_id}",
            "PUT",
            f"spare-parts/{invalid_part_id}",
            404,
            data={
                "name": "Test Part",
                "part_number": "TP001",
                "brand": "Test Brand",
                "quantity": 10,
                "unit_price": 100.0
            }
        )

    def test_update_spare_part_without_auth(self, part_id):
        """Test updating spare part without authentication (should return 401/403)"""
        original_token = self.token
        self.token = None  # Remove token temporarily
        
        success, response = self.run_test(
            f"Update Spare Part Without Auth {part_id}",
            "PUT",
            f"spare-parts/{part_id}",
            403,
            data={
                "name": "Test Part",
                "part_number": "TP001",
                "brand": "Test Brand",
                "quantity": 10,
                "unit_price": 100.0
            }
        )
        
        self.token = original_token  # Restore token
        return success, response

    def test_create_spare_part_bill(self, customer_id, items):
        """Test spare part bill creation (legacy format)"""
        success, response = self.run_test(
            "Create Spare Part Bill (Legacy)",
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

    def test_create_gst_spare_part_bill(self, customer_data, items, subtotal, total_discount, total_cgst, total_sgst, total_tax, total_amount):
        """Test GST-compliant spare part bill creation with customer data"""
        success, response = self.run_test(
            "Create GST Spare Part Bill",
            "POST",
            "spare-parts/bills",
            200,
            data={
                "customer_data": customer_data,
                "items": items,
                "subtotal": subtotal,
                "total_discount": total_discount,
                "total_cgst": total_cgst,
                "total_sgst": total_sgst,
                "total_tax": total_tax,
                "total_amount": total_amount
            }
        )
        if success and 'id' in response:
            self.created_ids['bills'].append(response['id'])
            print(f"   Bill Number: {response.get('bill_number', 'N/A')}")
            print(f"   Customer: {customer_data.get('name', 'N/A')}")
            print(f"   Total Amount: ₹{total_amount}")
        return success, response

    def test_create_gst_spare_part_bill_invalid_data(self):
        """Test GST spare part bill creation with invalid data"""
        # Test with missing customer data
        success, response = self.run_test(
            "Create GST Bill - Missing Customer Data",
            "POST",
            "spare-parts/bills",
            400,
            data={
                "items": [{"description": "Test Item", "quantity": 1, "rate": 100}],
                "subtotal": 100,
                "total_amount": 100
            }
        )
        
        # Test with empty items
        success2, response2 = self.run_test(
            "Create GST Bill - Empty Items",
            "POST",
            "spare-parts/bills",
            200,  # This might still succeed with empty items
            data={
                "customer_data": {"name": "Test Customer", "mobile": "9876543210"},
                "items": [],
                "subtotal": 0,
                "total_amount": 0
            }
        )
        
        return success or success2, response if success else response2

    def test_get_spare_part_bills(self):
        """Test getting all spare part bills"""
        return self.run_test("Get Spare Part Bills", "GET", "spare-parts/bills", 200)

    def test_get_dashboard_stats(self):
        """Test getting dashboard statistics"""
        return self.run_test("Get Dashboard Stats", "GET", "dashboard/stats", 200)

    # Backup System API Tests
    def test_get_backup_config(self):
        """Test getting backup configuration"""
        return self.run_test("Get Backup Configuration", "GET", "backup/config", 200)

    def test_update_backup_config(self, config_data):
        """Test updating backup configuration"""
        return self.run_test(
            "Update Backup Configuration",
            "PUT",
            "backup/config",
            200,
            data=config_data
        )

    def test_create_manual_backup(self):
        """Test creating a manual backup"""
        success, response = self.run_test(
            "Create Manual Backup",
            "POST",
            "backup/create",
            200,
            data={"backup_type": "manual"}
        )
        if success and 'id' in response:
            print(f"   Backup Job ID: {response['id']}")
            print(f"   Status: {response.get('status', 'N/A')}")
            print(f"   Total Records: {response.get('total_records', 0)}")
            if response.get('backup_size_mb'):
                print(f"   Backup Size: {response['backup_size_mb']} MB")
        return success, response

    def test_get_backup_jobs(self):
        """Test getting backup job history"""
        return self.run_test("Get Backup Jobs", "GET", "backup/jobs", 200)

    def test_get_backup_stats(self):
        """Test getting backup statistics"""
        success, response = self.run_test("Get Backup Statistics", "GET", "backup/stats", 200)
        if success:
            print(f"   Total Backups: {response.get('total_backups', 0)}")
            print(f"   Successful Backups: {response.get('successful_backups', 0)}")
            print(f"   Failed Backups: {response.get('failed_backups', 0)}")
            print(f"   Total Storage Used: {response.get('total_storage_used_mb', 0)} MB")
        return success, response

    def test_download_backup(self, job_id):
        """Test downloading a backup file"""
        url = f"{self.base_url}/backup/download/{job_id}"
        headers = {}
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        self.tests_run += 1
        print(f"\n🔍 Testing Download Backup File...")
        print(f"   URL: {url}")
        
        try:
            response = requests.get(url, headers=headers)
            print(f"   Status Code: {response.status_code}")
            
            if response.status_code == 200:
                self.tests_passed += 1
                print(f"✅ Passed - Backup file download successful")
                print(f"   Content Type: {response.headers.get('content-type', 'N/A')}")
                print(f"   Content Length: {len(response.content)} bytes")
                return True, {"content_length": len(response.content)}
            elif response.status_code == 404:
                print(f"❌ Failed - Backup file not found (404)")
                return False, {}
            else:
                print(f"❌ Failed - Status: {response.status_code}")
                try:
                    error_detail = response.json()
                    print(f"   Error: {error_detail}")
                except:
                    print(f"   Error: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_cleanup_old_backups(self, retention_days=30):
        """Test cleaning up old backups"""
        return self.run_test(
            f"Cleanup Old Backups ({retention_days} days)",
            "DELETE",
            f"backup/cleanup?retention_days={retention_days}",
            200
        )

    def test_backup_endpoints_without_auth(self):
        """Test backup endpoints without authentication (should fail)"""
        original_token = self.token
        self.token = None  # Remove token temporarily
        
        print("\n🔒 Testing Backup Endpoints Without Authentication...")
        
        # Test each endpoint without auth - should return 401/403
        endpoints_to_test = [
            ("GET", "backup/config", 403),
            ("PUT", "backup/config", 403),
            ("POST", "backup/create", 403),
            ("GET", "backup/jobs", 403),
            ("GET", "backup/stats", 403),
            ("DELETE", "backup/cleanup", 403)
        ]
        
        all_passed = True
        for method, endpoint, expected_status in endpoints_to_test:
            success, _ = self.run_test(
                f"Unauthorized {method} {endpoint}",
                method,
                endpoint,
                expected_status,
                data={"test": "data"} if method in ["POST", "PUT"] else None
            )
            if not success:
                all_passed = False
        
        self.token = original_token  # Restore token
        return all_passed, {}

    def test_backup_download_invalid_job_id(self):
        """Test downloading backup with invalid job ID"""
        invalid_job_id = "invalid-job-id-12345"
        success, response = self.test_download_backup(invalid_job_id)
        # This should fail with 404, so we expect success to be False
        if not success:
            print("✅ Correctly handled invalid job ID")
            return True, response
        else:
            print("❌ Should have failed with invalid job ID")
            return False, response

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
        
        # Test customer update operations (NEW)
        print("\n✏️ Testing Customer Update Operations...")
        tester.test_update_customer(
            customer_id,
            "John Doe Updated",
            "9876543211", 
            "john.updated@example.com",
            "456 Updated St, New City"
        )
        
        # Test error handling for customer updates
        tester.test_update_customer_not_found("invalid-customer-id-12345")
        tester.test_update_customer_without_auth(customer_id)

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
    sale_id = None
    if customer_id and vehicle_id:
        success, sale_data = tester.test_create_sale(customer_id, vehicle_id, 85000.0, "Cash")
        sale_id = sale_data.get('id') if success else None
    tester.test_get_sales()
    
    # Test sales update operations (NEW)
    if sale_id:
        print("\n✏️ Testing Sales Update Operations...")
        tester.test_get_sale_by_id(sale_id)
        
        # Create another vehicle for update test
        success, vehicle_data2 = tester.test_create_vehicle(
            "BAJAJ", 
            "Pulsar 150", 
            "CHASSIS456", 
            "ENGINE456", 
            "Blue", 
            "KEY456", 
            "Warehouse B"
        )
        vehicle_id2 = vehicle_data2.get('id') if success else None
        
        if vehicle_id2:
            tester.test_update_sale(
                sale_id,
                customer_id,
                vehicle_id2,  # Update to different vehicle
                90000.0,      # Updated amount
                "Bank Transfer"  # Updated payment method
            )
        
        # Test error handling for sales updates
        tester.test_update_sale_not_found("invalid-sale-id-12345")
        tester.test_update_sale_without_auth(sale_id)

    # Test service operations
    print("\n🔧 Testing Service Operations...")
    service_id = None
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
    
    # Test service update operations (NEW)
    if service_id:
        print("\n✏️ Testing Service Update Operations...")
        tester.test_get_service_by_id(service_id)
        
        tester.test_update_service(
            service_id,
            customer_id,
            "TN01AB5678",  # Updated vehicle number
            "Premium Service",  # Updated service type
            "Complete service with premium parts and detailed inspection",  # Updated description
            2500.0  # Updated amount
        )
        
        # Test error handling for service updates
        tester.test_update_service_not_found("invalid-service-id-12345")
        tester.test_update_service_without_auth(service_id)

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
    
    # Test legacy spare part bill creation
    if customer_id and spare_part_id:
        tester.test_create_spare_part_bill(
            customer_id, 
            [{"part_id": spare_part_id, "quantity": 2, "unit_price": 250.0}]
        )
    
    # Test GST-compliant spare part bill creation (as requested in review)
    print("\n💰 Testing GST-Compliant Spare Parts Billing...")
    
    # Test data from the review request
    customer_data = {
        "name": "Test Customer",
        "mobile": "9876543210",
        "vehicle_name": "Honda Activa",
        "vehicle_number": "TN12CD5678"
    }
    
    items = [
        {
            "sl_no": 1,
            "part_id": "MANUAL-123456",
            "description": "Test Brake Pad",
            "hsn_sac": "87083000",
            "quantity": 2,
            "unit": "Nos",
            "rate": 500,
            "discount_percent": 5,
            "gst_percent": 18,
            "subtotal": 1000,
            "discountAmount": 50,
            "taxableAmount": 950,
            "cgstAmount": 85.5,
            "sgstAmount": 85.5,
            "totalTax": 171,
            "finalAmount": 1121
        }
    ]
    
    # Test successful GST bill creation
    success, gst_bill_data = tester.test_create_gst_spare_part_bill(
        customer_data,
        items,
        subtotal=1000,
        total_discount=50,
        total_cgst=85.5,
        total_sgst=85.5,
        total_tax=171,
        total_amount=1121
    )
    
    # Test error handling with invalid data
    print("\n❌ Testing Error Handling...")
    tester.test_create_gst_spare_part_bill_invalid_data()
    
    # Get all bills to verify the created bill appears
    print("\n📋 Verifying Bills List...")
    tester.test_get_spare_part_bills()

    # Test dashboard stats
    print("\n📊 Testing Dashboard Statistics...")
    tester.test_get_dashboard_stats()

    # Test Backup System API Endpoints (as requested in review)
    print("\n💾 Testing Backup System API Endpoints...")
    
    # Test backup configuration
    print("\n⚙️ Testing Backup Configuration...")
    success, config_data = tester.test_get_backup_config()
    
    if success:
        # Test updating backup configuration
        updated_config = {
            "backup_enabled": True,
            "backup_time": "03:00",
            "retention_days": 45,
            "compress_backups": True,
            "email_notifications": False
        }
        tester.test_update_backup_config(updated_config)
        
        # Get config again to verify update
        tester.test_get_backup_config()

    # Test manual backup creation
    print("\n🔄 Testing Manual Backup Creation...")
    success, backup_job = tester.test_create_manual_backup()
    backup_job_id = backup_job.get('id') if success else None

    # Test backup history and statistics
    print("\n📈 Testing Backup History and Statistics...")
    tester.test_get_backup_jobs()
    tester.test_get_backup_stats()

    # Test backup file management
    print("\n📁 Testing Backup File Management...")
    if backup_job_id:
        # Test downloading the backup file
        tester.test_download_backup(backup_job_id)
    
    # Test with invalid job ID
    tester.test_backup_download_invalid_job_id()
    
    # Test cleanup functionality
    tester.test_cleanup_old_backups(30)

    # Test error handling - endpoints without authentication
    print("\n🚫 Testing Error Handling...")
    tester.test_backup_endpoints_without_auth()

    print("\n✅ Backup System Testing Complete!")
    print("   All backup endpoints have been tested including:")
    print("   - Authentication with admin/admin123 credentials")
    print("   - Backup configuration (GET/PUT)")
    print("   - Manual backup creation")
    print("   - Backup job history and statistics")
    print("   - Backup file download")
    print("   - Old backup cleanup")
    print("   - Error handling for unauthorized access")
    print("   - Error handling for invalid job IDs")

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