# M M Motors — Two Wheeler Business Management System

Full-stack dealership management app for two-wheeler businesses: vehicle stock, sales, services, spare parts, billing, backup, and data import.

## Tech Stack

- **Backend:** Python / FastAPI / MongoDB Atlas (Motor async driver)
- **Frontend:** React / Tailwind CSS / shadcn/ui / Recharts
- **Auth:** JWT with bcrypt password hashing

## Quick Start

```bash
# 1. Backend
cd backend
cp .env.example .env        # Edit with your MongoDB URI + JWT secret
pip install -r requirements.txt
uvicorn server:app --reload --port 8001

# 2. Frontend
cd frontend
npm install
REACT_APP_BACKEND_URL=http://localhost:8001 npm start

# 3. Create first admin (one-time, only works when DB is empty)
curl -X POST http://localhost:8001/api/auth/bootstrap \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","email":"admin@mm.com","password":"YourStrongPass1","role":"admin","full_name":"Admin"}'
```

## Modules

| Module | Description | Key Features |
|--------|-------------|--------------|
| Dashboard | Business overview | Revenue stats, pending services, low stock alerts |
| Sales | Invoice & customer management | Create/edit invoices, customer CRUD, insurance tracking |
| Services | Job card & service tracking | Registration, job cards, service billing with GST, service due reminders |
| Vehicle Stock | Brand-based inventory | TVS, Bajaj, Hero, Honda, KTM, Royal Enfield + more |
| Spare Parts | Parts inventory & billing | Stock management, GST billing, low stock alerts |
| Backup | Data export/restore | JSON/Excel export, scheduled backups |
| Data Import | Bulk data import | CSV/Excel import for customers, vehicles, sales, services |

## API

All list endpoints support pagination: `?page=1&limit=100&sort=field&order=asc|desc`

Auth: All endpoints require `Authorization: Bearer <token>` except `/api/auth/login` and `/api/auth/bootstrap`.

Registration of new users requires admin JWT via `/api/auth/register`.

## Environment Variables

See `backend/.env.example` for all required variables:
- `MONGO_URL` — MongoDB connection string
- `DB_NAME` — Database name
- `JWT_SECRET_KEY` — Secret for JWT signing
- `CORS_ORIGINS` — Comma-separated allowed origins

## Project Structure

```
backend/
  server.py          # FastAPI app (all routes, models, services)
  .env.example       # Required environment variables
frontend/src/
  App.js             # Root router + auth context
  components/
    sales/           # Sales module (7 components)
    services/        # Services module (7 components)
    spare-parts/     # Spare parts module (8 components)
    vehicles/        # Vehicle stock module (5 components)
    Dashboard.js     # Main dashboard
    Layout.js        # Sidebar + header layout
    Login.js         # Auth page
  utils/
    helpers.js       # Shared utilities (formatCurrency, numberToWords, etc.)
```
