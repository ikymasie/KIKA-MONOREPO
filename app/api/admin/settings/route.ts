import { NextRequest, NextResponse } from 'next/server';
import { AppDataSource } from '@/src/config/database';
import { Tenant } from '@/src/entities/Tenant';
import { getUserFromRequest } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!user.isTenantAdmin()) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        if (!user.tenantId) {
            return NextResponse.json({ error: 'No tenant associated with user' }, { status: 400 });
        }

        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }

        const tenantRepo = AppDataSource.getRepository(Tenant);
        const tenant = await tenantRepo.findOne({
            where: { id: user.tenantId }
        });

        if (!tenant) {
            return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
        }

        return NextResponse.json(tenant);
    } catch (error: any) {
        console.error('Settings GET error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch settings' },
            { status: 500 }
        );
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!user.isTenantAdmin() || user.role !== 'saccos_admin') {
            return NextResponse.json({ error: 'Only SACCOSS Admins can update settings' }, { status: 403 });
        }

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
            brandingSettings
        } = body;

        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }

        const tenantRepo = AppDataSource.getRepository(Tenant);
        const tenant = await tenantRepo.findOne({
            where: { id: user.tenantId }
        });

        if (!tenant) {
            return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
        }

        // Update fields if provided
        if (name) tenant.name = name;
        if (address !== undefined) tenant.address = address;
        if (phone !== undefined) tenant.phone = phone;
        if (email !== undefined) tenant.email = email;
        if (registrationNumber !== undefined) tenant.registrationNumber = registrationNumber;
        if (maxBorrowingLimit !== undefined) tenant.maxBorrowingLimit = Number(maxBorrowingLimit);
        if (liquidityRatioTarget !== undefined) tenant.liquidityRatioTarget = Number(liquidityRatioTarget);
        if (kycConfiguration !== undefined) tenant.kycConfiguration = kycConfiguration;
        if (workflowConfiguration !== undefined) tenant.workflowConfiguration = workflowConfiguration;
        if (logoUrl !== undefined) tenant.logoUrl = logoUrl;
        if (primaryColor !== undefined) tenant.primaryColor = primaryColor;
        if (secondaryColor !== undefined) tenant.secondaryColor = secondaryColor;
        if (brandingSettings !== undefined) tenant.brandingSettings = brandingSettings;

        await tenantRepo.save(tenant);

        return NextResponse.json({ message: 'Settings updated successfully', tenant });
    } catch (error: any) {
        console.error('Settings PATCH error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to update settings' },
            { status: 500 }
        );
    }
}
