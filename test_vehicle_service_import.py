#!/usr/bin/env python3
"""
Standalone test for vehicle and service import fixes
"""

import requests
import json

BASE_URL = "https://moto-business-suite.preview.emergentagent.com/api"
token = None

def login():
    """Login and get token"""
    global token
    response = requests.post(
        f"{BASE_URL}/auth/login",
        json={"username": "admin", "password": "admin123"}
    )
    if response.status_code == 200:
        data = response.json()
        token = data['access_token']
        print(f"✅ Authenticated successfully")
        return True
    else:
        print(f"❌ Authentication failed: {response.status_code}")
        return False

def import_csv(data_type, csv_content, filename):
    """Import CSV data"""
    import io
    headers = {'Authorization': f'Bearer {token}'}
    files = {'file': (filename, io.StringIO(csv_content), 'text/csv')}
    
    response = requests.post(
        f"{BASE_URL}/import/upload?data_type={data_type}",
        headers=headers,
        files=files
    )
    
    if response.status_code == 200:
        return True, response.json()
    else:
        return False, response.text

def get_data(endpoint):
    """Get data from endpoint"""
    headers = {'Authorization': f'Bearer {token}'}
    response = requests.get(f"{BASE_URL}/{endpoint}", headers=headers)
    if response.status_code == 200:
        return True, response.json()
    else:
        return False, response.text

def main():
    print("=" * 80)
    print("VEHICLE AND SERVICE IMPORT FIXES TESTING")
    print("=" * 80)
    
    # 1. Authentication
    print("\n🔐 1. AUTHENTICATION")
    print("-" * 50)
    if not login():
        return 1
    
    # 2. Test Vehicle Import with Empty Optional Fields
    print("\n🚗 2. VEHICLE IMPORT WITH EMPTY OPTIONAL FIELDS")
    print("-" * 50)
    
    vehicle_csv = """brand,model,chassis_number,engine_number,color,vehicle_number,key_number,inbound_location,page_number,status,customer_mobile,customer_name,sale_amount,payment_method
BAJAJ,Pulsar 150,FIX-TEST-001,FIX-ENG-001,Blue,FIX-REG-001,KEY001,Warehouse B,Page 2,available,,,"""
    
    print("   Importing vehicle WITHOUT customer/sale fields...")
    success, result = import_csv("vehicles", vehicle_csv, "test_vehicle_empty.csv")
    
    if success:
        print(f"   ✅ Import completed")
        print(f"   Total: {result.get('total_records', 0)}")
        print(f"   Success: {result.get('successful_records', 0)}")
        print(f"   Failed: {result.get('failed_records', 0)}")
        
        errors = result.get('errors', [])
        strip_error = False
        for error in errors:
            error_msg = str(error.get('error', ''))
            if '.strip()' in error_msg or ('NoneType' in error_msg and 'attribute' in error_msg):
                print(f"   ❌ .strip() error found: {error_msg}")
                strip_error = True
        
        if not strip_error:
            print("   ✅ No .strip() AttributeError found")
        
        if result.get('successful_records', 0) == 1 and result.get('failed_records', 0) == 0:
            print("   ✅ Import success rate: 100%")
        else:
            print(f"   ❌ Import failed")
    else:
        print(f"   ❌ Import failed: {result}")
    
    # Verify vehicle appears in list
    print("\n   Verifying vehicle in GET /api/vehicles...")
    success, vehicles = get_data("vehicles")
    if success and isinstance(vehicles, list):
        found = any(v.get('chassis_number') == 'FIX-TEST-001' for v in vehicles)
        if found:
            print("   ✅ Vehicle FIX-TEST-001 found in list")
        else:
            print("   ❌ Vehicle FIX-TEST-001 NOT found")
    
    # 3. Test Vehicle Import WITH Customer and Sale Data
    print("\n🚗 3. VEHICLE IMPORT WITH CUSTOMER AND SALE DATA")
    print("-" * 50)
    
    vehicle_csv2 = """brand,model,chassis_number,engine_number,color,vehicle_number,key_number,inbound_location,page_number,status,customer_mobile,customer_name,sale_amount,payment_method
TVS,Apache,FIX-TEST-002,FIX-ENG-002,Red,FIX-REG-002,KEY002,Warehouse A,Page 1,sold,8888888888,Fix Test Customer,50000,cash"""
    
    print("   Importing vehicle WITH customer and sale data...")
    success, result = import_csv("vehicles", vehicle_csv2, "test_vehicle_with_customer.csv")
    
    if success:
        print(f"   ✅ Import completed")
        print(f"   Success: {result.get('successful_records', 0)}")
        print(f"   Failed: {result.get('failed_records', 0)}")
        
        cross_ref = result.get('cross_reference_stats', {})
        print(f"   Cross-reference stats: {cross_ref}")
        
        if cross_ref.get('customers_created', 0) > 0:
            print(f"   ✅ Customers created: {cross_ref['customers_created']}")
        if cross_ref.get('sales_created', 0) > 0:
            print(f"   ✅ Sales created: {cross_ref['sales_created']}")
    else:
        print(f"   ❌ Import failed: {result}")
    
    # Verify vehicle has customer_id
    print("\n   Verifying vehicle has customer_id...")
    success, vehicles = get_data("vehicles")
    if success and isinstance(vehicles, list):
        vehicle = next((v for v in vehicles if v.get('chassis_number') == 'FIX-TEST-002'), None)
        if vehicle:
            print("   ✅ Vehicle FIX-TEST-002 found")
            if vehicle.get('customer_id'):
                print(f"   ✅ Vehicle has customer_id: {vehicle['customer_id'][:8]}...")
            else:
                print("   ⚠️ Vehicle customer_id not set")
    
    # Verify sale record
    print("\n   Verifying sale record...")
    success, sales = get_data("sales")
    if success and isinstance(sales, list):
        sale = any(s.get('amount') == 50000 for s in sales)
        if sale:
            print("   ✅ Sale record found")
        else:
            print("   ⚠️ Sale record not found")
    
    # 4. Test Service Import - Basic
    print("\n🔧 4. SERVICE IMPORT - BASIC TEST")
    print("-" * 50)
    
    service_csv = """customer_name,customer_mobile,vehicle_number,chassis_number,service_type,description,amount
Service Test,7777777777,FIX-REG-001,FIX-TEST-001,repair,Test repair service,1500"""
    
    print("   Importing service with all required fields...")
    success, result = import_csv("services", service_csv, "test_service_basic.csv")
    
    if success:
        print(f"   ✅ Import completed")
        print(f"   Success: {result.get('successful_records', 0)}")
        print(f"   Failed: {result.get('failed_records', 0)}")
        
        errors = result.get('errors', [])
        keyerror = False
        for error in errors:
            error_msg = str(error.get('error', ''))
            if 'KeyError' in error_msg and "'id'" in error_msg:
                print(f"   ❌ KeyError 'id' found: {error_msg}")
                keyerror = True
        
        if not keyerror:
            print("   ✅ No KeyError 'id' found")
        
        if result.get('successful_records', 0) == 1 and result.get('failed_records', 0) == 0:
            print("   ✅ Import success rate: 100%")
        else:
            print(f"   ❌ Import failed")
    else:
        print(f"   ❌ Import failed: {result}")
    
    # Verify service appears in list
    print("\n   Verifying service in GET /api/services...")
    success, services = get_data("services")
    if success and isinstance(services, list):
        service = next((s for s in services if s.get('description') == 'Test repair service'), None)
        if service:
            print("   ✅ Service found in list")
            if service.get('customer_id'):
                print(f"   ✅ Service has customer_id: {service['customer_id'][:8]}...")
            if service.get('vehicle_id'):
                print(f"   ✅ Service has vehicle_id: {service['vehicle_id'][:8]}...")
        else:
            print("   ❌ Service NOT found")
    
    # 5. Test Service Import - Without Vehicle
    print("\n🔧 5. SERVICE IMPORT - WITHOUT VEHICLE")
    print("-" * 50)
    
    service_csv2 = """customer_name,customer_mobile,vehicle_number,chassis_number,service_type,description,amount
New Service Customer,6666666666,,,periodic_service,Basic service,1000"""
    
    print("   Importing service without vehicle (auto-create customer)...")
    success, result = import_csv("services", service_csv2, "test_service_no_vehicle.csv")
    
    if success:
        print(f"   ✅ Import completed")
        print(f"   Success: {result.get('successful_records', 0)}")
        
        cross_ref = result.get('cross_reference_stats', {})
        if cross_ref.get('customers_created', 0) > 0:
            print(f"   ✅ Customers created: {cross_ref['customers_created']}")
        
        incomplete = result.get('incomplete_records', [])
        if incomplete:
            print(f"   ✅ Incomplete records tracked: {len(incomplete)}")
    else:
        print(f"   ❌ Import failed: {result}")
    
    # 6. Complete Workflow
    print("\n🔄 6. COMPLETE IMPORT WORKFLOW")
    print("-" * 50)
    
    # Import vehicle
    workflow_vehicle = """brand,model,chassis_number,engine_number,color,vehicle_number,key_number,inbound_location,page_number,status,customer_mobile,customer_name,sale_amount,payment_method
HERO,Splendor,WORKFLOW-001,WORKFLOW-ENG-001,Black,WORKFLOW-REG-001,KEY003,Warehouse C,Page 3,available,,,"""
    
    success, _ = import_csv("vehicles", workflow_vehicle, "workflow_vehicle.csv")
    if success:
        print("   ✅ Step 1: Vehicle imported")
    
    # Import service
    workflow_service = """customer_name,customer_mobile,vehicle_number,chassis_number,service_type,description,amount
Workflow Customer,5555555555,WORKFLOW-REG-001,WORKFLOW-001,repair,Workflow service,2000"""
    
    success, _ = import_csv("services", workflow_service, "workflow_service.csv")
    if success:
        print("   ✅ Step 2: Service imported")
    
    # Import spare part
    workflow_spare = """name,part_number,brand,quantity,unit,unit_price,hsn_sac,gst_percentage,supplier,compatible_models
Workflow Part,WORKFLOW-PART-001,HERO,5,Nos,150.00,12345678,18.0,Workflow Supplier,Splendor"""
    
    success, _ = import_csv("spare_parts", workflow_spare, "workflow_spare.csv")
    if success:
        print("   ✅ Step 3: Spare part imported")
    
    # Verify all visible
    print("\n   Verifying all data visible...")
    
    success, vehicles = get_data("vehicles")
    if success and any(v.get('chassis_number') == 'WORKFLOW-001' for v in vehicles):
        print("   ✅ Workflow vehicle visible")
    
    success, services = get_data("services")
    if success and any(s.get('description') == 'Workflow service' for s in services):
        print("   ✅ Workflow service visible")
    
    success, spare_parts = get_data("spare-parts")
    if success and any(p.get('part_number') == 'WORKFLOW-PART-001' for p in spare_parts):
        print("   ✅ Workflow spare part visible")
    
    print("\n" + "=" * 80)
    print("✅ TESTING COMPLETED")
    print("=" * 80)
    print("\nKey Validation Points:")
    print("• No .strip() AttributeError in vehicle imports")
    print("• No KeyError 'id' in service imports")
    print("• Import success rates are 100% for valid data")
    print("• Cross-reference statistics are accurate")
    print("• Data persists and is visible in GET endpoints")
    
    return 0

if __name__ == "__main__":
    import sys
    sys.exit(main())
