from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import init_db, get_connection
from app.services.seed_data import seed_database
from app.routers import dashboard, invoices, audit, registry, demo, buyer_acceptance, submissions, fraud_sim

app = FastAPI(
    title="InvoiceTrust AI",
    description="AI-Powered Invoice Financing with Hybrid Audit Architecture & Fraud Mitigation Engine",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS configuration restricted to local dev frontend and common localhost ports
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    init_db()
    conn = get_connection()
    try:
        seed_database(conn)
        conn.commit()
    finally:
        conn.close()

# Include routers under /api
app.include_router(dashboard.router, prefix="/api")
app.include_router(invoices.router, prefix="/api")
app.include_router(audit.router, prefix="/api")
app.include_router(registry.router, prefix="/api")
app.include_router(demo.router, prefix="/api")
app.include_router(buyer_acceptance.router, prefix="/api")
app.include_router(submissions.router, prefix="/api")
app.include_router(fraud_sim.router, prefix="/api")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
