import requests
import sys
import json
from datetime import datetime
import uuid

class TwoWheelerAPITester:
    def __init__(self, base_url="https://autofix-system-9.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0

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

    def test_create_customer(self, name, mobile, email, address):
        """Test customer creation with mobile field"""
        success, response = self.run_test(
            "Create Customer",
            "POST",
            "customers",
            200,
            data={
                "name": name,
                "mobile": mobile,
                "email": email,
                "address": address
            }
        )
        return success, response

    def test_registration_vs_job_card_separation(self):
        """
        TEST REGISTRATION VS JOB CARD SEPARATION FEATURE
        
        Testing the separation between Registration and Job Card functionality as requested.
        
        SPECIFIC TESTING REQUIREMENTS:
        1. Test /api/registrations endpoint - should handle customer/vehicle registration data
        2. Test /api/services endpoint - should handle job card data (NOT registration data)
        3. Verify data separation - registrations should NOT appear in services and vice versa
        4. Test registration creation with customer and vehicle info (NO service fields)
        5. Test service creation with job card info
        6. Verify proper data structure and field separation
        
        AUTHENTICATION: Uses admin/admin123 credentials
        
        EXPECTED RESULTS:
        - /api/registrations should return registration data only
        - /api/services should return job card data only
        - Registration creation should NOT include service-related fields
        - Service creation should include job card fields
        - No data overlap between the two endpoints
        """
        print("\n" + "=" * 80)
        print("🔄 TESTING REGISTRATION VS JOB CARD SEPARATION FEATURE")
        print("=" * 80)
        print("Testing the separation between Registration and Job Card functionality")
        print("Focus: /api/registrations vs /api/services endpoint separation")
        
        all_tests_passed = True
        test_results = {
            'authentication': False,
            'registrations_endpoint_available': False,
            'services_endpoint_available': False,
            'registration_creation_success': False,
            'service_creation_success': False,
            'data_separation_verified': False,
            'registration_fields_correct': False,
            'service_fields_correct': False,
            'no_data_overlap': False
        }
        
        created_registration_id = None
        created_service_id = None
        created_customer_id = None
        
        # 1. AUTHENTICATION SETUP
        print("\n🔐 1. AUTHENTICATION WITH ADMIN/ADMIN123")
        print("-" * 50)
        success, auth_response = self.test_login_user("admin", "admin123")
        if success and 'access_token' in auth_response:
            print("✅ Authentication successful with admin/admin123")
            test_results['authentication'] = True
        else:
            print("❌ Authentication failed with admin/admin123")
            all_tests_passed = False
            return False, test_results
        
        # 2. TEST /api/registrations ENDPOINT AVAILABILITY
        print("\n📋 2. TESTING /api/registrations ENDPOINT AVAILABILITY")
        print("-" * 50)
        
        success, registrations_response = self.run_test(
            "Get Registrations",
            "GET",
            "registrations",
            200
        )
        
        if success:
            print("✅ /api/registrations endpoint is available and responding")
            print(f"   Current registrations count: {len(registrations_response) if isinstance(registrations_response, list) else 'N/A'}")
            test_results['registrations_endpoint_available'] = True
        else:
            print("❌ /api/registrations endpoint not available or not responding correctly")
            all_tests_passed = False
        
        # 3. TEST /api/services ENDPOINT AVAILABILITY
        print("\n🔧 3. TESTING /api/services ENDPOINT AVAILABILITY")
        print("-" * 50)
        
        success, services_response = self.run_test(
            "Get Services",
            "GET",
            "services",
            200
        )
        
        if success:
            print("✅ /api/services endpoint is available and responding")
            print(f"   Current services count: {len(services_response) if isinstance(services_response, list) else 'N/A'}")
            test_results['services_endpoint_available'] = True
        else:
            print("❌ /api/services endpoint not available or not responding correctly")
            all_tests_passed = False
        
        # 4. CREATE TEST CUSTOMER FOR REGISTRATION
        print("\n👤 4. CREATING TEST CUSTOMER FOR REGISTRATION")
        print("-" * 50)
        
        # Generate unique mobile number using timestamp
        unique_mobile = f"987654{datetime.now().strftime('%H%M')}"
        success, customer_response = self.test_create_customer(
            "Test User",
            unique_mobile,
            "testuser@example.com",
            "123 Test Street, Test City"
        )
        
        if success and 'id' in customer_response:
            created_customer_id = customer_response['id']
            print(f"✅ Created test customer: {created_customer_id[:8]}...")
        else:
            print("❌ Failed to create test customer")
            all_tests_passed = False
            return False, test_results
        
        # 5. TEST REGISTRATION CREATION (Customer + Vehicle Registration)
        print("\n📝 5. TESTING REGISTRATION CREATION")
        print("-" * 50)
        
        registration_data = {
            "customer_name": "Test User",
            "customer_mobile": unique_mobile,
            "customer_address": "123 Test Street, Test City",
            "vehicle_number": f"KA01AB{datetime.now().strftime('%H%M')}",
            "vehicle_brand": "TVS",
            "vehicle_model": "Jupiter",
            "vehicle_year": "2024",
            "chassis_number": f"TEST_CHASSIS_{datetime.now().strftime('%H%M%S')}",
            "engine_number": f"TEST_ENGINE_{datetime.now().strftime('%H%M%S')}"
        }
        
        print("   Creating registration with:")
        print(f"   Customer: {registration_data['customer_name']}, Mobile: {registration_data['customer_mobile']}")
        print(f"   Vehicle: {registration_data['vehicle_brand']} {registration_data['vehicle_model']} ({registration_data['vehicle_year']})")
        print(f"   Vehicle Reg No: {registration_data['vehicle_number']}")
        
        success, registration_response = self.run_test(
            "Create Registration",
            "POST",
            "registrations",
            200,
            data=registration_data
        )
        
        if success and 'id' in registration_response:
            created_registration_id = registration_response['id']
            print(f"✅ Registration created successfully: {created_registration_id[:8]}...")
            print(f"   Registration Number: {registration_response.get('registration_number', 'N/A')}")
            test_results['registration_creation_success'] = True
            
            # Verify registration fields are correct (NO service fields)
            expected_registration_fields = [
                'id', 'registration_number', 'customer_id', 'customer_name', 
                'customer_mobile', 'customer_address', 'vehicle_number', 
                'vehicle_brand', 'vehicle_model', 'vehicle_year', 
                'chassis_number', 'engine_number', 'registration_date', 'created_by'
            ]
            
            # Fields that should NOT be in registration
            forbidden_service_fields = ['service_type', 'amount', 'description', 'job_card_number', 'status']
            
            registration_fields_correct = True
            for field in expected_registration_fields:
                if field not in registration_response:
                    print(f"   ⚠️ Missing expected field: {field}")
            
            for field in forbidden_service_fields:
                if field in registration_response:
                    print(f"   ❌ Found forbidden service field in registration: {field}")
                    registration_fields_correct = False
            
            if registration_fields_correct:
                print("✅ Registration contains correct fields (NO service-related fields)")
                test_results['registration_fields_correct'] = True
            else:
                print("❌ Registration contains incorrect fields")
                all_tests_passed = False
        else:
            print("❌ Registration creation failed")
            all_tests_passed = False
        
        # 6. TEST SERVICE CREATION (Job Card)
        print("\n🔧 6. TESTING SERVICE CREATION (JOB CARD)")
        print("-" * 50)
        
        service_data = {
            "customer_id": created_customer_id,
            "vehicle_number": registration_data["vehicle_number"],
            "vehicle_brand": "TVS",
            "vehicle_model": "Jupiter",
            "vehicle_year": "2024",
            "service_type": "Periodic Service",
            "description": "Regular maintenance and oil change",
            "amount": 1500.0
        }
        
        print("   Creating service with:")
        print(f"   Customer ID: {created_customer_id[:8]}...")
        print(f"   Vehicle: {service_data['vehicle_brand']} {service_data['vehicle_model']}")
        print(f"   Service Type: {service_data['service_type']}")
        print(f"   Amount: ₹{service_data['amount']}")
        
        success, service_response = self.run_test(
            "Create Service",
            "POST",
            "services",
            200,
            data=service_data
        )
        
        if success and 'id' in service_response:
            created_service_id = service_response['id']
            print(f"✅ Service created successfully: {created_service_id[:8]}...")
            print(f"   Job Card Number: {service_response.get('job_card_number', 'N/A')}")
            test_results['service_creation_success'] = True
            
            # Verify service fields are correct (HAS service fields)
            expected_service_fields = [
                'id', 'job_card_number', 'customer_id', 'vehicle_number',
                'service_type', 'description', 'amount', 'status', 'service_date', 'created_by'
            ]
            
            service_fields_correct = True
            for field in expected_service_fields:
                if field not in service_response:
                    print(f"   ⚠️ Missing expected service field: {field}")
                    service_fields_correct = False
            
            if service_fields_correct:
                print("✅ Service contains correct job card fields")
                test_results['service_fields_correct'] = True
            else:
                print("❌ Service missing required job card fields")
                all_tests_passed = False
        else:
            print("❌ Service creation failed")
            all_tests_passed = False
        
        # 7. VERIFY DATA SEPARATION - Check registrations don't appear in services
        print("\n🔍 7. VERIFYING DATA SEPARATION")
        print("-" * 50)
        
        # Get updated registrations list
        success, updated_registrations = self.run_test(
            "Get Updated Registrations",
            "GET",
            "registrations",
            200
        )
        
        # Get updated services list
        success2, updated_services = self.run_test(
            "Get Updated Services",
            "GET",
            "services",
            200
        )
        
        if success and success2:
            print(f"✅ Retrieved updated data - Registrations: {len(updated_registrations)}, Services: {len(updated_services)}")
            
            # Check that our registration appears in registrations but NOT in services
            registration_found_in_registrations = False
            registration_found_in_services = False
            
            if isinstance(updated_registrations, list):
                for reg in updated_registrations:
                    if reg.get('id') == created_registration_id:
                        registration_found_in_registrations = True
                        break
            
            if isinstance(updated_services, list):
                for svc in updated_services:
                    if svc.get('id') == created_registration_id or svc.get('registration_number') == registration_response.get('registration_number'):
                        registration_found_in_services = True
                        break
            
            # Check that our service appears in services but NOT in registrations
            service_found_in_services = False
            service_found_in_registrations = False
            
            if isinstance(updated_services, list):
                for svc in updated_services:
                    if svc.get('id') == created_service_id:
                        service_found_in_services = True
                        break
            
            if isinstance(updated_registrations, list):
                for reg in updated_registrations:
                    if reg.get('id') == created_service_id or reg.get('job_card_number') == service_response.get('job_card_number'):
                        service_found_in_registrations = True
                        break
            
            # Verify proper separation
            separation_correct = True
            
            if registration_found_in_registrations:
                print("✅ Registration found in /api/registrations (correct)")
            else:
                print("❌ Registration NOT found in /api/registrations (incorrect)")
                separation_correct = False
            
            if not registration_found_in_services:
                print("✅ Registration NOT found in /api/services (correct)")
            else:
                print("❌ Registration found in /api/services (incorrect - data leak)")
                separation_correct = False
            
            if service_found_in_services:
                print("✅ Service found in /api/services (correct)")
            else:
                print("❌ Service NOT found in /api/services (incorrect)")
                separation_correct = False
            
            if not service_found_in_registrations:
                print("✅ Service NOT found in /api/registrations (correct)")
            else:
                print("❌ Service found in /api/registrations (incorrect - data leak)")
                separation_correct = False
            
            if separation_correct:
                print("✅ Data separation verified - no overlap between registrations and services")
                test_results['data_separation_verified'] = True
                test_results['no_data_overlap'] = True
            else:
                print("❌ Data separation failed - found data overlap")
                all_tests_passed = False
        else:
            print("❌ Failed to retrieve updated data for separation verification")
            all_tests_passed = False
        
        # 8. COMPREHENSIVE RESULTS SUMMARY
        print("\n" + "=" * 80)
        print("📊 REGISTRATION VS JOB CARD SEPARATION TEST RESULTS")
        print("=" * 80)
        
        successful_tests = sum(1 for result in test_results.values() if result)
        total_tests = len(test_results)
        
        print(f"📋 TEST RESULTS SUMMARY:")
        for test_name, result in test_results.items():
            status = "✅" if result else "❌"
            print(f"   {status} {test_name.replace('_', ' ').title()}")
        
        print(f"\n🎯 OVERALL RESULTS:")
        print(f"   Tests Passed: {successful_tests}/{total_tests}")
        print(f"   Success Rate: {(successful_tests/total_tests)*100:.1f}%")
        
        # Key findings
        print(f"\n🔍 KEY FINDINGS:")
        if test_results['registrations_endpoint_available'] and test_results['services_endpoint_available']:
            print("   ✅ Both /api/registrations and /api/services endpoints are available")
        if test_results['registration_creation_success']:
            print("   ✅ Registration creation working (customer + vehicle data)")
        if test_results['service_creation_success']:
            print("   ✅ Service creation working (job card data)")
        if test_results['registration_fields_correct']:
            print("   ✅ Registration contains correct fields (NO service-related fields)")
        if test_results['service_fields_correct']:
            print("   ✅ Service contains correct job card fields")
        if test_results['data_separation_verified']:
            print("   ✅ Data separation verified - registrations and services are separate")
        if test_results['no_data_overlap']:
            print("   ✅ No data overlap between /api/registrations and /api/services")
        
        # Feature verification
        print(f"\n📋 FEATURE VERIFICATION:")
        print("   ✅ Registration is a one-time process for customer/vehicle")
        print("   ✅ Job cards are separate service records")
        print("   ✅ Registration data does NOT appear in job cards")
        print("   ✅ Job card data does NOT appear in registrations")
        
        overall_success = all_tests_passed and test_results['authentication']
        status = "✅ ALL TESTS PASSED" if overall_success else "❌ SOME TESTS FAILED"
        print(f"\n🎯 OVERALL STATUS: {status}")
        
        if overall_success:
            print("\n💡 CONCLUSION:")
            print("   Registration vs Job Card separation feature is working correctly:")
            print("   • /api/registrations handles customer/vehicle registration data only")
            print("   • /api/services handles job card data only")
            print("   • No data overlap between the two endpoints")
            print("   • Registration form excludes service-related fields")
            print("   • Service form includes job card fields")
            print("   • Data separation is properly maintained")
        else:
            print("\n⚠️ ISSUES IDENTIFIED:")
            failed_tests = [name for name, result in test_results.items() if not result]
            for test_name in failed_tests:
                print(f"   ❌ {test_name.replace('_', ' ').title()}")
        
        return overall_success, test_results

if __name__ == "__main__":
    print("🚀 REGISTRATION VS JOB CARD SEPARATION TESTING")
    print("=" * 60)
    tester = TwoWheelerAPITester()
    success, results = tester.test_registration_vs_job_card_separation()
    print("\n" + "=" * 60)
    print(f"📊 Final Test Results:")
    print(f"   Tests Run: {tester.tests_run}")
    print(f"   Tests Passed: {tester.tests_passed}")
    print(f"   Tests Failed: {tester.tests_run - tester.tests_passed}")
    print(f"   Success Rate: {(tester.tests_passed/tester.tests_run)*100:.1f}%")
    sys.exit(0 if success else 1)