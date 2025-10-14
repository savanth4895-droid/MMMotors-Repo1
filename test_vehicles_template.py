#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime
import uuid

class VehiclesTemplateStatusTester:
    def __init__(self, base_url="https://moto-inventory-sys.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None

    def login(self, username, password):
        """Login and get token"""
        url = f"{self.base_url}/auth/login"
        data = {"username": username, "password": password}
        
        try:
            response = requests.post(url, json=data)
            if response.status_code == 200:
                result = response.json()
                self.token = result.get('access_token')
                print(f"✅ Authentication successful")
                return True
            else:
                print(f"❌ Authentication failed: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Authentication error: {str(e)}")
            return False

    def test_vehicles_template_with_status(self):
        """Test vehicles template download and verify status column"""
        print("\n🚗 VEHICLES CSV TEMPLATE WITH STATUS COLUMN TESTING")
        print("=" * 60)
        
        # 1. Authentication
        print("\n🔐 1. AUTHENTICATION")
        if not self.login("admin", "admin123"):
            return False
        
        # 2. Template Download
        print("\n📥 2. TEMPLATE DOWNLOAD")
        template_url = f"{self.base_url}/import/template/vehicles"
        headers = {'Authorization': f'Bearer {self.token}'}
        
        try:
            response = requests.get(template_url, headers=headers)
            if response.status_code == 200:
                template_content = response.text
                print(f"✅ Template downloaded successfully ({len(template_content)} bytes)")
                
                # Parse template
                lines = template_content.strip().split('\n')
                if len(lines) >= 1:
                    header = lines[0]
                    print(f"   Header: {header}")
                    
                    # Check for status column
                    if 'status' in header:
                        print("✅ Status column found in header")
                        
                        # Check position (should be at end)
                        fields = header.split(',')
                        if fields[-1].strip() == 'status':
                            print("✅ Status column is at the end")
                        else:
                            print(f"⚠️ Status column position: {fields.index('status') + 1}")
                        
                        # Check sample data
                        if len(lines) > 1:
                            sample_line = lines[1]
                            sample_fields = sample_line.split(',')
                            if len(sample_fields) >= len(fields):
                                status_value = sample_fields[-1].strip()
                                print(f"   Sample status value: '{status_value}'")
                                if status_value == 'available':
                                    print("✅ Sample data shows 'available' status")
                                else:
                                    print(f"⚠️ Sample status is '{status_value}', expected 'available'")
                        
                        return True
                    else:
                        print("❌ Status column NOT found in header")
                        return False
                else:
                    print("❌ Template is empty")
                    return False
            else:
                print(f"❌ Template download failed: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Template download error: {str(e)}")
            return False

    def test_vehicle_import_with_status(self):
        """Test vehicle import with status column"""
        print("\n📤 3. VEHICLE IMPORT WITH STATUS")
        
        # Test CSV with status column
        csv_content = """brand,model,chassis_number,engine_number,color,vehicle_number,key_number,inbound_location,page_number,status
TVS,Test Vehicle,TEST123CHASSIS,TESTENG123,Red,KA01TEST123,TESTKEY001,Test Location,1,available"""
        
        url = f"{self.base_url}/import/upload"
        headers = {'Authorization': f'Bearer {self.token}'}
        
        try:
            import io
            csv_file = io.StringIO(csv_content)
            files = {'file': ('test_vehicle_status.csv', csv_file, 'text/csv')}
            params = {'data_type': 'vehicles'}
            
            response = requests.post(url, headers=headers, files=files, params=params)
            
            if response.status_code == 200:
                result = response.json()
                successful = result.get('successful_records', 0)
                total = result.get('total_records', 0)
                
                print(f"✅ Import completed: {successful}/{total} records successful")
                
                if successful > 0:
                    print("✅ Vehicle with status imported successfully")
                    return True
                else:
                    print("❌ No vehicles imported successfully")
                    errors = result.get('errors', [])
                    if errors:
                        print(f"   Errors: {errors[:2]}")  # Show first 2 errors
                    return False
            else:
                print(f"❌ Import failed: {response.status_code}")
                try:
                    error_detail = response.json()
                    print(f"   Error details: {error_detail}")
                except:
                    print(f"   Error text: {response.text}")
                return False
        except Exception as e:
            print(f"❌ Import error: {str(e)}")
            return False

    def test_status_validation(self):
        """Test different status values"""
        print("\n🔍 4. STATUS VALIDATION TESTING")
        
        status_values = ['available', 'in_stock', 'sold', 'returned']
        results = []
        
        for status in status_values:
            print(f"\n   Testing status: '{status}'")
            
            csv_content = f"""brand,model,chassis_number,engine_number,color,vehicle_number,key_number,inbound_location,page_number,status
TVS,Test {status.title()},TEST{status.upper()}CHASSIS,TESTENG{status.upper()},Blue,KA01{status.upper()}123,TESTKEY{status.upper()},Test Location,1,{status}"""
            
            url = f"{self.base_url}/import/upload"
            headers = {'Authorization': f'Bearer {self.token}'}
            
            try:
                import io
                csv_file = io.StringIO(csv_content)
                files = {'file': (f'test_vehicle_{status}.csv', csv_file, 'text/csv')}
                params = {'data_type': 'vehicles'}
                
                response = requests.post(url, headers=headers, files=files, params=params)
                
                if response.status_code == 200:
                    result = response.json()
                    successful = result.get('successful_records', 0)
                    
                    if successful > 0:
                        print(f"   ✅ Status '{status}' imported successfully")
                        results.append(True)
                    else:
                        print(f"   ❌ Status '{status}' import failed")
                        results.append(False)
                else:
                    print(f"   ❌ Status '{status}' import failed: {response.status_code}")
                    results.append(False)
            except Exception as e:
                print(f"   ❌ Status '{status}' import error: {str(e)}")
                results.append(False)
        
        return all(results)

    def run_all_tests(self):
        """Run all vehicle template status tests"""
        print("🚗 VEHICLES CSV TEMPLATE STATUS COLUMN TESTING")
        print("=" * 80)
        
        tests = [
            ("Template Download & Status Column Verification", self.test_vehicles_template_with_status),
            ("Vehicle Import with Status", self.test_vehicle_import_with_status),
            ("Status Validation Testing", self.test_status_validation)
        ]
        
        results = []
        for test_name, test_method in tests:
            try:
                result = test_method()
                results.append(result)
                status = "✅ PASSED" if result else "❌ FAILED"
                print(f"\n{status} - {test_name}")
            except Exception as e:
                print(f"\n❌ FAILED - {test_name}: {str(e)}")
                results.append(False)
        
        # Final summary
        passed = sum(results)
        total = len(results)
        
        print(f"\n{'='*80}")
        print(f"📊 FINAL RESULTS")
        print(f"{'='*80}")
        print(f"Tests Passed: {passed}/{total}")
        print(f"Success Rate: {(passed/total)*100:.1f}%")
        
        if all(results):
            print("\n✅ ALL TESTS PASSED")
            print("The vehicles CSV template status column is working correctly!")
        else:
            print("\n❌ SOME TESTS FAILED")
            print("Please review the failed tests above.")
        
        return all(results)

if __name__ == "__main__":
    tester = VehiclesTemplateStatusTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)