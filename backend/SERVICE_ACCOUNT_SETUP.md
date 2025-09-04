# Google Cloud Service Account Setup

## Overview
This application uses Google Cloud Storage for image uploads. You need to set up a service account to enable this functionality.

## Setup Instructions

### 1. Create a Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Cloud Storage API

### 2. Create a Service Account
1. Go to IAM & Admin > Service Accounts
2. Click "Create Service Account"
3. Enter a name and description
4. Click "Create and Continue"
5. Grant the "Storage Admin" role
6. Click "Done"

### 3. Generate Service Account Key
1. Click on the created service account
2. Go to the "Keys" tab
3. Click "Add Key" > "Create new key"
4. Choose "JSON" format
5. Download the key file

### 4. Configure the Application
1. Rename the downloaded file to `service-account.json`
2. Place it in the `backend/` directory
3. The file should be ignored by git (already configured in .gitignore)

### 5. Environment Variables (Alternative)
Instead of using a service account file, you can set environment variables:
```bash
export GOOGLE_APPLICATION_CREDENTIALS="path/to/service-account.json"
export GCS_BUCKET_NAME="your-bucket-name"
```

## Security Notes
- Never commit the actual service account file to version control
- Use the template file (`service-account.json.template`) as a reference
- Rotate service account keys regularly
- Use least privilege principle for service account permissions

## Troubleshooting
- Ensure the service account has proper permissions
- Check that the Cloud Storage API is enabled
- Verify the bucket name is correct
- Make sure the service account file path is correct
