import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        // Dynamic imports to avoid circular dependencies
        const { query } = await import("../../../../../src/db/query");

        const settings = await query('SELECT * FROM regulator_settings ORDER BY updatedAt DESC LIMIT 1') as any[];
        const currentSettings = settings.length > 0 ? settings[0] : null;

        return NextResponse.json({
            excellentThreshold: currentSettings?.excellentThreshold || 90,
            goodThreshold: currentSettings?.goodThreshold || 75,
            fairThreshold: currentSettings?.fairThreshold || 60,
            poorThreshold: currentSettings?.poorThreshold || 40,
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        // Dynamic imports to avoid circular dependencies
        const { query, execute } = await import("../../../../../src/db/query");
        const { v4: uuidv4 } = await import('uuid');

        const body = await request.json();

        const existingSettings = await query('SELECT * FROM regulator_settings ORDER BY updatedAt DESC LIMIT 1') as any[];
        let settings = existingSettings[0] || null;

        if (!settings) {
            const newId = uuidv4();
            await execute(
                'INSERT INTO regulator_settings (id, excellentThreshold, goodThreshold, fairThreshold, poorThreshold, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, NOW(), NOW())',
                [newId, body.excellentThreshold ?? 90, body.goodThreshold ?? 75, body.fairThreshold ?? 60, body.poorThreshold ?? 40]
            );
            settings = { id: newId, excellentThreshold: body.excellentThreshold ?? 90, goodThreshold: body.goodThreshold ?? 75, fairThreshold: body.fairThreshold ?? 60, poorThreshold: body.poorThreshold ?? 40 };
        } else {
            const excel = body.excellentThreshold !== undefined ? body.excellentThreshold : settings.excellentThreshold;
            const good = body.goodThreshold !== undefined ? body.goodThreshold : settings.goodThreshold;
            const fair = body.fairThreshold !== undefined ? body.fairThreshold : settings.fairThreshold;
            const poor = body.poorThreshold !== undefined ? body.poorThreshold : settings.poorThreshold;

            await execute(
                'UPDATE regulator_settings SET excellentThreshold = ?, goodThreshold = ?, fairThreshold = ?, poorThreshold = ?, updatedAt = NOW() WHERE id = ?',
                [excel, good, fair, poor, settings.id]
            );
            settings = { ...settings, excellentThreshold: excel, goodThreshold: good, fairThreshold: fair, poorThreshold: poor };
        }
        return NextResponse.json(settings);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
