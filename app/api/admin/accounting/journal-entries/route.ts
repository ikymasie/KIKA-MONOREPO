import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth-server';
import { createManualJournalEntry } from '@/src/db/services/AccountingService';

export const dynamic = 'force-dynamic';
export async function POST(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request);
        if (!user || user.role !== 'saccos_admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        if (!user.tenantId) return NextResponse.json({ error: 'Tenant ID not found' }, { status: 400 });

        const body = await request.json();
        const { description, items, date } = body;

        if (!items || !Array.isArray(items) || items.length < 2) {
            return NextResponse.json({ error: 'Valid journal entries must have at least two items' }, { status: 400 });
        }

        await createManualJournalEntry(
            user.tenantId,
            description,
            date ? new Date(date) : new Date(),
            items
        );

        return NextResponse.json({ success: true, message: 'Journal entry created' });
    } catch (error: any) {
        console.error('Error creating journal entry:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
