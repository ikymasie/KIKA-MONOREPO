# KIKA Platform - Multi-Tenant SACCOS Management System

A production-ready Next.js platform for managing Savings and Credit Co-operative Societies (SACCOS) in Botswana.

## Features

### Three-Tier Architecture
- **Regulator Portal**: DCD & Bank of Botswana oversight and compliance monitoring
- **SACCOS Admin Portal**: Complete operational management for individual societies
- **Member Portal**: Self-service access for SACCOS members

### Core Modules
- ✅ Member lifecycle management with KYC
- ✅ Delta-based deduction engine with MoF CSV generation
- ✅ Three-way reconciliation with automated journaling
- ✅ Double-entry accounting with financial reporting
- ✅ Loan management with guarantor tracking
- ✅ Insurance products with claims workflow
- ✅ Merchandise hire-purchase system
- ✅ Comprehensive RBAC with MFA support
- ✅ Immutable audit trail

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL with TypeORM
- **Authentication**: NextAuth.js
- **Styling**: Tailwind CSS
- **Charts**: Recharts

## Getting Started

### Prerequisites
- Node.js >= 18.0.0
- PostgreSQL database
- npm >= 9.0.0

### Installation

1. Clone the repository:
```bash
cd KIKA
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Configure your database credentials in `.env`:
```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=your_db_username
DATABASE_PASSWORD=your_db_password
DATABASE_NAME=kika_platform
```

5. Run database migrations:
```bash
npm run migration:run
```

6. Start the development server:
```bash
npm run dev
```

7. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Management

### Generate a new migration:
```bash
npm run migration:generate -- src/migrations/MigrationName
```

### Run migrations:
```bash
npm run migration:run
```

### Revert last migration:
```bash
npm run migration:revert
```

### Sync schema (development only):
```bash
npm run schema:sync
```

## Project Structure

```
KIKA/
├── app/                    # Next.js app directory
│   ├── admin/             # SACCOS admin portal
│   ├── member/            # Member self-service portal
│   ├── regulator/         # Regulator oversight portal
│   └── api/               # API routes
├── src/
│   ├── entities/          # TypeORM entities
│   ├── config/            # Database configuration
│   └── migrations/        # Database migrations
├── lib/
│   ├── accounting/        # General ledger & financial reporting
│   ├── deductions/        # Delta engine & reconciliation
│   ├── rbac.ts           # Role-based access control
│   └── utils.ts          # Utility functions
└── components/            # Reusable React components
```

## Key Entities

- **Tenant**: Multi-tenant isolation for each SACCOS
- **User**: Authentication with role-based permissions
- **Member**: SACCOS member with KYC and lifecycle management
- **Products**: Savings, Loans, Insurance, Merchandise
- **Deductions**: Delta-based deduction requests and reconciliation
- **Accounting**: Chart of accounts, transactions, journal entries
- **AuditLog**: Immutable audit trail for all actions

## RBAC Roles

### Regulator Tier
- Super Regulator
- Deduction Officer
- Field Auditor
- Compliance Officer

### Tenant Tier
- SACCOS Admin
- Loan Officer
- Accountant
- Member Service Rep
- Credit Committee

### Member Tier
- Member
- External Auditor
- Vendor

## Production Deployment

1. Set `NODE_ENV=production` in your environment
2. Configure production database credentials
3. Set a secure `NEXTAUTH_SECRET`
4. Build the application:
```bash
npm run build
```

5. Start the production server:
```bash
npm start
```

## Security Features

- Multi-factor authentication for admin roles
- Row-level security through multi-tenant architecture
- Immutable audit logs
- Encrypted password storage with bcrypt
- Session-based authentication
- CSRF protection

## License

Proprietary - All rights reserved

## Support

For support, please contact the development team.
