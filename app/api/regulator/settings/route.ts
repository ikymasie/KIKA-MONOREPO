import { NextRequest, NextResponse } from 'next/server';
import { AppDataSource } from '@/lib/db';
import { RegulatorSettings } from '@/entities/RegulatorSettings';

export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
    try {
        // Dynamic imports to avoid circular dependencies
        const { getUserFromRequest } = await import('@/lib/auth-server');
const user = await getUserFromRequest(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }

        const settingsRepo = AppDataSource.getRepository(RegulatorSettings);
        let settings = await settingsRepo.find({
            take: 1
        });

        if (!settings || settings.length === 0) {
            // Create default settings if none exist
            const newSettings = settingsRepo.create({});
            await settingsRepo.save(newSettings);
            return NextResponse.json(newSettings);
        }

        return NextResponse.json(settings[0]);
    } catch (error: any) {
        console.error('Error fetching regulator settings:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        // Dynamic imports to avoid circular dependencies
        const { getUserFromRequest } = await import('@/lib/auth-server');
const user = await getUserFromRequest(request);
        if (!user || !user.isRegulator()) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();

        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }

        const settingsRepo = AppDataSource.getRepository(RegulatorSettings);

        // Find existing settings or create new
        let currentSettings: RegulatorSettings | null = await settingsRepo.findOne({
            where: {},
            order: { updatedAt: 'DESC' } // Get the latest one if multiple exist (should safeguard to only have one)
        });

        if (!currentSettings) {
            currentSettings = settingsRepo.create(body) as unknown as RegulatorSettings;
        } else {
            settingsRepo.merge(currentSettings, body);
        }

        currentSettings.updatedById = user.id;

        const savedSettings = await settingsRepo.save(currentSettings);

        return NextResponse.json(savedSettings);
    } catch (error: any) {
        console.error('Error updating regulator settings:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
