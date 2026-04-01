#!/usr/bin/env python3

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from backend_test import TwoWheelerAPITester

def main():
    """Run the specific customer update vehicle and insurance preservation test"""
    print("🚀 STARTING CUSTOMER UPDATE VEHICLE & INSURANCE PRESERVATION TESTING")
    print("=" * 80)
    
    # Initialize the tester
    tester = TwoWheelerAPITester()
    
    # Run the specific test
    success, results = tester.test_customer_update_vehicle_insurance_preservation()
    
    print("\n" + "=" * 80)
    print("🎯 TEST EXECUTION COMPLETED")
    print("=" * 80)
    
    if success:
        print("✅ ALL TESTS PASSED - Vehicle and insurance preservation is working correctly!")
        return 0
    else:
        print("❌ SOME TESTS FAILED - Issues detected with vehicle and insurance preservation")
        return 1

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)