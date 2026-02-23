import { FieldVisit, FieldVisitStatus } from '../entities/FieldVisit';
import { Investigation, InvestigationStatus, InvestigationSeverity } from '../entities/Investigation';
import { FieldReport } from '../entities/FieldReport';
import { Tenant } from '../entities/Tenant';
import { query, execute } from '../db/query';
import { v4 as uuidv4 } from 'uuid';
import { RowDataPacket } from 'mysql2/promise';

export class FieldOfficerService {
    /**
     * Schedule a new field visit
     */
    static async scheduleVisit(data: {
        tenantId: string;
        officerId: string;
        scheduledDate: Date;
        purpose: string;
        notes?: string;
    }): Promise<FieldVisit> {
        const id = uuidv4();
        await execute(
            `INSERT INTO field_visits (id, tenantId, officerId, scheduledDate, purpose, notes, status, createdAt, updatedAt) 
             VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
            [id, data.tenantId, data.officerId, data.scheduledDate, data.purpose, data.notes || null, FieldVisitStatus.SCHEDULED]
        );

        const [[visit]] = await query('SELECT * FROM field_visits WHERE id = ? LIMIT 1', [id]) as any;
        return visit as FieldVisit;
    }

    /**
     * Get all visits for an officer or tenant
     */
    static async getVisits(filters: {
        officerId?: string;
        tenantId?: string;
        status?: FieldVisitStatus;
    }): Promise<FieldVisit[]> {
        let sql = `
            SELECT v.*, t.name as tenantName, u.firstName as officerFirstName, u.lastName as officerLastName
            FROM field_visits v
            LEFT JOIN tenants t ON t.id = v.tenantId
            LEFT JOIN users u ON u.id = v.officerId
            WHERE 1=1
        `;
        const params: any[] = [];

        if (filters.officerId) {
            sql += ' AND v.officerId = ?';
            params.push(filters.officerId);
        }
        if (filters.tenantId) {
            sql += ' AND v.tenantId = ?';
            params.push(filters.tenantId);
        }
        if (filters.status) {
            sql += ' AND v.status = ?';
            params.push(filters.status);
        }

        sql += ' ORDER BY v.scheduledDate DESC';

        const results = await query(sql, params) as any[];

        // Fetch reports for these visits (in practice, it's better to fetch selectively or do a specific join, 
        // but for maintaining the exact payload shape we fetch them if needed)
        // Here we'll do a basic join logic if needed or just return raw visits.
        return results.map(v => ({
            ...v,
            tenant: v.tenantId ? { id: v.tenantId, name: v.tenantName } : undefined,
            officer: v.officerId ? { id: v.officerId, firstName: v.officerFirstName, lastName: v.officerLastName } : undefined,
        })) as FieldVisit[];
    }

    /**
     * Update visit status
     */
    static async updateVisitStatus(visitId: string, status: FieldVisitStatus, actualDate?: Date): Promise<FieldVisit> {
        if (actualDate) {
            await execute(
                'UPDATE field_visits SET status = ?, actualDate = ?, updatedAt = NOW() WHERE id = ?',
                [status, actualDate, visitId]
            );
        } else {
            await execute(
                'UPDATE field_visits SET status = ?, updatedAt = NOW() WHERE id = ?',
                [status, visitId]
            );
        }

        const [[visit]] = await query('SELECT * FROM field_visits WHERE id = ? LIMIT 1', [visitId]) as any;
        return visit as FieldVisit;
    }

    /**
     * Submit a field report
     */
    static async submitReport(data: {
        visitId: string;
        tenantId: string;
        submittedById: string;
        cooperativePrinciplesChecklist: any;
        memberVerificationResults?: any;
        generalFindings: string;
        recommendations: string;
        attachments?: string[];
    }): Promise<FieldReport> {
        const id = uuidv4();
        await execute(
            `INSERT INTO field_reports 
             (id, visitId, tenantId, submittedById, cooperativePrinciplesChecklist, memberVerificationResults, generalFindings, recommendations, attachments, createdAt, updatedAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
            [
                id, data.visitId, data.tenantId, data.submittedById,
                JSON.stringify(data.cooperativePrinciplesChecklist),
                data.memberVerificationResults ? JSON.stringify(data.memberVerificationResults) : null,
                data.generalFindings, data.recommendations,
                data.attachments ? JSON.stringify(data.attachments) : null
            ]
        );

        const [[savedReport]] = await query('SELECT * FROM field_reports WHERE id = ? LIMIT 1', [id]) as any;

        // Update visit status to completed
        await this.updateVisitStatus(data.visitId, FieldVisitStatus.COMPLETED, new Date());

        return savedReport as FieldReport;
    }

    /**
     * Initiate a new investigation
     */
    static async initiateInvestigation(data: {
        tenantId: string;
        officerId: string;
        subject: string;
        description: string;
        severity: InvestigationSeverity;
    }): Promise<Investigation> {
        const id = uuidv4();
        await execute(
            `INSERT INTO investigations (id, tenantId, officerId, subject, description, severity, status, createdAt, updatedAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
            [id, data.tenantId, data.officerId, data.subject, data.description, data.severity, InvestigationStatus.OPEN]
        );

        const [[investigation]] = await query('SELECT * FROM investigations WHERE id = ? LIMIT 1', [id]) as any;
        return investigation as Investigation;
    }

    /**
     * Update investigation findings and recommendations
     */
    static async updateInvestigation(investigationId: string, data: {
        findings?: string;
        recommendations?: string;
        status?: InvestigationStatus;
    }): Promise<Investigation> {
        let setClauses = [];
        let params = [];

        if (data.findings !== undefined) {
            setClauses.push('findings = ?');
            params.push(data.findings);
        }
        if (data.recommendations !== undefined) {
            setClauses.push('recommendations = ?');
            params.push(data.recommendations);
        }
        if (data.status !== undefined) {
            setClauses.push('status = ?');
            params.push(data.status);
            if (data.status === InvestigationStatus.COMPLETED || data.status === InvestigationStatus.CLOSED) {
                setClauses.push('completedAt = NOW()');
            }
        }

        if (setClauses.length > 0) {
            setClauses.push('updatedAt = NOW()');
            params.push(investigationId);
            await execute(
                `UPDATE investigations SET ${setClauses.join(', ')} WHERE id = ?`,
                params
            );
        }

        const [[investigation]] = await query('SELECT * FROM investigations WHERE id = ? LIMIT 1', [investigationId]) as any;
        return investigation as Investigation;
    }

    /**
     * Get all investigations
     */
    static async getInvestigations(filters: {
        officerId?: string;
        tenantId?: string;
        status?: InvestigationStatus;
    }): Promise<Investigation[]> {
        let sql = `
            SELECT i.*, t.name as tenantName, u.firstName as officerFirstName, u.lastName as officerLastName
            FROM investigations i
            LEFT JOIN tenants t ON t.id = i.tenantId
            LEFT JOIN users u ON u.id = i.officerId
            WHERE 1=1
        `;
        const params: any[] = [];

        if (filters.officerId) {
            sql += ' AND i.officerId = ?';
            params.push(filters.officerId);
        }
        if (filters.tenantId) {
            sql += ' AND i.tenantId = ?';
            params.push(filters.tenantId);
        }
        if (filters.status) {
            sql += ' AND i.status = ?';
            params.push(filters.status);
        }

        sql += ' ORDER BY i.createdAt DESC';

        const results = await query(sql, params) as any[];

        return results.map(i => ({
            ...i,
            tenant: i.tenantId ? { id: i.tenantId, name: i.tenantName } : undefined,
            officer: i.officerId ? { id: i.officerId, firstName: i.officerFirstName, lastName: i.officerLastName } : undefined,
        })) as Investigation[];
    }

    /**
     * Log GPS coordinates for a field visit
     */
    static async logGeolocation(visitId: string, latitude: number, longitude: number): Promise<FieldVisit> {
        await execute(
            'UPDATE field_visits SET latitude = ?, longitude = ?, geoLoggedAt = NOW() WHERE id = ?',
            [latitude, longitude, visitId]
        );

        const [[visit]] = await query('SELECT * FROM field_visits WHERE id = ? LIMIT 1', [visitId]) as any;
        return visit as FieldVisit;
    }

    /**
     * Get visits for calendar integration
     */
    static async getCalendarVisits(filters: {
        officerId?: string;
        tenantId?: string;
        startDate: Date;
        endDate: Date;
    }): Promise<FieldVisit[]> {
        let sql = `
            SELECT v.*, t.name as tenantName, u.firstName as officerFirstName, u.lastName as officerLastName
            FROM field_visits v
            LEFT JOIN tenants t ON t.id = v.tenantId
            LEFT JOIN users u ON u.id = v.officerId
            WHERE v.scheduledDate BETWEEN ? AND ?
        `;
        const params: any[] = [filters.startDate, filters.endDate];

        if (filters.officerId) {
            sql += ' AND v.officerId = ?';
            params.push(filters.officerId);
        }

        if (filters.tenantId) {
            sql += ' AND v.tenantId = ?';
            params.push(filters.tenantId);
        }

        const results = await query(sql, params) as any[];

        return results.map(v => ({
            ...v,
            tenant: v.tenantId ? { id: v.tenantId, name: v.tenantName } : undefined,
            officer: v.officerId ? { id: v.officerId, firstName: v.officerFirstName, lastName: v.officerLastName } : undefined,
        })) as FieldVisit[];
    }
}
