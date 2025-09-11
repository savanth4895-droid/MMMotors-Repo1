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

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'your-secret-key-change-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440  # 24 hours

# Create the main app without a prefix
app = FastAPI(title="Two Wheeler Business Management API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

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
    name: str
    phone: str
    email: Optional[EmailStr] = None
    address: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CustomerCreate(BaseModel):
    name: str
    phone: str
    email: Optional[EmailStr] = None
    address: str

class Vehicle(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    brand: str  # TVS, BAJAJ, HERO, HONDA, TRIUMPH, KTM, SUZUKI, APRILIA
    model: str
    chassis_no: str
    engine_no: str
    color: str
    key_no: str
    inbound_location: str
    outbound_location: Optional[str] = None
    status: VehicleStatus = VehicleStatus.IN_STOCK
    page_number: Optional[str] = None
    date_received: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    date_sold: Optional[datetime] = None
    date_returned: Optional[datetime] = None
    customer_id: Optional[str] = None

class VehicleCreate(BaseModel):
    brand: str
    model: str
    chassis_no: str
    engine_no: str
    color: str
    key_no: str
    inbound_location: str
    page_number: Optional[str] = None

class Sale(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    invoice_number: str
    customer_id: str
    vehicle_id: str
    sale_date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    amount: float
    payment_method: str
    insurance_details: Optional[Dict[str, Any]] = None
    created_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SaleCreate(BaseModel):
    customer_id: str
    vehicle_id: str
    amount: float
    payment_method: str
    insurance_details: Optional[Dict[str, Any]] = None

class Service(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    job_card_number: str
    customer_id: str
    vehicle_id: Optional[str] = None
    vehicle_number: str
    service_type: str
    description: str
    status: ServiceStatus = ServiceStatus.PENDING
    service_date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    completion_date: Optional[datetime] = None
    amount: float
    created_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ServiceCreate(BaseModel):
    customer_id: str
    vehicle_id: Optional[str] = None
    vehicle_number: str
    service_type: str
    description: str
    amount: float

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
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

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
    created_at: datetime = Field(default_factory=datetime.utcnow)

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
        
        return {"user_id": user["id"], "username": user["username"], "role": user["role"]}
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")

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
    customer = Customer(**customer_data.dict())
    await db.customers.insert_one(customer.dict())
    return customer

@api_router.get("/customers", response_model=List[Customer])
async def get_customers(current_user: User = Depends(get_current_user)):
    customers = await db.customers.find().to_list(1000)
    return [Customer(**customer) for customer in customers]

@api_router.get("/customers/{customer_id}", response_model=Customer)
async def get_customer(customer_id: str, current_user: User = Depends(get_current_user)):
    customer = await db.customers.find_one({"id": customer_id})
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return Customer(**customer)

# Vehicle endpoints
@api_router.post("/vehicles", response_model=Vehicle)
async def create_vehicle(vehicle_data: VehicleCreate, current_user: User = Depends(get_current_user)):
    vehicle = Vehicle(**vehicle_data.dict())
    await db.vehicles.insert_one(vehicle.dict())
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
    brands = ["TVS", "BAJAJ", "HERO", "HONDA", "TRIUMPH", "KTM", "SUZUKI", "APRILIA"]
    return brands

@api_router.put("/vehicles/{vehicle_id}", response_model=Vehicle)
async def update_vehicle(vehicle_id: str, vehicle_data: VehicleCreate, current_user: User = Depends(get_current_user)):
    # Check if vehicle exists
    existing_vehicle = await db.vehicles.find_one({"id": vehicle_id})
    if not existing_vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    
    # Update vehicle data
    update_data = vehicle_data.dict()
    update_data["id"] = vehicle_id  # Keep the original ID
    
    updated_vehicle = Vehicle(**{**existing_vehicle, **update_data})
    await db.vehicles.replace_one({"id": vehicle_id}, updated_vehicle.dict())
    return updated_vehicle

@api_router.get("/vehicles/{vehicle_id}", response_model=Vehicle)
async def get_vehicle(vehicle_id: str, current_user: User = Depends(get_current_user)):
    vehicle = await db.vehicles.find_one({"id": vehicle_id})
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return Vehicle(**vehicle)

# Sales endpoints
@api_router.post("/sales", response_model=Sale)
async def create_sale(sale_data: SaleCreate, current_user: User = Depends(get_current_user)):
    # Check if vehicle exists and is available
    vehicle = await db.vehicles.find_one({"id": sale_data.vehicle_id})
    if not vehicle or vehicle['status'] != VehicleStatus.IN_STOCK:
        raise HTTPException(status_code=400, detail="Vehicle not available for sale")
    
    # Generate invoice number
    count = await db.sales.count_documents({})
    invoice_number = f"INV-{count + 1:06d}"
    
    sale_dict = sale_data.dict()
    sale_dict['invoice_number'] = invoice_number
    sale_dict['created_by'] = current_user.id
    sale = Sale(**sale_dict)
    
    # Update vehicle status
    await db.vehicles.update_one(
        {"id": sale_data.vehicle_id},
        {"$set": {"status": VehicleStatus.SOLD, "customer_id": sale_data.customer_id, "date_sold": datetime.now(timezone.utc)}}
    )
    
    await db.sales.insert_one(sale.dict())
    return sale

@api_router.get("/sales", response_model=List[Sale])
async def get_sales(current_user: User = Depends(get_current_user)):
    sales = await db.sales.find().to_list(1000)
    return [Sale(**sale) for sale in sales]

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

@api_router.put("/services/{service_id}/status")
async def update_service_status(service_id: str, status_data: dict, current_user: User = Depends(get_current_user)):
    status = status_data.get("status")
    if not status:
        raise HTTPException(status_code=400, detail="Status is required")
    
    update_data = {"status": status}
    if status == ServiceStatus.COMPLETED:
        update_data["completion_date"] = datetime.now(timezone.utc)
    
    await db.services.update_one({"id": service_id}, {"$set": update_data})
    return {"message": "Service status updated successfully"}

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

# Dashboard stats
@api_router.get("/dashboard/stats")
async def get_dashboard_stats(current_user: User = Depends(get_current_user)):
    total_customers = await db.customers.count_documents({})
    total_vehicles = await db.vehicles.count_documents({})
    vehicles_in_stock = await db.vehicles.count_documents({"status": VehicleStatus.IN_STOCK})
    vehicles_sold = await db.vehicles.count_documents({"status": VehicleStatus.SOLD})
    pending_services = await db.services.count_documents({"status": ServiceStatus.PENDING})
    low_stock_parts = await db.spare_parts.count_documents({"$expr": {"$lte": ["$quantity", "$low_stock_threshold"]}})
    
    return {
        "total_customers": total_customers,
        "total_vehicles": total_vehicles,
        "vehicles_in_stock": vehicles_in_stock,
        "vehicles_sold": vehicles_sold,
        "pending_services": pending_services,
        "low_stock_parts": low_stock_parts
    }

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
                
                # Convert to DataFrame for easier Excel manipulation
                df = pd.DataFrame(documents)
                
                # Add data to sheet
                for row_num, row_data in enumerate(dataframe_to_rows(df, index=False, header=True), 1):
                    for col_num, value in enumerate(row_data, 1):
                        cell = sheet.cell(row=row_num, column=col_num, value=value)
                        
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
            
            # Create summary sheet
            summary_sheet = workbook.create_sheet(title="Backup Summary", index=0)
            
            # Summary data
            summary_data = [
                ["Backup Information", ""],
                ["Backup Date", datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")],
                ["Backup Type", backup_type.title()],
                ["Created By", user_id],
                ["Total Records", sum(records_by_collection.values())],
                ["", ""],
                ["Collection Statistics", "Records"],
            ]
            
            # Add collection statistics
            for collection, count in records_by_collection.items():
                summary_data.append([collection.replace('_', ' ').title(), count])
            
            # Add summary data to sheet
            for row_num, (key, value) in enumerate(summary_data, 1):
                summary_sheet.cell(row=row_num, column=1, value=key)
                summary_sheet.cell(row=row_num, column=2, value=value)
                
                # Style headers
                if key in ["Backup Information", "Collection Statistics"]:
                    summary_sheet.cell(row=row_num, column=1).font = Font(bold=True, size=14)
                    summary_sheet.cell(row=row_num, column=2).font = Font(bold=True, size=14)
            
            # Auto-adjust summary sheet columns
            summary_sheet.column_dimensions['A'].width = 25
            summary_sheet.column_dimensions['B'].width = 15
            
            # Save workbook
            workbook.save(excel_file)
            
        except Exception as e:
            # Fallback to JSON if Excel creation fails
            logger.error(f"Excel backup creation failed: {e}, falling back to JSON")
            await self.create_json_csv_backup(backup_dir, collection_data, records_by_collection, user_id, backup_type)
    
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
        
        # Create backup summary
        summary = {
            'backup_date': datetime.utcnow().isoformat(),
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
    job = await service.create_backup(current_user['user_id'], backup_create.backup_type)
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