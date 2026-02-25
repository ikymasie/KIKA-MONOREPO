import { NextRequest, NextResponse } from 'next/server';
import { getTenantById, updateTenant } from '@/src/db/services/TenantService';
import type { ITenantUpdateInput } from '@/src/interfaces/ITenant';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const { getUserFromRequest } = await import("../../../../lib/auth-server");

        const user = await getUserFromRequest(request);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        if (!user.isTenantAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        if (!user.tenantId) return NextResponse.json({ error: 'No tenant associated with user' }, { status: 400 });

        const tenant = await getTenantById(user.tenantId);
        if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

        return NextResponse.json(tenant);
    } catch (error: any) {
        console.error('Settings GET error:', error);
        return NextResponse.json({ error: error.message || 'Failed to fetch settings' }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const { getUserFromRequest } = await import("../../../../lib/auth-server");

        const user = await getUserFromRequest(request);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        if (!user.isTenantAdmin() || user.role !== 'saccos_admin') {
            return NextResponse.json({ error: 'Only SACCOS Admins can update settings' }, { status: 403 });
        }
        if (!user.tenantId) return NextResponse.json({ error: 'No tenant associated with user' }, { status: 400 });

        const body = await request.json();
        const {
            name,
            address,
            phone,
            email,
            registrationNumber,
            maxBorrowingLimit,
            liquidityRatioTarget,
            kycConfiguration,
            workflowConfiguration,
            logoUrl,
            primaryColor,
            secondaryColor,
            brandingSettings,
        } = body;

        const changes: ITenantUpdateInput = {};
        if (name !== undefined) changes.name = name;
        if (address !== undefined) changes.address = address;
        if (phone !== undefined) changes.phone = phone;
        if (email !== undefined) changes.email = email;
        if (registrationNumber !== undefined) changes.registrationNumber = registrationNumber;
        if (maxBorrowingLimit !== undefined) changes.maxBorrowingLimit = Number(maxBorrowingLimit);
        if (liquidityRatioTarget !== undefined) changes.liquidityRatioTarget = Number(liquidityRatioTarget);
        if (kycConfiguration !== undefined) changes.kycConfiguration = kycConfiguration;
        if (workflowConfiguration !== undefined) changes.workflowConfiguration = workflowConfiguration;
        if (logoUrl !== undefined) changes.logoUrl = logoUrl;
        if (primaryColor !== undefined) changes.primaryColor = primaryColor;
        if (secondaryColor !== undefined) changes.secondaryColor = secondaryColor;
        if (brandingSettings !== undefined) changes.brandingSettings = brandingSettings;

        if (Object.keys(changes).length === 0) {
            return NextResponse.json({ error: 'No updatable fields provided' }, { status: 400 });
        }

        const tenant = await updateTenant(user.tenantId, changes);
        return NextResponse.json({ message: 'Settings updated successfully', tenant });
    } catch (error: any) {
        console.error('Settings PATCH error:', error);
        return NextResponse.json({ error: error.message || 'Failed to update settings' }, { status: 500 });
    }
}
