# Debugging Guide for Product Image Upload 500 Error

## Overview
This guide explains the comprehensive logging improvements made to help debug the 500 error when uploading product images.

## Logging Improvements Made

### 1. Structured Logging Configuration (`backend/logging_config.py`)
- **JSON-formatted logs** for production environments
- **Structured logging** with timestamps, log levels, and context
- **Exception tracking** with full stack traces
- **Custom formatters** for different environments

### 2. Global Exception Handler (`backend/main.py`)
- **Catches all unhandled exceptions** across the application
- **Logs detailed error context** including request details
- **Returns appropriate error responses** based on environment
- **Preserves security** by not exposing internal details in production

### 3. Request/Response Logging Middleware (`backend/main.py`)
- **Logs all incoming requests** with method, URL, headers, and user info
- **Tracks response times** and status codes
- **Extracts user information** from JWT tokens for better debugging
- **Logs response sizes** for performance monitoring

### 4. Enhanced Upload Endpoint (`backend/api/products.py`)
- **Added authentication** - endpoint now requires valid JWT token
- **Comprehensive validation** - file type, size, and tenant access checks
- **Detailed logging** at each step of the upload process
- **Better error handling** with specific error messages
- **Tenant access validation** - users can only upload to their own tenant

### 5. GCS Utilities Logging (`backend/gcs_utils.py`)
- **Environment validation** - checks for required GCS settings
- **Connection testing** - validates GCS bucket access
- **Step-by-step logging** of the upload process
- **Error context** with detailed debugging information

### 6. Environment Validation (`backend/env_validation.py`)
- **Startup validation** of all required environment variables
- **GCS connection testing** on application startup
- **Configuration summary** logging
- **Production safety** - application exits if critical settings are missing

## How to Debug the 500 Error

### 1. Check Application Startup Logs
Look for these log entries when the application starts:
```
Starting application initialization
Environment validation passed
GCS connection test passed
```

If you see errors here, the issue is with environment configuration.

### 2. Check Request Logs
When you make the upload request, you should see:
```
Incoming request: POST /api/v1/products/upload-image
Image upload attempt started
```

### 3. Check Upload Process Logs
The upload process will log each step:
```
Starting image upload process
Using GCS bucket: your-bucket-name
Generated blob path: tenants/1/products/uuid_filename.png
Uploading file to GCS: tenants/1/products/uuid_filename.png
File uploaded successfully to tenants/1/products/uuid_filename.png
Generating signed URL for uploaded file
Image upload completed successfully
```

### 4. Check Error Logs
If an error occurs, you'll see detailed logs like:
```
Error occurred: [specific error message]
Failed to upload image for tenant 1
```

## Common Issues and Solutions

### 1. Missing Environment Variables
**Error**: `GCS_BUCKET_NAME not set`
**Solution**: Ensure `GCS_BUCKET_NAME` is set in your environment

### 2. Invalid GCS Credentials
**Error**: `GCP_SA_KEY contains invalid JSON` or `Failed to create credentials file`
**Solution**: Check that `GCP_SA_KEY` contains valid JSON content of your service account key

### 3. Bucket Access Issues
**Error**: `GCS bucket not found or is not accessible`
**Solution**: Verify the bucket exists and the service account has proper permissions

### 4. Authentication Issues
**Error**: `Not enough permissions` or `Cannot upload to different tenant`
**Solution**: Ensure the user has proper role and tenant access

### 5. File Validation Issues
**Error**: `File must be an image` or `File too large`
**Solution**: Check file type and size before upload

## Environment Variables Required

Make sure these are set in your production environment:
```bash
GCS_BUCKET_NAME=your-bucket-name
GCP_SA_KEY={"type":"service_account","project_id":"your-project",...}  # Full JSON content
JWT_SECRET_KEY=your-secret-key
DB_HOST=your-db-host
DB_USER=your-db-user
DB_NAME=your-db-name
ENVIRONMENT=production
LOG_LEVEL=INFO
```

**Note**: The `GCP_SA_KEY` should contain the entire JSON content of your service account key file, not a file path.

## Testing the Fix

1. **Deploy the updated application** to Google Cloud Run
2. **Check the startup logs** to ensure environment validation passes
3. **Try uploading an image** and check the detailed logs
4. **Look for specific error messages** in the logs to identify the root cause

## Log Format

In production, logs are in JSON format for easy parsing:
```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "level": "ERROR",
  "logger": "inventory_mgmt.products",
  "message": "Image upload failed",
  "module": "products",
  "function": "upload_image",
  "line": 169,
  "extra_fields": {
    "error": {
      "type": "Exception",
      "message": "GCS_BUCKET_NAME not set",
      "context": "Image upload failed for tenant 1"
    }
  }
}
```

## Next Steps

1. Deploy these changes to your Google Cloud Run service
2. Monitor the logs when attempting to upload an image
3. The detailed logs will show exactly where the upload process is failing
4. Use the specific error messages to fix the underlying issue

The logging improvements will provide complete visibility into the upload process, making it much easier to identify and fix the 500 error.
