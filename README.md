# MM Motors — Two Wheeler Dealership Management System

Full-stack business management app for two-wheeler dealerships.

## Setup

```bash
cp backend/.env.example backend/.env   # Edit with your MongoDB URI
cd backend && pip install -r requirements.txt && uvicorn server:app --reload --port 8001
cd frontend && npm install && REACT_APP_BACKEND_URL=http://localhost:8001 npm start
```

## Deployment

- **Backend:** Render (free) — set PYTHON_VERSION=3.11.12
- **Frontend:** Vercel (free) — set REACT_APP_BACKEND_URL to your Render URL
- **Database:** MongoDB Atlas (free M0 tier)
