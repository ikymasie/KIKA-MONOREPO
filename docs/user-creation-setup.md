# User Creation Script - Setup Guide

## Issue Fixed

The `create-user` script had module resolution issues due to ESM/CommonJS conflicts. This has been resolved by:

1. Creating `tsconfig.scripts.json` with CommonJS configuration
2. Updating the npm script to use the new tsconfig
3. Fixing import paths

## Current Status

✅ Module resolution fixed
⚠️ Requires Firebase service account credentials

## Firebase Setup Required

The script requires Firebase Admin SDK credentials to create users. Follow these steps:

### 1. Get Firebase Service Account Credentials

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Project Settings** → **Service Accounts**
4. Click **Generate New Private Key**
5. Download the JSON file

### 2. Configure Environment Variable

Copy the `.env.example` to `.env`:
```bash
cp .env.example .env
```

Edit `.env` and set the `FIREBASE_ADMIN_CREDENTIALS` variable with your service account JSON:

```bash
FIREBASE_ADMIN_CREDENTIALS={"type":"service_account","project_id":"your-project-id","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"...","client_id":"...","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"..."}
```

**Important:** The entire JSON should be on one line with escaped newlines in the private key.

### 3. Test the Script

Once configured, run:
```bash
npm run create-user -- --email clerk@gov.bw --first-name Registry --last-name Clerk --role registry_clerk
```

## Usage

```bash
npm run create-user -- --email <email> --first-name <name> --last-name <name> --role <role> [--password <password>]
```

### Available Roles

**Government Officers:**
- `registry_clerk`
- `intelligence_liaison`
- `legal_officer`
- `registrar`
- `director_cooperatives`
- `minister_delegate`

**Applicants:**
- `society_applicant`
- `cooperative_applicant`

**Regulators:**
- `super_regulator`
- `deduction_officer`
- `field_auditor`
- `compliance_officer`

**SACCOS Staff:**
- `saccos_admin`
- `loan_officer`
- `accountant`
- `member_service_rep`
- `credit_committee`

**Others:**
- `member`
- `external_auditor`
- `vendor`

### Examples

```bash
# Create a Registry Clerk
npm run create-user -- --email clerk@gov.bw --first-name Registry --last-name Clerk --role registry_clerk

# Create a Registrar with custom password
npm run create-user -- --email registrar@gov.bw --first-name John --last-name Doe --role registrar --password SecurePass123

# Create a Society Applicant
npm run create-user -- --email applicant@test.com --first-name Jane --last-name Smith --role society_applicant
```

## Troubleshooting

### Error: "Service account object must contain a string 'project_id' property"

**Cause:** Firebase credentials not configured or invalid

**Solution:** Follow the Firebase Setup steps above

### Error: "Cannot find module"

**Cause:** Module resolution issue

**Solution:** This should be fixed. If you still see this, ensure you're using the updated script:
```bash
npm run create-user -- --help
```

### Error: "Invalid role"

**Cause:** Role name doesn't match enum values

**Solution:** Use one of the available roles listed above (all lowercase with underscores)
