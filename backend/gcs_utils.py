import os
import uuid
from google.cloud import storage
from datetime import datetime, timedelta
from backend.logging_config import get_logger, log_error
from backend.credentials_setup import setup_google_credentials

logger = get_logger("gcs_utils")

def generate_signed_url(bucket_name: str, blob_path: str) -> str:
    """Generate a signed URL for a GCS blob that expires in 7 days"""
    logger.info(f"Generating signed URL for {blob_path} in bucket {bucket_name}")
    
    try:
        # Setup credentials if needed
        setup_google_credentials()
        
        client = storage.Client()
        bucket = client.bucket(bucket_name)
        blob = bucket.blob(blob_path)
        
        # Check if blob exists
        if not blob.exists():
            logger.warning(f"Blob {blob_path} does not exist in bucket {bucket_name}")
            raise Exception(f"Blob {blob_path} not found")
        
        url = blob.generate_signed_url(
            version="v4",
            expiration=datetime.utcnow() + timedelta(days=7),
            method="GET"
        )
        
        logger.info(f"Successfully generated signed URL for {blob_path}")
        return url
        
    except Exception as e:
        log_error(
            logger,
            e,
            context=f"Failed to generate signed URL for {blob_path}",
            extra_data={
                "bucket_name": bucket_name,
                "blob_path": blob_path
            }
        )
        raise

def upload_product_image(upload_file, tenant_id, filename):
    """Upload product image to Google Cloud Storage"""
    
    logger.info(f"Starting image upload process", extra={
        "extra_fields": {
            "upload": {
                "tenant_id": tenant_id,
                "filename": filename,
                "content_type": upload_file.content_type
            }
        }
    })
    
    try:
        # Validate environment variables
        bucket_name = os.getenv('GCS_BUCKET_NAME')
        if not bucket_name:
            logger.error("GCS_BUCKET_NAME environment variable not set")
            raise Exception('GCS_BUCKET_NAME not set')
        
        # Setup Google Cloud credentials
        setup_google_credentials()
        
        logger.info(f"Using GCS bucket: {bucket_name}")
        
        # Generate unique filename
        ext = filename.split('.')[-1] if '.' in filename else ''
        unique_name = f"{uuid.uuid4()}_{filename}"
        blob_path = f"tenants/{tenant_id}/products/{unique_name}"
        
        logger.info(f"Generated blob path: {blob_path}")
        
        # Initialize GCS client and upload
        client = storage.Client()
        bucket = client.bucket(bucket_name)
        blob = bucket.blob(blob_path)
        
        # Check if bucket exists
        if not bucket.exists():
            logger.error(f"GCS bucket {bucket_name} does not exist")
            raise Exception(f'GCS bucket {bucket_name} not found')
        
        logger.info(f"Uploading file to GCS: {blob_path}")
        
        # Upload the file
        blob.upload_from_file(
            upload_file.file, 
            content_type=upload_file.content_type
        )
        
        logger.info(f"File uploaded successfully to {blob_path}")
        
        # Generate a signed URL
        logger.info(f"Generating signed URL for uploaded file")
        url = generate_signed_url(bucket_name, blob_path)
        
        result = {
            "url": url,
            "path": f"gs://{bucket_name}/{blob_path}"
        }
        
        logger.info(f"Image upload completed successfully", extra={
            "extra_fields": {
                "upload_result": {
                    "tenant_id": tenant_id,
                    "filename": filename,
                    "blob_path": blob_path,
                    "gcs_path": result["path"]
                }
            }
        })
        
        return result
        
    except Exception as e:
        log_error(
            logger,
            e,
            context=f"Failed to upload image for tenant {tenant_id}",
            extra_data={
                "tenant_id": tenant_id,
                "filename": filename,
                "content_type": upload_file.content_type,
                "bucket_name": bucket_name,
                "gcp_sa_key_set": "✓" if os.getenv('GCP_SA_KEY') else "✗"
            }
        )
        raise

