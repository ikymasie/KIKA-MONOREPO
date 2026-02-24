# Configuration and Customization for Single Tenant

By default, the Saccoss platform supports multiple SACCOs via a multi-tenant architecture. For an on-premise, single-institution deployment, this architectural overhead must be simplified or bypassed so that the platform functions purely for the host organization.

## 1. Bypassing Multi-Tenancy Logic

The multi-tenant nature of the platform relies heavily on identifying the `tenantId`. When self-hosting for one institution, this context switch is unnecessary.

### Hardcoding Single Tenant Configuration

To avoid massive rewrites of all database entities, it is best to mock the multi-tenant concept by enforcing a single, "Global" tenant.

1. **Database Setup:**
   Insert a single record into the `Tenant` table in MySQL during database setup with details of your institution. Let's assume its UUID or incremental ID is `default-tenant-1`.
2. **Override the Middleware Context:**
   Update the Context API or Next.js route middleware that handles tenant detection. Instead of querying the database for a `tenantId` based on the URL domain (e.g., `saccos.cloudplatform.com`), the application middleware should strictly inject a hardcoded default `tenantId` into all sessions and database operations.

```typescript
// Example Implementation in src/db/services/BaseService.ts or global middleware:
// Ensure every query runs against the singleton tenant.
const SINGLE_TENANT_ID = 'default-tenant-1'; 

// Apply this filter globally in your services
return this.repository.find({
    where: { 
        tenant: { id: SINGLE_TENANT_ID } 
    }
});
```

### Route Parameter Adjustments

If the URLs in the application structure look like `/v1/[tenantId]/dashboard`, you may opt to rewrite these routes to omit `[tenantId]` entirely.
However, the path of least resistance for refactoring is to intercept `[tenantId]` at the routing layer, ignore its value, and implicitly apply the singular local `tenantId`.

## 2. Removing Public SaaS Landing Pages

Since the platform is designed to be internal-only (for admins and internal members on an intranet), all public SaaS landing pricing pages or marketing materials should be removed or completely restricted.

1. **Restrict the Application Root `/`:**
    Modify the root route file `app/page.tsx` (the public landing page). Replace the marketing UI components with an immediate server-side redirect to the login portal.

    ```tsx
    import { redirect } from "next/navigation";
    
    export default function IndexPage() {
        // Force all hits to the marketing page straight to the internal login portal.
        redirect("/auth/signin");
    }
    ```

2. **Adjust Global Security (`middleware.ts`):**
    Ensure the global Next.js middleware is configured to protect all internal resources.
    * No anonymous user should be able to view `/register-tenant` or subscription setup screens.
    * Delete or disable any routes corresponding to standard SaaS onboarding flows that do not relate to internal user administration.
    * Ensure all data-fetching API calls enforce the presence of a valid, authenticated user session.
