# M M Motors - Vehicle Service Business Management System

## Original Problem Statement
A full-stack application for managing a vehicle service business including:
- Customer management
- Vehicle inventory management
- Sales invoicing
- Service billing and job cards
- Insurance tracking
- Spare parts inventory

## Tech Stack
- **Frontend**: React with Shadcn/UI components
- **Backend**: FastAPI (Python)
- **Database**: MongoDB

## Core Features Implemented

### Sales Module
- Create Sales Invoice with customer and vehicle details
- View/Edit/Delete Invoices
- Vehicle search by chassis number with auto-fill
- PDF invoice generation and download
- Customer management
- Insurance nominee tracking

### Service Module
- Registration workflow (one-time customer/vehicle entry)
- Job Card workflow (recurring service instances)
- Service billing with payment status tracking
- Spare parts inventory management with automatic stock reduction
- Service Number and Kilometers Driven tracking in Job Cards

### Recent Changes (Jan 2025)

#### Bug Fixes
1. **Invoice UI Refresh Bug** - Fixed issue where edited invoices didn't reflect in UI without manual page refresh
   - Root cause: Array mutation in `filterInvoices` function
   - Fix: Used spread operator `[...invoices]` to create immutable copy
   - File: `/app/frontend/src/components/Sales.js` (line 1525)

2. **Service Due Delete Bug** - Fixed inability to delete records from Service Due Schedule table
   - Root cause: Delete function tried to delete underlying service records which didn't work for derived data
   - Fix: Implemented `dismissed_service_due` collection to track dismissed records
   - Records are now filtered out from view rather than truly deleted
   - File: `/app/backend/server.py`, `/app/frontend/src/components/Services.js`

#### New Features
1. **Service Number field** - Added to Job Card form, list view, view modal, and edit modal
   - Allows user to enter custom service reference number
   - Optional field (string)
   - Displayed in purple color when set
   
2. **Kilometers Driven field** - Added to Job Card form, list view, view modal, and edit modal
   - Tracks odometer reading at time of service
   - Optional field (integer)
   - Displayed in green with "km" suffix when set

3. **Service Due Bulk Delete** - Added bulk delete option for Service Due Schedule table
   - Checkbox selection for multiple records
   - "Delete Selected" button appears when records selected
   - Both single delete (trash icon) and bulk delete supported
   - Summary cards update immediately after deletions

**Implementation details:**
- **New Job Card form**: Both fields added (Service Details & Vehicle Information sections)
- **Job Cards table**: Service No. and KMs Driven columns added (replaced Vehicle Year)
- **View Job Card modal**: Service Number shown in Job Card Info, KMs in Vehicle Info
- **Edit Job Card modal**: Both fields editable
- **CSV Export**: Updated to include both new fields

Files modified:
- `/app/frontend/src/components/Services.js` - Complete UI implementation
- `/app/backend/server.py` - Service, ServiceCreate, ServiceUpdate models

## Architecture

```
/app/
├── backend/
│   ├── server.py              # FastAPI main app
│   └── .env                   # Backend environment variables
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Sales.js       # Sales management (invoices, customers)
│   │   │   ├── Services.js    # Service management (registrations, job cards, billing)
│   │   │   └── ui/            # Shadcn components
│   │   └── ...
│   └── .env                   # Frontend environment variables
└── memory/
    └── PRD.md                 # This file
```

## Key API Endpoints
- `GET/POST /api/sales` - Sales/Invoice operations
- `PUT /api/sales/{id}` - Update invoice
- `GET/POST /api/customers` - Customer management
- `GET/POST /api/vehicles` - Vehicle inventory
- `GET/POST /api/services` - Job Cards (includes service_number, kms_driven)
- `PUT /api/services/{id}` - Update job card
- `GET/POST /api/service-bills` - Service billing
- `PUT /api/service-bills/{id}/status` - Update bill payment status
- `GET/POST /api/dismissed-service-due` - Dismissed service due records
- `POST /api/dismissed-service-due/bulk` - Bulk dismiss service due records
- `DELETE /api/dismissed-service-due/{key}` - Restore dismissed record

## Known Technical Debt
- **Monolithic Components**: `Sales.js` (~6500 lines) and `Services.js` (~5000+ lines) are very large
- Recommended: Break into smaller, single-responsibility components

## Backlog / Future Tasks
1. **(P1)** Refactor `Sales.js` into smaller components (ViewInvoices, CreateInvoice, EditInvoiceModal, etc.)
2. **(P1)** Refactor `Services.js` into smaller components (JobCards, Registrations, ServiceBilling, etc.)
3. **(P2)** Add comprehensive error handling and loading states across all forms
4. **(P2)** Add form validation feedback

## Test Reports
- `/app/test_reports/iteration_1.json` - Invoice edit UI refresh bug fix verification
- `/app/test_reports/iteration_2.json` - Service Number and Kilometers Driven fields in New Job Card form
- `/app/test_reports/iteration_3.json` - Service Number and KMs Driven in Job Card list, view, and edit
- `/app/test_reports/iteration_4.json` - Service Due delete and bulk delete functionality
- `/app/tests/test_job_card_new_fields.py` - Backend API tests for job card fields
- `/app/tests/test_service_due_delete.py` - Backend API tests for service due delete

---
Last Updated: January 3, 2025
