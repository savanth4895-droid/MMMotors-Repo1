#!/usr/bin/env python3

import sys
import os
sys.path.append('/app')

from backend_test import TwoWheelerAPITester

def main():
    """Run sales import integration testing"""
    print("🚀 Starting Sales Import Integration Testing")
    print("=" * 80)
    
    tester = TwoWheelerAPITester()
    
    # Test basic connectivity
    print("\n📡 Testing API Connectivity...")
    success, _ = tester.test_root_endpoint()
    if not success:
        print("❌ API is not accessible. Exiting...")
        sys.exit(1)
    
    # Test authentication
    print("\n🔐 Testing Authentication...")
    success, _ = tester.test_login_user("admin", "admin123")
    if not success:
        print("❌ Authentication failed. Exiting...")
        sys.exit(1)
    
    # Run sales import integration testing
    print("\n💰 Running Sales Import Integration Testing...")
    success, results = tester.test_sales_import_integration()
    
    if success:
        print("\n✅ All sales import integration tests passed successfully!")
    else:
        print("\n❌ Some sales import integration tests failed. Check the detailed results above.")
    
    print(f"\n📊 Final Results: {tester.tests_passed}/{tester.tests_run} tests passed")
    print("🏁 Testing completed!")
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())