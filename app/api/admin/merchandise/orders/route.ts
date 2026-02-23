import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth-server';
import { listMerchandiseOrders, createMerchandiseOrder } from '@/src/db/services/MerchandiseService';
import { OrderStatus } from '@/src/interfaces/IMerchandise';

export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request);
        if (!user || !user.isTenantAdmin()) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status') as OrderStatus | null;
        const memberId = searchParams.get('memberId') || undefined;

        const orders = await listMerchandiseOrders(user.tenantId, status || undefined, memberId);
        return NextResponse.json(orders);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request);
        if (!user || user.role !== 'saccos_admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { memberId, productId, ...rest } = body;

        if (!memberId || !productId) {
            return NextResponse.json({ error: 'Missing memberId or productId' }, { status: 400 });
        }

        const order = await createMerchandiseOrder(user.tenantId, memberId, productId, rest);
        return NextResponse.json(order);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
