"""
Migration script to update vehicle status from 'available' to 'in_stock'
This fixes the status mismatch issue between backend and frontend
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

async def migrate_vehicle_status():
    # Connect to MongoDB
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    print("Starting vehicle status migration...")
    print("Converting all 'available' status to 'in_stock'")
    
    # Find vehicles with status 'available'
    result = await db.vehicles.update_many(
        {"status": "available"},
        {"$set": {"status": "in_stock"}}
    )
    
    print(f"✅ Migration complete!")
    print(f"   Updated {result.modified_count} vehicle(s)")
    print(f"   Matched {result.matched_count} vehicle(s)")
    
    # Verify the fix
    available_count = await db.vehicles.count_documents({"status": "available"})
    in_stock_count = await db.vehicles.count_documents({"status": "in_stock"})
    
    print(f"\nCurrent status counts:")
    print(f"   Available: {available_count}")
    print(f"   In Stock: {in_stock_count}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(migrate_vehicle_status())
