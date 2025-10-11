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
    brand: Optional[str] = None  # TVS, BAJAJ, HERO, HONDA, TRIUMPH, KTM, SUZUKI, APRILIA
    model: Optional[str] = None
    chassis_no: Optional[str] = None
    engine_no: Optional[str] = None
    color: Optional[str] = None
    key_no: Optional[str] = None
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
    chassis_no: Optional[str] = None
    engine_no: Optional[str] = None
    color: Optional[str] = None
    key_no: Optional[str] = None
    inbound_location: Optional[str] = None
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
    errors: List[Dict[str, Any]] = []
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
    errors: List[Dict[str, Any]] = []

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

@api_router.get("/customers")
async def get_customers(current_user: User = Depends(get_current_user)):
    customers = await db.customers.find().to_list(1000)
    # Convert ObjectId to string for JSON serialization and return raw customer data
    for customer in customers:
        if '_id' in customer:
            customer['_id'] = str(customer['_id'])
    return customers

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
    update_data = sale_data.dict()
    update_data["id"] = sale_id  # Keep the original ID
    update_data["invoice_number"] = existing_sale["invoice_number"]  # Keep original invoice number
    update_data["created_by"] = existing_sale["created_by"]  # Keep original creator
    update_data["created_at"] = existing_sale["created_at"]  # Keep original creation date
    
    updated_sale = Sale(**update_data)
    await db.sales.replace_one({"id": sale_id}, updated_sale.dict())
    return updated_sale

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
async def update_service(service_id: str, service_data: ServiceCreate, current_user: User = Depends(get_current_user)):
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
        "customers": "name,care_of,mobile,phone,email,address,vehicle_brand,vehicle_model,vehicle_color,vehicle_no,chassis_no,engine_no,insurance_nominee,insurance_relation,insurance_age,sale_amount,payment_method,hypothecation,sale_date,invoice_number\nJohn Doe,S/O Ramesh,9876543210,9876543210,john@example.com,\"123 Main St, Bangalore\",TVS,Apache RTR 160,Red,KA01AB1234,ABC123456789012345,ENG987654321,Jane Doe,spouse,28,75000,cash,cash,2024-01-15,INV001\nJane Smith,D/O Kumar,9876543211,9876543211,jane@example.com,\"456 Oak Ave, Mysore\",BAJAJ,Pulsar 150,Blue,KA02CD5678,DEF123456789012345,ENG987654322,John Smith,father,55,65000,finance,\"Bank Finance\",2024-01-16,INV002",
        "vehicles": "brand,model,chassis_no,engine_no,color,key_no,inbound_location,page_number\nTVS,Apache RTR 160,ABC123456789,ENG987654321,Red,KEY001,Warehouse A,Page 1\nBAJAJ,Pulsar 150,DEF123456789,ENG987654322,Blue,KEY002,Warehouse B,Page 2",
        "spare_parts": "name,part_number,brand,quantity,unit,unit_price,hsn_sac,gst_percentage,supplier\nBrake Pad,BP001,TVS,50,Nos,250.00,87084090,18.0,ABC Supplies\nEngine Oil,EO001,CASTROL,25,Ltr,450.00,27101981,28.0,XYZ Motors",
        "services": "customer_name,customer_mobile,vehicle_number,service_type,description,amount\nJohn Doe,9876543210,KA01AB1234,periodic_service,General servicing,1500.00\nJane Smith,9876543211,KA02CD5678,repair,Brake repair,800.00"
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

async def parse_excel_file(file_content: bytes) -> List[Dict]:
    """Parse Excel file content"""
    df = pd.read_excel(io.BytesIO(file_content))
    return df.to_dict('records')

async def import_customers_data(data: List[Dict], import_job: ImportJob, user_id: str) -> ImportResult:
    """Import customers data with vehicle and insurance information"""
    successful = 0
    failed = 0
    errors = []
    
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
            
            # Create basic customer record
            customer_data = CustomerCreate(
                name=name,
                mobile=phone_number,
                email=row.get('email', '').strip() or None,
                address=address
            )
            
            customer = Customer(**customer_data.dict())
            
            # Add vehicle and insurance information as extended data
            vehicle_info = {}
            insurance_info = {}
            sales_info = {}
            
            # Map vehicle fields from form to CSV template
            if row.get('vehicle_brand') or row.get('vehicle_model'):
                vehicle_info = {
                    'brand': row.get('vehicle_brand', '').strip(),
                    'model': row.get('vehicle_model', '').strip(), 
                    'color': row.get('vehicle_color', '').strip(),
                    'vehicle_number': row.get('vehicle_no', '').strip(),
                    'chassis_number': row.get('chassis_no', '').strip(),
                    'engine_number': row.get('engine_no', '').strip()
                }
            
            # Map insurance nominee fields
            if row.get('insurance_nominee') or row.get('insurance_relation'):
                insurance_info = {
                    'nominee_name': row.get('insurance_nominee', '').strip(),
                    'relation': row.get('insurance_relation', '').strip(),
                    'age': row.get('insurance_age', '').strip()
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
            
            # Add extended information to customer record
            customer_dict = customer.dict()
            if vehicle_info and any(vehicle_info.values()):
                customer_dict['vehicle_info'] = vehicle_info
            if insurance_info and any(insurance_info.values()):
                customer_dict['insurance_info'] = insurance_info
            if sales_info and any(sales_info.values()):
                customer_dict['sales_info'] = sales_info
            
            await db.customers.insert_one(customer_dict)
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
    import_job.processed_records = successful + failed
    import_job.errors = errors
    
    return ImportResult(
        job_id=import_job.id,
        status="completed",
        message=f"Import completed: {successful} successful, {failed} failed",
        total_records=len(data),
        successful_records=successful,
        failed_records=failed,
        errors=errors
    )

async def import_vehicles_data(data: List[Dict], import_job: ImportJob, user_id: str) -> ImportResult:
    """Import vehicles data"""
    successful = 0
    failed = 0
    errors = []
    
    valid_brands = ["TVS", "BAJAJ", "HERO", "HONDA", "TRIUMPH", "KTM", "SUZUKI", "APRILIA"]
    
    for idx, row in enumerate(data):
        try:
            # Get fields with fallback values (no longer required)
            brand = row.get('brand', '').upper().strip() or 'UNKNOWN'
            if brand != 'UNKNOWN' and brand not in valid_brands:
                brand = 'UNKNOWN'  # Use fallback instead of error
            
            vehicle_data = VehicleCreate(
                brand=brand,
                model=row.get('model', '').strip() or 'Unknown Model',
                chassis_no=row.get('chassis_no', '').strip() or 'Unknown Chassis',
                engine_no=row.get('engine_no', '').strip() or 'Unknown Engine',
                color=row.get('color', '').strip() or 'Unknown Color',
                key_no=row.get('key_no', '').strip() or 'Unknown Key',
                inbound_location=row.get('inbound_location', '').strip() or 'Unknown Location',
                page_number=row.get('page_number', '').strip() or None
            )
            
            vehicle = Vehicle(**vehicle_data.dict())
            await db.vehicles.insert_one(vehicle.dict())
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
    import_job.processed_records = successful + failed
    import_job.errors = errors
    
    return ImportResult(
        job_id=import_job.id,
        status="completed",
        message=f"Import completed: {successful} successful, {failed} failed",
        total_records=len(data),
        successful_records=successful,
        failed_records=failed,
        errors=errors
    )

async def import_spare_parts_data(data: List[Dict], import_job: ImportJob, user_id: str) -> ImportResult:
    """Import spare parts data"""
    successful = 0
    failed = 0
    errors = []
    
    for idx, row in enumerate(data):
        try:
            # Validate required fields
            required_fields = ['name', 'part_number', 'brand', 'quantity', 'unit_price']
            for field in required_fields:
                if not row.get(field):
                    raise ValueError(f"{field} is required")
            
            spare_part_data = SparePartCreate(
                name=row['name'].strip(),
                part_number=row['part_number'].strip(),
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
    import_job.processed_records = successful + failed
    import_job.errors = errors
    
    return ImportResult(
        job_id=import_job.id,
        status="completed",
        message=f"Import completed: {successful} successful, {failed} failed",
        total_records=len(data),
        successful_records=successful,
        failed_records=failed,
        errors=errors
    )

async def import_services_data(data: List[Dict], import_job: ImportJob, user_id: str) -> ImportResult:
    """Import services data"""
    successful = 0
    failed = 0
    errors = []
    
    for idx, row in enumerate(data):
        try:
            # Validate required fields
            required_fields = ['customer_name', 'customer_mobile', 'vehicle_number', 'service_type', 'amount']
            for field in required_fields:
                if not row.get(field):
                    raise ValueError(f"{field} is required")
            
            # Find or create customer
            customer_name = row['customer_name'].strip()
            customer_mobile = row['customer_mobile'].strip()
            
            existing_customer = await db.customers.find_one({"mobile": customer_mobile})
            if existing_customer:
                customer_id = existing_customer['id']
            else:
                # Create new customer
                customer_data = CustomerCreate(
                    name=customer_name,
                    mobile=customer_mobile,
                    address="Imported via service data"
                )
                customer = Customer(**customer_data.dict())
                await db.customers.insert_one(customer.dict())
                customer_id = customer.id
            
            service_data = ServiceCreate(
                customer_id=customer_id,
                vehicle_number=row['vehicle_number'].strip(),
                service_type=row['service_type'].strip(),
                description=row.get('description', '').strip(),
                amount=float(row['amount'])
            )
            
            # Generate job card number
            count = await db.services.count_documents({})
            job_card_number = f"JOB-{count + 1:06d}"
            
            service_dict = service_data.dict()
            service_dict['job_card_number'] = job_card_number
            service_dict['created_by'] = user_id
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
    import_job.processed_records = successful + failed
    import_job.errors = errors
    
    return ImportResult(
        job_id=import_job.id,
        status="completed",
        message=f"Import completed: {successful} successful, {failed} failed",
        total_records=len(data),
        successful_records=successful,
        failed_records=failed,
        errors=errors
    )

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