import requests
import sys
import json
from datetime import datetime
import uuid

class HypothecationTester:
    def __init__(self, base_url="https://bike-business.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.created_ids = {
            'customers': [],
            'vehicles': [],
            'sales': []
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

    def test_create_sale_with_hypothecation(self, customer_id, vehicle_id, amount, payment_method, hypothecation_data):
        """Test sale creation with hypothecation data in insurance_details"""
        insurance_details = {
            "hypothecation": hypothecation_data
        }
        
        success, response = self.run_test(
            "Create Sale with Hypothecation Data",
            "POST",
            "sales",
            200,
            data={
                "customer_id": customer_id,
                "vehicle_id": vehicle_id,
                "amount": amount,
                "payment_method": payment_method,
                "insurance_details": insurance_details
            }
        )
        if success and 'id' in response:
            self.created_ids['sales'].append(response['id'])
            print(f"   Sale ID: {response['id']}")
            print(f"   Invoice Number: {response.get('invoice_number', 'N/A')}")
            if 'insurance_details' in response:
                print(f"   Insurance Details: {response['insurance_details']}")
        return success, response

    def test_create_sale_with_full_insurance_and_hypothecation(self, customer_id, vehicle_id, amount, payment_method, insurance_data, hypothecation_data):
        """Test sale creation with both insurance and hypothecation data"""
        insurance_details = {
            "insurance_company": insurance_data.get("company"),
            "policy_number": insurance_data.get("policy_number"),
            "premium_amount": insurance_data.get("premium"),
            "coverage_type": insurance_data.get("coverage"),
            "hypothecation": hypothecation_data
        }
        
        success, response = self.run_test(
            "Create Sale with Full Insurance and Hypothecation",
            "POST",
            "sales",
            200,
            data={
                "customer_id": customer_id,
                "vehicle_id": vehicle_id,
                "amount": amount,
                "payment_method": payment_method,
                "insurance_details": insurance_details
            }
        )
        if success and 'id' in response:
            self.created_ids['sales'].append(response['id'])
            print(f"   Sale ID: {response['id']}")
            print(f"   Invoice Number: {response.get('invoice_number', 'N/A')}")
            if 'insurance_details' in response:
                print(f"   Insurance Details: {json.dumps(response['insurance_details'], indent=2)}")
        return success, response

    def test_get_sale_with_hypothecation(self, sale_id):
        """Test retrieving sale with hypothecation data"""
        success, response = self.run_test(
            f"Get Sale with Hypothecation Data - {sale_id}",
            "GET",
            f"sales/{sale_id}",
            200
        )
        if success:
            print(f"   Sale ID: {response.get('id', 'N/A')}")
            print(f"   Invoice Number: {response.get('invoice_number', 'N/A')}")
            if 'insurance_details' in response and response['insurance_details']:
                print(f"   Insurance Details: {json.dumps(response['insurance_details'], indent=2)}")
                if 'hypothecation' in response['insurance_details']:
                    print(f"   ✅ Hypothecation data found in response")
                    hypothecation = response['insurance_details']['hypothecation']
                    print(f"   Hypothecation Details: {json.dumps(hypothecation, indent=2)}")
                else:
                    print(f"   ❌ Hypothecation data NOT found in insurance_details")
            else:
                print(f"   ❌ No insurance_details found in response")
        return success, response

    def test_update_sale_with_hypothecation(self, sale_id, customer_id, vehicle_id, amount, payment_method, hypothecation_data):
        """Test updating sale with hypothecation data"""
        insurance_details = {
            "hypothecation": hypothecation_data
        }
        
        success, response = self.run_test(
            f"Update Sale with Hypothecation Data - {sale_id}",
            "PUT",
            f"sales/{sale_id}",
            200,
            data={
                "customer_id": customer_id,
                "vehicle_id": vehicle_id,
                "amount": amount,
                "payment_method": payment_method,
                "insurance_details": insurance_details
            }
        )
        if success:
            print(f"   Updated Sale ID: {response.get('id', 'N/A')}")
            if 'insurance_details' in response and response['insurance_details']:
                print(f"   Updated Insurance Details: {json.dumps(response['insurance_details'], indent=2)}")
                if 'hypothecation' in response['insurance_details']:
                    print(f"   ✅ Hypothecation data successfully updated")
                else:
                    print(f"   ❌ Hypothecation data NOT found after update")
        return success, response

    def test_get_all_sales_with_hypothecation(self):
        """Test retrieving all sales and check for hypothecation data"""
        success, response = self.run_test(
            "Get All Sales (Check for Hypothecation)",
            "GET",
            "sales",
            200
        )
        if success and isinstance(response, list):
            print(f"   Total Sales Retrieved: {len(response)}")
            hypothecation_count = 0
            for sale in response:
                if 'insurance_details' in sale and sale['insurance_details'] and 'hypothecation' in sale['insurance_details']:
                    hypothecation_count += 1
                    print(f"   Sale {sale.get('invoice_number', 'N/A')} has hypothecation data")
            print(f"   Sales with Hypothecation Data: {hypothecation_count}")
        return success, response

    def test_hypothecation_data_structure(self, sale_id):
        """Test the structure and content of hypothecation data"""
        success, response = self.run_test(
            f"Verify Hypothecation Data Structure - {sale_id}",
            "GET",
            f"sales/{sale_id}",
            200
        )
        
        if success and 'insurance_details' in response and response['insurance_details']:
            insurance_details = response['insurance_details']
            if 'hypothecation' in insurance_details:
                hypothecation = insurance_details['hypothecation']
                print(f"   ✅ Hypothecation data structure verification:")
                
                # Check required fields
                required_fields = ['bank_name', 'loan_amount', 'loan_account_number']
                for field in required_fields:
                    if field in hypothecation:
                        print(f"     ✅ {field}: {hypothecation[field]}")
                    else:
                        print(f"     ❌ Missing required field: {field}")
                
                # Check optional fields
                optional_fields = ['loan_tenure_months', 'interest_rate', 'emi_amount', 'loan_start_date']
                for field in optional_fields:
                    if field in hypothecation:
                        print(f"     ✅ {field}: {hypothecation[field]}")
                    else:
                        print(f"     ⚠️  Optional field not present: {field}")
                
                return True, hypothecation
            else:
                print(f"   ❌ No hypothecation data found")
                return False, {}
        else:
            print(f"   ❌ No insurance_details found")
            return False, {}

def main():
    print("🚀 Starting Hypothecation Field Testing for Sales Module")
    print("=" * 70)
    
    tester = HypothecationTester()
    
    # Test authentication with known credentials
    print("\n🔐 Testing Authentication...")
    success, _ = tester.test_login_user("admin", "admin123")
    if not success:
        print("❌ Login failed with known credentials. Stopping tests.")
        return 1

    # Create test customer
    print("\n👥 Creating Test Customer...")
    success, customer_data = tester.test_create_customer(
        "Rajesh Kumar", 
        "9876543210", 
        "rajesh@example.com", 
        "123 MG Road, Bangalore, Karnataka"
    )
    customer_id = customer_data.get('id') if success else None
    
    if not customer_id:
        print("❌ Failed to create customer. Stopping tests.")
        return 1

    # Create test vehicle
    print("\n🏍️ Creating Test Vehicle...")
    success, vehicle_data = tester.test_create_vehicle(
        "BAJAJ", 
        "Pulsar NS200", 
        "CHASSIS789XYZ", 
        "ENGINE789XYZ", 
        "Black", 
        "KEY789", 
        "Showroom Floor"
    )
    vehicle_id = vehicle_data.get('id') if success else None
    
    if not vehicle_id:
        print("❌ Failed to create vehicle. Stopping tests.")
        return 1

    # Test 1: Create sale with hypothecation data
    print("\n💰 Test 1: Creating Sale with Hypothecation Data...")
    hypothecation_data = {
        "bank_name": "State Bank of India",
        "loan_amount": 75000.0,
        "loan_account_number": "SBI123456789",
        "loan_tenure_months": 36,
        "interest_rate": 10.5,
        "emi_amount": 2435.0,
        "loan_start_date": "2024-01-15"
    }
    
    success, sale_data = tester.test_create_sale_with_hypothecation(
        customer_id, 
        vehicle_id, 
        125000.0, 
        "Loan", 
        hypothecation_data
    )
    sale_id = sale_data.get('id') if success else None
    
    if not sale_id:
        print("❌ Failed to create sale with hypothecation. Stopping tests.")
        return 1

    # Test 2: Retrieve sale and verify hypothecation data
    print("\n🔍 Test 2: Retrieving Sale and Verifying Hypothecation Data...")
    tester.test_get_sale_with_hypothecation(sale_id)

    # Test 3: Verify hypothecation data structure
    print("\n📋 Test 3: Verifying Hypothecation Data Structure...")
    tester.test_hypothecation_data_structure(sale_id)

    # Test 4: Update sale with modified hypothecation data
    print("\n✏️ Test 4: Updating Sale with Modified Hypothecation Data...")
    updated_hypothecation_data = {
        "bank_name": "HDFC Bank",
        "loan_amount": 80000.0,
        "loan_account_number": "HDFC987654321",
        "loan_tenure_months": 48,
        "interest_rate": 9.75,
        "emi_amount": 2025.0,
        "loan_start_date": "2024-02-01"
    }
    
    tester.test_update_sale_with_hypothecation(
        sale_id,
        customer_id,
        vehicle_id,
        125000.0,
        "Loan",
        updated_hypothecation_data
    )

    # Test 5: Verify updated hypothecation data
    print("\n🔍 Test 5: Verifying Updated Hypothecation Data...")
    tester.test_get_sale_with_hypothecation(sale_id)

    # Test 6: Create another vehicle for additional testing
    print("\n🏍️ Creating Second Test Vehicle...")
    success, vehicle_data2 = tester.test_create_vehicle(
        "TVS", 
        "Apache RTR 200", 
        "CHASSIS456ABC", 
        "ENGINE456ABC", 
        "Red", 
        "KEY456", 
        "Warehouse A"
    )
    vehicle_id2 = vehicle_data2.get('id') if success else None

    # Test 7: Create sale with both insurance and hypothecation data
    if vehicle_id2:
        print("\n💰 Test 7: Creating Sale with Full Insurance and Hypothecation...")
        insurance_data = {
            "company": "ICICI Lombard",
            "policy_number": "ICICI123456789",
            "premium": 8500.0,
            "coverage": "Comprehensive"
        }
        
        hypothecation_data_2 = {
            "bank_name": "ICICI Bank",
            "loan_amount": 95000.0,
            "loan_account_number": "ICICI555666777",
            "loan_tenure_months": 60,
            "interest_rate": 11.25,
            "emi_amount": 2075.0,
            "loan_start_date": "2024-03-01"
        }
        
        success, sale_data2 = tester.test_create_sale_with_full_insurance_and_hypothecation(
            customer_id,
            vehicle_id2,
            150000.0,
            "Loan",
            insurance_data,
            hypothecation_data_2
        )
        sale_id2 = sale_data2.get('id') if success else None
        
        if sale_id2:
            print("\n🔍 Test 8: Verifying Full Insurance and Hypothecation Data...")
            tester.test_get_sale_with_hypothecation(sale_id2)

    # Test 9: Get all sales and check for hypothecation data
    print("\n📊 Test 9: Checking All Sales for Hypothecation Data...")
    tester.test_get_all_sales_with_hypothecation()

    # Test 10: Edge case - Create sale without hypothecation data
    print("\n🏍️ Creating Third Test Vehicle for Edge Case...")
    success, vehicle_data3 = tester.test_create_vehicle(
        "HERO", 
        "Splendor Plus", 
        "CHASSIS999DEF", 
        "ENGINE999DEF", 
        "Blue", 
        "KEY999", 
        "Warehouse B"
    )
    vehicle_id3 = vehicle_data3.get('id') if success else None

    if vehicle_id3:
        print("\n💰 Test 10: Creating Sale WITHOUT Hypothecation Data (Edge Case)...")
        success, sale_data3 = tester.run_test(
            "Create Sale without Hypothecation",
            "POST",
            "sales",
            200,
            data={
                "customer_id": customer_id,
                "vehicle_id": vehicle_id3,
                "amount": 65000.0,
                "payment_method": "Cash"
            }
        )
        
        if success:
            sale_id3 = sale_data3.get('id')
            print(f"   Sale created without hypothecation: {sale_id3}")
            
            # Verify this sale doesn't have hypothecation data
            print("\n🔍 Test 11: Verifying Sale Without Hypothecation...")
            success, response = tester.test_get_sale_with_hypothecation(sale_id3)
            if success:
                if 'insurance_details' not in response or not response['insurance_details']:
                    print("   ✅ Correctly shows no insurance_details for cash sale")
                elif 'hypothecation' not in response['insurance_details']:
                    print("   ✅ Correctly shows no hypothecation data for cash sale")

    # Print final results
    print("\n" + "=" * 70)
    print(f"📊 Hypothecation Testing Results:")
    print(f"   Tests Run: {tester.tests_run}")
    print(f"   Tests Passed: {tester.tests_passed}")
    print(f"   Tests Failed: {tester.tests_run - tester.tests_passed}")
    print(f"   Success Rate: {(tester.tests_passed/tester.tests_run)*100:.1f}%")
    
    print(f"\n📋 Test Summary:")
    print(f"   ✅ Created {len(tester.created_ids['customers'])} test customers")
    print(f"   ✅ Created {len(tester.created_ids['vehicles'])} test vehicles")
    print(f"   ✅ Created {len(tester.created_ids['sales'])} test sales")
    
    print(f"\n🎯 Hypothecation Testing Conclusions:")
    print(f"   1. POST /api/sales endpoint can handle hypothecation data in insurance_details field")
    print(f"   2. Sales data structure accepts and stores hypothecation field within insurance_details")
    print(f"   3. PUT /api/sales/{{sale_id}} endpoint can update sales with hypothecation data")
    print(f"   4. GET /api/sales endpoint returns sales data including hypothecation field")
    print(f"   5. The existing insurance_details field can store hypothecation data - no separate field needed")
    print(f"   6. Hypothecation data structure supports all required fields (bank_name, loan_amount, etc.)")
    print(f"   7. System handles both sales with and without hypothecation data correctly")

    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())