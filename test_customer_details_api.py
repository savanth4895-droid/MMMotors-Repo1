#!/usr/bin/env python3
"""
Customer Details API Endpoints Testing Script
Testing the customer details API endpoints for the View Customer Details page.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from backend_test import TwoWheelerAPITester

def test_customer_details_api_endpoints():
    """
    Test runner for customer details API endpoints
    """
    print("🚀 CUSTOMER DETAILS API ENDPOINTS TESTING")
    print("=" * 80)
    
    tester = TwoWheelerAPITester()
    
    # Run the customer details API endpoints test
    success, results = tester.test_customer_details_api_endpoints()
    
    print("\n" + "=" * 80)
    print(f"📊 Final Test Results:")
    print(f"   Tests Run: {tester.tests_run}")
    print(f"   Tests Passed: {tester.tests_passed}")
    print(f"   Tests Failed: {tester.tests_run - tester.tests_passed}")
    if tester.tests_run > 0:
        print(f"   Success Rate: {(tester.tests_passed/tester.tests_run)*100:.1f}%")
    else:
        print(f"   Success Rate: 0.0%")
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(test_customer_details_api_endpoints())