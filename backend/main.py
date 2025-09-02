from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from backend.api import products, orders, users, tenants, businesses
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Warehouse Inventory Management System")

# CORS (adjust origins as needed)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers FIRST
app.include_router(products.router, prefix="/api/v1/products", tags=["Products"])
app.include_router(orders.router, prefix="/api/v1/orders", tags=["Orders"])
app.include_router(users.router, prefix="/api/v1/users", tags=["Users"])
app.include_router(tenants.router, prefix="/api/v1/tenants", tags=["Tenants"])
app.include_router(businesses.router, prefix="/api/v1/businesses", tags=["Businesses"])

@app.get("/api/v1/health")
def health_check():
    return {"status": "ok"}

# Serve static files (frontend) - mount AFTER API routes
static_dir = os.path.join(os.path.dirname(__file__), "static")
if os.path.exists(static_dir):
    app.mount("/static", StaticFiles(directory=static_dir), name="static")

# Route handler for tenant details page
@app.get("/tenants/{tenant_id}")
async def tenant_details_page(tenant_id: int):
    return FileResponse(os.path.join(static_dir, "tenant-details.html"))
