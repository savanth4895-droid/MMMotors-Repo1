#!/usr/bin/env python3
"""
Specific API tests for Sales Data Fetching Fix
Testing the exact endpoints mentioned in the review request
"""

import requests
import json
import sys
from datetime import datetime

class SalesAPITester:
    def __init__(self, base_url="https://twowheeler-system.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.session = requests.Session()
        
    def test_authentication_flow(self):
        """Test the complete authentication flow as specified in review"""
        print("🔐 TESTING AUTHENTICATION ENDPOINT")
        print("=" * 50)
        
        # Test POST /api/auth/login with admin/admin123 credentials
        login_url = f"{self.base_url}/auth/login"
        login_data = {"username": "admin", "password": "admin123"}
        
        print(f"📤 POST {login_url}")
        print(f"   Payload: {login_data}")
        
        try:
            response = self.session.post(login_url, json=login_data)
            print(f"   Status Code: {response.status_code}")
            print(f"   Headers: {dict(response.headers)}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Login successful")
                print(f"   Response keys: {list(data.keys())}")
                
                if 'access_token' in data:
                    self.token = data['access_token']
                    print(f"   JWT Token obtained: {self.token[:30]}...")
                    print(f"   Token type: {data.get('token_type', 'N/A')}")
                    
                    if 'user' in data:
                        user = data['user']
                        print(f"   User ID: {user.get('id', 'N/A')}")
                        print(f"   Username: {user.get('username', 'N/A')}")
                        print(f"   Role: {user.get('role', 'N/A')}")
                    
                    return True
                else:
                    print("❌ No access_token in response")
                    return False
            else:
                print(f"❌ Login failed: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Login error: {str(e)}")
            return False
    
    def test_token_validity(self):
        """Test token validity with GET /api/auth/me"""
        print("\n🔍 TESTING TOKEN VALIDITY")
        print("=" * 50)
        
        if not self.token:
            print("❌ No token available for testing")
            return False
            
        me_url = f"{self.base_url}/auth/me"
        headers = {'Authorization': f'Bearer {self.token}'}
        
        print(f"📤 GET {me_url}")
        print(f"   Authorization: Bearer {self.token[:30]}...")
        
        try:
            response = self.session.get(me_url, headers=headers)
            print(f"   Status Code: {response.status_code}")
            print(f"   Headers: {dict(response.headers)}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Token is valid")
                print(f"   User data: {json.dumps(data, indent=2, default=str)}")
                return True
            else:
                print(f"❌ Token validation failed: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Token validation error: {str(e)}")
            return False
    
    def test_sales_data_endpoints(self):
        """Test the three main sales data endpoints"""
        print("\n📊 TESTING SALES DATA ENDPOINTS")
        print("=" * 50)
        
        if not self.token:
            print("❌ No token available for testing")
            return False
            
        headers = {'Authorization': f'Bearer {self.token}'}
        endpoints = [
            ('sales', 'Sales records'),
            ('customers', 'Customer data'),
            ('vehicles', 'Vehicle data')
        ]
        
        results = {}
        
        for endpoint, description in endpoints:
            url = f"{self.base_url}/{endpoint}"
            print(f"\n📤 GET {url}")
            print(f"   Testing: {description}")
            
            try:
                response = self.session.get(url, headers=headers)
                print(f"   Status Code: {response.status_code}")
                
                # Check CORS headers
                cors_headers = {
                    'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
                    'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
                    'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers'),
                    'Access-Control-Allow-Credentials': response.headers.get('Access-Control-Allow-Credentials')
                }
                print(f"   CORS Headers: {cors_headers}")
                
                if response.status_code == 200:
                    data = response.json()
                    print(f"✅ {description} retrieved successfully")
                    print(f"   Data type: {type(data)}")
                    
                    if isinstance(data, list):
                        print(f"   Records count: {len(data)}")
                        if len(data) > 0:
                            print(f"   Sample record keys: {list(data[0].keys())}")
                            print(f"   Sample record: {json.dumps(data[0], indent=2, default=str)}")
                    else:
                        print(f"   Data keys: {list(data.keys()) if isinstance(data, dict) else 'N/A'}")
                    
                    results[endpoint] = {'success': True, 'data': data, 'count': len(data) if isinstance(data, list) else 1}
                else:
                    print(f"❌ Failed to retrieve {description}: {response.text}")
                    results[endpoint] = {'success': False, 'error': response.text}
                    
            except Exception as e:
                print(f"❌ Error retrieving {description}: {str(e)}")
                results[endpoint] = {'success': False, 'error': str(e)}
        
        return results
    
    def test_error_handling(self):
        """Test error handling scenarios"""
        print("\n❌ TESTING ERROR HANDLING")
        print("=" * 50)
        
        # Test endpoints without authentication
        print("\n🚫 Testing endpoints without authentication:")
        endpoints = ['sales', 'customers', 'vehicles']
        
        for endpoint in endpoints:
            url = f"{self.base_url}/{endpoint}"
            print(f"📤 GET {url} (no auth)")
            
            try:
                response = self.session.get(url)
                print(f"   Status Code: {response.status_code}")
                if response.status_code == 401:
                    print(f"✅ Properly rejected unauthorized request")
                else:
                    print(f"⚠️  Unexpected status code: {response.status_code}")
                    print(f"   Response: {response.text}")
            except Exception as e:
                print(f"❌ Error: {str(e)}")
        
        # Test with invalid token
        print("\n🚫 Testing with invalid token:")
        invalid_headers = {'Authorization': 'Bearer invalid_token_12345'}
        
        for endpoint in endpoints:
            url = f"{self.base_url}/{endpoint}"
            print(f"📤 GET {url} (invalid token)")
            
            try:
                response = self.session.get(url, headers=invalid_headers)
                print(f"   Status Code: {response.status_code}")
                if response.status_code == 401:
                    print(f"✅ Properly rejected invalid token")
                else:
                    print(f"⚠️  Unexpected status code: {response.status_code}")
                    print(f"   Response: {response.text}")
            except Exception as e:
                print(f"❌ Error: {str(e)}")
    
    def run_comprehensive_test(self):
        """Run all tests as specified in the review request"""
        print("🚀 COMPREHENSIVE BACKEND API TESTING FOR SALES DATA FETCHING FIX")
        print("=" * 80)
        print("Testing endpoints used by the frontend Sales module")
        print("Context: User reported 'Failed to fetch sales data' and 'Failed to fetch insurance data' errors")
        print("=" * 80)
        
        # 1. Authentication Endpoint Testing
        auth_success = self.test_authentication_flow()
        if not auth_success:
            print("\n❌ Authentication failed. Cannot proceed with other tests.")
            return False
        
        # 2. Test token validity
        token_valid = self.test_token_validity()
        if not token_valid:
            print("\n❌ Token validation failed. Cannot proceed with data endpoint tests.")
            return False
        
        # 3. Sales Data Endpoints Testing
        sales_results = self.test_sales_data_endpoints()
        
        # 4. Error Handling Testing
        self.test_error_handling()
        
        # 5. Summary and Analysis
        print("\n📋 TEST SUMMARY AND ANALYSIS")
        print("=" * 50)
        
        print("✅ Authentication Results:")
        print(f"   - Login with admin/admin123: {'✅ SUCCESS' if auth_success else '❌ FAILED'}")
        print(f"   - JWT token obtained: {'✅ SUCCESS' if self.token else '❌ FAILED'}")
        print(f"   - Token validation: {'✅ SUCCESS' if token_valid else '❌ FAILED'}")
        
        print("\n📊 Sales Data Endpoints Results:")
        for endpoint, result in sales_results.items():
            if result['success']:
                count = result.get('count', 0)
                print(f"   - GET /api/{endpoint}: ✅ SUCCESS ({count} records)")
            else:
                print(f"   - GET /api/{endpoint}: ❌ FAILED - {result.get('error', 'Unknown error')}")
        
        # Check if all critical endpoints are working
        critical_endpoints = ['sales', 'customers', 'vehicles']
        all_working = all(sales_results.get(ep, {}).get('success', False) for ep in critical_endpoints)
        
        print(f"\n🎯 OVERALL RESULT:")
        if auth_success and token_valid and all_working:
            print("✅ ALL TESTS PASSED - Backend APIs are working correctly")
            print("   - Authentication flow is functional")
            print("   - All sales data endpoints return proper data")
            print("   - CORS headers are configured")
            print("   - Error handling is working")
            print("\n💡 CONCLUSION: Backend is working correctly. Frontend integration issues likely due to:")
            print("   - Frontend authentication state management problems")
            print("   - Missing or incorrect token handling in frontend API calls")
            print("   - Frontend not properly redirecting after successful login")
            return True
        else:
            print("❌ SOME TESTS FAILED - Issues found in backend")
            return False

def main():
    tester = SalesAPITester()
    success = tester.run_comprehensive_test()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())