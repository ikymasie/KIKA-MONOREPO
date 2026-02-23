import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth-server';
import { listAccounts, initializeChartOfAccounts, createAccount } from '@/src/db/services/AccountingService';
import { AccountStatus, AccountType } from '@/src/interfaces/IAccounting';

export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request);
        if (!user || user.role !== 'saccos_admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        if (!user.tenantId) return NextResponse.json({ error: 'Tenant ID not found' }, { status: 400 });

        let accounts = await listAccounts(user.tenantId);

        if (accounts.length === 0) {
            await initializeChartOfAccounts(user.tenantId);
            accounts = await listAccounts(user.tenantId);
        }

        return NextResponse.json(accounts);
    } catch (error: any) {
        console.error('Error fetching COA:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request);
        if (!user || user.role !== 'saccos_admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        if (!user.tenantId) return NextResponse.json({ error: 'Tenant ID not found' }, { status: 400 });

        const { code, name, type, description } = await request.json();
        if (!code || !name || !type) return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });

        const { queryOne } = await import('@/src/db/query');
        const existing = await queryOne('SELECT id FROM accounts WHERE tenantId = ? AND code = ? LIMIT 1', [user.tenantId, code]);
        if (existing) return NextResponse.json({ error: 'Account code already exists' }, { status: 400 });

        const account = await createAccount(user.tenantId, {
            code,
            name,
            accountType: type as AccountType,
            description,
            balance: 0,
            status: AccountStatus.ACTIVE
        });

        return NextResponse.json(account);
    } catch (error: any) {
        console.error('Error creating account:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
