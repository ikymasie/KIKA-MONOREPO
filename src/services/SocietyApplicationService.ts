import { query, execute, withTransaction } from '../db/query';
import { v4 as uuidv4 } from 'uuid';
import { RowDataPacket } from 'mysql2/promise';

export class SocietyApplicationService {

    static async createApplication(
        data: any,
        user: any
    ): Promise<any> {
        // Ensure settings exist and get current fees
        let [settings] = await query('SELECT * FROM regulator_settings ORDER BY updatedAt DESC LIMIT 1') as any;

        if (!settings) {
            // Fallback fees if no settings
            settings = {
                saccosApplicationFee: 500,
                religiousSocietyApplicationFee: 250,
                generalSocietyApplicationFee: 250,
                burialSocietyApplicationFee: 100,
                cooperativeApplicationFee: 500,
            };
        }

        // Determine fee based on application type
        let feeAmount = 0;
        switch (data.applicationType) {
            case 'saccos':
                feeAmount = settings.saccosApplicationFee!;
                break;
            case 'religious_society':
                feeAmount = settings.religiousSocietyApplicationFee!;
                break;
            case 'general_society':
                feeAmount = settings.generalSocietyApplicationFee!;
                break;
            case 'burial_society':
                feeAmount = settings.burialSocietyApplicationFee!;
                break;
            case 'cooperative':
                feeAmount = settings.cooperativeApplicationFee!;
                break;
            default:
                feeAmount = settings.generalSocietyApplicationFee!;
        }

        const id = uuidv4();
        await execute(
            `INSERT INTO society_applications (id, proposedName, applicationType, applicantUserId, status, feeAmount, 
            physicalAddress, primaryContactName, primaryContactEmail, primaryContactPhone, createdAt, updatedAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
            [
                id, data.proposedName, data.applicationType, user.id, 'draft', feeAmount,
                data.physicalAddress || '', data.primaryContactName || '', data.primaryContactEmail || '', data.primaryContactPhone || ''
            ]
        );

        const [savedApplication] = await query('SELECT * FROM society_applications WHERE id = ?', [id]) as any;
        return savedApplication;
    }

    /**
     * Refreshes the fee for a draft application from current settings.
     * Useful if fees changed while application was in draft.
     */
    static async refreshApplicationFee(applicationId: string): Promise<any | null> {
        const [application] = await query('SELECT * FROM society_applications WHERE id = ?', [applicationId]) as any;

        if (!application || application.status !== 'draft') {
            return application;
        }

        const [settings] = await query('SELECT * FROM regulator_settings ORDER BY updatedAt DESC LIMIT 1') as any;

        if (!settings) return application;

        let feeAmount = 0;
        switch (application.applicationType) {
            case 'saccos':
                feeAmount = settings.saccosApplicationFee!;
                break;
            case 'religious_society':
                feeAmount = settings.religiousSocietyApplicationFee!;
                break;
            case 'general_society':
                feeAmount = settings.generalSocietyApplicationFee!;
                break;
            case 'burial_society':
                feeAmount = settings.burialSocietyApplicationFee!;
                break;
            case 'cooperative':
                feeAmount = settings.cooperativeApplicationFee!;
                break;
            default:
                feeAmount = settings.generalSocietyApplicationFee!;
        }

        await execute('UPDATE society_applications SET feeAmount = ?, updatedAt = NOW() WHERE id = ?', [feeAmount, applicationId]);
        const [updatedApplication] = await query('SELECT * FROM society_applications WHERE id = ?', [applicationId]) as any;
        return updatedApplication;
    }

    /**
     * Get applications for Registry Clerk view
     */
    static async getApplicationsForRegistry(filters?: {
        status?: string;
        type?: string;
        search?: string;
    }): Promise<any[]> {
        let sql = `
            SELECT app.*, 
                   u.firstName as applicantFirstName, u.lastName as applicantLastName, u.email as applicantEmail
            FROM society_applications app
            LEFT JOIN users u ON u.id = app.applicantUserId
            WHERE app.status IN (?, ?, ?, ?, ?, ?)
        `;
        const params: any[] = [
            'submitted',
            'incomplete',
            'under_review',
            'security_vetting',
            'legal_review',
            'pending_decision'
        ];

        if (filters?.status) {
            sql += ' AND app.status = ?';
            params.push(filters.status);
        }

        if (filters?.type) {
            sql += ' AND app.applicationType = ?';
            params.push(filters.type);
        }

        if (filters?.search) {
            sql += ' AND (app.proposedName LIKE ? OR app.fileNumber LIKE ?)';
            params.push(`%${filters.search}%`, `%${filters.search}%`);
        }

        sql += ' ORDER BY app.createdAt DESC';

        const results = await query(sql, params) as any[];

        return results.map(r => ({
            ...r,
            applicant: r.applicantUserId ? { id: r.applicantUserId, firstName: r.applicantFirstName, lastName: r.applicantLastName, email: r.applicantEmail } : undefined
        })) as any[];
    }

    /**
     * Update document verification status
     */
    static async verifyDocument(
        documentId: string,
        isVerified: boolean,
        clerkId: string
    ): Promise<any> {
        const [document] = await query('SELECT * FROM application_documents WHERE id = ?', [documentId]) as any;

        if (!document) throw new Error('Document not found');

        const verifiedAt = new Date();
        await execute(
            'UPDATE application_documents SET isVerified = ?, verifiedAt = ?, verifiedById = ? WHERE id = ?',
            [isVerified, verifiedAt, clerkId, documentId]
        );

        const [updatedDocument] = await query('SELECT * FROM application_documents WHERE id = ?', [documentId]) as any;
        return updatedDocument;
    }

    /**
     * Complete registry phase and set file number
     */
    static async completeRegistryIntake(
        applicationId: string,
        clerkId: string,
        isIncomplete: boolean,
        notes?: string
    ): Promise<any> {
        const [application] = await query('SELECT * FROM society_applications WHERE id = ?', [applicationId]) as any;
        if (!application) throw new Error('Application not found');

        let status = application.status;
        let fileNumber = application.fileNumber;
        let rejectionReasons = application.rejectionReasons;
        let registryClerkId = application.registryClerkId;
        let assignedFileNumberAt = application.assignedFileNumberAt;

        if (isIncomplete) {
            status = 'incomplete';
            rejectionReasons = notes;
        } else {
            status = 'under_review';
            registryClerkId = clerkId;
            assignedFileNumberAt = new Date();

            // Generate file number if not present (simple generator)
            if (!fileNumber) {
                const prefix = application.applicationType === 'saccos' ? 'SACCOS' : 'SOC';
                const year = new Date().getFullYear();
                const [countResult] = await query('SELECT COUNT(*) as count FROM society_applications') as any;
                const count = Number(countResult?.count || 0);
                fileNumber = `${prefix}-${year}-${(count + 1).toString().padStart(4, '0')}`;
            }
        }

        await execute(
            `UPDATE society_applications 
             SET status = ?, rejectionReasons = ?, registryClerkId = ?, assignedFileNumberAt = ?, fileNumber = ?, updatedAt = NOW()
             WHERE id = ?`,
            [status, rejectionReasons, registryClerkId, assignedFileNumberAt, fileNumber, applicationId]
        );

        const [updatedApplication] = await query('SELECT * FROM society_applications WHERE id = ?', [applicationId]) as any;
        return updatedApplication;
    }

    /**
     * Assign application to next workflow stage
     */
    static async assignToWorkflow(
        applicationId: string,
        officerId: string,
        targetRole: 'intelligence' | 'legal',
        performerId?: string,
        notes?: string
    ): Promise<any> {
        return await withTransaction(async (conn) => {
            const [application] = await conn.query('SELECT * FROM society_applications WHERE id = ?', [applicationId]) as any;
            if (!application) throw new Error('Application not found');

            const fromStatus = application.status;
            let status = application.status;
            let intelligenceLiaisonId = application.intelligenceLiaisonId;
            let legalOfficerId = application.legalOfficerId;

            if (targetRole === 'intelligence') {
                status = 'security_vetting';
                intelligenceLiaisonId = officerId;
            } else {
                status = 'legal_review';
                legalOfficerId = officerId;
            }

            // Update application
            await conn.execute(
                `UPDATE society_applications 
                 SET status = ?, intelligenceLiaisonId = ?, legalOfficerId = ?, updatedAt = NOW()
                 WHERE id = ?`,
                [status, intelligenceLiaisonId, legalOfficerId, applicationId]
            );

            // Fetch updated application
            const [savedApplication] = await conn.query('SELECT * FROM society_applications WHERE id = ?', [applicationId]) as any;

            // Log the workflow change
            if (performerId) {
                const logId = uuidv4();
                await conn.execute(
                    `INSERT INTO application_workflow_logs (id, applicationId, fromStatus, toStatus, performedBy, notes, createdAt)
                     VALUES (?, ?, ?, ?, ?, ?, NOW())`,
                    [logId, applicationId, fromStatus, status, performerId, notes || `Assigned to ${targetRole} review`]
                );
            }

            // Merge applicant details for return (to match previous behavior if needed)
            const [applicant] = await conn.query('SELECT * FROM users WHERE id = ?', [savedApplication.applicantUserId]) as any;
            if (applicant) {
                savedApplication.applicant = { id: applicant.id, firstName: applicant.firstName, lastName: applicant.lastName, email: applicant.email };
            }

            return savedApplication;
        });
    }

    /**
     * Bulk assign applications to next workflow stage
     */
    static async bulkAssignToWorkflow(
        applicationIds: string[],
        officerId: string,
        targetRole: 'intelligence' | 'legal',
        performerId: string,
        notes?: string
    ): Promise<any[]> {
        const results: any[] = [];
        for (const id of applicationIds) {
            const app = await this.assignToWorkflow(id, officerId, targetRole, performerId, notes);
            results.push(app);
        }
        return results;
    }

    /**
     * Log communication with applicant
     */
    static async logCommunication(
        applicationId: string,
        data: {
            type: string,
            direction: string,
            subject?: string,
            content: string,
            recordedById: string
        }
    ): Promise<any> {
        const id = uuidv4();
        await execute(
            `INSERT INTO application_communications (id, applicationId, type, direction, subject, content, recordedById, createdAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
            [id, applicationId, data.type, data.direction, data.subject, data.content, data.recordedById]
        );
        const [comm] = await query('SELECT * FROM application_communications WHERE id = ?', [id]) as any;
        return comm;
    }

    /**
     * Get communication logs for an application
     */
    static async getCommunications(applicationId: string): Promise<any[]> {
        const results = await query(`
            SELECT c.*, u.firstName as recordedByFirstName, u.lastName as recordedByLastName
            FROM application_communications c
            LEFT JOIN users u ON u.id = c.recordedById
            WHERE c.applicationId = ?
            ORDER BY c.createdAt DESC
        `, [applicationId]) as any[];

        return results.map(r => ({
            ...r,
            recordedBy: r.recordedById ? { id: r.recordedById, firstName: r.recordedByFirstName, lastName: r.recordedByLastName } : undefined
        }));
    }

    /**
     * Get applications for Security Vetting view
     */
    static async getApplicationsForVetting(officerId: string): Promise<any[]> {
        const results = await query(`
            SELECT a.*, u.firstName as applicantFirstName, u.lastName as applicantLastName
            FROM society_applications a
            LEFT JOIN users u ON u.id = a.applicantUserId
            WHERE a.status = ? AND a.intelligenceLiaisonId = ?
            ORDER BY a.updatedAt DESC
        `, ['security_vetting', officerId]) as any[];

        return results.map(r => ({
            ...r,
            applicant: r.applicantUserId ? { id: r.applicantUserId, firstName: r.applicantFirstName, lastName: r.applicantLastName } : undefined
        })) as any[];
    }

    /**
     * Submit security clearance decision
     */
    static async submitSecurityClearance(
        applicationId: string,
        officerId: string,
        isCleared: boolean,
        notes: string,
        riskLevel: string = 'low'
    ): Promise<any> {
        return await withTransaction(async (conn) => {
            const [application] = await conn.query('SELECT * FROM society_applications WHERE id = ?', [applicationId]) as any;
            if (!application) throw new Error('Application not found');

            // Update or create screening record
            const [screening] = await conn.query('SELECT * FROM security_screenings WHERE applicationId = ? LIMIT 1', [applicationId]) as any;

            const screeningStatus = isCleared ? 'cleared' : 'failed';

            if (!screening) {
                const screeningId = uuidv4();
                const checks = {
                    criminalRecordMatched: false,
                    sanctionsListMatched: false,
                    adverseMediaFound: false,
                    pepStatusConfirmed: false,
                    sourceOfWealthVerified: true
                };

                await conn.execute(
                    `INSERT INTO security_screenings (id, applicationId, officerId, status, riskLevel, checks, notes, createdAt, updatedAt)
                     VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
                    [screeningId, applicationId, officerId, screeningStatus, riskLevel, JSON.stringify(checks), notes]
                );
            } else {
                await conn.execute(
                    `UPDATE security_screenings 
                     SET status = ?, notes = ?, riskLevel = ?, officerId = ?, updatedAt = NOW()
                     WHERE id = ?`,
                    [screeningStatus, notes, riskLevel, officerId, screening.id]
                );
            }

            const appStatus = isCleared ? 'legal_review' : 'security_failed';
            const securityClearedAt = isCleared ? new Date() : null;

            await conn.execute(
                `UPDATE society_applications 
                 SET securityVettingNotes = ?, securityClearedAt = ?, intelligenceLiaisonId = ?, status = ?, updatedAt = NOW()
                 WHERE id = ?`,
                [notes, securityClearedAt, officerId, appStatus, applicationId]
            );

            const [updatedApp] = await conn.query('SELECT * FROM society_applications WHERE id = ?', [applicationId]) as any;
            return updatedApp;
        });
    }

    /**
     * Get security screening for an application
     */
    static async getSecurityScreening(applicationId: string): Promise<any | null> {
        const [screening] = await query('SELECT * FROM security_screenings WHERE applicationId = ? LIMIT 1', [applicationId]) as any;
        if (!screening) return null;

        const flags = await query('SELECT * FROM risk_flags WHERE screeningId = ?', [screening.id]) as any[];
        screening.riskFlags = flags;

        if (screening.officerId) {
            const [officer] = await query('SELECT * FROM users WHERE id = ?', [screening.officerId]) as any;
            screening.officer = officer;
        }

        return screening;
    }

    /**
     * Add risk flag to a screening
     */
    static async addRiskFlag(
        screeningId: string,
        data: { type: string; description: string }
    ): Promise<any> {
        const id = uuidv4();
        await execute(
            `INSERT INTO risk_flags (id, screeningId, type, description, isResolved, createdAt)
             VALUES (?, ?, ?, ?, false, NOW())`,
            [id, screeningId, data.type, data.description]
        );
        const [flag] = await query('SELECT * FROM risk_flags WHERE id = ?', [id]) as any;
        return flag;
    }

    /**
     * Resolve a risk flag
     */
    static async resolveRiskFlag(flagId: string, userId: string): Promise<any> {
        const [flag] = await query('SELECT * FROM risk_flags WHERE id = ?', [flagId]) as any;
        if (!flag) throw new Error('Risk flag not found');

        const resolvedAt = new Date();
        await execute(
            'UPDATE risk_flags SET isResolved = true, resolvedAt = ?, resolvedById = ? WHERE id = ?',
            [resolvedAt, userId, flagId]
        );

        const [updatedFlag] = await query('SELECT * FROM risk_flags WHERE id = ?', [flagId]) as any;
        return updatedFlag;
    }

    /**
     * Get applications pending security vetting
     */
    static async getApplicationsPendingVetting(): Promise<any[]> {
        const results = await query(`
            SELECT a.*, u.firstName as applicantFirstName, u.lastName as applicantLastName
            FROM society_applications a
            LEFT JOIN users u ON u.id = a.applicantUserId
            WHERE a.status = ?
            ORDER BY a.updatedAt DESC
        `, ['security_vetting']) as any[];

        return results.map(r => ({
            ...r,
            applicant: r.applicantUserId ? { id: r.applicantUserId, firstName: r.applicantFirstName, lastName: r.applicantLastName } : undefined
        })) as any[];
    }

    /**
     * Get a specific application by ID
     */
    static async getApplicationById(id: string): Promise<any | null> {
        const [application] = await query(`
            SELECT a.*, 
                   u.firstName as applicantFirstName, u.lastName as applicantLastName, u.email as applicantEmail,
                   rc.firstName as rcFirstName, rc.lastName as rcLastName,
                   il.firstName as ilFirstName, il.lastName as ilLastName,
                   lo.firstName as loFirstName, lo.lastName as loLastName
            FROM society_applications a
            LEFT JOIN users u ON u.id = a.applicantUserId
            LEFT JOIN users rc ON rc.id = a.registryClerkId
            LEFT JOIN users il ON il.id = a.intelligenceLiaisonId
            LEFT JOIN users lo ON lo.id = a.legalOfficerId
            WHERE a.id = ?
        `, [id]) as any;

        if (!application) return null;

        application.applicant = application.applicantUserId ? { id: application.applicantUserId, firstName: application.applicantFirstName, lastName: application.applicantLastName, email: application.applicantEmail } : undefined;
        application.registryClerk = application.registryClerkId ? { id: application.registryClerkId, firstName: application.rcFirstName, lastName: application.rcLastName } : undefined;
        application.intelligenceLiaison = application.intelligenceLiaisonId ? { id: application.intelligenceLiaisonId, firstName: application.ilFirstName, lastName: application.ilLastName } : undefined;
        application.legalOfficer = application.legalOfficerId ? { id: application.legalOfficerId, firstName: application.loFirstName, lastName: application.loLastName } : undefined;

        // Clean up raw flat data
        delete application.applicantFirstName; delete application.applicantLastName; delete application.applicantEmail;
        delete application.rcFirstName; delete application.rcLastName;
        delete application.ilFirstName; delete application.ilLastName;
        delete application.loFirstName; delete application.loLastName;

        return application;
    }

    /**
     * Get all applications for a specific applicant
     */
    static async getApplicantApplications(userId: string): Promise<any[]> {
        return await query(`SELECT * FROM society_applications WHERE applicantUserId = ? ORDER BY createdAt DESC`, [userId]) as any[];
    }

    /**
     * Get application by ID ensuring it belongs to the applicant
     */
    static async getApplicantApplication(id: string, userId: string): Promise<any | null> {
        const [application] = await query(`
            SELECT a.*, u.firstName as applicantFirstName, u.lastName as applicantLastName, u.email as applicantEmail
            FROM society_applications a
            LEFT JOIN users u ON u.id = a.applicantUserId
            WHERE a.id = ? AND a.applicantUserId = ?
        `, [id, userId]) as any;

        if (!application) return null;

        application.applicant = { id: application.applicantUserId, firstName: application.applicantFirstName, lastName: application.applicantLastName, email: application.applicantEmail };

        delete application.applicantFirstName; delete application.applicantLastName; delete application.applicantEmail;

        return application;
    }

    /**
     * Update an application
     */
    static async updateApplication(
        id: string,
        data: any,
        userId?: string
    ): Promise<any> {
        const application = userId
            ? await this.getApplicantApplication(id, userId)
            : await this.getApplicationById(id);

        if (!application) throw new Error('Application not found or unauthorized');

        if (userId && !['draft', 'incomplete'].includes(application.status)) {
            throw new Error('Application cannot be updated in its current status');
        }

        const updates: string[] = [];
        const params: any[] = [];

        for (const [key, value] of Object.entries(data)) {
            if (key !== 'id' && key !== 'createdAt' && key !== 'updatedAt') {
                updates.push(`${key} = ?`);
                params.push(value);
            }
        }

        if (updates.length > 0) {
            params.push(id);
            await execute(`UPDATE society_applications SET ${updates.join(', ')}, updatedAt = NOW() WHERE id = ?`, params);
        }

        return await this.getApplicationById(id);
    }

    // --- Document Management ---

    /**
     * Add a document to an application
     */
    static async addDocument(
        applicationId: string,
        data: any,
        userId: string
    ): Promise<any> {
        const id = uuidv4();
        await execute(
            `INSERT INTO application_documents (id, applicationId, documentType, fileName, fileUrl, fileSizeBytes, mimeType, uploadedBy, uploadedAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
            [id, applicationId, data.documentType, data.fileName, data.fileUrl, data.fileSizeBytes, data.mimeType, userId]
        );
        const [doc] = await query('SELECT * FROM application_documents WHERE id = ?', [id]) as any;
        return doc;
    }

    /**
     * Get documents for an application
     */
    static async getDocuments(applicationId: string): Promise<any[]> {
        return await query(`SELECT * FROM application_documents WHERE applicationId = ? ORDER BY uploadedAt DESC`, [applicationId]) as any[];
    }

    /**
     * Remove a document
     */
    static async removeDocument(documentId: string, userId: string): Promise<void> {
        const [document] = await query('SELECT * FROM application_documents WHERE id = ? AND uploadedBy = ?', [documentId, userId]) as any;
        if (!document) throw new Error('Document not found or unauthorized');
        await execute('DELETE FROM application_documents WHERE id = ?', [documentId]);
    }

    // --- Member Management ---

    /**
     * Add a member to an application
     */
    static async addMember(
        applicationId: string,
        data: any
    ): Promise<any> {
        const id = uuidv4();
        await execute(
            `INSERT INTO application_members (id, applicationId, fullName, idNumber, citizenship, isOfficeBearer, officeBearerPosition, residentialAddress, createdAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
            [id, applicationId, data.fullName, data.idNumber, data.citizenship, data.isOfficeBearer || false, data.officeBearerPosition, data.residentialAddress]
        );
        const [member] = await query('SELECT * FROM application_members WHERE id = ?', [id]) as any;
        return member;
    }

    /**
     * Get members for an application
     */
    static async getMembers(applicationId: string): Promise<any[]> {
        return await query(`SELECT * FROM application_members WHERE applicationId = ? ORDER BY createdAt ASC`, [applicationId]) as any[];
    }

    /**
     * Update a member's details
     */
    static async updateMember(
        memberId: string,
        data: any
    ): Promise<any> {
        const [member] = await query('SELECT * FROM application_members WHERE id = ?', [memberId]) as any;
        if (!member) throw new Error('Member not found');

        const updates: string[] = [];
        const params: any[] = [];

        for (const [key, value] of Object.entries(data)) {
            if (key !== 'id' && key !== 'createdAt') {
                updates.push(`${key} = ?`);
                params.push(value);
            }
        }

        if (updates.length > 0) {
            params.push(memberId);
            await execute(`UPDATE application_members SET ${updates.join(', ')} WHERE id = ?`, params);
        }

        const [updatedMember] = await query('SELECT * FROM application_members WHERE id = ?', [memberId]) as any;
        return updatedMember;
    }

    /**
     * Remove a member from an application
     */
    static async removeMember(memberId: string): Promise<void> {
        const [member] = await query('SELECT * FROM application_members WHERE id = ?', [memberId]) as any;
        if (!member) throw new Error('Member not found');
        await execute('DELETE FROM application_members WHERE id = ?', [memberId]);
    }

    /**
     * Submit an appeal for a rejected application
     */
    static async submitAppeal(
        applicationId: string,
        userId: string,
        notes: string
    ): Promise<any> {
        const application = await this.getApplicantApplication(applicationId, userId);
        if (!application) throw new Error('Application not found or unauthorized');

        // Logic check for canAppeal based on status that was on entity
        const canAppeal = application.status === 'rejected';
        if (!canAppeal) {
            throw new Error('Application is not eligible for appeal');
        }

        const status = 'appeal_lodged';
        const appealLodgedAt = new Date();
        const appealOutcome = notes; // Using appealOutcome to store the applicant's reasoning

        await execute(
            `UPDATE society_applications 
             SET status = ?, appealLodgedAt = ?, appealOutcome = ?, updatedAt = NOW()
             WHERE id = ?`,
            [status, appealLodgedAt, appealOutcome, applicationId]
        );

        return await this.getApplicationById(applicationId);
    }
}
