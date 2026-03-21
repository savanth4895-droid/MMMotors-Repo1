#!/usr/bin/env python3
"""
Test script for View Invoices Vehicle Details functionality
Testing the View Invoices page to verify vehicle details are displayed correctly and edits are reflecting.
"""

import requests
import json
from datetime import datetime

class ViewInvoicesAPITester:
    def __init__(self, base_url="https://servicebay-app.preview.emergentagent.com/api"):
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
        """Test customer creation"""
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

    def test_view_invoices_vehicle_details(self):
        """
        TEST VIEW INVOICES PAGE - VEHICLE DETAILS DISPLAY AND EDITING
        
        Testing the View Invoices page to verify vehicle details are displayed correctly 
        and edits are reflecting as requested in the review.
        
        SPECIFIC TESTING REQUIREMENTS:
        1. GET /api/sales to check the data structure
        2. Check if vehicle_brand and vehicle_model fields exist in sales records
        3. Create a test sale with vehicle info (POST /api/sales)
        4. Update a sale (PUT /api/sales/{id}) with updated vehicle info
        5. Verify data structure contains all required vehicle fields
        
        TEST CREDENTIALS: admin/admin123
        
        EXPECTED RESULTS:
        - Sales records should contain vehicle_brand, vehicle_model, vehicle_color, 
          vehicle_registration, vehicle_chassis, vehicle_engine fields
        - Vehicle details should be editable via PUT /api/sales/{id}
        - Changes should persist and be reflected in GET /api/sales
        """
        print("\n" + "=" * 80)
        print("🚗 TESTING VIEW INVOICES PAGE - VEHICLE DETAILS DISPLAY AND EDITING")
        print("=" * 80)
        print("Testing vehicle details display and editing functionality in View Invoices")
        print("Focus: Vehicle fields in sales records and edit capabilities")
        
        all_tests_passed = True
        test_results = {
            'authentication': False,
            'sales_data_structure_check': False,
            'vehicle_fields_exist': False,
            'test_customer_creation': False,
            'test_sale_creation': False,
            'vehicle_details_in_sale': False,
            'sale_update_success': False,
            'vehicle_edits_persisted': False,
            'all_vehicle_fields_present': False
        }
        
        created_customer_id = None
        created_sale_id = None
        
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
        
        # 2. GET SALES DATA TO CHECK STRUCTURE
        print("\n📊 2. CHECKING SALES DATA STRUCTURE")
        print("-" * 50)
        
        success, sales_response = self.run_test(
            "Get Sales Data",
            "GET",
            "sales",
            200
        )
        
        if success:
            print(f"✅ GET /api/sales successful")
            if isinstance(sales_response, list):
                print(f"   Found {len(sales_response)} sales records")
                test_results['sales_data_structure_check'] = True
                
                # Check if vehicle fields exist in existing sales
                vehicle_fields = ['vehicle_brand', 'vehicle_model', 'vehicle_color', 
                                'vehicle_registration', 'vehicle_chassis', 'vehicle_engine']
                
                if len(sales_response) > 0:
                    sample_sale = sales_response[0]
                    existing_vehicle_fields = []
                    for field in vehicle_fields:
                        if field in sample_sale:
                            existing_vehicle_fields.append(field)
                    
                    print(f"   Vehicle fields found in existing sales: {existing_vehicle_fields}")
                    if len(existing_vehicle_fields) >= 2:  # At least brand and model
                        test_results['vehicle_fields_exist'] = True
                        print("✅ Vehicle fields exist in sales data structure")
                    else:
                        print("⚠️ Limited vehicle fields in existing sales data")
                else:
                    print("   No existing sales records to check structure")
            else:
                print("   Sales response is not a list")
        else:
            print("❌ GET /api/sales failed")
            all_tests_passed = False
        
        # 3. CREATE TEST CUSTOMER
        print("\n👤 3. CREATING TEST CUSTOMER FOR VEHICLE SALES TEST")
        print("-" * 50)
        
        success, customer_response = self.test_create_customer(
            "Vehicle Test Customer",
            "9876543210",
            "vehicletest@example.com",
            "123 Vehicle Test Street, Test City"
        )
        
        if success and 'id' in customer_response:
            created_customer_id = customer_response['id']
            print(f"✅ Created test customer: {created_customer_id[:8]}...")
            test_results['test_customer_creation'] = True
        else:
            print("❌ Failed to create test customer")
            all_tests_passed = False
            return False, test_results
        
        # 4. CREATE TEST SALE WITH VEHICLE INFO
        print("\n🚗 4. CREATING TEST SALE WITH VEHICLE INFORMATION")
        print("-" * 50)
        
        sale_data = {
            "customer_id": created_customer_id,
            "amount": 75000.0,
            "payment_method": "Cash",
            "vehicle_brand": "HONDA",
            "vehicle_model": "Activa 6G",
            "vehicle_color": "Pearl White",
            "vehicle_chassis": "TEST-CHASSIS-001",
            "vehicle_engine": "TEST-ENGINE-001",
            "vehicle_registration": "KA01AB9999"
        }
        
        print(f"   Creating sale with vehicle details:")
        print(f"   Brand: {sale_data['vehicle_brand']}")
        print(f"   Model: {sale_data['vehicle_model']}")
        print(f"   Color: {sale_data['vehicle_color']}")
        print(f"   Registration: {sale_data['vehicle_registration']}")
        print(f"   Chassis: {sale_data['vehicle_chassis']}")
        print(f"   Engine: {sale_data['vehicle_engine']}")
        print(f"   Amount: ₹{sale_data['amount']}")
        
        success, sale_response = self.run_test(
            "Create Sale with Vehicle Info",
            "POST",
            "sales",
            200,
            data=sale_data
        )
        
        if success and 'id' in sale_response:
            created_sale_id = sale_response['id']
            print(f"✅ Sale created successfully: {created_sale_id[:8]}...")
            print(f"   Invoice Number: {sale_response.get('invoice_number', 'N/A')}")
            test_results['test_sale_creation'] = True
            
            # Verify vehicle details are in the response
            vehicle_fields_in_response = []
            for field in ['vehicle_brand', 'vehicle_model', 'vehicle_color', 
                         'vehicle_chassis', 'vehicle_engine', 'vehicle_registration']:
                if field in sale_response and sale_response[field]:
                    vehicle_fields_in_response.append(field)
                    print(f"   ✅ {field}: {sale_response[field]}")
            
            if len(vehicle_fields_in_response) >= 4:
                print("✅ Vehicle details included in sale response")
                test_results['vehicle_details_in_sale'] = True
            else:
                print(f"⚠️ Only {len(vehicle_fields_in_response)} vehicle fields in response")
        else:
            print("❌ Sale creation failed")
            all_tests_passed = False
            return False, test_results
        
        # 5. UPDATE SALE WITH MODIFIED VEHICLE INFO
        print("\n✏️ 5. UPDATING SALE WITH MODIFIED VEHICLE INFORMATION")
        print("-" * 50)
        
        updated_sale_data = {
            "customer_id": created_customer_id,
            "amount": 75000.0,
            "payment_method": "Cash",
            "vehicle_brand": "YAMAHA",  # Changed from HONDA
            "vehicle_model": "Fascino 125",  # Changed from Activa 6G
            "vehicle_color": "Metallic Blue",  # Changed from Pearl White
            "vehicle_chassis": "TEST-CHASSIS-002",  # Changed
            "vehicle_engine": "TEST-ENGINE-002",  # Changed
            "vehicle_registration": "KA01AB8888"  # Changed
        }
        
        print(f"   Updating sale with new vehicle details:")
        print(f"   Brand: {sale_data['vehicle_brand']} → {updated_sale_data['vehicle_brand']}")
        print(f"   Model: {sale_data['vehicle_model']} → {updated_sale_data['vehicle_model']}")
        print(f"   Color: {sale_data['vehicle_color']} → {updated_sale_data['vehicle_color']}")
        print(f"   Registration: {sale_data['vehicle_registration']} → {updated_sale_data['vehicle_registration']}")
        print(f"   Chassis: {sale_data['vehicle_chassis']} → {updated_sale_data['vehicle_chassis']}")
        print(f"   Engine: {sale_data['vehicle_engine']} → {updated_sale_data['vehicle_engine']}")
        
        success, update_response = self.run_test(
            f"Update Sale {created_sale_id}",
            "PUT",
            f"sales/{created_sale_id}",
            200,
            data=updated_sale_data
        )
        
        if success:
            print(f"✅ Sale update successful")
            test_results['sale_update_success'] = True
            
            # Verify updated vehicle details are in the response
            updated_fields_correct = True
            for field in ['vehicle_brand', 'vehicle_model', 'vehicle_color', 
                         'vehicle_chassis', 'vehicle_engine', 'vehicle_registration']:
                if field in update_response:
                    expected_value = updated_sale_data[field]
                    actual_value = update_response[field]
                    if actual_value == expected_value:
                        print(f"   ✅ {field}: {actual_value} (updated correctly)")
                    else:
                        print(f"   ❌ {field}: Expected {expected_value}, got {actual_value}")
                        updated_fields_correct = False
                else:
                    print(f"   ❌ {field}: Missing from update response")
                    updated_fields_correct = False
            
            if updated_fields_correct:
                print("✅ All vehicle details updated correctly in response")
                test_results['vehicle_edits_persisted'] = True
            else:
                print("❌ Some vehicle details not updated correctly")
                all_tests_passed = False
        else:
            print("❌ Sale update failed")
            all_tests_passed = False
        
        # 6. VERIFY CHANGES PERSIST IN GET /api/sales
        print("\n🔍 6. VERIFYING CHANGES PERSIST IN GET /api/sales")
        print("-" * 50)
        
        success, updated_sales_response = self.run_test(
            "Get Updated Sales Data",
            "GET",
            "sales",
            200
        )
        
        if success and isinstance(updated_sales_response, list):
            # Find our updated sale
            updated_sale = None
            for sale in updated_sales_response:
                if sale.get('id') == created_sale_id:
                    updated_sale = sale
                    break
            
            if updated_sale:
                print(f"✅ Found updated sale in sales list")
                
                # Verify all vehicle fields are present and correct
                all_fields_present = True
                required_vehicle_fields = ['vehicle_brand', 'vehicle_model', 'vehicle_color', 
                                         'vehicle_registration', 'vehicle_chassis', 'vehicle_engine']
                
                print("   Checking all required vehicle fields:")
                for field in required_vehicle_fields:
                    if field in updated_sale and updated_sale[field]:
                        expected_value = updated_sale_data[field]
                        actual_value = updated_sale[field]
                        if actual_value == expected_value:
                            print(f"   ✅ {field}: {actual_value}")
                        else:
                            print(f"   ❌ {field}: Expected {expected_value}, got {actual_value}")
                            all_fields_present = False
                    else:
                        print(f"   ❌ {field}: Missing or empty")
                        all_fields_present = False
                
                if all_fields_present:
                    print("✅ All vehicle fields present and correct in persisted data")
                    test_results['all_vehicle_fields_present'] = True
                else:
                    print("❌ Some vehicle fields missing or incorrect in persisted data")
                    all_tests_passed = False
            else:
                print(f"❌ Updated sale not found in sales list")
                all_tests_passed = False
        else:
            print("❌ Failed to retrieve updated sales data")
            all_tests_passed = False
        
        # 7. COMPREHENSIVE RESULTS SUMMARY
        print("\n" + "=" * 80)
        print("📊 VIEW INVOICES VEHICLE DETAILS TEST RESULTS")
        print("=" * 80)
        
        successful_tests = sum(1 for result in test_results.values() if result)
        total_tests = len(test_results)
        
        print(f"\n📋 TEST RESULTS SUMMARY:")
        for test_name, result in test_results.items():
            status = "✅" if result else "❌"
            print(f"   {status} {test_name.replace('_', ' ').title()}")
        
        print(f"\n🎯 OVERALL RESULTS:")
        print(f"   Tests Passed: {successful_tests}/{total_tests}")
        print(f"   Success Rate: {(successful_tests/total_tests)*100:.1f}%")
        
        # Key findings
        print(f"\n🔍 KEY FINDINGS:")
        if test_results['sales_data_structure_check']:
            print("   ✅ GET /api/sales endpoint working correctly")
        if test_results['vehicle_fields_exist']:
            print("   ✅ Vehicle fields exist in sales data structure")
        if test_results['test_sale_creation']:
            print("   ✅ Sale creation with vehicle info successful")
        if test_results['vehicle_details_in_sale']:
            print("   ✅ Vehicle details included in sale creation response")
        if test_results['sale_update_success']:
            print("   ✅ Sale update with modified vehicle info successful")
        if test_results['vehicle_edits_persisted']:
            print("   ✅ Vehicle edits reflected in update response")
        if test_results['all_vehicle_fields_present']:
            print("   ✅ All vehicle fields present and correct in persisted data")
        
        # Data structure verification
        print(f"\n📋 DATA STRUCTURE VERIFICATION:")
        print("   Required vehicle fields in sales records:")
        required_fields = ['vehicle_brand', 'vehicle_model', 'vehicle_color', 
                          'vehicle_registration', 'vehicle_chassis', 'vehicle_engine']
        for field in required_fields:
            status = "✅" if test_results['all_vehicle_fields_present'] else "⚠️"
            print(f"   {status} {field}")
        
        overall_success = all_tests_passed and test_results['authentication']
        status = "✅ ALL TESTS PASSED" if overall_success else "❌ SOME TESTS FAILED"
        print(f"\n🎯 OVERALL STATUS: {status}")
        
        if overall_success:
            print("\n💡 CONCLUSION:")
            print("   View Invoices vehicle details functionality is working correctly:")
            print("   • GET /api/sales returns sales data with vehicle fields")
            print("   • POST /api/sales accepts and stores vehicle information")
            print("   • PUT /api/sales/{id} allows editing of vehicle details")
            print("   • Vehicle edits are persisted and reflected in subsequent GET requests")
            print("   • All required vehicle fields are present and editable")
        else:
            print("\n⚠️ ISSUES IDENTIFIED:")
            failed_tests = [name for name, result in test_results.items() if not result]
            for test_name in failed_tests:
                print(f"   ❌ {test_name.replace('_', ' ').title()}")
        
        return overall_success, test_results


if __name__ == "__main__":
    print("🚀 Starting View Invoices Vehicle Details API Testing")
    print("=" * 60)
    print("Focus: View Invoices Page - Vehicle Details Display and Editing")
    
    tester = ViewInvoicesAPITester()
    
    # Run the specific test for View Invoices vehicle details
    success, results = tester.test_view_invoices_vehicle_details()
    
    print(f"\n🎯 Testing Complete!")
    print(f"Tests Run: {tester.tests_run}")
    print(f"Tests Passed: {tester.tests_passed}")
    print(f"Success Rate: {(tester.tests_passed/tester.tests_run)*100:.1f}%")
    
    if success:
        print("\n✅ View Invoices Vehicle Details Test: PASSED")
    else:
        print("\n❌ View Invoices Vehicle Details Test: FAILED")
        print("Please check the detailed test results above for specific issues.")