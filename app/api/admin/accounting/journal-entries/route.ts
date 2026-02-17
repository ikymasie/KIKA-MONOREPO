import { NextRequest, NextResponse } from 'next/server';
import { AppDataSource } from '@/src/config/database';
import { getUserFromRequest } from '@/lib/auth-server';
import { AccountingService } from '@/src/services/AccountingService';

export async function POST(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request);
        if (!user || user.role !== 'saccos_admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { description, items, date } = body;

        if (!items || !Array.isArray(items) || items.length < 2) {
            return NextResponse.json({ error: 'Valid journal entries must have at least two items' }, { status: 400 });
        }

        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }

        const accountingService = new AccountingService();
        const entries = await accountingService.createManualJournalEntry({
            tenantId: user.tenantId,
            description,
            date: date ? new Date(date) : new Date(),
            items
        });

        return NextResponse.json(entries);
    } catch (error: any) {
        console.error('Error creating journal entry:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
