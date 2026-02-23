import { query, queryOne, execute } from '../db/query';
import { RowDataPacket } from 'mysql2/promise';
import { v4 as uuidv4 } from 'uuid';
import { IAuditorAccessRequest, IAuditWorkingPaper, IAuditReport, AccessRequestStatus, AuditReportStatus } from '../interfaces/IAuditor';

export class AuditorService {
    async createAccessRequest(data: {
        auditorId: string;
        tenantId: string;
        startDate: Date | string;
        endDate: Date | string;
        purpose: string;
    }): Promise<IAuditorAccessRequest> {
        const id = uuidv4();
        await execute(
            `INSERT INTO auditor_access_requests (id, auditorId, tenantId, startDate, endDate, purpose, status, createdAt, updatedAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
            [
                id, data.auditorId, data.tenantId, new Date(data.startDate), new Date(data.endDate),
                data.purpose, AccessRequestStatus.PENDING
            ]
        );

        const request = await queryOne<RowDataPacket & IAuditorAccessRequest>('SELECT * FROM auditor_access_requests WHERE id = ?', [id]);
        if (!request) throw new Error('Failed to create access request');
        return request;
    }

    async approveAccessRequest(requestId: string, approvedById: string): Promise<IAuditorAccessRequest> {
        await execute('UPDATE auditor_access_requests SET status = ?, approvedById = ?, updatedAt = NOW() WHERE id = ?', [AccessRequestStatus.APPROVED, approvedById, requestId]);
        const request = await queryOne<RowDataPacket & IAuditorAccessRequest>('SELECT * FROM auditor_access_requests WHERE id = ?', [requestId]);
        if (!request) throw new Error('Access request not found');
        return request;
    }

    async rejectAccessRequest(requestId: string): Promise<IAuditorAccessRequest> {
        await execute('UPDATE auditor_access_requests SET status = ?, updatedAt = NOW() WHERE id = ?', [AccessRequestStatus.REJECTED, requestId]);
        const request = await queryOne<RowDataPacket & IAuditorAccessRequest>('SELECT * FROM auditor_access_requests WHERE id = ?', [requestId]);
        if (!request) throw new Error('Access request not found');
        return request;
    }

    async getAuditorAccess(auditorId: string): Promise<any[]> {
        return await query<any>(`
            SELECT r.*, t.name as tenantName 
            FROM auditor_access_requests r
            LEFT JOIN tenants t ON t.id = r.tenantId
            WHERE r.auditorId = ?
            ORDER BY r.createdAt DESC
        `, [auditorId]);
    }

    async hasActiveAccess(auditorId: string, tenantId: string): Promise<boolean> {
        const res = await queryOne<any>(`
            SELECT id FROM auditor_access_requests 
            WHERE auditorId = ? AND tenantId = ? AND status = ? 
            AND startDate <= NOW() AND endDate >= NOW()
        `, [auditorId, tenantId, AccessRequestStatus.APPROVED]);

        return !!res;
    }

    async uploadWorkingPaper(data: {
        requestId: string;
        fileName: string;
        fileUrl: string;
        uploadedById: string;
    }): Promise<IAuditWorkingPaper> {
        const id = uuidv4();
        await execute(
            `INSERT INTO audit_working_papers (id, requestId, fileName, fileUrl, uploadedById, createdAt, updatedAt)
             VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
            [id, data.requestId, data.fileName, data.fileUrl, data.uploadedById]
        );

        const paper = await queryOne<RowDataPacket & IAuditWorkingPaper>('SELECT * FROM audit_working_papers WHERE id = ?', [id]);
        if (!paper) throw new Error('Failed to upload working paper');
        return paper;
    }

    async submitAuditReport(data: {
        requestId: string;
        fileName: string;
        fileUrl: string;
    }): Promise<IAuditReport> {
        let report = await queryOne<RowDataPacket & IAuditReport>('SELECT * FROM audit_reports WHERE requestId = ?', [data.requestId]);

        let id = report?.id;
        if (report) {
            await execute(
                `UPDATE audit_reports SET fileName = ?, fileUrl = ?, status = ?, submittedAt = NOW(), updatedAt = NOW() WHERE id = ?`,
                [data.fileName, data.fileUrl, AuditReportStatus.SUBMITTED, id]
            );
        } else {
            id = uuidv4();
            await execute(
                `INSERT INTO audit_reports (id, requestId, fileName, fileUrl, status, submittedAt, createdAt, updatedAt)
                 VALUES (?, ?, ?, ?, ?, NOW(), NOW(), NOW())`,
                [id, data.requestId, data.fileName, data.fileUrl, AuditReportStatus.SUBMITTED]
            );
        }

        const newReport = await queryOne<RowDataPacket & IAuditReport>('SELECT * FROM audit_reports WHERE id = ?', [id]);
        if (!newReport) throw new Error('Failed to submit report');
        return newReport;
    }

    async getWorkingPapers(requestId: string): Promise<IAuditWorkingPaper[]> {
        return await query<RowDataPacket & IAuditWorkingPaper>('SELECT * FROM audit_working_papers WHERE requestId = ? ORDER BY createdAt DESC', [requestId]);
    }

    async getAuditReport(requestId: string): Promise<IAuditReport | null> {
        return await queryOne<RowDataPacket & IAuditReport>('SELECT * FROM audit_reports WHERE requestId = ?', [requestId]);
    }
}
