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

### Bug Fixes Completed (Jan 2025)
1. **Invoice UI Refresh Bug** - Fixed issue where edited invoices didn't reflect in UI without manual page refresh
   - Root cause: Array mutation in `filterInvoices` function
   - Fix: Used spread operator `[...invoices]` to create immutable copy
   - File: `/app/frontend/src/components/Sales.js` (line 1525)

2. Authentication token verification error (KeyError: 'id')
3. Bulk status updates on job card page
4. Service bill deletion
5. Service Due Schedule date defaults
6. Vehicle details not displaying in View Invoices

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
- `GET/POST /api/service-bills` - Service billing
- `PUT /api/service-bills/{id}/status` - Update bill payment status

## Known Technical Debt
- **Monolithic Components**: `Sales.js` and `Services.js` are very large files handling multiple responsibilities
- Recommended: Break into smaller, single-responsibility components

## Backlog / Future Tasks
1. **(P1)** Refactor `Sales.js` into smaller components (ViewInvoices, EditInvoiceModal, etc.)
2. **(P1)** Refactor `Services.js` into smaller components (ViewRegistration, JobCards, etc.)
3. **(P2)** Add comprehensive error handling across all forms
4. **(P2)** Add loading states for all async operations

## Test Reports
- `/app/test_reports/iteration_1.json` - Invoice edit UI refresh bug fix verification

---
Last Updated: January 3, 2025
