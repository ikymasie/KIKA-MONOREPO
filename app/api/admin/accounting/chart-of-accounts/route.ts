import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
    try {
        // Dynamic imports to avoid circular dependencies
        const { getUserFromRequest } = await import('@/lib/auth-server');
const { AppDataSource } = await import('@/src/config/database');
        const { Account } = await import('@/src/entities/Account');
        const { AccountingService } = await import('@/src/services/AccountingService');

        const user = await getUserFromRequest(request);
        if (!user || user.role !== 'saccos_admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!user.tenantId) {
            return NextResponse.json({ error: 'Tenant ID not found' }, { status: 400 });
        }

        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }

        const accountRepo = AppDataSource.getRepository(Account);
        const accounts = await accountRepo.find({
            where: { tenantId: user.tenantId },
            order: { code: 'ASC' }
        });

        // If no accounts exist, initialize defaults
        if (accounts.length === 0) {
            const accountingService = new AccountingService();
            await accountingService.initializeChartOfAccounts(user.tenantId);
            const initializedAccounts = await accountRepo.find({
                where: { tenantId: user.tenantId },
                order: { code: 'ASC' }
            });
            return NextResponse.json(initializedAccounts);
        }

        return NextResponse.json(accounts);
    } catch (error: any) {
        console.error('Error fetching COA:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        // Dynamic imports to avoid circular dependencies
        const { getUserFromRequest } = await import('@/lib/auth-server');
const { AppDataSource } = await import('@/src/config/database');
        const { Account, AccountStatus, AccountType } = await import('@/src/entities/Account');

        const user = await getUserFromRequest(request);
        if (!user || user.role !== 'saccos_admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!user.tenantId) {
            return NextResponse.json({ error: 'Tenant ID not found' }, { status: 400 });
        }

        const body = await request.json();
        const { code, name, type, description } = body;

        if (!code || !name || !type) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }

        const accountRepo = AppDataSource.getRepository(Account);

        // Check if code already exists
        const existing = await accountRepo.findOne({ where: { tenantId: user.tenantId, code } });
        if (existing) {
            return NextResponse.json({ error: 'Account code already exists' }, { status: 400 });
        }

        const account = accountRepo.create({
            tenantId: user.tenantId,
            code,
            name,
            accountType: type,
            description,
            balance: 0,
            status: AccountStatus.ACTIVE
        });

        await accountRepo.save(account);

        return NextResponse.json(account);
    } catch (error: any) {
        console.error('Error creating account:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
