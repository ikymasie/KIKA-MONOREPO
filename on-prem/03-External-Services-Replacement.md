# External Service Replacements

Moving the Saccoss application on-premise requires swapping out cloud-native services for self-hosted or local alternatives. Here is a technical breakdown of the necessary code changes.

## 1. Replacing Firebase Authentication

Currently, Firebase handles generic user authentication (passwords, OTPs) and Firebase Admin SDK is used on the server `/api/*` routes to parse session cookies.

**Recommended On-Premise Solution:** NextAuth.js (Auth.js) combined with JWTs.

### Required Code Changes

1. **Remove Dependencies:**

    ```bash
    npm uninstall firebase firebase-admin
    ```

2. **Install NextAuth:**

    ```bash
    npm install next-auth bcryptjs
    npm install --save-dev @types/bcryptjs
    ```

3. **Create Auth Config (`app/api/auth/[...nextauth]/route.ts`):**
    Configure the `CredentialsProvider`. User passwords should be hashed and verified against the existing `User` table via TypeORM.
4. **Update Session Interfaces:**
    Replace the current `firebase-auth-hooks.ts` with NextAuth's `useSession()` hooks to ensure role-based access control (RBAC) checks continue to function correctly.
5. **Modify Login Routes:**
    Currently, login talks to Firebase which sets a session cookie. This must be refactored to use standard NextAuth `signIn('credentials', { email, password })`.

## 2. Replacing Firebase Storage

Currently, PDF files, KYC images, and auditor working papers are pushed to Firebase Storage via `firebase-storage.ts`.

**Recommended On-Premise Solution:** Local API Routes with Node `fs` or `MinIO`.

### Required Code Changes (Local Storage Approach)

1. **Create an Upload API Route (`app/api/upload/route.ts`):**
    Create a new endpoint that accepts `multipart/form-data` and uses Node.js `fs` and `path` modules to save files into a dedicated `.gitignore`d directory like `/uploads/` situated at the project root.
2. **Update File Entities:**
    When an image is successfully stored locally, the database should record the local file path URL structure (e.g., `/api/download?path=/uploads/kyc/user_1.png`) instead of the Firebase Google Cloud Storage URL.
3. **Replace Client-Side Upload Methods:**
    Update functions in `lib/firebase-storage.ts` to instead use standard `fetch()` or `axios.post()` directed toward the new internal upload endpoint (`/api/upload`).
    *Example:* `uploadKycDocument(file: File)` should POST to your local API route instead of `uploadBytes()`.

## 3. Disabling SMS/Email External Backends (Optional)

If the internal network does not have access to the outside internet, external APIs for notifications will fail.

* **SMS:** Replace the `sms-service.ts` HTTP calls to SMS Portal with a local appliance integration (e.g., Kannel) or disable it entirely via feature flags in the `.env` file (`ENABLE_SMS=false`).
* **Email:** Point the `nodemailer` transporter in `lib/email-service.ts` to `localhost:25` or the internal corporate Microsoft Exchange / Postfix relay server. No code changes are required beyond altering the `.env` variables (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`).
