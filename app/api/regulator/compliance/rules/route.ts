import { NextRequest, NextResponse } from 'next/server';
import { ComplianceService } from '@/src/services/ComplianceService';

export async function GET(req: NextRequest) {
    try {
        const rules = await ComplianceService.getRules();
        return NextResponse.json(rules);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const rule = await ComplianceService.saveRule(body);
        return NextResponse.json(rule);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
