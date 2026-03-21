#!/usr/bin/env python3
"""
MM Motors — Database Setup & Connection Test
Run this after creating your MongoDB Atlas cluster to verify everything works.

Usage:
    python3 setup_db.py              # Interactive setup
    python3 setup_db.py --test       # Test existing .env connection
"""
import sys
import os
import secrets
from pathlib import Path

ENV_PATH = Path(__file__).parent / ".env"

def generate_jwt_secret():
    return secrets.token_hex(32)

def create_env_file():
    print("\n" + "═" * 60)
    print("  MM Motors — Database Setup")
    print("═" * 60)
    
    if ENV_PATH.exists():
        resp = input("\n⚠️  .env file already exists. Overwrite? (y/N): ").strip().lower()
        if resp != 'y':
            print("Keeping existing .env file.")
            return False
    
    print("\n📋 Follow these steps on MongoDB Atlas (https://cloud.mongodb.com):\n")
    print("  1. Sign up / Log in (free, no credit card)")
    print("  2. Create a FREE M0 cluster")
    print("     → Choose region: ap-south-1 (Mumbai) for best performance")
    print("  3. Create a Database User:")
    print("     → Database Access → Add New User")
    print("     → Choose username & password (save these!)")
    print("  4. Allow network access:")
    print("     → Network Access → Add IP Address")
    print("     → Add 0.0.0.0/0 for development (or your specific IP)")
    print("  5. Get connection string:")
    print("     → Database → Connect → Drivers")
    print("     → Copy the connection string\n")
    
    print("─" * 60)
    mongo_url = input("\n🔗 Paste your MongoDB connection string:\n   > ").strip()
    
    if not mongo_url:
        print("❌ No connection string provided. Exiting.")
        return False
    
    # Help fix common mistakes
    if "<password>" in mongo_url or "<username>" in mongo_url:
        print("\n⚠️  Your connection string still has <username> or <password> placeholders!")
        username = input("   Enter your database username: ").strip()
        password = input("   Enter your database password: ").strip()
        mongo_url = mongo_url.replace("<username>", username).replace("<password>", password)
        # Also handle the <db> placeholder some Atlas versions include
        if "<db>" in mongo_url:
            mongo_url = mongo_url.replace("<db>", "mm_motors")
    
    db_name = input("\n📂 Database name (press Enter for 'mm_motors'): ").strip() or "mm_motors"
    
    jwt_secret = generate_jwt_secret()
    print(f"\n🔑 Generated JWT secret: {jwt_secret[:16]}...{jwt_secret[-8:]}")
    
    cors_origins = input("\n🌐 CORS origins (press Enter for 'http://localhost:3000'): ").strip() or "http://localhost:3000"
    
    env_content = f"""# MM Motors — Environment Configuration (auto-generated)
MONGO_URL={mongo_url}
DB_NAME={db_name}
JWT_SECRET_KEY={jwt_secret}
CORS_ORIGINS={cors_origins}
"""
    
    ENV_PATH.write_text(env_content)
    print(f"\n✅ .env file created at: {ENV_PATH}")
    return True

def test_connection():
    print("\n🔍 Testing MongoDB connection...")
    
    if not ENV_PATH.exists():
        print("❌ .env file not found. Run 'python3 setup_db.py' first.")
        return False
    
    # Load env
    from dotenv import load_dotenv
    load_dotenv(ENV_PATH)
    
    mongo_url = os.environ.get('MONGO_URL')
    db_name = os.environ.get('DB_NAME', 'mm_motors')
    
    if not mongo_url:
        print("❌ MONGO_URL not set in .env file.")
        return False
    
    # Mask password for display
    display_url = mongo_url
    if '@' in display_url:
        parts = display_url.split('@')
        creds = parts[0].split('://')
        if len(creds) > 1:
            user_pass = creds[1].split(':')
            display_url = f"{creds[0]}://{user_pass[0]}:****@{parts[1]}"
    
    print(f"   URL: {display_url}")
    print(f"   Database: {db_name}")
    
    try:
        from pymongo import MongoClient
        
        client = MongoClient(mongo_url, serverSelectionTimeoutMS=10000)
        
        # Test connection
        result = client.admin.command('ping')
        print("   ✅ Connection successful!")
        
        # Check database
        db = client[db_name]
        collections = db.list_collection_names()
        
        if collections:
            print(f"\n   📊 Existing collections in '{db_name}':")
            for col in sorted(collections):
                count = db[col].count_documents({})
                print(f"      {col}: {count} documents")
        else:
            print(f"\n   📂 Database '{db_name}' is empty (collections will be created automatically)")
        
        # Check if admin user exists
        user_count = db.users.count_documents({})
        if user_count == 0:
            print("\n   ⚠️  No users found. After starting the server, run:")
            print("      curl -X POST http://localhost:8001/api/auth/bootstrap \\")
            print('        -H "Content-Type: application/json" \\')
            print("        -d '{\"username\":\"admin\",\"email\":\"admin@mm.com\",\"password\":\"YourPassword123\",\"role\":\"admin\",\"full_name\":\"Admin\"}'")
        else:
            print(f"\n   👤 {user_count} user(s) found — ready to login")
        
        client.close()
        print("\n✅ Database is ready!\n")
        return True
        
    except ImportError:
        print("   ❌ pymongo not installed. Run: pip install pymongo")
        return False
    except Exception as e:
        print(f"   ❌ Connection failed: {e}")
        print("\n   Common fixes:")
        print("   • Check username/password in the connection string")
        print("   • Add your IP to Atlas → Network Access → IP Access List")
        print("   • Make sure the cluster is active (not paused)")
        return False

if __name__ == "__main__":
    if "--test" in sys.argv:
        test_connection()
    else:
        created = create_env_file()
        if created or ENV_PATH.exists():
            test_connection()
