import { SocietyApplication, ApplicationStatus, ApplicationType } from '../entities/SocietyApplication';
import { Certificate, CertificateType } from '../entities/Certificate';
import { AuditAction } from '../entities/AuditLog';
import { query, execute, withTransaction } from '../db/query';
import { v4 as uuidv4 } from 'uuid';
import { RowDataPacket } from 'mysql2/promise';

export class RegistrationService {
    /**
     * Get applications pending final decision
     */
    static async getPendingDecisions(): Promise<SocietyApplication[]> {
        const results = await query(`
            SELECT a.*, 
                   u_app.firstName as applicantFirstName, u_app.lastName as applicantLastName,
                   u_clerk.firstName as clerkFirstName, u_clerk.lastName as clerkLastName,
                   u_legal.firstName as legalFirstName, u_legal.lastName as legalLastName,
                   u_intel.firstName as intelFirstName, u_intel.lastName as intelLastName
            FROM society_applications a
            LEFT JOIN users u_app ON u_app.id = a.applicantId
            LEFT JOIN users u_clerk ON u_clerk.id = a.registryClerkId
            LEFT JOIN users u_legal ON u_legal.id = a.legalOfficerId
            LEFT JOIN users u_intel ON u_intel.id = a.intelligenceLiaisonId
            WHERE a.status = ?
            ORDER BY a.updatedAt DESC
        `, [ApplicationStatus.PENDING_DECISION]) as any[];

        return results.map(r => ({
            ...r,
            applicant: r.applicantId ? { id: r.applicantId, firstName: r.applicantFirstName, lastName: r.applicantLastName } : undefined,
            registryClerk: r.registryClerkId ? { id: r.registryClerkId, firstName: r.clerkFirstName, lastName: r.clerkLastName } : undefined,
            legalOfficer: r.legalOfficerId ? { id: r.legalOfficerId, firstName: r.legalFirstName, lastName: r.legalLastName } : undefined,
            intelligenceLiaison: r.intelligenceLiaisonId ? { id: r.intelligenceLiaisonId, firstName: r.intelFirstName, lastName: r.intelLastName } : undefined,
        })) as SocietyApplication[];
    }

    /**
     * Final approval of an application
     */
    static async approveApplication(
        applicationId: string,
        registrarId: string,
        notes?: string
    ): Promise<SocietyApplication> {
        return await withTransaction(async (conn) => {
            const [[application]] = await conn.query('SELECT * FROM society_applications WHERE id = ? LIMIT 1', [applicationId]) as any;

            if (!application) throw new Error('Application not found');
            if (application.status !== ApplicationStatus.PENDING_DECISION) {
                throw new Error(`Application in status ${application.status} cannot be approved`);
            }

            const [[registrar]] = await conn.query('SELECT * FROM users WHERE id = ? LIMIT 1', [registrarId]) as any;
            if (!registrar) throw new Error('Registrar not found');

            const fromStatus = application.status;
            let certificateNumber = application.certificateNumber;
            const finalDecisionAt = new Date();

            // Generate registration number (Certificate Number)
            if (!certificateNumber) {
                certificateNumber = await this.generateRegistrationNumber(application.applicationType, conn);
            }

            // Update application
            await conn.execute(
                `UPDATE society_applications 
                 SET status = ?, finalDecisionMakerId = ?, finalDecisionAt = ?, certificateNumber = ?, updatedAt = NOW()
                 WHERE id = ?`,
                [ApplicationStatus.APPROVED, registrarId, finalDecisionAt, certificateNumber, applicationId]
            );

            // Fetch the freshly updated application
            let [[savedApp]] = await conn.query('SELECT * FROM society_applications WHERE id = ? LIMIT 1', [applicationId]) as any;

            // Log workflow
            const workflowLogId = uuidv4();
            const workflowMetadata = {
                registrationNumber: certificateNumber,
                approvedAt: finalDecisionAt
            };

            await conn.execute(
                `INSERT INTO application_workflow_logs (id, applicationId, fromStatus, toStatus, performedBy, notes, metadata, createdAt)
                 VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
                [workflowLogId, application.id, fromStatus, ApplicationStatus.APPROVED, registrarId, notes || 'Final approval granted.', JSON.stringify(workflowMetadata)]
            );

            // Log audit
            const auditLogId = uuidv4();
            const auditNewValues = { status: ApplicationStatus.APPROVED, registrationNumber: certificateNumber };
            await conn.execute(
                `INSERT INTO audit_logs (id, userId, userEmail, action, entityType, entityId, description, newValues, createdAt)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
                [auditLogId, registrarId, registrar.email, AuditAction.APPROVE, 'SocietyApplication', application.id, `Registrar approved society application: ${application.proposedName}`, JSON.stringify(auditNewValues)]
            );

            return savedApp as SocietyApplication;
        });
    }

    /**
     * Issue official registration certificate
     */
    static async issueCertificate(
        applicationId: string,
        issuerId: string
    ): Promise<Certificate> {
        return await withTransaction(async (conn) => {
            const [[application]] = await conn.query('SELECT * FROM society_applications WHERE id = ? LIMIT 1', [applicationId]) as any;

            if (!application) throw new Error('Application not found');
            if (application.status !== ApplicationStatus.APPROVED && application.status !== ApplicationStatus.APPEAL_APPROVED) {
                throw new Error('Application must be approved before issuing certificate');
            }

            if (!application.certificateNumber) {
                throw new Error('Application does not have a registration number assigned');
            }

            const [[issuer]] = await conn.query('SELECT * FROM users WHERE id = ? LIMIT 1', [issuerId]) as any;
            if (!issuer) throw new Error('Issuer not found');

            // Check if certificate already exists
            const [[existingCert]] = await conn.query('SELECT * FROM certificates WHERE certificateNumber = ? LIMIT 1', [application.certificateNumber]) as any;
            if (existingCert) return existingCert as Certificate;

            // Create certificate
            const certificateId = uuidv4();
            const now = new Date();
            const metadata = {
                societyName: application.proposedName,
                registrationNumber: application.certificateNumber,
                registrationDate: now.toISOString(),
                applicationType: application.applicationType,
                address: application.physicalAddress
            };

            await conn.execute(
                `INSERT INTO certificates (id, tenantId, certificateNumber, certificateType, issuedDate, issuedBy, metadata, createdAt, updatedAt)
                 VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
                [certificateId, application.id, application.certificateNumber, CertificateType.REGISTRATION, now, issuerId, JSON.stringify(metadata)]
            );

            const [[savedCert]] = await conn.query('SELECT * FROM certificates WHERE id = ? LIMIT 1', [certificateId]) as any;

            // Update application
            await conn.execute(
                'UPDATE society_applications SET certificateIssuedAt = NOW(), updatedAt = NOW() WHERE id = ?',
                [application.id]
            );

            // Log audit
            const auditLogId = uuidv4();
            await conn.execute(
                `INSERT INTO audit_logs (id, userId, userEmail, action, entityType, entityId, description, createdAt)
                 VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
                [auditLogId, issuerId, issuer.email, AuditAction.CREATE, 'Certificate', savedCert.id, `Certificate issued for ${application.proposedName} (Reg: ${application.certificateNumber})`]
            );

            return savedCert as Certificate;
        });
    }

    /**
     * Generate a unique registration number based on type and year
     */
    private static async generateRegistrationNumber(type: ApplicationType, conn?: any): Promise<string> {
        const prefix = type === ApplicationType.SACCOS ? 'SACCOS' :
            type === ApplicationType.BURIAL_SOCIETY ? 'BUR' :
                type === ApplicationType.RELIGIOUS_SOCIETY ? 'REL' : 'GS';

        const year = new Date().getFullYear();
        const pattern = `${prefix}-${year}-%`;

        const queryFn = conn ? conn.query.bind(conn) : query;

        const [[countResult]] = await queryFn(
            'SELECT COUNT(*) as count FROM society_applications WHERE applicationType = ? AND certificateNumber LIKE ?',
            [type, pattern]
        ) as any;

        const count = Number(countResult?.count || 0);

        return `${prefix}-${year}-${(count + 1).toString().padStart(4, '0')}`;
    }

    /**
     * Get applications currently under appeal
     */
    static async getPendingAppeals(): Promise<SocietyApplication[]> {
        const results = await query(`
            SELECT a.*, 
                   u_app.firstName as applicantFirstName, u_app.lastName as applicantLastName,
                   u_dec.firstName as finalDecisionMakerFirstName, u_dec.lastName as finalDecisionMakerLastName
            FROM society_applications a
            LEFT JOIN users u_app ON u_app.id = a.applicantId
            LEFT JOIN users u_dec ON u_dec.id = a.finalDecisionMakerId
            WHERE a.status = ?
            ORDER BY a.appealLodgedAt DESC
        `, [ApplicationStatus.APPEAL_LODGED]) as any[];

        return results.map(r => ({
            ...r,
            applicant: r.applicantId ? { id: r.applicantId, firstName: r.applicantFirstName, lastName: r.applicantLastName } : undefined,
            finalDecisionMaker: r.finalDecisionMakerId ? { id: r.finalDecisionMakerId, firstName: r.finalDecisionMakerFirstName, lastName: r.finalDecisionMakerLastName } : undefined,
        })) as SocietyApplication[];
    }

    /**
     * Handle registration appeal decision
     */
    static async handleAppeal(
        applicationId: string,
        decisionMakerId: string,
        decision: 'APPROVE' | 'REJECT',
        notes: string
    ): Promise<SocietyApplication> {
        return await withTransaction(async (conn) => {
            const [[application]] = await conn.query('SELECT * FROM society_applications WHERE id = ? LIMIT 1', [applicationId]) as any;

            if (!application) throw new Error('Application not found');
            if (application.status !== ApplicationStatus.APPEAL_LODGED) {
                throw new Error('Application is not under appeal');
            }

            const [[decisionMaker]] = await conn.query('SELECT * FROM users WHERE id = ? LIMIT 1', [decisionMakerId]) as any;
            if (!decisionMaker) throw new Error('Decision maker not found');

            const fromStatus = application.status;
            const toStatus = decision === 'APPROVE' ? ApplicationStatus.APPEAL_APPROVED : ApplicationStatus.APPEAL_REJECTED;

            const appealDecisionAt = new Date();
            let certificateNumber = application.certificateNumber;

            if (decision === 'APPROVE' && !certificateNumber) {
                certificateNumber = await this.generateRegistrationNumber(application.applicationType, conn);
            }

            // Update application
            await conn.execute(
                `UPDATE society_applications 
                 SET status = ?, appealDecisionAt = ?, appealDecisionMakerId = ?, appealOutcome = ?, certificateNumber = ?, updatedAt = NOW()
                 WHERE id = ?`,
                [toStatus, appealDecisionAt, decisionMakerId, notes, certificateNumber, applicationId]
            );

            // Fetch the updated application
            let [[savedApp]] = await conn.query('SELECT * FROM society_applications WHERE id = ? LIMIT 1', [applicationId]) as any;

            // Log workflow
            const workflowLogId = uuidv4();
            const workflowMetadata = {
                decision,
                decisionAt: appealDecisionAt
            };
            await conn.execute(
                `INSERT INTO application_workflow_logs (id, applicationId, fromStatus, toStatus, performedBy, notes, metadata, createdAt)
                 VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
                [workflowLogId, application.id, fromStatus, toStatus, decisionMakerId, notes, JSON.stringify(workflowMetadata)]
            );

            // Log audit
            const auditLogId = uuidv4();
            const auditNewValues = { status: toStatus, outcome: notes };
            await conn.execute(
                `INSERT INTO audit_logs (id, userId, userEmail, action, entityType, entityId, description, newValues, createdAt)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
                [auditLogId, decisionMakerId, decisionMaker.email, decision === 'APPROVE' ? AuditAction.APPROVE : AuditAction.REJECT, 'SocietyApplication', application.id, `Appeal ${decision.toLowerCase()}d for ${application.proposedName}`, JSON.stringify(auditNewValues)]
            );

            return savedApp as SocietyApplication;
        });
    }

    /**
     * Get all registered societies (Official Registry)
     */
    static async getOfficialRegistry(): Promise<SocietyApplication[]> {
        return await query(`
            SELECT * FROM society_applications
            WHERE status IN (?, ?)
            ORDER BY certificateIssuedAt DESC
        `, [ApplicationStatus.APPROVED, ApplicationStatus.APPEAL_APPROVED]) as SocietyApplication[];
    }
}
