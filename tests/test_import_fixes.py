#!/usr/bin/env python3
"""
Test script for vehicle and service import fixes
"""

import sys
sys.path.insert(0, '/app')

from backend_test import TwoWheelerAPITester

def main():
    print("=" * 80)
    print("VEHICLE AND SERVICE IMPORT FIXES TESTING")
    print("=" * 80)
    
    tester = TwoWheelerAPITester()
    
    # Run the vehicle and service import fixes test
    success, results = tester.test_vehicle_service_import_fixes()
    
    print("\n" + "=" * 80)
    print("FINAL TEST SUMMARY")
    print("=" * 80)
    
    if success:
        print("✅ ALL TESTS PASSED")
        print("\nThe vehicle and service import fixes are working correctly:")
        print("• No .strip() errors on optional fields")
        print("• No KeyError 'id' in service imports")
        print("• All import success rates are 100%")
        print("• Cross-reference statistics are accurate")
        print("• Data persists correctly")
        return 0
    else:
        print("❌ SOME TESTS FAILED")
        print("\nPlease review the detailed output above for specific issues.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
