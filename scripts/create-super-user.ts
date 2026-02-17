import 'dotenv/config';
import 'reflect-metadata';
import { AppDataSource } from '../src/config/database';
import { User, UserRole, UserStatus } from '../src/entities/User';
import { syncUserWithFirebase } from '../lib/firebase-auth';

interface CreateUserOptions {
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    password?: string;
}

async function createUser(options: CreateUserOptions) {
    try {
        console.log('Initializing database connection...');
        await AppDataSource.initialize();
        console.log('Database connected successfully');

        const userRepository = AppDataSource.getRepository(User);

        // Check if user already exists
        const existingUser = await userRepository.findOne({
            where: { email: options.email },
        });

        if (existingUser) {
            console.log(`User with email ${options.email} already exists. Syncing with Firebase...`);

            // Sync with Firebase
            const firebaseUid = await syncUserWithFirebase(
                options.email,
                options.password || '12345678',
                existingUser
            );

            console.log('✅ User synced successfully!');
            console.log('Firebase UID:', firebaseUid);
            console.log('User ID:', existingUser.id);
            console.log('Email:', existingUser.email);
            console.log('Role:', existingUser.role);

            await AppDataSource.destroy();
            return;
        }

        // Create new user
        console.log(`Creating user with role ${options.role}...`);

        const newUser = userRepository.create({
            email: options.email,
            firstName: options.firstName,
            lastName: options.lastName,
            role: options.role,
            status: UserStatus.ACTIVE,
            mfaEnabled: false,
            permissions: getDefaultPermissions(options.role),
        });

        await userRepository.save(newUser);
        console.log('User created in database');

        // Sync with Firebase
        const firebaseUid = await syncUserWithFirebase(
            options.email,
            options.password || '12345678',
            newUser
        );

        console.log('\n✅ User created successfully!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('Firebase UID:', firebaseUid);
        console.log('User ID:', newUser.id);
        console.log('Email:', newUser.email);
        console.log('Password:', options.password || '12345678');
        console.log('Role:', newUser.role);
        console.log('Status:', newUser.status);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('\nYou can now login with these credentials at http://localhost:3000');

        await AppDataSource.destroy();
    } catch (error) {
        console.error('Error creating user:', error);
        process.exit(1);
    }
}

function getDefaultPermissions(role: UserRole): Record<string, boolean> {
    switch (role) {
        // DCD roles
        case UserRole.DCD_DIRECTOR:
            return {
                'system:manage': true,
                'tenants:view_all': true,
                'tenants:manage': true,
                'users:manage': true,
                'applications:manage': true,
                'certificates:manage': true,
                'bylaws:manage': true,
                'cooperative_compliance:manage': true,
                'reports:view_all': true,
                'audit:view_all': true,
            };
        case UserRole.DCD_FIELD_OFFICER:
        case UserRole.DCD_COMPLIANCE_OFFICER:
            return {
                'tenants:view_all': true,
                'cooperative_compliance:manage': true,
                'reports:view_all': true,
            };
        // BoB roles
        case UserRole.BOB_PRUDENTIAL_SUPERVISOR:
            return {
                'tenants:view_all': true,
                'financial_stability:manage': true,
                'liquidity_reports:view_all': true,
                'capital_adequacy:manage': true,
                'reports:view_all': true,
                'audit:view_all': true,
            };
        case UserRole.BOB_FINANCIAL_AUDITOR:
        case UserRole.BOB_COMPLIANCE_OFFICER:
            return {
                'tenants:view_all': true,
                'financial_stability:view': true,
                'reports:view_all': true,
            };
        // Government registration officers
        case UserRole.REGISTRY_CLERK:
        case UserRole.INTELLIGENCE_LIAISON:
        case UserRole.LEGAL_OFFICER:
        case UserRole.REGISTRAR:
        case UserRole.DIRECTOR_COOPERATIVES:
        case UserRole.MINISTER_DELEGATE:
            return {
                'applications:manage': true,
            };
        default:
            return {};
    }
}

// Parse command line arguments
const args = process.argv.slice(2);
const options: Partial<CreateUserOptions> = {};

for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
        case '--email':
            options.email = args[++i];
            break;
        case '--first-name':
            options.firstName = args[++i];
            break;
        case '--last-name':
            options.lastName = args[++i];
            break;
        case '--role':
            options.role = args[++i] as UserRole;
            break;
        case '--password':
            options.password = args[++i];
            break;
        case '--help':
            console.log(`
Usage: npm run create-user -- [options]

Options:
  --email <email>           User email (required)
  --first-name <name>       User first name (required)
  --last-name <name>        User last name (required)
  --role <role>             User role (required)
  --password <password>     User password (default: 12345678)
  --help                    Show this help message

Available roles:
  Department of Co-operative Development (DCD):
    - dcd_director
    - dcd_field_officer
    - dcd_compliance_officer
  
  Bank of Botswana (BoB):
    - bob_prudential_supervisor
    - bob_financial_auditor
    - bob_compliance_officer
  
  Shared Regulatory:
    - deduction_officer
  
  Government Registration Officers:
    - registry_clerk
    - intelligence_liaison
    - legal_officer
    - registrar
    - director_cooperatives
    - minister_delegate
  
  Applicants:
    - society_applicant
    - cooperative_applicant
  
  SACCOS Staff:
    - saccos_admin
    - loan_officer
    - accountant
    - member_service_rep
    - credit_committee
  
  Other:
    - member
    - external_auditor
    - vendor

Examples:
  npm run create-user -- --email clerk@gov.bw --first-name Registry --last-name Clerk --role registry_clerk
  npm run create-user -- --email registrar@gov.bw --first-name John --last-name Doe --role registrar --password SecurePass123
            `);
            process.exit(0);
    }
}

// Validate required options
if (!options.email || !options.firstName || !options.lastName || !options.role) {
    console.error('Error: Missing required arguments');
    console.error('Run with --help to see usage information');
    process.exit(1);
}

// Validate role
if (!Object.values(UserRole).includes(options.role)) {
    console.error(`Error: Invalid role "${options.role}"`);
    console.error('Run with --help to see available roles');
    process.exit(1);
}

createUser(options as CreateUserOptions);

