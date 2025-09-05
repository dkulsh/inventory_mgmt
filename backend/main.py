from fastapi import FastAPI, Request, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from backend.api import products, orders, users, tenants, businesses
from backend.logging_config import setup_logging, get_logger, log_request, log_response, log_error
from backend.env_validation import validate_environment, validate_gcs_connection, log_environment_summary
import os
import time
from dotenv import load_dotenv

load_dotenv()

# Setup logging
environment = os.getenv("ENVIRONMENT", "development")
log_level = os.getenv("LOG_LEVEL", "INFO")
app_logger = setup_logging(environment, log_level)
logger = get_logger("main")

# Validate environment on startup
logger.info("Starting application initialization")
is_valid, validation_message = validate_environment()
if not is_valid:
    logger.error(f"Environment validation failed: {validation_message}")
    if environment == "production":
        logger.error("Exiting due to environment validation failure in production")
        exit(1)
else:
    logger.info("Environment validation passed")

# Log environment summary
log_environment_summary()

# Test GCS connection
if environment == "production":
    gcs_valid, gcs_message = validate_gcs_connection()
    if not gcs_valid:
        logger.error(f"GCS connection test failed: {gcs_message}")
        logger.error("Exiting due to GCS connection failure in production")
        exit(1)
    else:
        logger.info("GCS connection test passed")

app = FastAPI(title="Warehouse Inventory Management System")

# Request/Response logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    
    # Extract user info from JWT if present
    user_id = None
    auth_header = request.headers.get("authorization")
    if auth_header and auth_header.startswith("Bearer "):
        try:
            # Basic JWT parsing to extract user info (without verification for logging)
            import base64
            token = auth_header.split(" ")[1]
            payload = token.split(".")[1]
            # Add padding if needed
            payload += "=" * (4 - len(payload) % 4)
            decoded = base64.b64decode(payload)
            import json
            user_data = json.loads(decoded)
            user_id = user_data.get("sub", "unknown")
        except Exception:
            user_id = "invalid_token"
    
    # Log incoming request
    log_request(
        logger, 
        request.method, 
        str(request.url), 
        dict(request.headers),
        user_id=user_id
    )
    
    # Process request
    response = await call_next(request)
    
    # Calculate response time
    process_time = time.time() - start_time
    
    # Log outgoing response
    log_response(
        logger,
        response.status_code,
        process_time,
        response.headers.get("content-length")
    )
    
    return response

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

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler to catch and log all unhandled exceptions"""
    
    # Log the error with context
    log_error(
        logger,
        exc,
        context=f"Unhandled exception in {request.method} {request.url}",
        extra_data={
            "request_url": str(request.url),
            "request_method": request.method,
            "request_headers": dict(request.headers),
            "client_ip": request.client.host if request.client else None
        }
    )
    
    # Return appropriate response based on exception type
    if isinstance(exc, HTTPException):
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.detail, "error_type": "HTTPException"}
        )
    else:
        # For production, don't expose internal error details
        if environment == "production":
            return JSONResponse(
                status_code=500,
                content={"detail": "Internal server error", "error_type": "InternalError"}
            )
        else:
            return JSONResponse(
                status_code=500,
                content={
                    "detail": str(exc),
                    "error_type": type(exc).__name__,
                    "traceback": str(exc.__traceback__)
                }
            )
