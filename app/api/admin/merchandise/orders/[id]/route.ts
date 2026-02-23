import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth-server';
import { getMerchandiseOrder, updateMerchandiseOrderStatus } from '@/src/db/services/MerchandiseService';

export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const user = await getUserFromRequest(request);
        if (!user || !user.isTenantAdmin()) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const order = await getMerchandiseOrder(params.id, user.tenantId);
        if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

        const formattedOrder = {
            ...order,
            member: {
                firstName: (order as any).firstName || '',
                lastName: (order as any).lastName || '',
                memberNumber: (order as any).memberNumber || '',
                email: (order as any).email || '',
                phone: (order as any).phone || '',
            },
            product: {
                id: (order as any).productId,
                name: (order as any).productName || '',
                sku: (order as any).sku || '',
                stockQuantity: (order as any).stockQuantity || 0,
            }
        };

        return NextResponse.json(formattedOrder);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const user = await getUserFromRequest(request);
        if (!user || user.role !== 'saccos_admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { status, ...rest } = body;

        const updatedOrder = await updateMerchandiseOrderStatus(params.id, user.tenantId, status, rest);
        return NextResponse.json(updatedOrder);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
