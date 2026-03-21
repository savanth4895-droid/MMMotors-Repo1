#!/usr/bin/env python3

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from backend_test import TwoWheelerAPITester

def main():
    """Run vehicle field validation tests"""
    print("🚗 STARTING VEHICLE FIELD VALIDATION TESTING")
    print("=" * 80)
    
    # Initialize tester
    tester = TwoWheelerAPITester()
    
    # Run vehicle field validation tests
    success, results = tester.test_vehicle_field_validation_comprehensive()
    
    if success:
        print("\n🎉 ALL VEHICLE FIELD VALIDATION TESTS PASSED!")
        return 0
    else:
        print("\n❌ SOME VEHICLE FIELD VALIDATION TESTS FAILED!")
        return 1

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)