import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { Beneficiary } from '@/src/entities/Beneficiary';
import { Member } from '@/src/entities/Member';
import { getUserFromRequest } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

async function getMember(userId: string) {
    const db = await getDb();
    const memberRepo = db.getRepository(Member);
    return await memberRepo.findOne({ where: { userId } });
}

export async function GET(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request);
        if (!user || user.role !== 'member') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const member = await getMember(user.id);
        if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 });

        const db = await getDb();
        const beneficiaryRepo = db.getRepository(Beneficiary);
        const beneficiaries = await beneficiaryRepo.find({
            where: { memberId: member.id },
            order: { firstName: 'ASC' }
        });

        return NextResponse.json(beneficiaries);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request);
        if (!user || user.role !== 'member') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const member = await getMember(user.id);
        if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 });

        const body = await request.json();
        const db = await getDb();
        const beneficiaryRepo = db.getRepository(Beneficiary);

        const beneficiary = beneficiaryRepo.create({
            ...body,
            memberId: member.id
        });

        await beneficiaryRepo.save(beneficiary);
        return NextResponse.json(beneficiary);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request);
        if (!user || user.role !== 'member') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const member = await getMember(user.id);
        if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 });

        const body = await request.json();
        const { id, ...updateData } = body;

        const db = await getDb();
        const beneficiaryRepo = db.getRepository(Beneficiary);

        const beneficiary = await beneficiaryRepo.findOne({
            where: { id, memberId: member.id }
        });

        if (!beneficiary) return NextResponse.json({ error: 'Beneficiary not found' }, { status: 404 });

        Object.assign(beneficiary, updateData);
        await beneficiaryRepo.save(beneficiary);

        return NextResponse.json(beneficiary);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request);
        if (!user || user.role !== 'member') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const member = await getMember(user.id);
        if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 });

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

        const db = await getDb();
        const beneficiaryRepo = db.getRepository(Beneficiary);

        const result = await beneficiaryRepo.delete({ id, memberId: member.id });

        if (result.affected === 0) return NextResponse.json({ error: 'Beneficiary not found' }, { status: 404 });

        return NextResponse.json({ message: 'Beneficiary deleted' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
