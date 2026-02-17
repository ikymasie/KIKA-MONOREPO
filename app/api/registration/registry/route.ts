import { NextRequest, NextResponse } from 'next/server';
import { RegistrationService } from '@/src/services/RegistrationService';


import { getUserFromRequest } from '@/lib/auth-server';

export async function GET(req: NextRequest) {
    try {
        const user = await getUserFromRequest(req);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Any authenticated user can view the official registry (public record)
        const registry = await RegistrationService.getOfficialRegistry();

        return NextResponse.json(registry);
    } catch (error: any) {
        console.error('[Registry GET Error]:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}
