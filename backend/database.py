import os
import logging
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "3306")
DB_NAME = os.getenv("DB_NAME", "inventory_mgmt")
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")

# Log environment variables (without sensitive data)
logger.info(f"Environment: {ENVIRONMENT}")
logger.info(f"DB_HOST: {DB_HOST}")
logger.info(f"DB_USER: {DB_USER}")
logger.info(f"DB_NAME: {DB_NAME}")
logger.info(f"DB_PORT: {DB_PORT}")

# Handle Cloud SQL connection
if ENVIRONMENT == "production":
    logger.info("Using production environment - configuring Cloud SQL connection")
    # For Cloud SQL, use Unix socket connection
    if "/cloudsql/" in DB_HOST:
        # Unix socket path (e.g., /cloudsql/project:region:instance)
        SQLALCHEMY_DATABASE_URL = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@/{DB_NAME}?unix_socket={DB_HOST}"
        logger.info(f"Using existing Unix socket path: {DB_HOST}")
    elif ":" in DB_HOST and "us-central1" in DB_HOST:
        # Cloud SQL connection name (e.g., project:region:instance)
        # Convert to Unix socket path
        unix_socket_path = f"/cloudsql/{DB_HOST}"
        SQLALCHEMY_DATABASE_URL = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@/{DB_NAME}?unix_socket={unix_socket_path}"
        logger.info(f"Converted Cloud SQL connection name to Unix socket: {unix_socket_path}")
    else:
        # For Cloud SQL with public IP
        SQLALCHEMY_DATABASE_URL = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
        logger.info(f"Using public IP connection: {DB_HOST}:{DB_PORT}")
else:
    # Local development
    logger.info("Using development environment - configuring local connection")
    if DB_PASSWORD:
        SQLALCHEMY_DATABASE_URL = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    else:
        SQLALCHEMY_DATABASE_URL = f"mysql+pymysql://{DB_USER}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    logger.info(f"Local connection string: {SQLALCHEMY_DATABASE_URL}")

# Log the final connection string (without password)
safe_connection_string = SQLALCHEMY_DATABASE_URL.replace(DB_PASSWORD, "***") if DB_PASSWORD else SQLALCHEMY_DATABASE_URL
logger.info(f"Final connection string: {safe_connection_string}")

engine = create_engine(SQLALCHEMY_DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
