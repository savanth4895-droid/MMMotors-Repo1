"""
Migration script to add 'id' field to vehicles that don't have one
Uses MongoDB _id as the id value
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from uuid import uuid4

load_dotenv('.env')

async def add_vehicle_ids():
    client = AsyncIOMotorClient(os.environ['MONGO_URL'])
    db = client[os.environ['DB_NAME']]
    
    print("=" * 60)
    print("ADDING 'id' FIELD TO VEHICLES")
    print("=" * 60)
    
    # Find all vehicles without an 'id' field
    vehicles_without_id = await db.vehicles.find({"id": {"$exists": False}}).to_list(None)
    
    print(f"\n📊 Found {len(vehicles_without_id)} vehicles without 'id' field")
    
    if len(vehicles_without_id) == 0:
        print("✅ All vehicles already have 'id' field")
        client.close()
        return
    
    # Update each vehicle
    updated_count = 0
    for vehicle in vehicles_without_id:
        # Generate a new UUID for the id field
        new_id = str(uuid4())
        
        # Update the vehicle with the new id
        result = await db.vehicles.update_one(
            {"_id": vehicle["_id"]},
            {"$set": {"id": new_id}}
        )
        
        if result.modified_count > 0:
            updated_count += 1
            print(f"✅ Updated vehicle: {vehicle.get('brand', 'N/A')} {vehicle.get('model', 'N/A')} (ID: {new_id})")
    
    print(f"\n✅ Successfully added 'id' field to {updated_count} vehicle(s)")
    
    # Verify
    vehicles_without_id = await db.vehicles.count_documents({"id": {"$exists": False}})
    vehicles_with_id = await db.vehicles.count_documents({"id": {"$exists": True}})
    
    print(f"\n📊 Final counts:")
    print(f"   - Vehicles with 'id' field: {vehicles_with_id}")
    print(f"   - Vehicles without 'id' field: {vehicles_without_id}")
    
    print("=" * 60)
    
    client.close()

if __name__ == "__main__":
    asyncio.run(add_vehicle_ids())
