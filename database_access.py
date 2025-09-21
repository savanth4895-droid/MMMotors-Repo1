#!/usr/bin/env python3
"""
MongoDB Database Manual Access Script
Usage: python3 database_access.py
"""

import os
import json
from pymongo import MongoClient
from datetime import datetime

def connect_to_database():
    """Connect to MongoDB database"""
    try:
        mongo_url = "mongodb://localhost:27017"
        db_name = "test_database"
        
        print(f"Connecting to MongoDB: {mongo_url}/{db_name}")
        client = MongoClient(mongo_url)
        db = client[db_name]
        
        # Test connection
        db.command('ping')
        print("✅ Successfully connected to MongoDB")
        return db, client
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        return None, None

def show_database_overview(db):
    """Show overview of all collections and their counts"""
    print("\n" + "="*60)
    print("📊 DATABASE OVERVIEW")
    print("="*60)
    
    collections = db.list_collection_names()
    total_records = 0
    
    for collection_name in collections:
        count = db[collection_name].count_documents({})
        total_records += count
        print(f"{collection_name:20} : {count:6} records")
    
    print("-" * 60)
    print(f"{'TOTAL':20} : {total_records:6} records")
    return collections

def view_collection_data(db, collection_name, limit=5):
    """View sample data from a specific collection"""
    print(f"\n📋 COLLECTION: {collection_name}")
    print("-" * 40)
    
    collection = db[collection_name]
    count = collection.count_documents({})
    
    if count == 0:
        print("No data found in this collection")
        return
    
    print(f"Total records: {count}")
    print(f"Showing first {min(limit, count)} records:")
    
    for i, document in enumerate(collection.find().limit(limit)):
        print(f"\nRecord {i+1}:")
        # Convert ObjectId to string for better display
        for key, value in document.items():
            if key == '_id':
                print(f"  {key}: {str(value)}")
            else:
                print(f"  {key}: {value}")

def clear_collection(db, collection_name):
    """Clear all data from a specific collection"""
    collection = db[collection_name]
    count_before = collection.count_documents({})
    
    if count_before == 0:
        print(f"Collection '{collection_name}' is already empty")
        return
    
    confirm = input(f"⚠️  Are you sure you want to delete all {count_before} records from '{collection_name}'? (yes/no): ")
    
    if confirm.lower() == 'yes':
        result = collection.delete_many({})
        print(f"✅ Deleted {result.deleted_count} records from '{collection_name}'")
    else:
        print("❌ Operation cancelled")

def interactive_menu(db):
    """Interactive menu for database operations"""
    collections = show_database_overview(db)
    
    while True:
        print("\n" + "="*60)
        print("🔧 DATABASE OPERATIONS MENU")
        print("="*60)
        print("1. Show database overview")
        print("2. View collection data")
        print("3. Clear collection")
        print("4. Clear all collections (except users)")
        print("5. Export collection to JSON")
        print("6. Execute custom query")
        print("0. Exit")
        
        choice = input("\nEnter your choice (0-6): ").strip()
        
        if choice == '0':
            break
        elif choice == '1':
            show_database_overview(db)
        elif choice == '2':
            collection_name = input("Enter collection name: ").strip()
            if collection_name in collections:
                limit = input("Number of records to show (default 5): ").strip()
                limit = int(limit) if limit.isdigit() else 5
                view_collection_data(db, collection_name, limit)
            else:
                print(f"❌ Collection '{collection_name}' not found")
        elif choice == '3':
            collection_name = input("Enter collection name to clear: ").strip()
            if collection_name in collections:
                if collection_name == 'users':
                    print("❌ Cannot clear 'users' collection for security")
                else:
                    clear_collection(db, collection_name)
            else:
                print(f"❌ Collection '{collection_name}' not found")
        elif choice == '4':
            confirm = input("⚠️  Clear ALL collections except 'users'? (yes/no): ")
            if confirm.lower() == 'yes':
                total_cleared = 0
                for collection_name in collections:
                    if collection_name != 'users':
                        result = db[collection_name].delete_many({})
                        total_cleared += result.deleted_count
                        print(f"Cleared {collection_name}: {result.deleted_count} records")
                print(f"✅ Total records cleared: {total_cleared}")
            else:
                print("❌ Operation cancelled")
        elif choice == '5':
            collection_name = input("Enter collection name to export: ").strip()
            if collection_name in collections:
                export_collection(db, collection_name)
            else:
                print(f"❌ Collection '{collection_name}' not found")
        elif choice == '6':
            execute_custom_query(db)
        else:
            print("❌ Invalid choice")

def export_collection(db, collection_name):
    """Export collection data to JSON file"""
    collection = db[collection_name]
    data = list(collection.find())
    
    # Convert ObjectId to string for JSON serialization
    for document in data:
        if '_id' in document:
            document['_id'] = str(document['_id'])
    
    filename = f"{collection_name}_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    
    with open(filename, 'w') as f:
        json.dump(data, f, indent=2, default=str)
    
    print(f"✅ Exported {len(data)} records to {filename}")

def execute_custom_query(db):
    """Execute custom MongoDB query"""
    print("\nExample queries:")
    print("1. db.customers.find({'name': {'$regex': 'John'}})")
    print("2. db.sales.find({'amount': {'$gt': 50000}})")
    print("3. db.customers.aggregate([{'$group': {'_id': None, 'count': {'$sum': 1}}}])")
    
    collection_name = input("Enter collection name: ").strip()
    query = input("Enter MongoDB query (e.g., {}): ").strip()
    
    try:
        if not query:
            query = "{}"
        
        # Simple find query
        result = list(db[collection_name].find(eval(query)))
        print(f"\nQuery returned {len(result)} results:")
        
        for i, doc in enumerate(result[:5]):  # Show first 5 results
            print(f"\nResult {i+1}:")
            for key, value in doc.items():
                if key == '_id':
                    print(f"  {key}: {str(value)}")
                else:
                    print(f"  {key}: {value}")
        
        if len(result) > 5:
            print(f"\n... and {len(result) - 5} more results")
            
    except Exception as e:
        print(f"❌ Query error: {e}")

def main():
    """Main function"""
    print("🗄️  MongoDB Database Manual Access Tool")
    print("=" * 60)
    
    db, client = connect_to_database()
    if not db:
        return
    
    try:
        interactive_menu(db)
    except KeyboardInterrupt:
        print("\n\n👋 Goodbye!")
    finally:
        if client:
            client.close()
            print("🔐 Database connection closed")

if __name__ == "__main__":
    main()