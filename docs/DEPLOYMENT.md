# KIKA Platform - Production Deployment Guide

## Prerequisites

Before deploying, ensure you have:
- PostgreSQL database (v12 or higher)
- Node.js 18+ installed
- Database credentials ready

## Step 1: Database Setup

1. Create a PostgreSQL database:
```sql
CREATE DATABASE kika_platform;
CREATE USER kika_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE kika_platform TO kika_user;
```

2. Note your database credentials:
- Host
- Port (default: 5432)
- Username
- Password
- Database name

## Step 2: Environment Configuration

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Edit `.env` and add your database credentials:
```env
DATABASE_HOST=your_db_host
DATABASE_PORT=5432
DATABASE_USERNAME=kika_user
DATABASE_PASSWORD=your_secure_password
DATABASE_NAME=kika_platform
DATABASE_SSL=true

NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=generate_a_secure_random_string_here
NODE_ENV=production
```

3. Generate a secure NEXTAUTH_SECRET:
```bash
openssl rand -base64 32
```

## Step 3: Install Dependencies

```bash
npm install
```

## Step 4: Run Database Migrations

```bash
npm run migration:run
```

This will create all necessary tables and schema.

## Step 5: Seed Initial Data (Optional)

Create an initial super regulator user by running SQL:
```sql
INSERT INTO users (id, email, "passwordHash", "firstName", "lastName", role, status, "mfaEnabled", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'admin@mof.gov.bw',
  '$2a$10$...',  -- Use bcrypt to hash your password
  'System',
  'Administrator',
  'super_regulator',
  'active',
  true,
  NOW(),
  NOW()
);
```

## Step 6: Build for Production

```bash
npm run build
```

## Step 7: Start the Application

```bash
npm start
```

The application will be available at `http://localhost:3000` (or your configured URL).

## Production Checklist

- [ ] Database credentials configured
- [ ] NEXTAUTH_SECRET set to a secure random string
- [ ] NODE_ENV set to 'production'
- [ ] Database migrations run successfully
- [ ] SSL/TLS configured for database connection
- [ ] HTTPS enabled for web application
- [ ] Firewall rules configured
- [ ] Backup strategy in place
- [ ] Monitoring and logging configured

## Security Recommendations

1. **Use strong passwords** for all database users
2. **Enable SSL** for database connections in production
3. **Use HTTPS** for all web traffic
4. **Enable MFA** for all admin and regulator users
5. **Regular backups** of the PostgreSQL database
6. **Monitor audit logs** for suspicious activity
7. **Keep dependencies updated** with `npm audit`

## Troubleshooting

### Database Connection Issues
- Verify database credentials in `.env`
- Check if PostgreSQL is running
- Verify firewall rules allow connections
- Check SSL settings match your database configuration

### Migration Errors
- Ensure database user has sufficient privileges
- Check for existing tables that might conflict
- Review migration logs for specific errors

### Build Errors
- Clear `.next` directory: `rm -rf .next`
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Check TypeScript errors: `npm run lint`

## Support

For production support, contact your development team.
