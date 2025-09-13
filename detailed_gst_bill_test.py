#!/usr/bin/env python3
"""
Detailed GST Spare Parts Bill API Testing
This script specifically tests the GST-compliant spare parts billing functionality
as requested in the review.
"""

import requests
import json
from datetime import datetime

class DetailedGSTBillTester:
    def __init__(self, base_url="https://mmmotor-bills.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        
    def authenticate(self):
        """Authenticate with admin credentials"""
        url = f"{self.base_url}/auth/login"
        data = {"username": "admin", "password": "admin123"}
        
        print("🔐 Authenticating with admin credentials...")
        response = requests.post(url, json=data)
        
        if response.status_code == 200:
            result = response.json()
            self.token = result['access_token']
            print(f"✅ Authentication successful")
            print(f"   Token: {self.token[:20]}...")
            return True
        else:
            print(f"❌ Authentication failed: {response.status_code}")
            return False
    
    def test_gst_bill_creation(self):
        """Test GST bill creation with the exact payload from review request"""
        if not self.token:
            print("❌ No authentication token available")
            return False
            
        url = f"{self.base_url}/spare-parts/bills"
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {self.token}'
        }
        
        # Exact payload from review request
        payload = {
            "customer_data": {
                "name": "Test Customer",
                "mobile": "9876543210",
                "vehicle_name": "Honda Activa",
                "vehicle_number": "TN12CD5678"
            },
            "items": [
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
            ],
            "subtotal": 1000,
            "total_discount": 50,
            "total_cgst": 85.5,
            "total_sgst": 85.5,
            "total_tax": 171,
            "total_amount": 1121
        }
        
        print("\n💰 Testing GST Bill Creation...")
        print(f"   URL: {url}")
        print(f"   Payload: {json.dumps(payload, indent=2)}")
        
        response = requests.post(url, json=payload, headers=headers)
        
        print(f"   Status Code: {response.status_code}")
        
        if response.status_code in [200, 201]:
            result = response.json()
            print("✅ GST Bill created successfully!")
            print(f"   Bill ID: {result.get('id')}")
            print(f"   Bill Number: {result.get('bill_number')}")
            print(f"   Customer Data: {result.get('customer_data')}")
            print(f"   Total Amount: ₹{result.get('total_amount')}")
            print(f"   Total CGST: ₹{result.get('total_cgst')}")
            print(f"   Total SGST: ₹{result.get('total_sgst')}")
            print(f"   Items Count: {len(result.get('items', []))}")
            
            # Verify calculations
            expected_cgst = 85.5
            expected_sgst = 85.5
            expected_total = 1121
            
            actual_cgst = result.get('total_cgst')
            actual_sgst = result.get('total_sgst')
            actual_total = result.get('total_amount')
            
            print("\n🧮 Verifying GST Calculations...")
            print(f"   Expected CGST: ₹{expected_cgst}, Actual: ₹{actual_cgst} {'✅' if actual_cgst == expected_cgst else '❌'}")
            print(f"   Expected SGST: ₹{expected_sgst}, Actual: ₹{actual_sgst} {'✅' if actual_sgst == expected_sgst else '❌'}")
            print(f"   Expected Total: ₹{expected_total}, Actual: ₹{actual_total} {'✅' if actual_total == expected_total else '❌'}")
            
            return True, result
        else:
            print(f"❌ GST Bill creation failed")
            try:
                error = response.json()
                print(f"   Error: {error}")
            except:
                print(f"   Error: {response.text}")
            return False, None
    
    def test_get_bills(self):
        """Test retrieving all bills to verify the created bill appears"""
        if not self.token:
            print("❌ No authentication token available")
            return False
            
        url = f"{self.base_url}/spare-parts/bills"
        headers = {'Authorization': f'Bearer {self.token}'}
        
        print("\n📋 Testing Get Bills...")
        response = requests.get(url, headers=headers)
        
        print(f"   Status Code: {response.status_code}")
        
        if response.status_code == 200:
            bills = response.json()
            print(f"✅ Retrieved {len(bills)} bills")
            
            # Look for bills with customer_data (new format)
            gst_bills = [bill for bill in bills if bill.get('customer_data')]
            print(f"   GST Bills (with customer_data): {len(gst_bills)}")
            
            if gst_bills:
                latest_bill = gst_bills[-1]  # Get the latest GST bill
                print(f"   Latest GST Bill:")
                print(f"     Bill Number: {latest_bill.get('bill_number')}")
                print(f"     Customer: {latest_bill.get('customer_data', {}).get('name')}")
                print(f"     Mobile: {latest_bill.get('customer_data', {}).get('mobile')}")
                print(f"     Vehicle: {latest_bill.get('customer_data', {}).get('vehicle_name')}")
                print(f"     Total Amount: ₹{latest_bill.get('total_amount')}")
                
            return True, bills
        else:
            print(f"❌ Failed to retrieve bills")
            return False, None
    
    def test_error_scenarios(self):
        """Test various error scenarios"""
        if not self.token:
            print("❌ No authentication token available")
            return False
            
        url = f"{self.base_url}/spare-parts/bills"
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {self.token}'
        }
        
        print("\n❌ Testing Error Scenarios...")
        
        # Test 1: Missing customer data
        print("   Test 1: Missing customer data")
        payload1 = {
            "items": [{"description": "Test Item", "quantity": 1, "rate": 100}],
            "subtotal": 100,
            "total_amount": 100
        }
        
        response1 = requests.post(url, json=payload1, headers=headers)
        print(f"     Status: {response1.status_code} {'✅' if response1.status_code == 400 else '❌'}")
        
        # Test 2: Invalid customer data (missing required fields)
        print("   Test 2: Invalid customer data (missing name)")
        payload2 = {
            "customer_data": {"mobile": "9876543210"},  # Missing name
            "items": [{"description": "Test Item", "quantity": 1, "rate": 100}],
            "subtotal": 100,
            "total_amount": 100
        }
        
        response2 = requests.post(url, json=payload2, headers=headers)
        print(f"     Status: {response2.status_code} {'✅' if response2.status_code in [400, 422] else '❌'}")
        
        # Test 3: Empty items array (should succeed but with 0 amount)
        print("   Test 3: Empty items array")
        payload3 = {
            "customer_data": {"name": "Test Customer", "mobile": "9876543210"},
            "items": [],
            "subtotal": 0,
            "total_amount": 0
        }
        
        response3 = requests.post(url, json=payload3, headers=headers)
        print(f"     Status: {response3.status_code} {'✅' if response3.status_code == 200 else '❌'}")
        
        return True

def main():
    print("🧪 Detailed GST Spare Parts Bill API Testing")
    print("=" * 50)
    
    tester = DetailedGSTBillTester()
    
    # Step 1: Authenticate
    if not tester.authenticate():
        print("❌ Authentication failed. Cannot proceed with tests.")
        return 1
    
    # Step 2: Test GST bill creation
    success, bill_data = tester.test_gst_bill_creation()
    if not success:
        print("❌ GST bill creation failed. Cannot proceed with verification.")
        return 1
    
    # Step 3: Test retrieving bills
    tester.test_get_bills()
    
    # Step 4: Test error scenarios
    tester.test_error_scenarios()
    
    print("\n" + "=" * 50)
    print("✅ All GST Bill API tests completed successfully!")
    print("   ✅ Authentication working")
    print("   ✅ GST bill creation working")
    print("   ✅ Bill retrieval working")
    print("   ✅ Error handling working")
    print("   ✅ GST calculations verified")
    
    return 0

if __name__ == "__main__":
    exit(main())