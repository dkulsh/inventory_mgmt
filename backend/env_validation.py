import os
from backend.logging_config import get_logger

logger = get_logger("env_validation")

def validate_environment():
    """Validate all required environment variables are set"""
    
    required_vars = {
        'GCS_BUCKET_NAME': 'Google Cloud Storage bucket name',
        'GCP_SA_KEY': 'Google Cloud service account JSON key',
        'JWT_SECRET_KEY': 'JWT secret key for token signing',
        'DB_HOST': 'Database host',
        'DB_USER': 'Database username',
        'DB_NAME': 'Database name'
    }
    
    missing_vars = []
    invalid_vars = []
    
    logger.info("Validating environment variables")
    
    for var, description in required_vars.items():
        value = os.getenv(var)
        if not value:
            missing_vars.append(f"{var} ({description})")
            logger.error(f"Missing required environment variable: {var}")
        else:
            logger.info(f"✓ {var} is set")
            
            # Additional validation for specific variables
            if var == 'GCP_SA_KEY':
                try:
                    import json
                    json.loads(value)  # Validate JSON format
                    logger.info(f"✓ {var} contains valid JSON")
                except json.JSONDecodeError:
                    invalid_vars.append(f"{var} - Invalid JSON format")
                    logger.error(f"GCP_SA_KEY contains invalid JSON")
            elif var == 'GCS_BUCKET_NAME' and not value.strip():
                invalid_vars.append(f"{var} - Empty value")
                logger.error(f"GCS_BUCKET_NAME is empty")
    
    # Validate database connection string format
    db_host = os.getenv('DB_HOST', '')
    if db_host and ':' in db_host and 'us-central1' in db_host:
        logger.info(f"Using Cloud SQL connection: {db_host}")
    elif db_host and db_host.startswith('/cloudsql/'):
        logger.info(f"Using Cloud SQL Unix socket: {db_host}")
    elif db_host:
        logger.info(f"Using database host: {db_host}")
    
    # Log validation results
    if missing_vars or invalid_vars:
        error_msg = "Environment validation failed:\n"
        if missing_vars:
            error_msg += f"Missing variables: {', '.join(missing_vars)}\n"
        if invalid_vars:
            error_msg += f"Invalid variables: {', '.join(invalid_vars)}\n"
        
        logger.error(error_msg)
        return False, error_msg
    else:
        logger.info("✓ All environment variables validated successfully")
        return True, "All environment variables are valid"

def validate_gcs_connection():
    """Validate Google Cloud Storage connection"""
    try:
        from google.cloud import storage
        from backend.credentials_setup import setup_google_credentials
        
        bucket_name = os.getenv('GCS_BUCKET_NAME')
        if not bucket_name:
            return False, "GCS_BUCKET_NAME not set"
        
        # Setup credentials first
        setup_google_credentials()
        
        logger.info(f"Testing GCS connection to bucket: {bucket_name}")
        
        client = storage.Client()
        bucket = client.bucket(bucket_name)
        
        # Test if bucket exists and is accessible
        if not bucket.exists():
            return False, f"GCS bucket {bucket_name} does not exist or is not accessible"
        
        # Test if we can list objects (basic permission check)
        try:
            list(bucket.list_blobs(max_results=1))
            logger.info("✓ GCS connection test successful")
            return True, "GCS connection successful"
        except Exception as e:
            return False, f"GCS permission error: {str(e)}"
            
    except Exception as e:
        logger.error(f"GCS connection test failed: {str(e)}")
        return False, f"GCS connection failed: {str(e)}"

def log_environment_summary():
    """Log a summary of the current environment configuration"""
    environment = os.getenv('ENVIRONMENT', 'development')
    logger.info(f"Environment: {environment}")
    
    # Log database configuration (without sensitive data)
    db_host = os.getenv('DB_HOST', 'not set')
    db_user = os.getenv('DB_USER', 'not set')
    db_name = os.getenv('DB_NAME', 'not set')
    db_port = os.getenv('DB_PORT', '3306')
    
    logger.info(f"Database: {db_user}@{db_host}:{db_port}/{db_name}")
    
    # Log GCS configuration
    gcs_bucket = os.getenv('GCS_BUCKET_NAME', 'not set')
    gcp_sa_key_set = "✓" if os.getenv('GCP_SA_KEY') else "✗"
    
    logger.info(f"GCS Bucket: {gcs_bucket}")
    logger.info(f"GCP Service Account Key: {gcp_sa_key_set}")
    
    # Log JWT configuration
    jwt_secret_set = "✓" if os.getenv('JWT_SECRET_KEY') else "✗"
    logger.info(f"JWT Secret: {jwt_secret_set}")
