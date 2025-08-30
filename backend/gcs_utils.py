import os
import uuid
from google.cloud import storage
from datetime import datetime, timedelta

def generate_signed_url(bucket_name: str, blob_path: str) -> str:
    """Generate a signed URL for a GCS blob that expires in 7 days"""
    client = storage.Client()
    bucket = client.bucket(bucket_name)
    blob = bucket.blob(blob_path)
    
    url = blob.generate_signed_url(
        version="v4",
        expiration=datetime.utcnow() + timedelta(days=7),
        method="GET"
    )
    return url

def upload_product_image(upload_file, tenant_id, filename):
    bucket_name = os.getenv('GCS_BUCKET_NAME')
    if not bucket_name:
        raise Exception('GCS_BUCKET_NAME not set')
    ext = filename.split('.')[-1]
    unique_name = f"{uuid.uuid4()}_{filename}"
    blob_path = f"tenants/{tenant_id}/products/{unique_name}"
    client = storage.Client()
    bucket = client.bucket(bucket_name)
    blob = bucket.blob(blob_path)
    blob.upload_from_file(upload_file.file, content_type=upload_file.content_type)
    
    # Generate a signed URL
    url = generate_signed_url(bucket_name, blob_path)
    
    return {
        "url": url,
        "path": f"gs://{bucket_name}/{blob_path}"
    }

