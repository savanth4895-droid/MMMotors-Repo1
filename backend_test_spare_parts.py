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

    def test_create_spare_part(self, name, part_number, brand, quantity, unit, unit_price, hsn_sac, gst_percentage, supplier):
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
                "unit": unit,
                "unit_price": unit_price,
                "hsn_sac": hsn_sac,
                "gst_percentage": gst_percentage,
                "supplier": supplier
            }
        )
        if success and 'id' in response:
            self.created_ids['spare_parts'].append(response['id'])
        return success, response

    def test_spare_part_inventory_reduction_feature(self):
        """
        TEST SPARE PART INVENTORY REDUCTION FEATURE WHEN CREATING SERVICE BILLS
        
        Testing the spare part inventory reduction feature as requested in the review.
        
        SPECIFIC TESTING REQUIREMENTS:
        1. Authentication with admin/admin123 credentials
        2. Check current spare part quantity via GET /api/spare-parts
        3. Create a service bill with spare_part_id in items
        4. Verify the spare part quantity has been reduced by the qty used in the bill
        
        TEST STEPS:
        1. Get current spare part inventory
        2. Create service bill with spare part usage
        3. Verify inventory reduction
        
        EXPECTED RESULTS:
        - Spare part quantity should be reduced by the amount used in service bill
        - Service bill should be created successfully
        - Inventory tracking should be accurate
        """
        print("\n" + "=" * 80)
        print("🔧 TESTING SPARE PART INVENTORY REDUCTION FEATURE")
        print("=" * 80)
        print("Testing spare part inventory reduction when creating service bills")
        print("Focus: Inventory tracking and automatic quantity reduction")
        
        all_tests_passed = True
        test_results = {
            'authentication': False,
            'spare_parts_available': False,
            'initial_quantity_recorded': False,
            'service_bill_creation': False,
            'inventory_reduction_verified': False,
            'quantity_calculation_correct': False
        }
        
        spare_part_id = None
        initial_quantity = 0
        qty_used = 2
        
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
        
        # 2. GET CURRENT SPARE PART INVENTORY
        print("\n📦 2. CHECKING CURRENT SPARE PART INVENTORY")
        print("-" * 50)
        
        success, spare_parts_response = self.run_test(
            "Get Spare Parts",
            "GET",
            "spare-parts",
            200
        )
        
        if success and isinstance(spare_parts_response, list) and len(spare_parts_response) > 0:
            # Use the first spare part for testing
            test_spare_part = spare_parts_response[0]
            spare_part_id = test_spare_part.get('id')
            initial_quantity = test_spare_part.get('quantity', 0)
            spare_part_name = test_spare_part.get('name', 'Unknown')
            
            print(f"✅ Found {len(spare_parts_response)} spare parts in inventory")
            print(f"   Using spare part: {spare_part_name} (ID: {spare_part_id[:8]}...)")
            print(f"   Initial quantity: {initial_quantity}")
            
            test_results['spare_parts_available'] = True
            test_results['initial_quantity_recorded'] = True
            
            # Ensure we have enough quantity for testing
            if initial_quantity < qty_used:
                print(f"⚠️ Warning: Initial quantity ({initial_quantity}) is less than test usage ({qty_used})")
                print("   Test will proceed but quantity will be reduced to 0")
        else:
            print("❌ No spare parts found in inventory or failed to retrieve")
            print("   Creating a test spare part for testing...")
            
            # Create a test spare part
            success, spare_part_response = self.test_create_spare_part(
                "Test Inventory Part",
                "TEST-INV-001",
                "TEST",
                10,  # Initial quantity
                "Nos",
                100.0,
                "12345678",
                18.0,
                "Test Supplier"
            )
            
            if success and 'id' in spare_part_response:
                spare_part_id = spare_part_response['id']
                initial_quantity = 10
                print(f"✅ Created test spare part: {spare_part_id[:8]}...")
                print(f"   Initial quantity: {initial_quantity}")
                test_results['spare_parts_available'] = True
                test_results['initial_quantity_recorded'] = True
            else:
                print("❌ Failed to create test spare part")
                all_tests_passed = False
                return False, test_results
        
        # 3. CREATE SERVICE BILL WITH SPARE PART USAGE
        print("\n📋 3. CREATING SERVICE BILL WITH SPARE PART USAGE")
        print("-" * 50)
        
        # Create service bill with spare part item
        service_bill_data = {
            "bill_number": "SB-TEST001",
            "customer_name": "Test Customer",
            "customer_mobile": "9999999999",
            "vehicle_number": "KA01AB1234",
            "items": [
                {
                    "sl_no": 1,
                    "description": "Test Part",
                    "hsn_sac": "",
                    "qty": qty_used,
                    "unit": "Nos",
                    "rate": 100,
                    "labor": 0,
                    "disc_percent": 0,
                    "gst_percent": 18,
                    "cgst_amount": 18,
                    "sgst_amount": 18,
                    "total_tax": 36,
                    "amount": 236,
                    "spare_part_id": spare_part_id
                }
            ],
            "subtotal": 200,
            "total_discount": 0,
            "total_cgst": 18,
            "total_sgst": 18,
            "total_tax": 36,
            "total_amount": 236,
            "bill_date": "2024-12-19",
            "status": "pending"
        }
        
        print(f"   Creating service bill with:")
        print(f"   Bill Number: {service_bill_data['bill_number']}")
        print(f"   Customer: {service_bill_data['customer_name']}")
        print(f"   Spare Part ID: {spare_part_id[:8]}...")
        print(f"   Quantity Used: {qty_used}")
        
        success, bill_response = self.run_test(
            "Create Service Bill",
            "POST",
            "service-bills",
            200,
            data=service_bill_data
        )
        
        if success and 'id' in bill_response:
            bill_id = bill_response['id']
            print(f"✅ Service bill created successfully: {bill_id[:8]}...")
            print(f"   Bill Number: {bill_response.get('bill_number', 'N/A')}")
            test_results['service_bill_creation'] = True
        else:
            print("❌ Service bill creation failed")
            all_tests_passed = False
            return False, test_results
        
        # 4. VERIFY SPARE PART QUANTITY REDUCTION
        print("\n🔍 4. VERIFYING SPARE PART QUANTITY REDUCTION")
        print("-" * 50)
        
        # Get updated spare parts inventory
        success, updated_spare_parts = self.run_test(
            "Get Updated Spare Parts",
            "GET",
            "spare-parts",
            200
        )
        
        if success and isinstance(updated_spare_parts, list):
            # Find our test spare part
            updated_spare_part = None
            for part in updated_spare_parts:
                if part.get('id') == spare_part_id:
                    updated_spare_part = part
                    break
            
            if updated_spare_part:
                current_quantity = updated_spare_part.get('quantity', 0)
                expected_quantity = max(0, initial_quantity - qty_used)
                
                print(f"   Spare part found in updated inventory")
                print(f"   Initial quantity: {initial_quantity}")
                print(f"   Quantity used: {qty_used}")
                print(f"   Expected quantity: {expected_quantity}")
                print(f"   Current quantity: {current_quantity}")
                
                if current_quantity == expected_quantity:
                    print("✅ Spare part quantity reduced correctly")
                    test_results['inventory_reduction_verified'] = True
                    test_results['quantity_calculation_correct'] = True
                else:
                    print(f"❌ Quantity reduction incorrect: Expected {expected_quantity}, got {current_quantity}")
                    all_tests_passed = False
            else:
                print(f"❌ Spare part {spare_part_id[:8]}... not found in updated inventory")
                all_tests_passed = False
        else:
            print("❌ Failed to retrieve updated spare parts inventory")
            all_tests_passed = False
        
        # 5. COMPREHENSIVE RESULTS SUMMARY
        print("\n" + "=" * 80)
        print("📊 SPARE PART INVENTORY REDUCTION TEST RESULTS")
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
        if test_results['spare_parts_available']:
            print("   ✅ Spare parts inventory is available and accessible")
        if test_results['service_bill_creation']:
            print("   ✅ Service bill creation with spare parts works correctly")
        if test_results['inventory_reduction_verified']:
            print("   ✅ Spare part inventory reduction is working correctly")
        if test_results['quantity_calculation_correct']:
            print("   ✅ Quantity calculations are accurate")
        
        # Test data summary
        print(f"\n📊 TEST DATA SUMMARY:")
        if spare_part_id:
            print(f"   Spare Part ID: {spare_part_id[:8]}...")
            print(f"   Initial Quantity: {initial_quantity}")
            print(f"   Quantity Used: {qty_used}")
            print(f"   Expected Final Quantity: {max(0, initial_quantity - qty_used)}")
        
        overall_success = all_tests_passed and test_results['authentication']
        status = "✅ ALL TESTS PASSED" if overall_success else "❌ SOME TESTS FAILED"
        print(f"\n🎯 OVERALL STATUS: {status}")
        
        if overall_success:
            print("\n💡 CONCLUSION:")
            print("   Spare part inventory reduction feature is working correctly:")
            print("   • Service bills can include spare parts with spare_part_id")
            print("   • Inventory quantities are automatically reduced when bills are created")
            print("   • Quantity calculations are accurate and prevent negative values")
            print("   • The feature integrates seamlessly with service bill creation")
        else:
            print("\n⚠️ ISSUES IDENTIFIED:")
            failed_tests = [name for name, result in test_results.items() if not result]
            for test_name in failed_tests:
                print(f"   ❌ {test_name.replace('_', ' ').title()}")
        
        return overall_success, test_results

if __name__ == "__main__":
    print("🚀 SPARE PART INVENTORY REDUCTION TESTING")
    print("=" * 60)
    tester = TwoWheelerAPITester()
    success, results = tester.test_spare_part_inventory_reduction_feature()
    print("\n" + "=" * 60)
    print(f"📊 Final Test Results:")
    print(f"   Tests Run: {tester.tests_run}")
    print(f"   Tests Passed: {tester.tests_passed}")
    print(f"   Tests Failed: {tester.tests_run - tester.tests_passed}")
    print(f"   Success Rate: {(tester.tests_passed/tester.tests_run)*100:.1f}%")
    sys.exit(0 if success else 1)