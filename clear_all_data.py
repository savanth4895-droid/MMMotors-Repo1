import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv('/app/backend/.env')

MONGO_URL = os.getenv('MONGO_URL', 'mongodb://localhost:27017')

async def clear_all_data():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client.mm_motors
    
    collections_to_clear = [
        'customers',
        'vehicles',
        'sales',
        'services',
        'spare_parts',
        'spare_part_bills',
        'insurance_records',
        'import_jobs',
        'backups'
    ]
    
    print("Starting to clear all data...")
    print("=" * 50)
    
    for collection_name in collections_to_clear:
        try:
            collection = db[collection_name]
            count_before = await collection.count_documents({})
            result = await collection.delete_many({})
            print(f"✓ {collection_name}: Deleted {result.deleted_count} records (had {count_before} records)")
        except Exception as e:
            print(f"✗ {collection_name}: Error - {str(e)}")
    
    print("=" * 50)
    print("Data clearing completed!")
    print("\nNote: User accounts are preserved for login access.")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(clear_all_data())
