#!/usr/bin/env python3
"""Simple Database Status Check"""

from pymongo import MongoClient

def main():
    try:
        # Connect to MongoDB
        client = MongoClient("mongodb://localhost:27017")
        db = client["test_database"]
        
        print("🗄️  MongoDB Database Status")
        print("=" * 50)
        print(f"Connection: mongodb://localhost:27017")
        print(f"Database: test_database")
        print("=" * 50)
        
        # List collections and counts
        collections = db.list_collection_names()
        total_records = 0
        
        for collection_name in collections:
            count = db[collection_name].count_documents({})
            total_records += count
            print(f"{collection_name:20} : {count:6} records")
        
        print("-" * 50)
        print(f"{'TOTAL':20} : {total_records:6} records")
        
        if total_records == 0:
            print("\n✅ Database is clean - no testing data found")
        else:
            print(f"\n📊 Database contains {total_records} records")
        
        client.close()
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    main()