import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth-server';
import { listMerchandiseProducts, createMerchandiseOrder } from '@/src/db/services/MerchandiseService';

export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request);
        if (!user) return NextResponse.json({ error: 'Unauthorized access' }, { status: 401 });

        const products = await listMerchandiseProducts(user.tenantId, true);
        return NextResponse.json(products);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request);
        if (!user) return NextResponse.json({ error: 'Unauthorized access' }, { status: 401 });

        const body = await request.json();
        const { productId, quantity, totalAmount, termMonths, monthlyInstallment } = body;

        if (!productId || !quantity || !totalAmount || !termMonths || !monthlyInstallment) {
            return NextResponse.json({ error: 'Missing required order fields' }, { status: 400 });
        }

        const order = await createMerchandiseOrder(user.tenantId, user.id, productId, {
            quantity,
            totalPrice: totalAmount,
            termMonths,
            monthlyInstallment
        });

        return NextResponse.json({
            success: true,
            orderId: order.id,
            orderNumber: order.orderNumber
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
