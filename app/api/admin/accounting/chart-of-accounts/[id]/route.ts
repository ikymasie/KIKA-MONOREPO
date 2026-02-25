import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth-server';
import { getAccountById } from '@/src/db/services/AccountingService';

export const dynamic = 'force-dynamic';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const user = await getUserFromRequest(request);
        if (!user || user.role !== 'saccos_admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        if (!user.tenantId) return NextResponse.json({ error: 'Tenant ID not found' }, { status: 400 });

        const account = await getAccountById(params.id, user.tenantId);
        return NextResponse.json(account);
    } catch (error: any) {
        console.error('Error fetching account:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
