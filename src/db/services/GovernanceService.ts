import { query, execute } from '../query';
import { RowDataPacket } from 'mysql2/promise';
import { v4 as uuidv4 } from 'uuid';
import { IAgmResolution, IBoardMinute, ResolutionStatus } from '../../interfaces/IGovernance';

export async function listAgmResolutions(tenantId: string): Promise<IAgmResolution[]> {
    const sql = 'SELECT * FROM agm_resolutions WHERE tenantId = ? ORDER BY year DESC, date DESC';
    const rows = await query<RowDataPacket & IAgmResolution>(sql, [tenantId]);
    return rows.map((row: any) => ({
        ...row,
        metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata
    }));
}

export async function createAgmResolution(tenantId: string, data: Partial<IAgmResolution>): Promise<IAgmResolution> {
    const id = uuidv4();
    await execute(
        `INSERT INTO agm_resolutions (id, tenantId, year, date, title, description, status, meetingMinutesUrl, metadata, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
            id, tenantId, data.year, data.date, data.title, data.description,
            data.status || ResolutionStatus.PENDING, data.meetingMinutesUrl || null,
            data.metadata ? JSON.stringify(data.metadata) : null
        ]
    );

    const [row] = await query<RowDataPacket & IAgmResolution>('SELECT * FROM agm_resolutions WHERE id = ?', [id]);
    if (!row) throw new Error('Failed to create AGM Resolution');
    return {
        ...row,
        metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata
    };
}

export async function listBoardMinutes(tenantId: string): Promise<IBoardMinute[]> {
    const sql = 'SELECT * FROM board_minutes WHERE tenantId = ? ORDER BY meetingDate DESC';
    const rows = await query<RowDataPacket & IBoardMinute>(sql, [tenantId]);
    return rows.map((row: any) => ({
        ...row,
        attendees: typeof row.attendees === 'string' ? JSON.parse(row.attendees) : row.attendees,
        agenda: typeof row.agenda === 'string' ? JSON.parse(row.agenda) : row.agenda,
        decisions: typeof row.decisions === 'string' ? JSON.parse(row.decisions) : row.decisions,
    }));
}

export async function createBoardMinute(tenantId: string, data: Partial<IBoardMinute>): Promise<IBoardMinute> {
    const id = uuidv4();
    await execute(
        `INSERT INTO board_minutes (id, tenantId, meetingDate, startTime, endTime, location, attendees, agenda, decisions, documentUrl, notes, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
            id, tenantId, data.meetingDate, data.startTime || null, data.endTime || null,
            data.location || null, data.attendees ? JSON.stringify(data.attendees) : null,
            data.agenda ? JSON.stringify(data.agenda) : null,
            data.decisions ? JSON.stringify(data.decisions) : null,
            data.documentUrl || null, data.notes || null
        ]
    );

    const [row] = await query<RowDataPacket & IBoardMinute>('SELECT * FROM board_minutes WHERE id = ?', [id]);
    if (!row) throw new Error('Failed to create Board Minute');
    return {
        ...row,
        attendees: typeof row.attendees === 'string' ? JSON.parse(row.attendees) : row.attendees,
        agenda: typeof row.agenda === 'string' ? JSON.parse(row.agenda) : row.agenda,
        decisions: typeof row.decisions === 'string' ? JSON.parse(row.decisions) : row.decisions,
    };
}
