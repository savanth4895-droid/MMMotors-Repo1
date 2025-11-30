"""
Script to clear all vehicles from the database
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv('.env')

async def clear_all_vehicles():
    client = AsyncIOMotorClient(os.environ['MONGO_URL'])
    db = client[os.environ['DB_NAME']]
    
    print("=" * 60)
    print("CLEARING ALL VEHICLES FROM DATABASE")
    print("=" * 60)
    
    # Count vehicles before deletion
    total_vehicles = await db.vehicles.count_documents({})
    print(f'\n📊 Current vehicle count: {total_vehicles}')
    
    if total_vehicles == 0:
        print("✅ No vehicles to delete. Database is already empty.")
        client.close()
        return
    
    # Check for associated records
    total_sales = await db.sales.count_documents({})
    total_services = await db.services.count_documents({})
    
    print(f'📊 Associated records:')
    print(f'   - Sales records: {total_sales}')
    print(f'   - Service records: {total_services}')
    
    # Delete all vehicles
    print(f'\n🗑️  Deleting all {total_vehicles} vehicles...')
    result = await db.vehicles.delete_many({})
    
    print(f'✅ Successfully deleted {result.deleted_count} vehicle(s)')
    
    # Verify deletion
    remaining = await db.vehicles.count_documents({})
    print(f'📊 Remaining vehicles: {remaining}')
    
    if remaining == 0:
        print('\n✅ All vehicles have been cleared successfully!')
    else:
        print(f'\n⚠️  Warning: {remaining} vehicle(s) still remain in the database')
    
    print("=" * 60)
    
    client.close()

if __name__ == "__main__":
    asyncio.run(clear_all_vehicles())
