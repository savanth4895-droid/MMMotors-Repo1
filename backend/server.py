from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
import asyncio
import aiofiles
import zipfile
import shutil
import json
from pathlib import Path
import pandas as pd
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment
from openpyxl.utils.dataframe import dataframe_to_rows
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timedelta, timezone
import bcrypt
import jwt
from enum import Enum
from fastapi import UploadFile, File
import csv
import io
import re

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection with Atlas-compatible settings
mongo_url = os.environ['MONGO_URL']

# Detect if this is Atlas MongoDB (contains mongodb.net) or local MongoDB
is_atlas = 'mongodb.net' in mongo_url or 'mongodb+srv' in mongo_url

# Configure MongoDB client with proper timeouts and SSL settings
client_options = {
    'serverSelectionTimeoutMS': 30000,  # 30 seconds for server selection
    'connectTimeoutMS': 30000,           # 30 seconds for initial connection
    'socketTimeoutMS': 30000,            # 30 seconds for socket operations
    'maxPoolSize': 50,                   # Connection pool size
    'minPoolSize': 10,                   # Minimum connections to maintain
    'retryWrites': True,                 # Retry write operations
    'retryReads': True,                  # Retry read operations
}

# Add TLS settings only for Atlas MongoDB
if is_atlas:
    client_options.update({
        'tls': True,                         # Enable TLS/SSL for Atlas
        'tlsAllowInvalidCertificates': False # Validate SSL certificates
    })

client = AsyncIOMotorClient(mongo_url, **client_options)
db = client[os.environ['DB_NAME']]

# JWT Configuration
SECRET_KEY = os.environ['JWT_SECRET_KEY']
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440  # 24 hours

# Create the main app without a prefix
app = FastAPI(title="Two Wheeler Business Management API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Startup event to verify MongoDB connection
@app.on_event("startup")
async def startup_db_client():
    """Test MongoDB connection on startup"""
    try:
        # Test the connection
        await client.admin.command('ping')
        print("✅ Successfully connected to MongoDB Atlas")
    except Exception as e:
        print(f"❌ Failed to connect to MongoDB: {str(e)}")
        print(f"   Error type: {type(e).__name__}")
        print(f"   Make sure MONGO_URL is correctly configured for Atlas")
        # Don't raise exception - let the app start and show errors via /ready endpoint

@app.on_event("shutdown")
async def shutdown_db_client():
    """Close MongoDB connection on shutdown"""
    client.close()
    print("✅ MongoDB connection closed")

# Security
security = HTTPBearer()

# Enums
class UserRole(str, Enum):
    ADMIN = "admin"
    STAFF = "staff"

class VehicleStatus(str, Enum):
    IN_STOCK = "in_stock"
    SOLD = "sold"
    RETURNED = "returned"

class ServiceStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"

# Models
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    email: EmailStr
    role: UserRole
    full_name: str
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    role: UserRole
    full_name: str

class UserLogin(BaseModel):
    username: str
    password: str

class Customer(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: Optional[str] = None
    care_of: Optional[str] = None
    mobile: Optional[str] = None
    email: Optional[EmailStr] = None
    address: Optional[str] = None
    vehicle_info: Optional[Dict[str, Any]] = None
    insurance_info: Optional[Dict[str, Any]] = None
    sales_info: Optional[Dict[str, Any]] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CustomerCreate(BaseModel):
    name: Optional[str] = None
    care_of: Optional[str] = None
    mobile: Optional[str] = None
    email: Optional[EmailStr] = None
    address: Optional[str] = None
    vehicle_info: Optional[Dict[str, Any]] = None
    insurance_info: Optional[Dict[str, Any]] = None
    sales_info: Optional[Dict[str, Any]] = None

class Vehicle(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    brand: Optional[str] = None  # TVS, BAJAJ, HERO, HONDA, TRIUMPH, KTM, SUZUKI, APRILIA, YAMAHA, PIAGGIO
    model: Optional[str] = None
    chassis_number: Optional[str] = None  # Standardized from chassis_no
    engine_number: Optional[str] = None  # Standardized from engine_no
    color: Optional[str] = None
    vehicle_number: Optional[str] = None  # Registration number
    key_number: Optional[str] = None  # Standardized from key_no
    inbound_location: Optional[str] = None
    outbound_location: Optional[str] = None
    status: VehicleStatus = VehicleStatus.IN_STOCK
    page_number: Optional[str] = None
    date_received: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    date_sold: Optional[datetime] = None
    date_returned: Optional[datetime] = None
    customer_id: Optional[str] = None

class VehicleCreate(BaseModel):
    brand: Optional[str] = None
    model: Optional[str] = None
    chassis_number: Optional[str] = None  # Standardized from chassis_no
    engine_number: Optional[str] = None  # Standardized from engine_no
    color: Optional[str] = None
    vehicle_number: Optional[str] = None  # Registration number
    key_number: Optional[str] = None  # Standardized from key_no
    inbound_location: Optional[str] = None
    page_number: Optional[str] = None

class VehicleUpdate(BaseModel):
    brand: Optional[str] = None
    model: Optional[str] = None
    chassis_number: Optional[str] = None
    engine_number: Optional[str] = None
    color: Optional[str] = None
    vehicle_number: Optional[str] = None
    key_number: Optional[str] = None
    inbound_location: Optional[str] = None
    page_number: Optional[str] = None
    outbound_location: Optional[str] = None
    status: Optional[str] = None
    date_returned: Optional[str] = None

class Sale(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    invoice_number: str
    customer_id: str
    vehicle_id: Optional[str] = None  # Made optional for imported sales without specific vehicles
    sale_date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    amount: float
    payment_method: str
    insurance_details: Optional[Dict[str, Any]] = None
    created_by: str
    source: str = "direct"  # "direct" for manual sales, "import" for imported data
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    # Additional fields for imported sales data (not in create model)
    vehicle_brand: Optional[str] = None
    vehicle_model: Optional[str] = None
    vehicle_color: Optional[str] = None
    vehicle_chassis: Optional[str] = None
    vehicle_engine: Optional[str] = None
    vehicle_registration: Optional[str] = None
    insurance_nominee: Optional[str] = None
    insurance_relation: Optional[str] = None
    insurance_age: Optional[str] = None
    hypothecation: Optional[str] = None

class SaleCreate(BaseModel):
    customer_id: str
    vehicle_id: Optional[str] = None  # Made optional for imported sales
    sale_date: Optional[datetime] = None  # Allow updating sale date
    amount: float
    payment_method: str
    insurance_details: Optional[Dict[str, Any]] = None
    source: str = "direct"  # Default to direct sales
    
    # Additional fields for imported sales and editing
    vehicle_brand: Optional[str] = None
    vehicle_model: Optional[str] = None
    vehicle_color: Optional[str] = None
    vehicle_chassis: Optional[str] = None
    vehicle_engine: Optional[str] = None
    vehicle_registration: Optional[str] = None
    insurance_nominee: Optional[str] = None
    insurance_relation: Optional[str] = None
    insurance_age: Optional[str] = None
    hypothecation: Optional[str] = None

class Service(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    job_card_number: str
    customer_id: str
    vehicle_id: Optional[str] = None
    vehicle_number: str  # Registration number (standardized)
    vehicle_brand: Optional[str] = None  # For imported services without vehicle_id
    vehicle_model: Optional[str] = None  # For imported services without vehicle_id
    vehicle_year: Optional[str] = None  # For imported services without vehicle_id
    service_type: str
    description: str
    status: ServiceStatus = ServiceStatus.PENDING
    service_date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    completion_date: Optional[datetime] = None
    amount: float
    created_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    is_registration: bool = False  # Flag to identify registration vs job card

# Customer + Vehicle Registration Model (One-time registration)
class Registration(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    registration_number: str  # REG-000001
    customer_id: str
    customer_name: str
    customer_mobile: str
    customer_address: Optional[str] = None
    vehicle_number: str
    vehicle_brand: Optional[str] = None
    vehicle_model: Optional[str] = None
    vehicle_year: Optional[str] = None
    chassis_number: Optional[str] = None
    engine_number: Optional[str] = None
    registration_date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    created_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class RegistrationCreate(BaseModel):
    customer_name: str
    customer_mobile: str
    customer_address: Optional[str] = None
    vehicle_number: str
    vehicle_brand: Optional[str] = None
    vehicle_model: Optional[str] = None
    vehicle_year: Optional[str] = None
    chassis_number: Optional[str] = None
    engine_number: Optional[str] = None

class ServiceCreate(BaseModel):
    customer_id: str
    vehicle_id: Optional[str] = None
    vehicle_number: str  # Registration number (standardized)
    vehicle_brand: Optional[str] = None
    vehicle_model: Optional[str] = None
    vehicle_year: Optional[str] = None
    service_type: str
    description: str
    amount: float

class ServiceUpdate(BaseModel):
    customer_id: str
    vehicle_id: Optional[str] = None
    vehicle_number: str  # Registration number (standardized)
    vehicle_brand: Optional[str] = None
    vehicle_model: Optional[str] = None
    vehicle_year: Optional[str] = None
    service_type: str
    description: str
    amount: float
    service_date: Optional[datetime] = None  # Registration date

class SparePart(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    part_number: str
    brand: str
    quantity: int
    unit: str = "Nos"  # Unit of measurement (Nos, Kg, Ltr, etc.)
    unit_price: float
    hsn_sac: Optional[str] = None  # HSN/SAC code
    gst_percentage: float = 18.0  # GST percentage
    compatible_models: Optional[str] = None  # Compatible vehicle models
    low_stock_threshold: int = 5
    supplier: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SparePartCreate(BaseModel):
    name: str
    part_number: str
    brand: str
    quantity: int
    unit: str = "Nos"
    unit_price: float
    hsn_sac: Optional[str] = None
    gst_percentage: float = 18.0
    compatible_models: Optional[str] = None
    low_stock_threshold: int = 5
    supplier: Optional[str] = None

class SparePartBill(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    bill_number: str
    customer_id: Optional[str] = None  # For backwards compatibility
    customer_data: Optional[Dict[str, str]] = None  # {name, mobile, vehicle_name, vehicle_number}
    items: List[Dict[str, Any]]  # Detailed GST items with all calculations
    subtotal: float
    total_discount: float
    total_cgst: float
    total_sgst: float
    total_tax: float
    total_amount: float
    bill_date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    created_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SparePartBillCreate(BaseModel):
    customer_data: Optional[Dict[str, str]] = None  # {name, mobile, vehicle_name, vehicle_number}
    customer_id: Optional[str] = None  # For backwards compatibility
    items: List[Dict[str, Any]]
    subtotal: Optional[float] = 0
    total_discount: Optional[float] = 0
    total_cgst: Optional[float] = 0
    total_sgst: Optional[float] = 0
    total_tax: Optional[float] = 0
    total_amount: Optional[float] = 0

# Service Bill Models
class ServiceBill(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    bill_number: str
    job_card_number: Optional[str] = None
    customer_id: Optional[str] = None
    customer_name: Optional[str] = None
    customer_mobile: Optional[str] = None
    vehicle_number: Optional[str] = None
    vehicle_brand: Optional[str] = None
    vehicle_model: Optional[str] = None
    items: List[Dict[str, Any]]  # Itemized bill items with GST calculations
    subtotal: float = 0
    total_discount: float = 0
    total_cgst: float = 0
    total_sgst: float = 0
    total_tax: float = 0
    total_amount: float = 0
    bill_date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    status: str = "pending"
    created_by: str = ""
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ServiceBillCreate(BaseModel):
    bill_number: str
    job_card_number: Optional[str] = None
    customer_id: Optional[str] = None
    customer_name: Optional[str] = None
    customer_mobile: Optional[str] = None
    vehicle_number: Optional[str] = None
    vehicle_brand: Optional[str] = None
    vehicle_model: Optional[str] = None
    items: List[Dict[str, Any]]
    subtotal: float = 0
    total_discount: float = 0
    total_cgst: float = 0
    total_sgst: float = 0
    total_tax: float = 0
    total_amount: float = 0
    bill_date: Optional[str] = None
    status: str = "pending"

# Backup Models
class BackupConfig(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    backup_enabled: bool = True
    backup_time: str = "02:00"  # 24-hour format
    retention_days: int = 30
    compress_backups: bool = True
    email_notifications: bool = False
    email_recipients: List[str] = []
    backup_location: str = "./backups"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class BackupJob(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    status: str  # running, completed, failed
    start_time: datetime
    end_time: Optional[datetime] = None
    total_records: int = 0
    backup_size_mb: float = 0
    backup_file_path: str = ""
    error_message: Optional[str] = None
    records_backed_up: Dict[str, int] = {}
    created_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class BackupJobCreate(BaseModel):
    backup_type: str = "manual"  # manual or scheduled
    export_format: str = "json"  # json, excel

class BackupStats(BaseModel):
    total_backups: int
    successful_backups: int
    failed_backups: int
    last_backup_date: Optional[datetime]
    total_storage_used_mb: float
    oldest_backup_date: Optional[datetime]

# Import Models
class ImportJob(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    file_name: str
    data_type: str  # customers, vehicles, spare_parts, services
    status: str  # processing, completed, failed
    total_records: int = 0
    processed_records: int = 0
    successful_records: int = 0
    failed_records: int = 0
    skipped_records: int = 0  # Records skipped due to duplicates
    errors: List[Dict[str, Any]] = []
    cross_reference_stats: Optional[Dict[str, int]] = {}  # Track linking statistics
    incomplete_records: List[Dict[str, Any]] = []  # Records with missing data
    start_time: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    end_time: Optional[datetime] = None
    created_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ImportResult(BaseModel):
    job_id: str
    status: str
    message: str
    total_records: int = 0
    successful_records: int = 0
    failed_records: int = 0
    skipped_records: int = 0  # Records skipped due to duplicates
    errors: List[Dict[str, Any]] = []
    cross_reference_stats: Optional[Dict[str, int]] = {}  # Linking statistics
    incomplete_records: List[Dict[str, Any]] = []  # Records needing completion

# Utility functions
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed_password.encode('utf-8'))

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
        
        user = await db.users.find_one({"username": username})
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        
        return User(**user)
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")

async def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Verify JWT token and return user data"""
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
        
        user = await db.users.find_one({"username": username})
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        
        # Handle both 'id' and '_id' fields for user identification
        user_id = user.get("id") or str(user.get("_id", ""))
        return {"user_id": user_id, "username": user["username"], "role": user.get("role", "user")}
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")

def parse_date_flexible(date_str: str) -> datetime:
    """Parse date from various formats"""
    date_str = date_str.strip()
    
    # Try to parse as Excel serial date number
    try:
        excel_date = float(date_str)
        if excel_date > 59:
            excel_date -= 1
        return datetime(1900, 1, 1, tzinfo=timezone.utc) + timedelta(days=excel_date - 2)
    except (ValueError, TypeError):
        pass
    
    # Try various string date formats
    # Format: DD-MMM (03-Mar) - add current year
    if re.match(r'\d{1,2}-[A-Za-z]{3}', date_str):
        date_str = f"{date_str}-{datetime.now().year}"
        return datetime.strptime(date_str, "%d-%b-%Y").replace(tzinfo=timezone.utc)
    # Format: DD/MM/YYYY (15/01/2024)
    elif re.match(r'\d{1,2}/\d{1,2}/\d{4}', date_str):
        return datetime.strptime(date_str, "%d/%m/%Y").replace(tzinfo=timezone.utc)
    # Format: DD-MM-YYYY (15-01-2024)
    elif re.match(r'\d{1,2}-\d{1,2}-\d{4}', date_str):
        return datetime.strptime(date_str, "%d-%m-%Y").replace(tzinfo=timezone.utc)
    # Format: YYYY-MM-DD (2024-01-15) - ISO format
    elif re.match(r'\d{4}-\d{1,2}-\d{1,2}', date_str):
        return datetime.strptime(date_str, "%Y-%m-%d").replace(tzinfo=timezone.utc)
    # Format: YYYY/MM/DD (2024/01/15)
    elif re.match(r'\d{4}/\d{1,2}/\d{1,2}', date_str):
        return datetime.strptime(date_str, "%Y/%m/%d").replace(tzinfo=timezone.utc)
    # Format: DD MMM YYYY (15 Jan 2024)
    elif re.match(r'\d{1,2}\s+[A-Za-z]{3}\s+\d{4}', date_str):
        return datetime.strptime(date_str, "%d %b %Y").replace(tzinfo=timezone.utc)
    # Format: MMM DD, YYYY (Jan 15, 2024)
    elif re.match(r'[A-Za-z]{3}\s+\d{1,2},?\s+\d{4}', date_str):
        return datetime.strptime(date_str.replace(',', ''), "%b %d %Y").replace(tzinfo=timezone.utc)
    else:
        # Try generic parser as last resort
        try:
            from dateutil import parser
            return parser.parse(date_str).replace(tzinfo=timezone.utc)
        except:
            return datetime.now(timezone.utc)

# Health check endpoints for Kubernetes (both root and /api paths for compatibility)
@app.get("/health")
async def health_check():
    """Health check endpoint for Kubernetes liveness probe"""
    return {"status": "healthy"}

@app.get("/ready")
async def readiness_check():
    """Readiness check endpoint for Kubernetes readiness probe"""
    try:
        # Test database connection
        await db.command("ping")
        return {"status": "ready", "database": "connected"}
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Database not ready: {str(e)}")

# Also add health checks under /api prefix for compatibility
@api_router.get("/health")
async def api_health_check():
    """Health check endpoint at /api/health"""
    return {"status": "healthy"}

@api_router.get("/ready")
async def api_readiness_check():
    """Readiness check endpoint at /api/ready"""
    try:
        # Test database connection
        await db.command("ping")
        return {"status": "ready", "database": "connected"}
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Database not ready: {str(e)}")

# Test endpoint
@api_router.get("/")
async def root():
    return {"message": "Two Wheeler Business Management API is running"}

# Authentication endpoints
@api_router.post("/auth/register")
async def register_user(user_data: UserCreate):
    # Check if user exists
    existing_user = await db.users.find_one({"$or": [{"username": user_data.username}, {"email": user_data.email}]})
    if existing_user:
        raise HTTPException(status_code=400, detail="Username or email already registered")
    
    # Hash password
    hashed_password = hash_password(user_data.password)
    
    # Create user document for database
    user_dict = user_data.dict()
    user_dict.pop('password')
    user_dict['hashed_password'] = hashed_password
    user_dict['id'] = str(uuid.uuid4())
    user_dict['is_active'] = True
    user_dict['created_at'] = datetime.now(timezone.utc)
    
    await db.users.insert_one(user_dict)
    return {"message": "User registered successfully", "user_id": user_dict['id']}

@api_router.post("/auth/login")
async def login_user(user_credentials: UserLogin):
    user = await db.users.find_one({"username": user_credentials.username})
    if not user or not verify_password(user_credentials.password, user['hashed_password']):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not user['is_active']:
        raise HTTPException(status_code=401, detail="User account is inactive")
    
    access_token = create_access_token(data={"sub": user['username'], "role": user['role']})
    return {"access_token": access_token, "token_type": "bearer", "user": User(**user)}

@api_router.get("/auth/me")
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    return current_user

# Customer endpoints
@api_router.post("/customers", response_model=Customer)
async def create_customer(customer_data: CustomerCreate, current_user: User = Depends(get_current_user)):
    # Check for duplicate mobile number
    if customer_data.mobile and await check_customer_duplicate(customer_data.mobile):
        raise HTTPException(status_code=400, detail=f"Customer with mobile number '{customer_data.mobile}' already exists")
    
    customer = Customer(**customer_data.dict())
    await db.customers.insert_one(customer.dict())
    return customer

@api_router.get("/customers")
async def get_customers(
    page: int = 1,
    limit: int = 100,
    sort: str = "created_at",
    order: str = "desc",
    current_user: User = Depends(get_current_user)
):
    # Validate sort field
    valid_sort_fields = ["name", "mobile", "created_at", "total_purchases"]
    if sort not in valid_sort_fields:
        raise HTTPException(status_code=400, detail=f"Invalid sort field. Must be one of: {', '.join(valid_sort_fields)}")
    
    # Validate order
    if order not in ["asc", "desc"]:
        raise HTTPException(status_code=400, detail="Invalid order. Must be 'asc' or 'desc'")
    
    # Calculate skip
    skip = (page - 1) * limit
    
    # Build sort criteria
    sort_direction = 1 if order == "asc" else -1
    
    # For total_purchases, we need to aggregate
    if sort == "total_purchases":
        # Aggregate to calculate total purchases
        pipeline = [
            {
                "$lookup": {
                    "from": "sales",
                    "localField": "id",
                    "foreignField": "customer_id",
                    "as": "sales"
                }
            },
            {
                "$addFields": {
                    "total_purchases": {"$size": "$sales"}
                }
            },
            {"$sort": {"total_purchases": sort_direction}},
            {"$skip": skip},
            {"$limit": limit}
        ]
        customers = await db.customers.aggregate(pipeline).to_list(None)
        
        # Get total count
        total = await db.customers.count_documents({})
    else:
        # Regular sort
        customers = await db.customers.find().sort(sort, sort_direction).skip(skip).limit(limit).to_list(None)
        total = await db.customers.count_documents({})
    
    # Convert ObjectId to string for JSON serialization
    for customer in customers:
        if '_id' in customer:
            customer['_id'] = str(customer['_id'])
    
    # Calculate total pages
    total_pages = (total + limit - 1) // limit
    
    return {
        "data": customers,
        "meta": {
            "total": total,
            "page": page,
            "limit": limit,
            "totalPages": total_pages
        }
    }

@api_router.get("/customers/{customer_id}")
async def get_customer(customer_id: str, current_user: User = Depends(get_current_user)):
    customer = await db.customers.find_one({"id": customer_id})
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    # Convert ObjectId to string for JSON serialization
    if '_id' in customer:
        customer['_id'] = str(customer['_id'])
    return customer

@api_router.put("/customers/{customer_id}", response_model=Customer)
async def update_customer(customer_id: str, customer_data: CustomerCreate, current_user: User = Depends(get_current_user)):
    # Check if customer exists
    existing_customer = await db.customers.find_one({"id": customer_id})
    if not existing_customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    # Prepare update data by merging with existing data to preserve nested fields
    update_data = customer_data.dict(exclude_unset=True)  # Only include fields that were explicitly set
    
    # Always preserve these fields
    update_data["id"] = customer_id  # Keep the original ID
    update_data["created_at"] = existing_customer["created_at"]  # Keep original creation date
    
    # Merge nested fields to preserve existing data
    # Handle vehicle_info preservation
    if "vehicle_info" in update_data:
        existing_vehicle_info = existing_customer.get("vehicle_info", {})
        if existing_vehicle_info and update_data["vehicle_info"]:
            # Merge existing vehicle_info with new vehicle_info
            merged_vehicle_info = {**existing_vehicle_info, **update_data["vehicle_info"]}
            update_data["vehicle_info"] = merged_vehicle_info
    else:
        # Preserve existing vehicle_info if not included in update
        if "vehicle_info" in existing_customer:
            update_data["vehicle_info"] = existing_customer["vehicle_info"]
    
    # Handle insurance_info preservation
    if "insurance_info" in update_data:
        existing_insurance_info = existing_customer.get("insurance_info", {})
        if existing_insurance_info and update_data["insurance_info"]:
            # Merge existing insurance_info with new insurance_info
            merged_insurance_info = {**existing_insurance_info, **update_data["insurance_info"]}
            update_data["insurance_info"] = merged_insurance_info
    else:
        # Preserve existing insurance_info if not included in update
        if "insurance_info" in existing_customer:
            update_data["insurance_info"] = existing_customer["insurance_info"]
    
    # Handle sales_info preservation
    if "sales_info" in update_data:
        existing_sales_info = existing_customer.get("sales_info", {})
        if existing_sales_info and update_data["sales_info"]:
            # Merge existing sales_info with new sales_info
            merged_sales_info = {**existing_sales_info, **update_data["sales_info"]}
            update_data["sales_info"] = merged_sales_info
    else:
        # Preserve existing sales_info if not included in update
        if "sales_info" in existing_customer:
            update_data["sales_info"] = existing_customer["sales_info"]
    
    # Create the complete updated customer data by merging with existing
    complete_update_data = {**existing_customer, **update_data}
    
    updated_customer = Customer(**complete_update_data)
    await db.customers.replace_one({"id": customer_id}, updated_customer.dict())
    return updated_customer

@api_router.delete("/customers/{customer_id}")
async def delete_customer(customer_id: str, current_user: User = Depends(get_current_user)):
    # Check if customer exists
    existing_customer = await db.customers.find_one({"id": customer_id})
    if not existing_customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    # Check if customer has associated sales records
    sales_count = await db.sales.count_documents({"customer_id": customer_id})
    if sales_count > 0:
        raise HTTPException(status_code=400, detail=f"Cannot delete customer. Customer has {sales_count} associated sales record(s). Please delete sales records first.")
    
    # Delete the customer
    result = await db.customers.delete_one({"id": customer_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    return {"message": "Customer deleted successfully", "deleted_customer_id": customer_id}

class BulkDeleteRequest(BaseModel):
    ids: List[str]
    force_delete: bool = False

@api_router.delete("/customers")
async def bulk_delete_customers(request: BulkDeleteRequest, current_user: User = Depends(get_current_user)):
    """Bulk delete customers"""
    if not request.ids:
        raise HTTPException(status_code=400, detail="No customer IDs provided")
    
    deleted = []
    failed = []
    
    for customer_id in request.ids:
        try:
            # Check if customer exists
            existing_customer = await db.customers.find_one({"id": customer_id})
            if not existing_customer:
                failed.append({"id": customer_id, "error": "Customer not found"})
                continue
            
            # Check if customer has associated sales records
            sales_count = await db.sales.count_documents({"customer_id": customer_id})
            if sales_count > 0:
                failed.append({"id": customer_id, "error": f"Customer has {sales_count} associated sales record(s)"})
                continue
            
            # Delete the customer
            result = await db.customers.delete_one({"id": customer_id})
            if result.deleted_count > 0:
                deleted.append(customer_id)
            else:
                failed.append({"id": customer_id, "error": "Failed to delete"})
        except Exception as e:
            failed.append({"id": customer_id, "error": str(e)})
    
    return {
        "deleted": len(deleted),
        "deleted_ids": deleted,
        "failed": failed
    }

# Vehicle endpoints
@api_router.post("/vehicles", response_model=Vehicle)
async def create_vehicle(vehicle_data: VehicleCreate, current_user: User = Depends(get_current_user)):
    # Check for duplicate chassis number
    if vehicle_data.chassis_number and await check_vehicle_duplicate(vehicle_data.chassis_number):
        raise HTTPException(status_code=400, detail=f"Vehicle with chassis number '{vehicle_data.chassis_number}' already exists")
    
    vehicle = Vehicle(**vehicle_data.dict())
    await db.vehicles.insert_one(vehicle.dict())
    
    # Create activity notification
    try:
        await create_activity(ActivityCreate(
            type=ActivityType.VEHICLE_ADDED,
            title="New vehicle added to stock",
            description=f"{vehicle_data.brand} {vehicle_data.model} - {vehicle_data.chassis_number}",
            icon="info",
            metadata={"vehicle_id": vehicle.id}
        ))
    except Exception as e:
        logger.warning(f"Failed to create activity for vehicle addition: {e}")
    
    return vehicle

@api_router.get("/vehicles", response_model=List[Vehicle])
async def get_vehicles(brand: Optional[str] = None, status: Optional[VehicleStatus] = None, current_user: User = Depends(get_current_user)):
    filter_dict = {}
    if brand:
        filter_dict["brand"] = brand
    if status:
        filter_dict["status"] = status
    
    vehicles = await db.vehicles.find(filter_dict).to_list(1000)
    return [Vehicle(**vehicle) for vehicle in vehicles]

@api_router.get("/vehicles/brands")
async def get_vehicle_brands(current_user: User = Depends(get_current_user)):
    brands = ["TVS", "BAJAJ", "HERO", "HONDA", "TRIUMPH", "KTM", "SUZUKI", "APRILIA", "YAMAHA", "PIAGGIO"]
    return brands

@api_router.put("/vehicles/{vehicle_id}", response_model=Vehicle)
async def update_vehicle(vehicle_id: str, vehicle_data: VehicleUpdate, current_user: User = Depends(get_current_user)):
    # Check if vehicle exists
    existing_vehicle = await db.vehicles.find_one({"id": vehicle_id})
    if not existing_vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    
    # Update vehicle data - only update fields that are provided
    update_data = {k: v for k, v in vehicle_data.dict().items() if v is not None}
    update_data["id"] = vehicle_id  # Keep the original ID
    
    # Handle date_returned if provided
    if "date_returned" in update_data and update_data["date_returned"]:
        try:
            from dateutil import parser as date_parser
            update_data["date_returned"] = date_parser.parse(update_data["date_returned"])
        except:
            pass
    
    # Merge existing data with updates
    merged_data = {**existing_vehicle, **update_data}
    
    updated_vehicle = Vehicle(**merged_data)
    await db.vehicles.replace_one({"id": vehicle_id}, updated_vehicle.dict())
    return updated_vehicle

@api_router.get("/vehicles/{vehicle_id}", response_model=Vehicle)
async def get_vehicle(vehicle_id: str, current_user: User = Depends(get_current_user)):
    vehicle = await db.vehicles.find_one({"id": vehicle_id})
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return Vehicle(**vehicle)

@api_router.put("/vehicles/{vehicle_id}/status")
async def update_vehicle_status(vehicle_id: str, status_data: dict, current_user: User = Depends(get_current_user)):
    """Update vehicle status with optional return date"""
    # Check if vehicle exists
    existing_vehicle = await db.vehicles.find_one({"id": vehicle_id})
    if not existing_vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    
    # Validate status
    new_status = status_data.get("status")
    if not new_status:
        raise HTTPException(status_code=400, detail="Status is required")
    
    # Validate status value
    valid_statuses = ["in_stock", "sold", "returned"]
    if new_status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")
    
    # Prepare update data
    update_data = {"status": new_status}
    
    # Handle status-specific updates
    if new_status == "sold":
        update_data["date_sold"] = datetime.now(timezone.utc)
        # Clear return date if previously returned
        update_data["date_returned"] = None
    elif new_status == "returned":
        # Set return date
        return_date = status_data.get("return_date")
        if return_date:
            try:
                # Parse the return date if provided
                update_data["date_returned"] = datetime.fromisoformat(return_date.replace('Z', '+00:00'))
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid return_date format. Use ISO format (YYYY-MM-DDTHH:MM:SSZ)")
        else:
            update_data["date_returned"] = datetime.now(timezone.utc)
        
        # Set outbound location if provided
        outbound_location = status_data.get("outbound_location")
        if outbound_location:
            update_data["outbound_location"] = outbound_location
    elif new_status == "in_stock":
        # Clear sold/returned dates when back in stock
        update_data["date_sold"] = None
        update_data["date_returned"] = None
        update_data["customer_id"] = None
        update_data["outbound_location"] = None
    
    # Update the vehicle
    await db.vehicles.update_one({"id": vehicle_id}, {"$set": update_data})
    
    # Return updated vehicle
    updated_vehicle = await db.vehicles.find_one({"id": vehicle_id})
    return Vehicle(**updated_vehicle)

@api_router.delete("/vehicles/{vehicle_id}")
async def delete_vehicle(vehicle_id: str, current_user: User = Depends(get_current_user)):
    # Check if vehicle exists
    existing_vehicle = await db.vehicles.find_one({"id": vehicle_id})
    if not existing_vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    
    # Check if vehicle has associated sales records
    sales_count = await db.sales.count_documents({"vehicle_id": vehicle_id})
    if sales_count > 0:
        raise HTTPException(status_code=400, detail=f"Cannot delete vehicle. Vehicle has {sales_count} associated sales record(s). Please delete sales records first.")
    
    # Check if vehicle has associated service records
    services_count = await db.services.count_documents({"vehicle_id": vehicle_id})
    if services_count > 0:
        raise HTTPException(status_code=400, detail=f"Cannot delete vehicle. Vehicle has {services_count} associated service record(s). Please delete service records first.")
    
    # Delete the vehicle
    result = await db.vehicles.delete_one({"id": vehicle_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    
    return {"message": "Vehicle deleted successfully", "deleted_vehicle_id": vehicle_id}

@api_router.delete("/vehicles")
async def bulk_delete_vehicles(request: BulkDeleteRequest, current_user: User = Depends(get_current_user)):
    """Bulk delete vehicles with optional force delete (cascade)"""
    if not request.ids:
        raise HTTPException(status_code=400, detail="No vehicle IDs provided")
    
    deleted = []
    failed = []
    cascade_stats = {"sales": 0, "services": 0}
    
    for vehicle_id in request.ids:
        try:
            # Check if vehicle exists
            existing_vehicle = await db.vehicles.find_one({"id": vehicle_id})
            if not existing_vehicle:
                failed.append({"id": vehicle_id, "error": "Vehicle not found"})
                continue
            
            # Check for associated records
            sales_count = await db.sales.count_documents({"vehicle_id": vehicle_id})
            services_count = await db.services.count_documents({"vehicle_id": vehicle_id})
            
            # If force delete is enabled, delete associated records first
            if request.force_delete:
                # Delete associated sales
                if sales_count > 0:
                    sales_result = await db.sales.delete_many({"vehicle_id": vehicle_id})
                    cascade_stats["sales"] += sales_result.deleted_count
                
                # Delete associated services
                if services_count > 0:
                    services_result = await db.services.delete_many({"vehicle_id": vehicle_id})
                    cascade_stats["services"] += services_result.deleted_count
            else:
                # Normal delete - check for restrictions
                if sales_count > 0:
                    failed.append({"id": vehicle_id, "error": f"Vehicle has {sales_count} associated sales record(s)"})
                    continue
                
                if services_count > 0:
                    failed.append({"id": vehicle_id, "error": f"Vehicle has {services_count} associated service record(s)"})
                    continue
            
            # Delete the vehicle
            result = await db.vehicles.delete_one({"id": vehicle_id})
            if result.deleted_count > 0:
                deleted.append(vehicle_id)
            else:
                failed.append({"id": vehicle_id, "error": "Failed to delete"})
        except Exception as e:
            failed.append({"id": vehicle_id, "error": str(e)})
    
    response = {
        "deleted": len(deleted),
        "deleted_ids": deleted,
        "failed": failed
    }
    
    # Include cascade statistics if force delete was used
    if request.force_delete:
        response["cascade_deleted"] = cascade_stats
    
    return response

# Sales endpoints
@api_router.post("/sales", response_model=Sale)
async def create_sale(sale_data: SaleCreate, current_user: User = Depends(get_current_user)):
    # Validate customer exists
    customer = await db.customers.find_one({"id": sale_data.customer_id})
    if not customer:
        raise HTTPException(status_code=400, detail="Customer not found")
    
    # Validate vehicle if provided
    if sale_data.vehicle_id:
        vehicle = await db.vehicles.find_one({"id": sale_data.vehicle_id})
        if not vehicle:
            raise HTTPException(status_code=400, detail="Vehicle not found")
        if vehicle['status'] != VehicleStatus.IN_STOCK:
            raise HTTPException(status_code=400, detail="Vehicle not available for sale")
    
    # Validate amount is positive
    if sale_data.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be greater than zero")
    
    # Validate payment method
    valid_payment_methods = ["Cash", "Card", "UPI", "Bank Transfer", "Cheque", "Finance"]
    if sale_data.payment_method not in valid_payment_methods:
        raise HTTPException(status_code=400, detail=f"Invalid payment method. Must be one of: {', '.join(valid_payment_methods)}")
    
    # Generate invoice number
    count = await db.sales.count_documents({})
    invoice_number = f"INV-{count + 1:06d}"
    
    sale_dict = sale_data.dict()
    sale_dict['invoice_number'] = invoice_number
    sale_dict['created_by'] = current_user.id
    
    # Remove None sale_date to allow default factory to work
    if sale_dict.get('sale_date') is None:
        sale_dict.pop('sale_date', None)
    
    sale = Sale(**sale_dict)
    
    # Update vehicle status if vehicle_id provided
    if sale_data.vehicle_id:
        await db.vehicles.update_one(
            {"id": sale_data.vehicle_id},
            {"$set": {"status": VehicleStatus.SOLD, "customer_id": sale_data.customer_id, "date_sold": datetime.now(timezone.utc)}}
        )
    
    await db.sales.insert_one(sale.dict())
    
    # Create activity notification
    try:
        vehicle_info = ""
        if sale_data.vehicle_id:
            vehicle = await db.vehicles.find_one({"id": sale_data.vehicle_id}, {"_id": 0})
            if vehicle:
                vehicle_info = f" - {vehicle.get('brand', '')} {vehicle.get('model', '')}"
        
        await create_activity(ActivityCreate(
            type=ActivityType.SALE_CREATED,
            title="New sale recorded",
            description=f"{customer.get('name', 'Unknown')} - Invoice {invoice_number}{vehicle_info}",
            icon="success",
            metadata={"sale_id": sale.id, "customer_id": sale_data.customer_id, "invoice_number": invoice_number}
        ))
    except Exception as e:
        logger.warning(f"Failed to create activity for sale: {e}")
    
    return sale

@api_router.get("/sales", response_model=List[Sale])
async def get_sales(current_user: User = Depends(get_current_user)):
    sales = await db.sales.find().to_list(1000)
    return [Sale(**sale) for sale in sales]

@api_router.get("/sales/summary/chart")
async def get_sales_summary(
    granularity: str = "monthly",
    years: int = 5,
    current_user: User = Depends(get_current_user)
):
    """Get sales summary for chart - monthly or yearly"""
    if granularity not in ["monthly", "yearly"]:
        raise HTTPException(status_code=400, detail="Granularity must be 'monthly' or 'yearly'")
    
    from datetime import datetime, timezone
    
    if granularity == "monthly":
        # Get last 12 months of data
        pipeline = [
            {
                "$addFields": {
                    "month": {"$month": "$sale_date"},
                    "year": {"$year": "$sale_date"}
                }
            },
            {
                "$group": {
                    "_id": {
                        "year": "$year",
                        "month": "$month"
                    },
                    "total_amount": {"$sum": "$amount"},
                    "count": {"$sum": 1}
                }
            },
            {"$sort": {"_id.year": 1, "_id.month": 1}},
            {"$limit": 12}
        ]
        
        results = await db.sales.aggregate(pipeline).to_list(None)
        
        labels = []
        values = []
        for result in results:
            month_name = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][result["_id"]["month"] - 1]
            labels.append(f"{month_name} {result['_id']['year']}")
            values.append(result["total_amount"])
        
        return {"labels": labels, "values": values, "granularity": "monthly"}
    
    else:  # yearly
        # Get last N years of data
        pipeline = [
            {
                "$addFields": {
                    "year": {"$year": "$sale_date"}
                }
            },
            {
                "$group": {
                    "_id": "$year",
                    "total_amount": {"$sum": "$amount"},
                    "count": {"$sum": 1}
                }
            },
            {"$sort": {"_id": 1}},
            {"$limit": years}
        ]
        
        results = await db.sales.aggregate(pipeline).to_list(None)
        
        labels = [str(result["_id"]) for result in results]
        values = [result["total_amount"] for result in results]
        
        return {"labels": labels, "values": values, "granularity": "yearly"}

@api_router.get("/sales/{sale_id}", response_model=Sale)
async def get_sale(sale_id: str, current_user: User = Depends(get_current_user)):
    sale = await db.sales.find_one({"id": sale_id})
    if not sale:
        raise HTTPException(status_code=404, detail="Sale not found")
    return Sale(**sale)

@api_router.put("/sales/{sale_id}", response_model=Sale)
async def update_sale(sale_id: str, sale_data: SaleCreate, current_user: User = Depends(get_current_user)):
    # Check if sale exists
    existing_sale = await db.sales.find_one({"id": sale_id})
    if not existing_sale:
        raise HTTPException(status_code=404, detail="Sale not found")
    
    # Update sale data
    update_data = sale_data.dict(exclude_unset=True)
    update_data["id"] = sale_id  # Keep the original ID
    update_data["invoice_number"] = existing_sale["invoice_number"]  # Keep original invoice number
    update_data["created_by"] = existing_sale["created_by"]  # Keep original creator
    update_data["created_at"] = existing_sale["created_at"]  # Keep original creation date
    
    # If sale_date is provided, use it; otherwise keep existing
    if "sale_date" not in update_data or update_data["sale_date"] is None:
        update_data["sale_date"] = existing_sale["sale_date"]
    
    # Merge with existing data to preserve all fields
    merged_data = {**existing_sale, **update_data}
    
    updated_sale = Sale(**merged_data)
    await db.sales.replace_one({"id": sale_id}, updated_sale.dict())
    return updated_sale

@api_router.delete("/sales/{sale_id}")
async def delete_sale(sale_id: str, current_user: User = Depends(get_current_user)):
    # Check if sale exists
    existing_sale = await db.sales.find_one({"id": sale_id})
    if not existing_sale:
        raise HTTPException(status_code=404, detail="Sale not found")
    
    # If vehicle is associated, reset its status to in_stock
    if existing_sale.get("vehicle_id"):
        await db.vehicles.update_one(
            {"id": existing_sale["vehicle_id"]},
            {"$set": {"status": VehicleStatus.IN_STOCK}, "$unset": {"customer_id": "", "date_sold": ""}}
        )
    
    # Delete the sale
    result = await db.sales.delete_one({"id": sale_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Sale not found")
    
    return {"message": "Sale deleted successfully", "deleted_sale_id": sale_id}

@api_router.delete("/sales")
async def bulk_delete_sales(request: BulkDeleteRequest, current_user: User = Depends(get_current_user)):
    """Bulk delete sales/invoices"""
    if not request.ids:
        raise HTTPException(status_code=400, detail="No sale IDs provided")
    
    deleted = []
    failed = []
    
    for sale_id in request.ids:
        try:
            # Check if sale exists
            existing_sale = await db.sales.find_one({"id": sale_id})
            if not existing_sale:
                failed.append({"id": sale_id, "error": "Sale not found"})
                continue
            
            # If vehicle is associated, reset its status to in_stock
            if existing_sale.get("vehicle_id"):
                await db.vehicles.update_one(
                    {"id": existing_sale["vehicle_id"]},
                    {"$set": {"status": VehicleStatus.IN_STOCK}, "$unset": {"customer_id": "", "date_sold": ""}}
                )
            
            # Delete the sale
            result = await db.sales.delete_one({"id": sale_id})
            if result.deleted_count > 0:
                deleted.append(sale_id)
            else:
                failed.append({"id": sale_id, "error": "Failed to delete"})
        except Exception as e:
            failed.append({"id": sale_id, "error": str(e)})
    
    return {
        "deleted": len(deleted),
        "deleted_ids": deleted,
        "failed": failed
    }

# Registration endpoints (One-time customer + vehicle registration)
@api_router.post("/registrations", response_model=Registration)
async def create_registration(reg_data: RegistrationCreate, current_user: User = Depends(get_current_user)):
    # Check if customer already exists by mobile
    existing_customer = await db.customers.find_one({"mobile": reg_data.customer_mobile})
    
    if existing_customer:
        customer_id = existing_customer["id"]
        # Update customer name if different
        if existing_customer.get("name") != reg_data.customer_name:
            await db.customers.update_one(
                {"id": customer_id},
                {"$set": {"name": reg_data.customer_name}}
            )
    else:
        # Create new customer
        customer_id = str(uuid.uuid4())
        customer = {
            "id": customer_id,
            "name": reg_data.customer_name,
            "mobile": reg_data.customer_mobile,
            "address": reg_data.customer_address or "",
            "created_at": datetime.now(timezone.utc)
        }
        await db.customers.insert_one(customer)
    
    # Generate registration number
    count = await db.registrations.count_documents({})
    registration_number = f"REG-{count + 1:06d}"
    
    registration = Registration(
        registration_number=registration_number,
        customer_id=customer_id,
        customer_name=reg_data.customer_name,
        customer_mobile=reg_data.customer_mobile,
        customer_address=reg_data.customer_address,
        vehicle_number=reg_data.vehicle_number,
        vehicle_brand=reg_data.vehicle_brand,
        vehicle_model=reg_data.vehicle_model,
        vehicle_year=reg_data.vehicle_year,
        chassis_number=reg_data.chassis_number,
        engine_number=reg_data.engine_number,
        created_by=current_user.id
    )
    
    await db.registrations.insert_one(registration.dict())
    return registration

@api_router.get("/registrations")
async def get_registrations(current_user: User = Depends(get_current_user)):
    registrations = await db.registrations.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return registrations

@api_router.get("/registrations/{reg_id}")
async def get_registration(reg_id: str, current_user: User = Depends(get_current_user)):
    registration = await db.registrations.find_one({"id": reg_id}, {"_id": 0})
    if not registration:
        raise HTTPException(status_code=404, detail="Registration not found")
    return registration

@api_router.put("/registrations/{reg_id}")
async def update_registration(reg_id: str, reg_data: RegistrationCreate, current_user: User = Depends(get_current_user)):
    existing = await db.registrations.find_one({"id": reg_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Registration not found")
    
    update_data = reg_data.dict()
    update_data["id"] = reg_id
    update_data["registration_number"] = existing["registration_number"]
    update_data["customer_id"] = existing["customer_id"]
    update_data["created_by"] = existing["created_by"]
    update_data["created_at"] = existing["created_at"]
    update_data["registration_date"] = existing.get("registration_date", datetime.now(timezone.utc))
    
    await db.registrations.replace_one({"id": reg_id}, update_data)
    return update_data

@api_router.delete("/registrations/{reg_id}")
async def delete_registration(reg_id: str, current_user: User = Depends(get_current_user)):
    existing = await db.registrations.find_one({"id": reg_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Registration not found")
    
    await db.registrations.delete_one({"id": reg_id})
    return {"message": "Registration deleted successfully"}

# Service endpoints
@api_router.post("/services", response_model=Service)
async def create_service(service_data: ServiceCreate, current_user: User = Depends(get_current_user)):
    # Generate job card number
    count = await db.services.count_documents({})
    job_card_number = f"JOB-{count + 1:06d}"
    
    service_dict = service_data.dict()
    service_dict['job_card_number'] = job_card_number
    service_dict['created_by'] = current_user.id
    service = Service(**service_dict)
    
    await db.services.insert_one(service.dict())
    return service

@api_router.get("/services", response_model=List[Service])
async def get_services(status: Optional[ServiceStatus] = None, current_user: User = Depends(get_current_user)):
    filter_dict = {}
    if status:
        filter_dict["status"] = status
    
    services = await db.services.find(filter_dict).to_list(1000)
    return [Service(**service) for service in services]

@api_router.get("/services/{service_id}", response_model=Service)
async def get_service(service_id: str, current_user: User = Depends(get_current_user)):
    service = await db.services.find_one({"id": service_id})
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    return Service(**service)

@api_router.put("/services/{service_id}", response_model=Service)
async def update_service(service_id: str, service_data: ServiceUpdate, current_user: User = Depends(get_current_user)):
    # Check if service exists
    existing_service = await db.services.find_one({"id": service_id})
    if not existing_service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    # Update service data
    update_data = service_data.dict()
    update_data["id"] = service_id  # Keep the original ID
    update_data["job_card_number"] = existing_service["job_card_number"]  # Keep original job card number
    update_data["created_by"] = existing_service["created_by"]  # Keep original creator
    update_data["created_at"] = existing_service["created_at"]  # Keep original creation date
    update_data["status"] = existing_service.get("status", ServiceStatus.PENDING)  # Keep current status
    update_data["completion_date"] = existing_service.get("completion_date")  # Keep completion date if exists
    
    # If service_date not provided, keep the existing one
    if update_data.get("service_date") is None:
        update_data["service_date"] = existing_service.get("service_date")
    
    updated_service = Service(**update_data)
    await db.services.replace_one({"id": service_id}, updated_service.dict())
    return updated_service

@api_router.put("/services/{service_id}/status")
async def update_service_status(service_id: str, status_data: dict, current_user: User = Depends(get_current_user)):
    status = status_data.get("status")
    if not status:
        raise HTTPException(status_code=400, detail="Status is required")
    
    update_data = {"status": status}
    if status == ServiceStatus.COMPLETED:
        update_data["completion_date"] = datetime.now(timezone.utc)
    
    await db.services.update_one({"id": service_id}, {"$set": update_data})
    
    # Create activity notification for completed services
    if status == ServiceStatus.COMPLETED:
        try:
            service = await db.services.find_one({"id": service_id}, {"_id": 0})
            if service:
                vehicle_info = service.get('vehicle_number', 'N/A')
                service_type = service.get('service_type', 'Service')
                
                await create_activity(ActivityCreate(
                    type=ActivityType.SERVICE_COMPLETED,
                    title="Service completed",
                    description=f"{service_type} for {vehicle_info}",
                    icon="success",
                    metadata={"service_id": service_id}
                ))
        except Exception as e:
            logger.warning(f"Failed to create activity for service completion: {e}")
    
    return {"message": "Service status updated successfully"}

@api_router.get("/services/job-card/{job_card_number}")
async def get_service_by_job_card(job_card_number: str, current_user: User = Depends(get_current_user)):
    """Get service details by job card number for billing"""
    service = await db.services.find_one({"job_card_number": job_card_number.upper()})
    if not service:
        raise HTTPException(status_code=404, detail="Service not found with this job card number")
    
    # Get customer details
    customer = await db.customers.find_one({"id": service["customer_id"]})
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found for this service")
    
    # Prepare service details for billing
    service_details = {
        "service_id": service["id"],
        "job_card_number": service["job_card_number"],
        "customer_id": service["customer_id"],
        "customer_name": customer["name"],
        "customer_phone": customer["mobile"],
        "customer_address": customer["address"],
        "vehicle_number": service["vehicle_number"],
        "service_type": service["service_type"],
        "description": service["description"],
        "service_date": service["service_date"],
        "amount": service["amount"],
        "status": service["status"],
        "created_at": service["created_at"]
    }
    
    return service_details

@api_router.delete("/services/{service_id}")
async def delete_service(service_id: str, current_user: User = Depends(get_current_user)):
    # Check if service exists
    existing_service = await db.services.find_one({"id": service_id})
    if not existing_service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    # Delete the service
    result = await db.services.delete_one({"id": service_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Service not found")
    
    return {"message": "Service deleted successfully", "deleted_service_id": service_id}

# Spare Parts endpoints
@api_router.post("/spare-parts", response_model=SparePart)
async def create_spare_part(spare_part_data: SparePartCreate, current_user: User = Depends(get_current_user)):
    spare_part = SparePart(**spare_part_data.dict())
    await db.spare_parts.insert_one(spare_part.dict())
    return spare_part

@api_router.get("/spare-parts", response_model=List[SparePart])
async def get_spare_parts(low_stock: bool = False, current_user: User = Depends(get_current_user)):
    filter_dict = {}
    if low_stock:
        filter_dict = {"$expr": {"$lte": ["$quantity", "$low_stock_threshold"]}}
    
    spare_parts = await db.spare_parts.find(filter_dict).to_list(1000)
    # Handle legacy spare parts that don't have GST fields
    processed_parts = []
    for part in spare_parts:
        # Add default values for missing GST fields
        if 'hsn_sac' not in part:
            part['hsn_sac'] = None
        if 'gst_percentage' not in part:
            part['gst_percentage'] = 18.0
        if 'unit' not in part:
            part['unit'] = 'Nos'
        if 'compatible_models' not in part:
            part['compatible_models'] = None
        processed_parts.append(SparePart(**part))
    return processed_parts

@api_router.post("/spare-parts/bills", response_model=SparePartBill)
async def create_spare_part_bill(bill_data: SparePartBillCreate, current_user: User = Depends(get_current_user)):
    # Generate bill number
    count = await db.spare_part_bills.count_documents({})
    bill_number = f"SPB-{count + 1:06d}"
    
    bill_dict = bill_data.dict()
    bill_dict['bill_number'] = bill_number
    bill_dict['created_by'] = current_user.id
    
    # Handle customer data - prioritize customer_data over customer_id
    if bill_dict.get('customer_data'):
        # Use the new customer data format
        bill_dict['customer_id'] = None  # Clear legacy field
    elif bill_dict.get('customer_id'):
        # For backwards compatibility, keep customer_id if no customer_data
        pass
    else:
        raise HTTPException(status_code=400, detail="Customer information is required")
    
    # Ensure all GST fields are present with defaults if not provided
    if 'subtotal' not in bill_dict:
        bill_dict['subtotal'] = 0
    if 'total_discount' not in bill_dict:
        bill_dict['total_discount'] = 0
    if 'total_cgst' not in bill_dict:
        bill_dict['total_cgst'] = 0
    if 'total_sgst' not in bill_dict:
        bill_dict['total_sgst'] = 0
    if 'total_tax' not in bill_dict:
        bill_dict['total_tax'] = 0
    if 'total_amount' not in bill_dict:
        bill_dict['total_amount'] = bill_dict['subtotal'] + bill_dict['total_tax'] - bill_dict['total_discount']
    
    bill = SparePartBill(**bill_dict)
    
    await db.spare_part_bills.insert_one(bill.dict())
    return bill

@api_router.get("/spare-parts/bills", response_model=List[SparePartBill])
async def get_spare_part_bills(current_user: User = Depends(get_current_user)):
    bills = await db.spare_part_bills.find().to_list(1000)
    # Handle legacy bills that don't have GST fields or customer data
    processed_bills = []
    for bill in bills:
        # Add default values for missing GST fields
        if 'subtotal' not in bill:
            bill['subtotal'] = bill.get('total_amount', 0)
        if 'total_discount' not in bill:
            bill['total_discount'] = 0
        if 'total_cgst' not in bill:
            bill['total_cgst'] = 0
        if 'total_sgst' not in bill:
            bill['total_sgst'] = 0
        if 'total_tax' not in bill:
            bill['total_tax'] = 0
        # Handle customer data backwards compatibility
        if 'customer_data' not in bill:
            bill['customer_data'] = None
        if 'customer_id' not in bill:
            bill['customer_id'] = None
        processed_bills.append(SparePartBill(**bill))
    return processed_bills

@api_router.delete("/spare-parts/bills/{bill_id}")
async def delete_spare_part_bill(bill_id: str, current_user: User = Depends(get_current_user)):
    # Check if spare part bill exists
    existing_bill = await db.spare_part_bills.find_one({"id": bill_id})
    if not existing_bill:
        raise HTTPException(status_code=404, detail="Spare part bill not found")
    
    # Delete the spare part bill
    result = await db.spare_part_bills.delete_one({"id": bill_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Spare part bill not found")
    
    return {"message": "Spare part bill deleted successfully", "deleted_bill_id": bill_id}

# Service Bills API Endpoints
@api_router.post("/service-bills", response_model=ServiceBill)
async def create_service_bill(bill_data: ServiceBillCreate, current_user: User = Depends(get_current_user)):
    # Generate bill number if not provided
    if not bill_data.bill_number:
        count = await db.service_bills.count_documents({})
        bill_data.bill_number = f"SB-{count + 1:06d}"
    
    # Get customer info if customer_id is provided
    customer_name = bill_data.customer_name
    customer_mobile = bill_data.customer_mobile
    
    if bill_data.customer_id and not customer_name:
        customer = await db.customers.find_one({"id": bill_data.customer_id})
        if customer:
            customer_name = customer.get("name", "")
            customer_mobile = customer.get("mobile", customer.get("phone", ""))
    
    # Parse bill date
    bill_date = datetime.now(timezone.utc)
    if bill_data.bill_date:
        try:
            bill_date = datetime.fromisoformat(bill_data.bill_date.replace('Z', '+00:00'))
        except:
            pass
    
    # Reduce spare part quantities for items that have spare_part_id
    spare_part_updates = []
    if bill_data.items:
        for item in bill_data.items:
            if isinstance(item, dict) and item.get("spare_part_id"):
                spare_part_id = item["spare_part_id"]
                qty_used = item.get("qty", 1)
                
                # Check if spare part exists and has enough quantity
                spare_part = await db.spare_parts.find_one({"id": spare_part_id})
                if spare_part:
                    current_qty = spare_part.get("quantity", 0)
                    new_qty = max(0, current_qty - qty_used)  # Don't go below 0
                    
                    # Update spare part quantity
                    await db.spare_parts.update_one(
                        {"id": spare_part_id},
                        {"$set": {"quantity": new_qty}}
                    )
                    spare_part_updates.append({
                        "part_id": spare_part_id,
                        "part_name": spare_part.get("name", "Unknown"),
                        "qty_used": qty_used,
                        "old_qty": current_qty,
                        "new_qty": new_qty
                    })
    
    bill = ServiceBill(
        bill_number=bill_data.bill_number,
        job_card_number=bill_data.job_card_number,
        customer_id=bill_data.customer_id,
        customer_name=customer_name,
        customer_mobile=customer_mobile,
        vehicle_number=bill_data.vehicle_number,
        vehicle_brand=bill_data.vehicle_brand,
        vehicle_model=bill_data.vehicle_model,
        items=bill_data.items,
        subtotal=bill_data.subtotal,
        total_discount=bill_data.total_discount,
        total_cgst=bill_data.total_cgst,
        total_sgst=bill_data.total_sgst,
        total_tax=bill_data.total_tax,
        total_amount=bill_data.total_amount,
        bill_date=bill_date,
        status=bill_data.status,
        created_by=current_user.username
    )
    
    await db.service_bills.insert_one(bill.dict())
    
    # Log spare part inventory updates
    if spare_part_updates:
        print(f"Spare part inventory updated for bill {bill.bill_number}: {spare_part_updates}")
    
    return bill

@api_router.get("/service-bills")
async def get_service_bills(current_user: User = Depends(get_current_user)):
    bills = await db.service_bills.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return bills

@api_router.get("/service-bills/{bill_id}")
async def get_service_bill(bill_id: str, current_user: User = Depends(get_current_user)):
    bill = await db.service_bills.find_one({"id": bill_id}, {"_id": 0})
    if not bill:
        raise HTTPException(status_code=404, detail="Service bill not found")
    return bill

@api_router.put("/service-bills/{bill_id}/status")
async def update_service_bill_status(bill_id: str, status_update: dict, current_user: User = Depends(get_current_user)):
    existing_bill = await db.service_bills.find_one({"id": bill_id})
    if not existing_bill:
        raise HTTPException(status_code=404, detail="Service bill not found")
    
    new_status = status_update.get("status", "unpaid")
    if new_status not in ["paid", "unpaid"]:
        raise HTTPException(status_code=400, detail="Invalid status. Must be 'paid' or 'unpaid'")
    
    await db.service_bills.update_one(
        {"id": bill_id},
        {"$set": {"status": new_status}}
    )
    
    return {"message": f"Bill status updated to {new_status}", "bill_id": bill_id, "status": new_status}

@api_router.delete("/service-bills/{bill_id}")
async def delete_service_bill(bill_id: str, current_user: User = Depends(get_current_user)):
    existing_bill = await db.service_bills.find_one({"id": bill_id})
    if not existing_bill:
        raise HTTPException(status_code=404, detail="Service bill not found")
    
    result = await db.service_bills.delete_one({"id": bill_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Service bill not found")
    
    return {"message": "Service bill deleted successfully", "deleted_bill_id": bill_id}

@api_router.get("/spare-parts/{part_id}", response_model=SparePart)
async def get_spare_part(part_id: str, current_user: User = Depends(get_current_user)):
    part = await db.spare_parts.find_one({"id": part_id})
    if not part:
        raise HTTPException(status_code=404, detail="Spare part not found")
    
    # Handle legacy spare parts that don't have GST fields
    if 'hsn_sac' not in part:
        part['hsn_sac'] = None
    if 'gst_percentage' not in part:
        part['gst_percentage'] = 18.0
    if 'unit' not in part:
        part['unit'] = 'Nos'
    if 'compatible_models' not in part:
        part['compatible_models'] = None
    
    return SparePart(**part)

@api_router.put("/spare-parts/{part_id}", response_model=SparePart)
async def update_spare_part(part_id: str, spare_part_data: SparePartCreate, current_user: User = Depends(get_current_user)):
    # Check if spare part exists
    existing_part = await db.spare_parts.find_one({"id": part_id})
    if not existing_part:
        raise HTTPException(status_code=404, detail="Spare part not found")
    
    # Update spare part data
    update_data = spare_part_data.dict()
    update_data["id"] = part_id  # Keep the original ID
    update_data["created_at"] = existing_part["created_at"]  # Keep original creation date
    
    updated_part = SparePart(**update_data)
    await db.spare_parts.replace_one({"id": part_id}, updated_part.dict())
    return updated_part

@api_router.delete("/spare-parts/{part_id}")
async def delete_spare_part(part_id: str, current_user: User = Depends(get_current_user)):
    # Check if spare part exists
    existing_part = await db.spare_parts.find_one({"id": part_id})
    if not existing_part:
        raise HTTPException(status_code=404, detail="Spare part not found")
    
    # Check if spare part is referenced in any bills
    bills_count = await db.spare_part_bills.count_documents({"items.part_id": part_id})
    if bills_count > 0:
        raise HTTPException(status_code=400, detail=f"Cannot delete spare part. Part is referenced in {bills_count} bill(s). Please remove from bills first.")
    
    # Delete the spare part
    result = await db.spare_parts.delete_one({"id": part_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Spare part not found")
    
    return {"message": "Spare part deleted successfully", "deleted_part_id": part_id}

# Dashboard stats
@api_router.get("/dashboard/stats")
async def get_dashboard_stats(current_user: User = Depends(get_current_user)):
    total_customers = await db.customers.count_documents({})
    total_vehicles = await db.vehicles.count_documents({})
    vehicles_in_stock = await db.vehicles.count_documents({"status": VehicleStatus.IN_STOCK})
    vehicles_sold = await db.vehicles.count_documents({"status": VehicleStatus.SOLD})
    pending_services = await db.services.count_documents({"status": ServiceStatus.PENDING})
    low_stock_parts = await db.spare_parts.count_documents({"$expr": {"$lte": ["$quantity", "$low_stock_threshold"]}})
    
    # Calculate completed services today
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = datetime.now(timezone.utc).replace(hour=23, minute=59, second=59, microsecond=999999)
    completed_today = await db.services.count_documents({
        "status": ServiceStatus.COMPLETED,
        "updated_at": {"$gte": today_start, "$lte": today_end}
    })
    
    # Sales statistics including imported data
    total_sales = await db.sales.count_documents({})
    direct_sales = await db.sales.count_documents({"$or": [{"source": {"$exists": False}}, {"source": "direct"}]})
    imported_sales = await db.sales.count_documents({"source": "import"})
    
    # Calculate total sales revenue (including imported sales)
    sales_pipeline = [
        {"$group": {
            "_id": None,
            "total_revenue": {"$sum": "$amount"},
            "direct_revenue": {"$sum": {"$cond": [
                {"$or": [{"$not": ["$source"]}, {"$eq": ["$source", "direct"]}]},
                "$amount", 
                0
            ]}},
            "imported_revenue": {"$sum": {"$cond": [
                {"$eq": ["$source", "import"]},
                "$amount", 
                0
            ]}}
        }}
    ]
    
    revenue_stats = await db.sales.aggregate(sales_pipeline).to_list(1)
    total_revenue = revenue_stats[0]["total_revenue"] if revenue_stats else 0
    direct_revenue = revenue_stats[0]["direct_revenue"] if revenue_stats else 0
    imported_revenue = revenue_stats[0]["imported_revenue"] if revenue_stats else 0
    
    return {
        "total_customers": total_customers,
        "total_vehicles": total_vehicles,
        "vehicles_in_stock": vehicles_in_stock,
        "vehicles_sold": vehicles_sold,
        "pending_services": pending_services,
        "completed_today": completed_today,
        "low_stock_parts": low_stock_parts,
        "sales_stats": {
            "total_sales": total_sales,
            "direct_sales": direct_sales,
            "imported_sales": imported_sales,
            "total_revenue": total_revenue,
            "direct_revenue": direct_revenue,
            "imported_revenue": imported_revenue
        }
    }

# Import/Export endpoints
@api_router.post("/import/upload", response_model=ImportResult)
async def upload_import_file(
    data_type: str,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """Upload and process import file"""
    
    # Validate data type
    valid_types = ["customers", "vehicles", "spare_parts", "services"]
    if data_type not in valid_types:
        raise HTTPException(status_code=400, detail=f"Invalid data type. Must be one of: {valid_types}")
    
    # Validate file format
    if not file.filename or not (file.filename.endswith('.csv') or file.filename.endswith('.xlsx')):
        raise HTTPException(status_code=400, detail="Only CSV and Excel files are supported")
    
    # Create import job
    import_job = ImportJob(
        file_name=file.filename,
        data_type=data_type,
        status="processing",
        created_by=current_user.id
    )
    
    try:
        # Read file content
        file_content = await file.read()
        
        # Parse file based on type
        if file.filename.endswith('.csv'):
            data = await parse_csv_file(file_content)
        else:
            data = await parse_excel_file(file_content)
        
        import_job.total_records = len(data)
        
        # Process import based on data type
        if data_type == "customers":
            result = await import_customers_data(data, import_job, current_user.id)
        elif data_type == "vehicles":
            result = await import_vehicles_data(data, import_job, current_user.id)
        elif data_type == "spare_parts":
            result = await import_spare_parts_data(data, import_job, current_user.id)
        elif data_type == "services":
            result = await import_services_data(data, import_job, current_user.id)
        
        import_job.status = "completed"
        import_job.end_time = datetime.now(timezone.utc)
        
    except Exception as e:
        import_job.status = "failed"
        import_job.end_time = datetime.now(timezone.utc)
        import_job.errors.append({"error": str(e), "row": 0})
        result = ImportResult(
            job_id=import_job.id,
            status="failed",
            message=str(e)
        )
    
    # Save import job to database
    await db.import_jobs.insert_one(import_job.dict())
    
    return result

@api_router.get("/import/jobs", response_model=List[ImportJob])
async def get_import_jobs(
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(get_current_user)
):
    """Get import job history"""
    jobs = await db.import_jobs.find().skip(skip).limit(limit).sort("created_at", -1).to_list(length=None)
    return [ImportJob(**job) for job in jobs]

@api_router.get("/import/template/{data_type}")
async def download_import_template(
    data_type: str,
    current_user: User = Depends(get_current_user)
):
    """Download CSV template for import"""
    from fastapi.responses import Response
    
    templates = {
        "customers": "name,care_of,mobile,email,address,brand,model,color,vehicle_number,chassis_number,engine_number,nominee_name,relation,age,sale_amount,payment_method,hypothecation,sale_date,invoice_number\nJohn Doe,S/O Ramesh,9876543210,john@example.com,\"123 Main St, Bangalore\",TVS,Apache RTR 160,Red,KA01AB1234,ABC123456789012345,ENG987654321,Jane Doe,spouse,28,75000,cash,cash,2024-01-15,INV001\nJane Smith,D/O Kumar,9876543211,jane@example.com,\"456 Oak Ave, Mysore\",BAJAJ,Pulsar 150,Blue,KA02CD5678,DEF123456789012345,ENG987654322,John Smith,father,55,65000,finance,\"Bank Finance\",2024-01-16,INV002",
        "vehicles": "date_received,brand,model,chassis_number,engine_number,color,vehicle_number,key_number,inbound_location,page_number,status,customer_mobile,customer_name,sale_amount,payment_method\n2025-01-15,TVS,Apache RTR 160,ABC123456789,ENG987654321,Red,KA01AB1234,KEY001,Warehouse A,Page 1,in_stock,9876543210,John Doe,75000,cash\n2025-01-16,BAJAJ,Pulsar 150,DEF123456789,ENG987654322,Blue,KA02CD5678,KEY002,Warehouse B,Page 2,in_stock,9876543211,Jane Smith,65000,finance",
        "spare_parts": "name,part_number,brand,quantity,unit,unit_price,hsn_sac,gst_percentage,supplier,compatible_models\nBrake Pad,BP001,TVS,50,Nos,250.00,87084090,18.0,ABC Supplies,\"Apache RTR 160, Pulsar 150\"\nEngine Oil,EO001,CASTROL,25,Ltr,450.00,27101981,28.0,XYZ Motors,\"All Models\"",
        "services": "registration_date,customer_name,customer_mobile,vehicle_number,chassis_number,vehicle_brand,vehicle_model,vehicle_year,service_type,description,amount\n2025-01-15,John Doe,9876543210,KA01AB1234,ABC123456789,TVS,Apache RTR 160,2024,periodic_service,General servicing,1500.00\n2025-01-16,Jane Smith,9876543211,KA02CD5678,DEF123456789,BAJAJ,Pulsar 150,2023,repair,Brake repair,800.00"
    }
    
    if data_type not in templates:
        raise HTTPException(status_code=404, detail="Template not found")
    
    return Response(
        content=templates[data_type],
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={data_type}_template.csv"}
    )

# Helper functions for file parsing and data import
async def parse_csv_file(file_content: bytes) -> List[Dict]:
    """Parse CSV file content with multiple encoding support"""
    # List of encodings to try in order of preference
    encodings = ['utf-8', 'iso-8859-1', 'windows-1252', 'cp1252']
    
    content = None
    successful_encoding = None
    
    for encoding in encodings:
        try:
            content = file_content.decode(encoding)
            successful_encoding = encoding
            break
        except UnicodeDecodeError:
            continue
    
    # If all encodings fail, use UTF-8 with error handling
    if content is None:
        content = file_content.decode('utf-8', errors='replace')
        successful_encoding = 'utf-8 (with error replacement)'
    
    # Log which encoding was used for debugging
    logging.info(f"CSV file parsed successfully using encoding: {successful_encoding}")
    
    csv_reader = csv.DictReader(io.StringIO(content))
    return list(csv_reader)

# Cross-reference utility functions for unified data import
async def find_customer_by_mobile(mobile: str) -> Optional[Dict]:
    """Find existing customer by mobile number"""
    if not mobile or mobile == "0000000000":
        return None
    return await db.customers.find_one({"mobile": mobile})

async def find_vehicle_by_identifiers(vehicle_number: Optional[str] = None, chassis_number: Optional[str] = None) -> Optional[Dict]:
    """Find existing vehicle by vehicle_number or chassis_number"""
    if not vehicle_number and not chassis_number:
        return None
    
    query = []
    if vehicle_number:
        query.append({"vehicle_number": vehicle_number})
    if chassis_number:
        query.append({"chassis_number": chassis_number})
    
    if query:
        return await db.vehicles.find_one({"$or": query})
    return None

async def find_or_create_customer(mobile: str, data: Dict, import_stats: Dict) -> str:
    """Find existing customer by mobile or create new one"""
    # Try to find existing customer
    existing_customer = await find_customer_by_mobile(mobile)
    if existing_customer:
        import_stats['customers_linked'] = import_stats.get('customers_linked', 0) + 1
        return existing_customer['id']
    
    # Create new customer with available data
    customer_data = CustomerCreate(
        name=data.get('name', 'Unknown Customer'),
        mobile=mobile,
        email=data.get('email') or None,
        address=data.get('address', 'Address not provided'),
        care_of=data.get('care_of') or None
    )
    
    customer = Customer(**customer_data.dict())
    await db.customers.insert_one(customer.dict())
    import_stats['customers_created'] = import_stats.get('customers_created', 0) + 1
    return customer.id

async def find_or_create_vehicle(vehicle_number: Optional[str], chassis_number: Optional[str], data: Dict, import_stats: Dict) -> Optional[str]:
    """Find existing vehicle or create new one"""
    # Try to find existing vehicle
    existing_vehicle = await find_vehicle_by_identifiers(vehicle_number, chassis_number)
    if existing_vehicle:
        import_stats['vehicles_linked'] = import_stats.get('vehicles_linked', 0) + 1
        return existing_vehicle['id']
    
    # Create new vehicle if we have enough data
    if not chassis_number and not vehicle_number:
        return None
    
    vehicle_data = VehicleCreate(
        brand=data.get('brand', 'UNKNOWN'),
        model=data.get('model', 'Unknown Model'),
        chassis_number=chassis_number or f'AUTO-{str(uuid.uuid4())[:8]}',
        engine_number=data.get('engine_number', 'Unknown Engine'),
        color=data.get('color', 'Unknown Color'),
        vehicle_number=vehicle_number,
        key_number=data.get('key_number')
    )
    
    vehicle = Vehicle(**vehicle_data.dict())
    await db.vehicles.insert_one(vehicle.dict())
    import_stats['vehicles_created'] = import_stats.get('vehicles_created', 0) + 1
    return vehicle.id

async def check_customer_duplicate(mobile: str) -> bool:
    """Check if customer with mobile number already exists"""
    existing = await find_customer_by_mobile(mobile)
    return existing is not None

async def check_vehicle_duplicate(chassis_number: str) -> bool:
    """Check if vehicle with chassis number already exists"""
    existing = await db.vehicles.find_one({"chassis_number": chassis_number})
    return existing is not None

async def parse_excel_file(file_content: bytes) -> List[Dict]:
    """Parse Excel file content"""
    df = pd.read_excel(io.BytesIO(file_content))
    return df.to_dict('records')

async def import_customers_data(data: List[Dict], import_job: ImportJob, user_id: str) -> ImportResult:
    """Import customers data with vehicle and insurance information and cross-referencing"""
    successful = 0
    failed = 0
    skipped = 0
    errors = []
    incomplete_records = []
    import_stats = {
        'vehicles_linked': 0,
        'sales_created': 0
    }
    
    for idx, row in enumerate(data):
        try:
            # Get phone number from either 'mobile' or 'phone' field
            phone_number = row.get('mobile', '').strip() or row.get('phone', '').strip()
            
            # Get name and phone with fallbacks (no longer required)
            name = row.get('name', '').strip()
            if not name:
                name = "Customer"
            if not phone_number:
                phone_number = "0000000000"  # Default phone number
            
            # Get address with fallback to empty string if not provided
            address = row.get('address', '').strip()
            if not address:
                address = "Address not provided"
            
            # Check for duplicate customer before processing
            if phone_number and phone_number != "0000000000":
                existing_customer = await db.customers.find_one({"mobile": phone_number})
                if existing_customer:
                    # Skip duplicate customer (don't count as error)
                    skipped += 1
                    continue
            
            # Create basic customer record
            customer_data = CustomerCreate(
                name=name,
                mobile=phone_number,
                email=row.get('email', '').strip() or None,
                address=address,
                care_of=row.get('care_of', '').strip() or None
            )
            
            customer = Customer(**customer_data.dict())
            
            # Add vehicle and insurance information as extended data
            vehicle_info = {}
            insurance_info = {}
            sales_info = {}
            
            # Map vehicle fields from CSV template (support both old and new field names)
            if (row.get('brand') or row.get('model') or 
                row.get('vehicle_no') or row.get('vehicle_number') or 
                row.get('chassis_no') or row.get('chassis_number')):
                vehicle_info = {
                    'brand': row.get('brand', '').strip(),
                    'model': row.get('model', '').strip(), 
                    'color': row.get('color', '').strip(),
                    'vehicle_number': (row.get('vehicle_number', '').strip() or 
                                     row.get('vehicle_no', '').strip()),
                    'chassis_number': (row.get('chassis_number', '').strip() or 
                                     row.get('chassis_no', '').strip()),
                    'engine_number': (row.get('engine_number', '').strip() or 
                                    row.get('engine_no', '').strip())
                }
            
            # Map insurance nominee fields (using actual CSV column names)
            if row.get('nominee_name') or row.get('relation') or row.get('age'):
                insurance_info = {
                    'nominee_name': row.get('nominee_name', '').strip(),
                    'relation': row.get('relation', '').strip(),
                    'age': row.get('age', '').strip()
                }
            
            # Map sales information if available
            if row.get('sale_amount') or row.get('payment_method'):
                sales_info = {
                    'amount': row.get('sale_amount', '').strip(),
                    'payment_method': row.get('payment_method', '').strip(),
                    'hypothecation': row.get('hypothecation', '').strip(),
                    'sale_date': row.get('sale_date', '').strip(),
                    'invoice_number': row.get('invoice_number', '').strip()
                }
            
            # Create basic customer record
            customer_data = CustomerCreate(
                name=name,
                mobile=phone_number,
                email=row.get('email', '').strip() or None,
                address=address,
                care_of=row.get('care_of', '').strip() or None
            )
            
            customer = Customer(**customer_data.dict())
            
            # Add extended information to customer record
            customer_dict = customer.dict()
            if vehicle_info and any(vehicle_info.values()):
                customer_dict['vehicle_info'] = vehicle_info
            if insurance_info and any(insurance_info.values()):
                customer_dict['insurance_info'] = insurance_info
            if sales_info and any(sales_info.values()):
                customer_dict['sales_info'] = sales_info
            
            await db.customers.insert_one(customer_dict)
            
            # CROSS-REFERENCE: Try to link to existing vehicle
            if vehicle_info.get('chassis_number') or vehicle_info.get('vehicle_number'):
                existing_vehicle = await find_vehicle_by_identifiers(
                    vehicle_info.get('vehicle_number'),
                    vehicle_info.get('chassis_number')
                )
                if existing_vehicle:
                    # Link vehicle to customer
                    await db.vehicles.update_one(
                        {"id": existing_vehicle['id']},
                        {"$set": {"customer_id": customer.id}}
                    )
                    import_stats['vehicles_linked'] += 1
            
            # Create a sales record if sales information is provided
            if sales_info and any(sales_info.values()) and sales_info.get('amount'):
                try:
                    # Parse sale date
                    sale_date = None
                    if sales_info.get('sale_date'):
                        try:
                            # Try to parse various date formats
                            date_str = str(sales_info['sale_date']).strip()
                            from datetime import datetime
                            import re
                            
                            # Handle Excel numeric date format (days since 1900-01-01)
                            if date_str.replace('.', '').isdigit():
                                try:
                                    # Excel date: number of days since 1900-01-01
                                    excel_date = float(date_str)
                                    # Excel incorrectly treats 1900 as a leap year, adjust for dates after Feb 28, 1900
                                    if excel_date > 60:
                                        excel_date -= 1
                                    sale_date = datetime(1900, 1, 1) + timedelta(days=excel_date - 2)
                                except:
                                    pass
                            
                            # Try various string date formats
                            if not sale_date:
                                # Format: DD-MMM (03-Mar) - add current year
                                if re.match(r'\d{1,2}-[A-Za-z]{3}', date_str):
                                    date_str = f"{date_str}-{datetime.now().year}"
                                    sale_date = datetime.strptime(date_str, "%d-%b-%Y")
                                # Format: DD/MM/YYYY (15/01/2024)
                                elif re.match(r'\d{1,2}/\d{1,2}/\d{4}', date_str):
                                    sale_date = datetime.strptime(date_str, "%d/%m/%Y")
                                # Format: DD-MM-YYYY (15-01-2024)
                                elif re.match(r'\d{1,2}-\d{1,2}-\d{4}', date_str):
                                    sale_date = datetime.strptime(date_str, "%d-%m-%Y")
                                # Format: YYYY-MM-DD (2024-01-15)
                                elif re.match(r'\d{4}-\d{1,2}-\d{1,2}', date_str):
                                    sale_date = datetime.strptime(date_str, "%Y-%m-%d")
                                # Format: YYYY/MM/DD (2024/01/15)
                                elif re.match(r'\d{4}/\d{1,2}/\d{1,2}', date_str):
                                    sale_date = datetime.strptime(date_str, "%Y/%m/%d")
                                # Format: DD MMM YYYY (15 Jan 2024)
                                elif re.match(r'\d{1,2}\s+[A-Za-z]{3}\s+\d{4}', date_str):
                                    sale_date = datetime.strptime(date_str, "%d %b %Y")
                                # Format: MMM DD, YYYY (Jan 15, 2024)
                                elif re.match(r'[A-Za-z]{3}\s+\d{1,2},?\s+\d{4}', date_str):
                                    sale_date = datetime.strptime(date_str.replace(',', ''), "%b %d %Y")
                                else:
                                    # Try generic parser as last resort
                                    from dateutil import parser
                                    sale_date = parser.parse(date_str)
                            
                            if not sale_date:
                                sale_date = datetime.now()  # Default to current date
                        except Exception as date_error:
                            print(f"Date parsing error for '{sales_info.get('sale_date')}': {date_error}")
                            sale_date = datetime.now()  # Default if parsing fails
                    else:
                        sale_date = datetime.now()
                    
                    # Create sales record from imported data
                    sale_record = Sale(
                        customer_id=customer.id,
                        vehicle_id=None,  # Will be set if vehicle exists
                        amount=float(sales_info['amount']) if sales_info.get('amount') else 0.0,
                        payment_method=sales_info.get('payment_method', 'CASH').upper(),
                        hypothecation=sales_info.get('hypothecation', ''),
                        sale_date=sale_date,
                        invoice_number=sales_info.get('invoice_number', f"IMP-{customer.id[:8]}"),
                        vehicle_brand=vehicle_info.get('brand', ''),
                        vehicle_model=vehicle_info.get('model', ''),
                        vehicle_color=vehicle_info.get('color', ''),
                        vehicle_chassis=vehicle_info.get('chassis_number', ''),
                        vehicle_engine=vehicle_info.get('engine_number', ''),
                        vehicle_registration=vehicle_info.get('vehicle_number', ''),
                        insurance_nominee=insurance_info.get('nominee_name', ''),
                        insurance_relation=insurance_info.get('relation', ''),
                        insurance_age=insurance_info.get('age', ''),
                        source="import",  # Mark as imported data
                        created_by="import_system"  # Add required created_by field
                    )
                    
                    # Try to find matching vehicle in inventory
                    if vehicle_info.get('chassis_number'):
                        existing_vehicle = await db.vehicles.find_one({
                            "chassis_number": vehicle_info['chassis_number']
                        })
                        if existing_vehicle:
                            sale_record.vehicle_id = existing_vehicle['id']
                            # Update vehicle status to sold
                            await db.vehicles.update_one(
                                {"id": existing_vehicle['id']},
                                {"$set": {"status": "sold", "customer_id": customer.id}}
                            )
                    
                    await db.sales.insert_one(sale_record.dict())
                    import_stats['sales_created'] += 1
                    
                except Exception as sale_error:
                    # Log the error but don't fail the customer import
                    print(f"Warning: Could not create sale record for customer {customer.id}: {sale_error}")
            
            # Track incomplete records
            missing_fields = []
            if not vehicle_info or not any(vehicle_info.values()):
                missing_fields.append('vehicle_info')
            if not insurance_info or not any(insurance_info.values()):
                missing_fields.append('insurance_info')
            if not sales_info or not any(sales_info.values()):
                missing_fields.append('sales_info')
            
            if missing_fields:
                incomplete_records.append({
                    "record_id": customer.id,
                    "row": idx + 2,
                    "missing_fields": missing_fields,
                    "data": row
                })
            
            successful += 1
            
        except Exception as e:
            failed += 1
            errors.append({
                "row": idx + 2,  # +2 because CSV has header and is 1-indexed
                "data": row,
                "error": str(e)
            })
    
    import_job.successful_records = successful
    import_job.failed_records = failed
    import_job.skipped_records = skipped
    import_job.processed_records = successful + failed + skipped
    import_job.errors = errors
    import_job.cross_reference_stats = import_stats
    import_job.incomplete_records = incomplete_records
    
    return ImportResult(
        job_id=import_job.id,
        status="completed",
        message=f"Import completed: {successful} successful, {failed} failed, {skipped} skipped (duplicates). Cross-referenced: {import_stats['vehicles_linked']} vehicles linked, {import_stats['sales_created']} sales created.",
        total_records=len(data),
        successful_records=successful,
        failed_records=failed,
        skipped_records=skipped,
        errors=errors,
        cross_reference_stats=import_stats,
        incomplete_records=incomplete_records
    )

async def import_vehicles_data(data: List[Dict], import_job: ImportJob, user_id: str) -> ImportResult:
    """Import vehicles data with cross-referencing support"""
    successful = 0
    failed = 0
    skipped = 0
    errors = []
    incomplete_records = []
    import_stats = {
        'customers_linked': 0,
        'customers_created': 0,
        'sales_created': 0
    }
    
    valid_brands = ["TVS", "BAJAJ", "HERO", "HONDA", "TRIUMPH", "KTM", "SUZUKI", "APRILIA", "YAMAHA", "PIAGGIO"]
    
    for idx, row in enumerate(data):
        try:
            # Get fields with fallback values
            brand = row.get('brand', '').upper().strip() or 'UNKNOWN'
            if brand != 'UNKNOWN' and brand not in valid_brands:
                brand = 'UNKNOWN'
            
            # Support both old and new field names for backward compatibility
            chassis_number = (row.get('chassis_number', '').strip() or 
                            row.get('chassis_no', '').strip())
            engine_number = (row.get('engine_number', '').strip() or 
                           row.get('engine_no', '').strip())
            key_number = (row.get('key_number', '').strip() or 
                        row.get('key_no', '').strip())
            vehicle_number = row.get('vehicle_number', '').strip()
            
            # Handle status field with validation
            status = row.get('status', '').strip().lower()
            valid_statuses = ['available', 'in_stock', 'sold', 'returned']
            if status not in valid_statuses:
                status = 'available'
            
            # Check for duplicate chassis number before inserting
            if chassis_number and chassis_number != 'Unknown Chassis':
                existing_vehicle = await db.vehicles.find_one({"chassis_number": chassis_number})
                if existing_vehicle:
                    # Skip duplicate vehicle (don't count as error)
                    skipped += 1
                    continue
            
            vehicle_data = VehicleCreate(
                brand=brand,
                model=row.get('model', '').strip() or 'Unknown Model',
                chassis_number=chassis_number or 'Unknown Chassis',
                engine_number=engine_number or 'Unknown Engine',
                color=row.get('color', '').strip() or 'Unknown Color',
                vehicle_number=vehicle_number or None,
                key_number=key_number or 'Unknown Key',
                inbound_location=row.get('inbound_location', '').strip() or 'Unknown Location',
                page_number=row.get('page_number', '').strip() or None
            )
            
            # Create vehicle with proper status
            vehicle_dict = vehicle_data.dict()
            vehicle_dict['status'] = status
            
            # Handle date_received field
            date_received_str = row.get('date_received', '').strip()
            if date_received_str:
                try:
                    # Try to parse the date in various formats
                    date_received = parse_date_flexible(date_received_str)
                    vehicle_dict['date_received'] = date_received
                except Exception as e:
                    # If date parsing fails, use current date
                    vehicle_dict['date_received'] = datetime.now(timezone.utc)
            else:
                vehicle_dict['date_received'] = datetime.now(timezone.utc)
            
            vehicle = Vehicle(**vehicle_dict)
            
            # CROSS-REFERENCE: Check if customer mobile is provided
            customer_mobile = (row.get('customer_mobile') or '').strip()
            customer_name = (row.get('customer_name') or '').strip()
            customer_id = None
            
            if customer_mobile:
                # Find or create customer
                customer_id = await find_or_create_customer(
                    customer_mobile, 
                    {'name': customer_name or 'Unknown Customer'}, 
                    import_stats
                )
                vehicle.customer_id = customer_id
            
            await db.vehicles.insert_one(vehicle.dict())
            
            # CROSS-REFERENCE: Create sales record if sale data is provided
            sale_amount = (row.get('sale_amount') or '').strip()
            payment_method = (row.get('payment_method') or '').strip()
            
            if sale_amount and customer_id:
                try:
                    sale_record = Sale(
                        customer_id=customer_id,
                        vehicle_id=vehicle.id,
                        amount=float(sale_amount),
                        payment_method=payment_method.upper() or 'CASH',
                        sale_date=datetime.now(timezone.utc),
                        invoice_number=f"IMP-VEH-{vehicle.id[:8]}",
                        vehicle_brand=brand,
                        vehicle_model=vehicle_data.model,
                        vehicle_color=vehicle_data.color,
                        vehicle_chassis=chassis_number,
                        vehicle_engine=engine_number,
                        vehicle_registration=vehicle_number,
                        source="import",
                        created_by=user_id
                    )
                    await db.sales.insert_one(sale_record.dict())
                    import_stats['sales_created'] += 1
                    
                    # Update vehicle status to sold if sale is created
                    await db.vehicles.update_one(
                        {"id": vehicle.id},
                        {"$set": {"status": "sold"}}
                    )
                except Exception as sale_error:
                    print(f"Warning: Could not create sale record for vehicle {vehicle.id}: {sale_error}")
            
            # Track incomplete records (vehicles without customer linkage)
            if not customer_id and customer_mobile:
                incomplete_records.append({
                    "record_id": vehicle.id,
                    "row": idx + 2,
                    "missing_fields": ["customer_details"],
                    "data": row
                })
            
            successful += 1
            
        except Exception as e:
            failed += 1
            errors.append({
                "row": idx + 2,
                "data": row,
                "error": str(e)
            })
    
    import_job.successful_records = successful
    import_job.failed_records = failed
    import_job.skipped_records = skipped
    import_job.processed_records = successful + failed + skipped
    import_job.errors = errors
    import_job.cross_reference_stats = import_stats
    import_job.incomplete_records = incomplete_records
    
    return ImportResult(
        job_id=import_job.id,
        status="completed",
        message=f"Import completed: {successful} successful, {failed} failed, {skipped} skipped (duplicates). Cross-referenced: {import_stats['customers_linked']} customers linked, {import_stats['customers_created']} customers created, {import_stats['sales_created']} sales created.",
        total_records=len(data),
        successful_records=successful,
        failed_records=failed,
        skipped_records=skipped,
        errors=errors,
        cross_reference_stats=import_stats,
        incomplete_records=incomplete_records
    )

async def import_spare_parts_data(data: List[Dict], import_job: ImportJob, user_id: str) -> ImportResult:
    """Import spare parts data"""
    successful = 0
    failed = 0
    skipped = 0
    errors = []
    
    for idx, row in enumerate(data):
        try:
            # Validate required fields
            required_fields = ['name', 'part_number', 'brand', 'quantity', 'unit_price']
            for field in required_fields:
                if not row.get(field):
                    raise ValueError(f"{field} is required")
            
            part_number = row['part_number'].strip()
            
            # Check for duplicate spare part by part_number
            existing_part = await db.spare_parts.find_one({"part_number": part_number})
            if existing_part:
                # Skip duplicate spare part
                skipped += 1
                continue
            
            spare_part_data = SparePartCreate(
                name=row['name'].strip(),
                part_number=part_number,
                brand=row['brand'].strip(),
                quantity=int(row['quantity']),
                unit=row.get('unit', 'Nos').strip(),
                unit_price=float(row['unit_price']),
                hsn_sac=row.get('hsn_sac', '').strip() or None,
                gst_percentage=float(row.get('gst_percentage', 18.0)),
                compatible_models=row.get('compatible_models', '').strip() or None,
                low_stock_threshold=int(row.get('low_stock_threshold', 5)),
                supplier=row.get('supplier', '').strip() or None
            )
            
            spare_part = SparePart(**spare_part_data.dict())
            await db.spare_parts.insert_one(spare_part.dict())
            successful += 1
            
        except Exception as e:
            failed += 1
            errors.append({
                "row": idx + 2,
                "data": row,
                "error": str(e)
            })
    
    import_job.successful_records = successful
    import_job.failed_records = failed
    import_job.skipped_records = skipped
    import_job.processed_records = successful + failed + skipped
    import_job.errors = errors
    
    return ImportResult(
        job_id=import_job.id,
        status="completed",
        message=f"Import completed: {successful} successful, {failed} failed, {skipped} skipped (duplicates)",
        total_records=len(data),
        successful_records=successful,
        failed_records=failed,
        skipped_records=skipped,
        errors=errors
    )

async def import_services_data(data: List[Dict], import_job: ImportJob, user_id: str) -> ImportResult:
    """Import services data with cross-referencing support"""
    successful = 0
    failed = 0
    skipped = 0
    errors = []
    incomplete_records = []
    import_stats = {
        'customers_linked': 0,
        'customers_created': 0,
        'vehicles_linked': 0
    }
    
    for idx, row in enumerate(data):
        try:
            # Validate required fields (relaxed - only need mobile or vehicle identifier)
            customer_mobile = (row.get('customer_mobile') or '').strip()
            customer_name = (row.get('customer_name') or '').strip()
            vehicle_number = (row.get('vehicle_number') or '').strip()
            chassis_number = (row.get('chassis_number') or '').strip()
            service_type = (row.get('service_type') or 'general_service').strip()
            amount = float(row.get('amount', 0) or 0)
            
            if not customer_mobile and not vehicle_number and not chassis_number:
                raise ValueError("Either customer_mobile or vehicle identifiers (vehicle_number/chassis_number) must be provided")
            
            # CROSS-REFERENCE: Find or create customer
            customer_id = None
            if customer_mobile:
                customer_id = await find_or_create_customer(
                    customer_mobile,
                    {'name': customer_name or 'Unknown Customer'},
                    import_stats
                )
            
            # CROSS-REFERENCE: Find vehicle by identifiers
            vehicle_id = None
            vehicle_brand = None
            vehicle_model = None
            vehicle_year = None
            
            if vehicle_number or chassis_number:
                vehicle = await find_vehicle_by_identifiers(vehicle_number, chassis_number)
                if vehicle:
                    vehicle_id = vehicle.get('id')
                    vehicle_number = vehicle.get('vehicle_number', vehicle_number)
                    vehicle_brand = vehicle.get('brand')
                    vehicle_model = vehicle.get('model')
                    vehicle_year = vehicle.get('year')
                    import_stats['vehicles_linked'] += 1
                    
                    # If no customer was found by mobile, try to get from vehicle
                    if not customer_id and vehicle.get('customer_id'):
                        customer_id = vehicle.get('customer_id')
                        import_stats['customers_linked'] += 1
            
            # If vehicle not found in database, use CSV-provided vehicle details
            if not vehicle_brand:
                vehicle_brand = (row.get('vehicle_brand') or '').strip() or None
            if not vehicle_model:
                vehicle_model = (row.get('vehicle_model') or '').strip() or None
            if not vehicle_year:
                vehicle_year = (row.get('vehicle_year') or '').strip() or None
            
            # If still no customer, create a placeholder
            if not customer_id:
                customer_id = await find_or_create_customer(
                    f"AUTO-{str(uuid.uuid4())[:8]}",
                    {'name': customer_name or 'Unknown Customer'},
                    import_stats
                )
                incomplete_records.append({
                    "row": idx + 2,
                    "missing_fields": ["customer_mobile"],
                    "data": row
                })
            
            # Check for duplicate service (same customer, vehicle, service_type, and similar amount)
            duplicate_check = {
                "customer_id": customer_id,
                "vehicle_number": vehicle_number or chassis_number or 'Unknown',
                "service_type": service_type,
                "amount": amount
            }
            existing_service = await db.services.find_one(duplicate_check)
            if existing_service:
                # Skip duplicate service
                skipped += 1
                continue
            
            service_data = ServiceCreate(
                customer_id=customer_id,
                vehicle_id=vehicle_id,
                vehicle_number=vehicle_number or chassis_number or 'Unknown',
                service_type=service_type,
                description=(row.get('description') or '').strip() or 'Imported service',
                amount=amount
            )
            
            # Generate job card number
            count = await db.services.count_documents({})
            job_card_number = f"JOB-{count + 1:06d}"
            
            service_dict = service_data.dict()
            service_dict['job_card_number'] = job_card_number
            service_dict['created_by'] = user_id
            
            # Handle registration_date (service_date)
            registration_date = (row.get('registration_date') or '').strip()
            if registration_date:
                try:
                    from dateutil import parser as date_parser
                    parsed_date = date_parser.parse(registration_date)
                    service_dict['service_date'] = parsed_date
                except Exception:
                    # If parsing fails, use current datetime
                    service_dict['service_date'] = datetime.now(timezone.utc)
            
            # Add vehicle details for imported services (so they can be displayed even if vehicle is deleted)
            if vehicle_brand:
                service_dict['vehicle_brand'] = vehicle_brand
            if vehicle_model:
                service_dict['vehicle_model'] = vehicle_model
            if vehicle_year:
                service_dict['vehicle_year'] = vehicle_year
            
            service = Service(**service_dict)
            
            await db.services.insert_one(service.dict())
            successful += 1
            
        except Exception as e:
            failed += 1
            errors.append({
                "row": idx + 2,
                "data": row,
                "error": str(e)
            })
    
    import_job.successful_records = successful
    import_job.failed_records = failed
    import_job.skipped_records = skipped
    import_job.processed_records = successful + failed + skipped
    import_job.errors = errors
    import_job.cross_reference_stats = import_stats
    import_job.incomplete_records = incomplete_records
    
    return ImportResult(
        job_id=import_job.id,
        status="completed",
        message=f"Import completed: {successful} successful, {failed} failed, {skipped} skipped (duplicates). Cross-referenced: {import_stats['customers_linked']} customers linked, {import_stats['customers_created']} customers created, {import_stats['vehicles_linked']} vehicles linked.",
        total_records=len(data),
        successful_records=successful,
        failed_records=failed,
        skipped_records=skipped,
        errors=errors,
        cross_reference_stats=import_stats,
        incomplete_records=incomplete_records
    )

# Duplicate Detection and Cleanup endpoints
@api_router.get("/duplicates/detect")
async def detect_duplicates(current_user: User = Depends(get_current_user)):
    """Detect duplicate records across all collections"""
    duplicates = {
        "vehicles": {},
        "customers": {},
        "summary": {}
    }
    
    # Find duplicate vehicles by chassis_number
    vehicle_pipeline = [
        {"$match": {"chassis_number": {"$ne": None, "$ne": ""}}},
        {"$group": {
            "_id": "$chassis_number",
            "count": {"$sum": 1},
            "ids": {"$push": "$id"},
            "records": {"$push": "$$ROOT"}
        }},
        {"$match": {"count": {"$gt": 1}}}
    ]
    
    vehicle_duplicates = await db.vehicles.aggregate(vehicle_pipeline).to_list(1000)
    
    # Find duplicate customers by mobile
    customer_pipeline = [
        {"$match": {"mobile": {"$ne": None, "$ne": ""}}},
        {"$group": {
            "_id": "$mobile", 
            "count": {"$sum": 1},
            "ids": {"$push": "$id"},
            "records": {"$push": "$$ROOT"}
        }},
        {"$match": {"count": {"$gt": 1}}}
    ]
    
    customer_duplicates = await db.customers.aggregate(customer_pipeline).to_list(1000)
    
    # Process vehicle duplicates
    total_vehicle_duplicates = 0
    for duplicate in vehicle_duplicates:
        chassis_no = duplicate["_id"]
        duplicates["vehicles"][chassis_no] = {
            "count": duplicate["count"],
            "ids": duplicate["ids"],
            "records": [{"id": r["id"], "brand": r.get("brand"), "model": r.get("model"), "color": r.get("color")} for r in duplicate["records"]]
        }
        total_vehicle_duplicates += duplicate["count"] - 1  # Subtract 1 to keep original
    
    # Process customer duplicates
    total_customer_duplicates = 0
    for duplicate in customer_duplicates:
        mobile = duplicate["_id"]
        duplicates["customers"][mobile] = {
            "count": duplicate["count"],
            "ids": duplicate["ids"],
            "records": [{"id": r["id"], "name": r.get("name"), "email": r.get("email")} for r in duplicate["records"]]
        }
        total_customer_duplicates += duplicate["count"] - 1  # Subtract 1 to keep original
    
    duplicates["summary"] = {
        "total_vehicle_duplicates": total_vehicle_duplicates,
        "total_customer_duplicates": total_customer_duplicates,
        "vehicle_chassis_groups": len(vehicle_duplicates),
        "customer_mobile_groups": len(customer_duplicates)
    }
    
    return duplicates

@api_router.post("/duplicates/cleanup")
async def cleanup_duplicates(current_user: User = Depends(get_current_user)):
    """Remove duplicate records, keeping the oldest one in each group"""
    
    cleanup_results = {
        "vehicles_removed": 0,
        "customers_removed": 0,
        "removed_vehicle_ids": [],
        "removed_customer_ids": []
    }
    
    # Clean up duplicate vehicles by chassis_number
    vehicle_pipeline = [
        {"$match": {"chassis_number": {"$ne": None, "$ne": ""}}},
        {"$group": {
            "_id": "$chassis_number",
            "count": {"$sum": 1},
            "records": {"$push": "$$ROOT"}
        }},
        {"$match": {"count": {"$gt": 1}}}
    ]
    
    vehicle_duplicates = await db.vehicles.aggregate(vehicle_pipeline).to_list(1000)
    
    for duplicate_group in vehicle_duplicates:
        records = duplicate_group["records"]
        # Sort by created_at to keep the oldest
        records.sort(key=lambda x: x.get("date_received", datetime.now(timezone.utc)))
        
        # Keep the first (oldest) and remove the rest
        to_remove = records[1:]
        for record in to_remove:
            # Check if vehicle is not associated with sales/services
            sales_count = await db.sales.count_documents({"vehicle_id": record["id"]})
            services_count = await db.services.count_documents({"vehicle_id": record["id"]})
            
            if sales_count == 0 and services_count == 0:
                await db.vehicles.delete_one({"id": record["id"]})
                cleanup_results["vehicles_removed"] += 1
                cleanup_results["removed_vehicle_ids"].append(record["id"])
    
    # Clean up duplicate customers by mobile
    customer_pipeline = [
        {"$match": {"mobile": {"$ne": None, "$ne": ""}}},
        {"$group": {
            "_id": "$mobile",
            "count": {"$sum": 1},
            "records": {"$push": "$$ROOT"}
        }},
        {"$match": {"count": {"$gt": 1}}}
    ]
    
    customer_duplicates = await db.customers.aggregate(customer_pipeline).to_list(1000)
    
    for duplicate_group in customer_duplicates:
        records = duplicate_group["records"]
        # Sort by created_at to keep the oldest
        records.sort(key=lambda x: x.get("created_at", datetime.now(timezone.utc)))
        
        # Keep the first (oldest) and remove the rest
        to_remove = records[1:]
        for record in to_remove:
            # Check if customer is not associated with sales/services
            sales_count = await db.sales.count_documents({"customer_id": record["id"]})
            services_count = await db.services.count_documents({"customer_id": record["id"]})
            
            if sales_count == 0 and services_count == 0:
                await db.customers.delete_one({"id": record["id"]})
                cleanup_results["customers_removed"] += 1
                cleanup_results["removed_customer_ids"].append(record["id"])
    
    return cleanup_results

# Include the router in the main app
# Backup Service Class
class BackupService:
    def __init__(self, db, backup_config: BackupConfig):
        self.db = db
        self.config = backup_config
        self.backup_root = Path(backup_config.backup_location)
        self.backup_root.mkdir(parents=True, exist_ok=True)
    
    async def create_backup(self, user_id: str, backup_type: str = "manual", export_format: str = "json") -> BackupJob:
        """Create a new backup job with specified format"""
        job = BackupJob(
            status="running",
            start_time=datetime.utcnow(),
            created_by=user_id,
            backup_type=backup_type
        )
        
        try:
            # Create backup directory
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            backup_dir = self.backup_root / f"backup_{timestamp}"
            backup_dir.mkdir(parents=True, exist_ok=True)
            
            # Backup all collections
            collections = ['users', 'customers', 'vehicles', 'sales', 'services', 'spare_parts', 'spare_part_bills']
            total_records = 0
            records_by_collection = {}
            collection_data = {}
            
            for collection_name in collections:
                collection = getattr(self.db, collection_name)
                documents = await collection.find().to_list(length=None)
                
                # Convert ObjectId to string for JSON serialization
                for doc in documents:
                    if '_id' in doc:
                        doc['_id'] = str(doc['_id'])
                
                collection_data[collection_name] = documents
                record_count = len(documents)
                records_by_collection[collection_name] = record_count
                total_records += record_count
            
            # Create files based on export format
            if export_format.lower() == "excel":
                await self.create_excel_backup(backup_dir, collection_data, records_by_collection, user_id, backup_type)
            else:
                # Default JSON/CSV format
                await self.create_json_csv_backup(backup_dir, collection_data, records_by_collection, user_id, backup_type)
            
            # Compress backup if enabled
            final_path = str(backup_dir)
            backup_size = 0
            
            if self.config.compress_backups:
                if export_format.lower() == "excel":
                    zip_path = f"{backup_dir}_excel.zip"
                else:
                    zip_path = f"{backup_dir}.zip"
                
                with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
                    for file_path in backup_dir.rglob('*'):
                        if file_path.is_file():
                            zipf.write(file_path, file_path.relative_to(backup_dir))
                
                # Remove original directory and get compressed size
                shutil.rmtree(backup_dir)
                backup_size = os.path.getsize(zip_path) / (1024 * 1024)  # MB
                final_path = zip_path
            else:
                # Calculate directory size
                backup_size = sum(f.stat().st_size for f in backup_dir.rglob('*') if f.is_file()) / (1024 * 1024)
            
            # Update job with completion details
            job.status = "completed"
            job.end_time = datetime.utcnow()
            job.total_records = total_records
            job.backup_size_mb = round(backup_size, 2)
            job.backup_file_path = final_path
            job.records_backed_up = records_by_collection
            
        except Exception as e:
            job.status = "failed"
            job.end_time = datetime.utcnow()
            job.error_message = str(e)
        
        # Save job to database
        await self.db.backup_jobs.insert_one(job.dict())
        
        return job
    
    async def create_excel_backup(self, backup_dir: Path, collection_data: dict, records_by_collection: dict, user_id: str, backup_type: str):
        """Create Excel backup with multiple sheets"""
        try:
            # Create comprehensive Excel file
            excel_file = backup_dir / "backup_data.xlsx"
            
            # Create workbook and remove default sheet
            workbook = Workbook()
            workbook.remove(workbook.active)
            
            # Define header style
            header_font = Font(bold=True, color="FFFFFF")
            header_fill = PatternFill(start_color="4472C4", end_color="4472C4", fill_type="solid")
            header_alignment = Alignment(horizontal="center", vertical="center")
            
            # Create sheets for each collection
            for collection_name, documents in collection_data.items():
                if not documents:
                    continue
                    
                # Create sheet
                sheet = workbook.create_sheet(title=collection_name.replace('_', ' ').title())
                
                try:
                    # Flatten nested data for Excel compatibility
                    flattened_documents = []
                    for doc in documents:
                        flat_doc = self.flatten_document(doc)
                        flattened_documents.append(flat_doc)
                    
                    # Convert to DataFrame for easier Excel manipulation
                    df = pd.DataFrame(flattened_documents)
                    
                    # Add data to sheet
                    for row_num, row_data in enumerate(dataframe_to_rows(df, index=False, header=True), 1):
                        for col_num, value in enumerate(row_data, 1):
                            # Convert non-serializable values to strings
                            if value is None:
                                value = ""
                            elif isinstance(value, (dict, list)):
                                value = str(value)
                            
                            cell = sheet.cell(row=row_num, column=col_num, value=str(value))
                            
                            # Apply header styling
                            if row_num == 1:
                                cell.font = header_font
                                cell.fill = header_fill
                                cell.alignment = header_alignment
                    
                    # Auto-adjust column widths
                    for column in sheet.columns:
                        max_length = 0
                        column_letter = column[0].column_letter
                        for cell in column:
                            try:
                                if len(str(cell.value)) > max_length:
                                    max_length = len(str(cell.value))
                            except:
                                pass
                        adjusted_width = min(max_length + 2, 50)
                        sheet.column_dimensions[column_letter].width = adjusted_width
                        
                except Exception as e:
                    logger.warning(f"Failed to create Excel sheet for {collection_name}: {e}")
                    # Create a simple sheet with error message
                    sheet.cell(row=1, column=1, value=f"Error processing {collection_name}")
                    sheet.cell(row=2, column=1, value=str(e))
            
            # Create summary sheet
            summary_sheet = workbook.create_sheet(title="Backup Summary", index=0)
            
            # Summary data with IST timezone
            current_utc = datetime.utcnow()
            ist_time = current_utc + timedelta(hours=5, minutes=30)
            
            summary_data = [
                ["Backup Information", ""],
                ["Backup Date", ist_time.strftime("%Y-%m-%d %H:%M:%S IST")],
                ["Backup Type", backup_type.title()],
                ["Created By", user_id],
                ["Total Records", sum(records_by_collection.values())],
                ["Export Format", "Excel Workbook"],
                ["Timezone", "IST (UTC+5:30)"],
                ["", ""],
                ["Collection Statistics", "Records"],
            ]
            
            # Add collection statistics
            for collection, count in records_by_collection.items():
                summary_data.append([collection.replace('_', ' ').title(), count])
            
            # Add summary data to sheet
            for row_num, (key, value) in enumerate(summary_data, 1):
                summary_sheet.cell(row=row_num, column=1, value=str(key))
                summary_sheet.cell(row=row_num, column=2, value=str(value))
                
                # Style headers
                if key in ["Backup Information", "Collection Statistics"]:
                    summary_sheet.cell(row=row_num, column=1).font = Font(bold=True, size=14)
                    summary_sheet.cell(row=row_num, column=2).font = Font(bold=True, size=14)
            
            # Auto-adjust summary sheet columns
            summary_sheet.column_dimensions['A'].width = 25
            summary_sheet.column_dimensions['B'].width = 15
            
            # Save workbook
            workbook.save(excel_file)
            logger.info(f"Excel backup created successfully: {excel_file}")
            
        except Exception as e:
            # Fallback to JSON if Excel creation fails
            logger.error(f"Excel backup creation failed: {e}, falling back to JSON")
            await self.create_json_csv_backup(backup_dir, collection_data, records_by_collection, user_id, backup_type)
    
    def flatten_document(self, doc: dict, prefix: str = "") -> dict:
        """Flatten nested dictionary for Excel compatibility"""
        flattened = {}
        
        for key, value in doc.items():
            new_key = f"{prefix}_{key}" if prefix else key
            
            if isinstance(value, dict):
                # Recursively flatten nested dictionaries
                nested_flattened = self.flatten_document(value, new_key)
                flattened.update(nested_flattened)
            elif isinstance(value, list):
                # Convert lists to comma-separated strings
                if value and isinstance(value[0], dict):
                    # For list of dictionaries, create a summary
                    flattened[new_key] = f"[{len(value)} items]"
                    # Add first item details if available
                    if value:
                        first_item = self.flatten_document(value[0], f"{new_key}_item1")
                        flattened.update(first_item)
                else:
                    # For simple lists, join as string
                    flattened[new_key] = ", ".join(str(item) for item in value)
            else:
                # Simple values
                flattened[new_key] = value
        
        return flattened
    
    async def create_json_csv_backup(self, backup_dir: Path, collection_data: dict, records_by_collection: dict, user_id: str, backup_type: str):
        """Create JSON and CSV backup files"""
        for collection_name, documents in collection_data.items():
            # Save as JSON
            json_file = backup_dir / f"{collection_name}.json"
            async with aiofiles.open(json_file, 'w') as f:
                await f.write(json.dumps(documents, default=str, indent=2))
            
            # Save as CSV if data exists
            if documents:
                try:
                    df = pd.DataFrame(documents)
                    csv_file = backup_dir / f"{collection_name}.csv"
                    df.to_csv(csv_file, index=False)
                except Exception as e:
                    logger.warning(f"Failed to create CSV for {collection_name}: {e}")
        
        # Create backup summary with IST timezone
        current_utc = datetime.utcnow()
        ist_time = current_utc + timedelta(hours=5, minutes=30)
        
        summary = {
            'backup_date': ist_time.isoformat(),
            'backup_date_utc': current_utc.isoformat(),
            'timezone': 'IST (UTC+5:30)',
            'total_records': sum(records_by_collection.values()),
            'records_by_collection': records_by_collection,
            'backup_type': backup_type,
            'created_by': user_id
        }
        
        summary_file = backup_dir / 'backup_summary.json'
        async with aiofiles.open(summary_file, 'w') as f:
            await f.write(json.dumps(summary, indent=2))
    
    async def get_backup_stats(self) -> BackupStats:
        """Get backup statistics"""
        jobs = await self.db.backup_jobs.find().to_list(length=None)
        
        total_backups = len(jobs)
        successful_backups = len([j for j in jobs if j['status'] == 'completed'])
        failed_backups = len([j for j in jobs if j['status'] == 'failed'])
        
        last_backup = None
        oldest_backup = None
        total_size = 0
        
        if jobs:
            sorted_jobs = sorted(jobs, key=lambda x: x['created_at'], reverse=True)
            last_backup = sorted_jobs[0]['created_at']
            oldest_backup = sorted_jobs[-1]['created_at']
            
            # Calculate total storage used
            for job in jobs:
                if job['status'] == 'completed':
                    total_size += job.get('backup_size_mb', 0)
        
        return BackupStats(
            total_backups=total_backups,
            successful_backups=successful_backups,
            failed_backups=failed_backups,
            last_backup_date=last_backup,
            oldest_backup_date=oldest_backup,
            total_storage_used_mb=round(total_size, 2)
        )
    
    async def cleanup_old_backups(self, retention_days: int):
        """Clean up backups older than retention period"""
        cutoff_date = datetime.utcnow() - timedelta(days=retention_days)
        
        # Remove old backup files
        for backup_path in self.backup_root.glob('backup_*'):
            if backup_path.stat().st_mtime < cutoff_date.timestamp():
                try:
                    if backup_path.is_file():
                        backup_path.unlink()
                    else:
                        shutil.rmtree(backup_path)
                    
                    # Update database to mark as cleaned up
                    await self.db.backup_jobs.update_one(
                        {"backup_file_path": str(backup_path)},
                        {"$set": {"cleaned_up": True}}
                    )
                except Exception as e:
                    logger.error(f"Failed to cleanup backup {backup_path}: {e}")

# Initialize backup service
backup_service = None

async def get_backup_service():
    """Get or create backup service instance"""
    global backup_service
    
    if backup_service is None:
        # Get backup config from database or create default
        config_doc = await db.backup_config.find_one()
        if not config_doc:
            # Create default config
            default_config = BackupConfig()
            await db.backup_config.insert_one(default_config.dict())
            config = default_config
        else:
            config = BackupConfig(**config_doc)
        
        backup_service = BackupService(db, config)
    
    return backup_service

# Backup API Endpoints
@app.get("/api/backup/config", response_model=BackupConfig)
async def get_backup_config(current_user: dict = Depends(verify_token)):
    """Get backup configuration"""
    config_doc = await db.backup_config.find_one()
    if not config_doc:
        # Create default config
        default_config = BackupConfig()
        await db.backup_config.insert_one(default_config.dict())
        return default_config
    return BackupConfig(**config_doc)

@app.put("/api/backup/config", response_model=BackupConfig)
async def update_backup_config(
    config_update: dict,
    current_user: dict = Depends(verify_token)
):
    """Update backup configuration"""
    config_update['updated_at'] = datetime.utcnow()
    
    result = await db.backup_config.update_one(
        {}, 
        {"$set": config_update},
        upsert=True
    )
    
    # Refresh backup service with new config
    global backup_service
    backup_service = None
    
    updated_config = await db.backup_config.find_one()
    return BackupConfig(**updated_config)

@app.post("/api/backup/create", response_model=BackupJob)
async def create_manual_backup(
    backup_create: BackupJobCreate,
    current_user: dict = Depends(verify_token)
):
    """Create a manual backup"""
    service = await get_backup_service()
    job = await service.create_backup(
        current_user['user_id'], 
        backup_create.backup_type,
        backup_create.export_format
    )
    return job

@app.get("/api/backup/jobs", response_model=List[BackupJob])
async def get_backup_jobs(
    skip: int = 0,
    limit: int = 50,
    current_user: dict = Depends(verify_token)
):
    """Get backup job history"""
    jobs = await db.backup_jobs.find().skip(skip).limit(limit).sort("created_at", -1).to_list(length=None)
    return [BackupJob(**job) for job in jobs]

@app.get("/api/backup/stats", response_model=BackupStats)
async def get_backup_statistics(current_user: dict = Depends(verify_token)):
    """Get backup system statistics"""
    service = await get_backup_service()
    return await service.get_backup_stats()

@app.delete("/api/backup/cleanup")
async def cleanup_old_backups(
    retention_days: int = 30,
    current_user: dict = Depends(verify_token)
):
    """Clean up old backups"""
    service = await get_backup_service()
    await service.cleanup_old_backups(retention_days)
    return {"message": f"Cleanup completed for backups older than {retention_days} days"}

@app.get("/api/backup/download/{job_id}")
async def download_backup(
    job_id: str,
    current_user: dict = Depends(verify_token)
):
    """Download a backup file"""
    from fastapi.responses import FileResponse
    
    job = await db.backup_jobs.find_one({"id": job_id})
    if not job:
        raise HTTPException(status_code=404, detail="Backup job not found")
    
    if job['status'] != 'completed':
        raise HTTPException(status_code=400, detail="Backup is not completed")
    
    backup_path = Path(job['backup_file_path'])
    if not backup_path.exists():
        raise HTTPException(status_code=404, detail="Backup file not found")
    
    return FileResponse(
        path=backup_path,
        filename=backup_path.name,
        media_type='application/octet-stream'
    )

# ==================== Activity/Notifications System ====================

class ActivityType(str, Enum):
    SALE_CREATED = "sale_created"
    SERVICE_COMPLETED = "service_completed"
    SERVICE_CREATED = "service_created"
    VEHICLE_ADDED = "vehicle_added"
    VEHICLE_SOLD = "vehicle_sold"
    LOW_STOCK = "low_stock"
    CUSTOMER_ADDED = "customer_added"
    BACKUP_CREATED = "backup_created"

class Activity(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    type: ActivityType
    title: str
    description: str
    icon: str = "info"  # info, success, warning, error
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    read: bool = False
    metadata: Optional[Dict[str, Any]] = None

class ActivityCreate(BaseModel):
    type: ActivityType
    title: str
    description: str
    icon: str = "info"
    metadata: Optional[Dict[str, Any]] = None

async def create_activity(activity_data: ActivityCreate):
    """Helper function to create an activity"""
    activity = Activity(**activity_data.dict())
    await db.activities.insert_one(activity.dict())
    return activity

@app.get("/api/activities")
async def get_activities(
    limit: int = 20,
    skip: int = 0,
    unread_only: bool = False,
    current_user: dict = Depends(verify_token)
):
    """Get recent activities/notifications"""
    query = {}
    if unread_only:
        query["read"] = False
    
    activities = await db.activities.find(
        query,
        {"_id": 0}
    ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    total = await db.activities.count_documents(query)
    unread_count = await db.activities.count_documents({"read": False})
    
    return {
        "activities": activities,
        "total": total,
        "unread_count": unread_count
    }

@app.post("/api/activities/{activity_id}/mark-read")
async def mark_activity_read(
    activity_id: str,
    current_user: dict = Depends(verify_token)
):
    """Mark an activity as read"""
    result = await db.activities.update_one(
        {"id": activity_id},
        {"$set": {"read": True}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Activity not found")
    
    return {"message": "Activity marked as read"}

@app.post("/api/activities/mark-all-read")
async def mark_all_activities_read(current_user: dict = Depends(verify_token)):
    """Mark all activities as read"""
    await db.activities.update_many(
        {"read": False},
        {"$set": {"read": True}}
    )
    
    return {"message": "All activities marked as read"}

@app.delete("/api/activities/{activity_id}")
async def delete_activity(
    activity_id: str,
    current_user: dict = Depends(verify_token)
):
    """Delete an activity"""
    result = await db.activities.delete_one({"id": activity_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Activity not found")
    
    return {"message": "Activity deleted"}

# ==================== End Activity/Notifications System ====================

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()