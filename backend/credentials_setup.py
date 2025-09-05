import os
import json
from backend.logging_config import get_logger

logger = get_logger("credentials_setup")

def setup_google_credentials():
    """Setup Google Cloud credentials from GCP_SA_KEY environment variable"""
    
    # Check if GOOGLE_APPLICATION_CREDENTIALS is already set and file exists
    existing_creds = os.getenv('GOOGLE_APPLICATION_CREDENTIALS')
    if existing_creds and os.path.exists(existing_creds):
        logger.info(f"Using existing credentials file: {existing_creds}")
        return existing_creds
    
    # Get credentials from GCP_SA_KEY environment variable
    gcp_sa_key = os.getenv('GCP_SA_KEY')
    if not gcp_sa_key:
        logger.error("GCP_SA_KEY environment variable not set")
        raise Exception("GCP_SA_KEY environment variable not set")
    
    try:
        # Parse the JSON to validate it
        credentials_data = json.loads(gcp_sa_key)
        logger.info("GCP_SA_KEY contains valid JSON credentials")
    except json.JSONDecodeError as e:
        logger.error(f"GCP_SA_KEY contains invalid JSON: {str(e)}")
        raise Exception(f"GCP_SA_KEY contains invalid JSON: {str(e)}")
    
    # Create credentials file path
    credentials_path = '/app/service-account.json'
    
    try:
        # Write credentials to file
        with open(credentials_path, 'w') as f:
            f.write(gcp_sa_key)
        
        # Set file permissions (readable by owner only)
        os.chmod(credentials_path, 0o600)
        
        # Set GOOGLE_APPLICATION_CREDENTIALS environment variable
        os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = credentials_path
        
        logger.info(f"Successfully created credentials file: {credentials_path}")
        logger.info("GOOGLE_APPLICATION_CREDENTIALS environment variable set")
        
        return credentials_path
        
    except Exception as e:
        logger.error(f"Failed to create credentials file: {str(e)}")
        raise Exception(f"Failed to create credentials file: {str(e)}")

def validate_google_credentials():
    """Validate that Google Cloud credentials are properly set up"""
    
    try:
        # Setup credentials if needed
        credentials_path = setup_google_credentials()
        
        # Verify the file exists and is readable
        if not os.path.exists(credentials_path):
            raise Exception(f"Credentials file not found: {credentials_path}")
        
        # Verify the file contains valid JSON
        with open(credentials_path, 'r') as f:
            credentials_data = json.load(f)
        
        # Check for required fields
        required_fields = ['type', 'project_id', 'private_key', 'client_email']
        missing_fields = [field for field in required_fields if field not in credentials_data]
        
        if missing_fields:
            raise Exception(f"Credentials file missing required fields: {missing_fields}")
        
        logger.info("Google Cloud credentials validation successful")
        logger.info(f"Project ID: {credentials_data.get('project_id', 'unknown')}")
        logger.info(f"Service Account: {credentials_data.get('client_email', 'unknown')}")
        
        return True
        
    except Exception as e:
        logger.error(f"Google Cloud credentials validation failed: {str(e)}")
        return False
