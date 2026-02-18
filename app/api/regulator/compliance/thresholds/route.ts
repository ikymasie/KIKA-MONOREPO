import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        // Dynamic imports to avoid circular dependencies
        const { AppDataSource } = await import('@/src/config/database');
        const { RegulatorSettings } = await import('@/src/entities/RegulatorSettings');


        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }
        const settingsRepo = AppDataSource.getRepository(RegulatorSettings);
        const settings = await settingsRepo.findOne({ order: { updatedAt: 'DESC' } });

        return NextResponse.json({
            excellentThreshold: settings?.excellentThreshold || 90,
            goodThreshold: settings?.goodThreshold || 75,
            fairThreshold: settings?.fairThreshold || 60,
            poorThreshold: settings?.poorThreshold || 40,
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        // Dynamic imports to avoid circular dependencies
        const { AppDataSource } = await import('@/src/config/database');
        const { RegulatorSettings } = await import('@/src/entities/RegulatorSettings');
        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }
        const body = await request.json();
        const settingsRepo = AppDataSource.getRepository(RegulatorSettings);

        let settings = await settingsRepo.findOne({ order: { updatedAt: 'DESC' } });
        if (!settings) {
            settings = settingsRepo.create();
        }

        if (body.excellentThreshold !== undefined) settings.excellentThreshold = body.excellentThreshold;
        if (body.goodThreshold !== undefined) settings.goodThreshold = body.goodThreshold;
        if (body.fairThreshold !== undefined) settings.fairThreshold = body.fairThreshold;
        if (body.poorThreshold !== undefined) settings.poorThreshold = body.poorThreshold;

        await settingsRepo.save(settings);
        return NextResponse.json(settings);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
