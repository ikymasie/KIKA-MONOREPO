import { NextRequest, NextResponse } from 'next/server';
import { query, execute } from '@/src/db/query';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
    try {
        // Dynamic imports to avoid circular dependencies
        const { getUserFromRequest } = await import("@/lib/auth-server");
        const user = await getUserFromRequest(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const settings = await query('SELECT * FROM regulator_settings ORDER BY updatedAt DESC LIMIT 1') as any[];

        if (!settings || settings.length === 0) {
            // Create default settings if none exist
            const newSettings = {
                id: uuidv4(),
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            await execute(
                'INSERT INTO regulator_settings (id, createdAt, updatedAt) VALUES (?, NOW(), NOW())',
                [newSettings.id]
            );
            return NextResponse.json(newSettings);
        }

        const currentSettings = settings[0];
        try {
            if (currentSettings.complianceChecks && typeof currentSettings.complianceChecks === 'string') {
                currentSettings.complianceChecks = JSON.parse(currentSettings.complianceChecks);
            }
            if (currentSettings.reportingRequirements && typeof currentSettings.reportingRequirements === 'string') {
                currentSettings.reportingRequirements = JSON.parse(currentSettings.reportingRequirements);
            }
        } catch (e) { }

        return NextResponse.json(currentSettings);
    } catch (error: any) {
        console.error('Error fetching regulator settings:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        // Dynamic imports to avoid circular dependencies
        const { getUserFromRequest } = await import("@/lib/auth-server");
        const user = await getUserFromRequest(request);
        if (!user || !user.isRegulator()) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();

        // Find existing settings or create new
        const existingSettings = await query('SELECT * FROM regulator_settings ORDER BY updatedAt DESC LIMIT 1') as any[];
        let currentSettings = existingSettings[0] || null;

        if (!currentSettings) {
            const newId = uuidv4();
            await execute(
                `INSERT INTO regulator_settings 
                  (id, globalRateCap, mandatoryReserveRatio, complianceChecks, reportingRequirements, updatedById, createdAt, updatedAt) 
                  VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
                [newId, body.globalRateCap, body.mandatoryReserveRatio, JSON.stringify(body.complianceChecks || {}), JSON.stringify(body.reportingRequirements || {}), user.id]
            );
            currentSettings = { id: newId, ...body, updatedById: user.id };
        } else {
            const merged = { ...currentSettings, ...body };
            await execute(
                `UPDATE regulator_settings SET 
                  globalRateCap = ?, mandatoryReserveRatio = ?, complianceChecks = ?, reportingRequirements = ?, updatedById = ?, updatedAt = NOW() 
                  WHERE id = ?`,
                [merged.globalRateCap, merged.mandatoryReserveRatio, JSON.stringify(merged.complianceChecks || {}), JSON.stringify(merged.reportingRequirements || {}), user.id, currentSettings.id]
            );
            currentSettings = { ...merged, updatedById: user.id };
        }

        return NextResponse.json(currentSettings);
    } catch (error: any) {
        console.error('Error updating regulator settings:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
