import { NextResponse, NextRequest } from 'next/server';
import { getUserFromRequest } from '@/lib/auth-server';
import { AppDataSource } from '@/src/config/database';
import { RegulatoryAlert } from '@/entities/RegulatoryAlert';
import { AlertGenerationService } from '@/src/services/AlertGenerationService';

export async function GET(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request);
        if (!user || !user.isRegulator()) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }

        const { searchParams } = new URL(request.url);
        const severity = searchParams.get('severity');
        const isResolved = searchParams.get('resolved');

        // Build query
        const alertRepo = AppDataSource.getRepository(RegulatoryAlert);
        let query = alertRepo.createQueryBuilder('alert')
            .leftJoinAndSelect('alert.tenant', 'tenant')
            .orderBy('alert.createdAt', 'DESC');

        if (severity) {
            query = query.andWhere('alert.severity = :severity', { severity });
        }

        if (isResolved !== null) {
            const resolved = isResolved === 'true';
            query = query.andWhere('alert.isResolved = :isResolved', { isResolved: resolved });
        }

        const alerts = await query.take(50).getMany();

        return NextResponse.json(
            alerts.map(alert => ({
                id: alert.id,
                type: alert.type,
                severity: alert.severity,
                title: alert.title,
                description: alert.description,
                metadata: alert.metadata,
                isResolved: alert.isResolved,
                resolvedAt: alert.resolvedAt,
                createdAt: alert.createdAt,
                tenant: {
                    id: alert.tenant.id,
                    name: alert.tenant.name
                }
            }))
        );

    } catch (error: any) {
        console.error('Error fetching alerts:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request);
        if (!user || !user.isRegulator()) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Trigger alert generation
        await AlertGenerationService.generateAlerts();

        return NextResponse.json({ success: true, message: 'Alerts generated successfully' });

    } catch (error: any) {
        console.error('Error generating alerts:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
