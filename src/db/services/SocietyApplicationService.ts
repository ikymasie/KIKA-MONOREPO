/**
 * src/db/services/SocietyApplicationService.ts
 *
 * All database operations for the `society_applications` table,
 * using raw parameterized SQL. Covers the full application lifecycle:
 *   Draft → Submitted → Registry Intake → Security Vetting
 *   → Legal Review → Pending Decision → Approved/Rejected → Appeal
 */

import { v4 as uuidv4 } from 'uuid';
import { RowDataPacket } from 'mysql2/promise';
import { query, queryOne, execute, buildSetClause, likeParam, withTransaction } from '../query';
import type {
    ISocietyApplication,
    ISocietyApplicationCreateInput,
    ISocietyApplicationFilters,
} from '../../interfaces/ISocietyApplication';
import {
    ApplicationStatus,
    ApplicationType,
    REGISTRY_ACTIVE_STATUSES,
    canApplicationAppeal,
    isApplicationApproved,
    isApplicationRejected,
} from '../../interfaces/ISocietyApplication';

// ─────────────────────────────────────────────────────────────────────────────
// Internal parser
// ─────────────────────────────────────────────────────────────────────────────
function parseApp(row: RowDataPacket): ISocietyApplication {
    return {
        ...row,
        feeAmount: Number(row.feeAmount ?? 0),
    } as ISocietyApplication;
}

// ─────────────────────────────────────────────────────────────────────────────
// Reads
// ─────────────────────────────────────────────────────────────────────────────

export async function getApplicationById(id: string): Promise<ISocietyApplication | null> {
    const row = await queryOne<RowDataPacket>(
        'SELECT * FROM society_applications WHERE id = ? LIMIT 1',
        [id]
    );
    return row ? parseApp(row) : null;
}

export async function getApplicationByIdForApplicant(
    id: string,
    applicantUserId: string
): Promise<ISocietyApplication | null> {
    const row = await queryOne<RowDataPacket>(
        'SELECT * FROM society_applications WHERE id = ? AND applicantUserId = ? LIMIT 1',
        [id, applicantUserId]
    );
    return row ? parseApp(row) : null;
}

export async function listApplicationsByApplicant(applicantUserId: string): Promise<ISocietyApplication[]> {
    const rows = await query<RowDataPacket>(
        'SELECT * FROM society_applications WHERE applicantUserId = ? ORDER BY createdAt DESC',
        [applicantUserId]
    );
    return rows.map(parseApp);
}

/** Registry clerk view — active workflow statuses with optional filters. */
export async function listApplicationsForRegistry(
    filters: ISocietyApplicationFilters = {}
): Promise<ISocietyApplication[]> {
    const conditions: string[] = [`status IN (${REGISTRY_ACTIVE_STATUSES.map(() => '?').join(', ')})`];
    const params: unknown[] = [...REGISTRY_ACTIVE_STATUSES];

    if (filters.status) { conditions.push('status = ?'); params.push(filters.status); }
    if (filters.applicationType) { conditions.push('applicationType = ?'); params.push(filters.applicationType); }
    if (filters.search) {
        const like = likeParam(filters.search);
        conditions.push('(proposedName LIKE ? OR fileNumber LIKE ?)');
        params.push(like, like);
    }

    const rows = await query<RowDataPacket>(
        `SELECT * FROM society_applications WHERE ${conditions.join(' AND ')} ORDER BY createdAt DESC`,
        params
    );
    return rows.map(parseApp);
}

/** Applications awaiting final approval (PENDING_DECISION). */
export async function getPendingDecisions(): Promise<ISocietyApplication[]> {
    const rows = await query<RowDataPacket>(
        `SELECT * FROM society_applications WHERE status = ? ORDER BY updatedAt DESC`,
        [ApplicationStatus.PENDING_DECISION]
    );
    return rows.map(parseApp);
}

/** Applications under security vetting, optionally filtered by assigned officer. */
export async function getApplicationsForVetting(officerId?: string): Promise<ISocietyApplication[]> {
    const conditions = ['status = ?'];
    const params: unknown[] = [ApplicationStatus.SECURITY_VETTING];
    if (officerId) { conditions.push('intelligenceLiaisonId = ?'); params.push(officerId); }
    const rows = await query<RowDataPacket>(
        `SELECT * FROM society_applications WHERE ${conditions.join(' AND ')} ORDER BY updatedAt DESC`,
        params
    );
    return rows.map(parseApp);
}

/** Applications in legal review, optionally by assigned officer. */
export async function getApplicationsForLegalReview(officerId?: string): Promise<ISocietyApplication[]> {
    const conditions = ['status = ?'];
    const params: unknown[] = [ApplicationStatus.LEGAL_REVIEW];
    if (officerId) { conditions.push('legalOfficerId = ?'); params.push(officerId); }
    const rows = await query<RowDataPacket>(
        `SELECT * FROM society_applications WHERE ${conditions.join(' AND ')} ORDER BY updatedAt DESC`,
        params
    );
    return rows.map(parseApp);
}

/** Approved/appeal-approved applications — the official registry. */
export async function getOfficialRegistry(): Promise<ISocietyApplication[]> {
    const rows = await query<RowDataPacket>(
        `SELECT * FROM society_applications
         WHERE status IN (?, ?)
         ORDER BY certificateIssuedAt DESC`,
        [ApplicationStatus.APPROVED, ApplicationStatus.APPEAL_APPROVED]
    );
    return rows.map(parseApp);
}

/** Applications currently under appeal. */
export async function getPendingAppeals(): Promise<ISocietyApplication[]> {
    const rows = await query<RowDataPacket>(
        `SELECT * FROM society_applications WHERE status = ? ORDER BY appealLodgedAt DESC`,
        [ApplicationStatus.APPEAL_LODGED]
    );
    return rows.map(parseApp);
}

/** Count applications by type+year for registration number generation. */
async function countByTypeAndYear(type: ApplicationType, prefix: string, year: number): Promise<number> {
    const row = await queryOne<RowDataPacket & { cnt: string }>(
        `SELECT COUNT(*) AS cnt FROM society_applications
         WHERE applicationType = ? AND certificateNumber LIKE ?`,
        [type, `${prefix}-${year}-%`]
    );
    return parseInt(row?.cnt ?? '0', 10);
}

async function generateRegistrationNumber(type: ApplicationType): Promise<string> {
    const prefixMap: Record<ApplicationType, string> = {
        [ApplicationType.SACCOS]: 'SACCOS',
        [ApplicationType.BURIAL_SOCIETY]: 'BUR',
        [ApplicationType.RELIGIOUS_SOCIETY]: 'REL',
        [ApplicationType.COOPERATIVE]: 'COOP',
        [ApplicationType.GENERAL_SOCIETY]: 'GS',
    };
    const prefix = prefixMap[type] ?? 'GS';
    const year = new Date().getFullYear();
    const count = await countByTypeAndYear(type, prefix, year);
    return `${prefix}-${year}-${(count + 1).toString().padStart(4, '0')}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Mutations
// ─────────────────────────────────────────────────────────────────────────────

/** Create a new draft application. feeAmount should be resolved by caller from RegulatorSettings. */
export async function createApplication(
    data: ISocietyApplicationCreateInput
): Promise<ISocietyApplication> {
    const id = uuidv4();
    await execute(
        `INSERT INTO society_applications (
            id, applicantUserId, applicationType, proposedName, status,
            primaryContactName, primaryContactEmail, primaryContactPhone,
            physicalAddress, feeAmount, createdAt, updatedAt
         ) VALUES (?, ?, ?, ?, 'draft', ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
            id, data.applicantUserId, data.applicationType, data.proposedName,
            data.primaryContactName, data.primaryContactEmail, data.primaryContactPhone,
            data.physicalAddress, data.feeAmount ?? 0,
        ]
    );
    const created = await getApplicationById(id);
    if (!created) throw new Error('Application creation failed');
    return created;
}

/** Update a draft or incomplete application (applicant-facing). */
export async function updateApplication(
    id: string,
    applicantUserId: string | null,
    data: Partial<ISocietyApplication>
): Promise<ISocietyApplication> {
    const app = applicantUserId
        ? await getApplicationByIdForApplicant(id, applicantUserId)
        : await getApplicationById(id);

    if (!app) throw new Error('Application not found or unauthorized');

    if (
        applicantUserId &&
        ![ApplicationStatus.DRAFT, ApplicationStatus.INCOMPLETE].includes(app.status)
    ) {
        throw new Error('Application cannot be edited in its current status');
    }

    const allowed = [
        'proposedName', 'primaryContactName', 'primaryContactEmail', 'primaryContactPhone',
        'physicalAddress', 'feeAmount',
    ];
    const filtered = Object.fromEntries(
        Object.entries(data).filter(([k]) => allowed.includes(k))
    );
    if (Object.keys(filtered).length === 0) throw new Error('No updatable fields');

    const { clause, values } = buildSetClause(filtered);
    await execute(
        `UPDATE society_applications SET ${clause}, updatedAt = NOW() WHERE id = ?`,
        [...values, id]
    );
    const updated = await getApplicationById(id);
    if (!updated) throw new Error('Application not found after update');
    return updated;
}

/** Applicant submits a draft — transitions to SUBMITTED. */
export async function submitApplication(id: string, applicantUserId: string): Promise<ISocietyApplication> {
    const app = await getApplicationByIdForApplicant(id, applicantUserId);
    if (!app) throw new Error('Application not found or unauthorized');
    if (app.status !== ApplicationStatus.DRAFT) throw new Error('Only draft applications can be submitted');

    await execute(
        `UPDATE society_applications
         SET status = 'submitted', submittedAt = NOW(), updatedAt = NOW()
         WHERE id = ?`,
        [id]
    );
    const updated = await getApplicationById(id);
    if (!updated) throw new Error('Application not found after submit');
    return updated;
}

/** Registry clerk completes intake — assigns file number, moves to UNDER_REVIEW or INCOMPLETE. */
export async function completeRegistryIntake(
    id: string,
    clerkId: string,
    isIncomplete: boolean,
    notes?: string
): Promise<ISocietyApplication> {
    const app = await getApplicationById(id);
    if (!app) throw new Error('Application not found');

    if (isIncomplete) {
        await execute(
            `UPDATE society_applications
             SET status = 'incomplete', rejectionReasons = ?, updatedAt = NOW()
             WHERE id = ?`,
            [notes ?? null, id]
        );
    } else {
        // Auto-generate file number
        const prefix = app.applicationType === ApplicationType.SACCOS ? 'SACCOS' : 'SOC';
        const year = new Date().getFullYear();
        const countRow = await queryOne<RowDataPacket & { cnt: string }>(
            'SELECT COUNT(*) AS cnt FROM society_applications'
        );
        const count = parseInt(countRow?.cnt ?? '0', 10);
        const fileNumber = app.fileNumber || `${prefix}-${year}-${(count + 1).toString().padStart(4, '0')}`;

        await execute(
            `UPDATE society_applications
             SET status = 'under_review',
                 registryClerkId = ?,
                 fileNumber = ?,
                 assignedFileNumberAt = NOW(),
                 updatedAt = NOW()
             WHERE id = ?`,
            [clerkId, fileNumber, id]
        );
    }

    const updated = await getApplicationById(id);
    if (!updated) throw new Error('Application not found after registry intake');
    return updated;
}

/** Assign to intelligence liaison (security vetting) or legal officer. */
export async function assignToWorkflow(
    id: string,
    officerId: string,
    targetRole: 'intelligence' | 'legal',
    performerId?: string,
    notes?: string
): Promise<ISocietyApplication> {
    const app = await getApplicationById(id);
    if (!app) throw new Error('Application not found');

    if (targetRole === 'intelligence') {
        await execute(
            `UPDATE society_applications
             SET status = 'security_vetting', intelligenceLiaisonId = ?, updatedAt = NOW()
             WHERE id = ?`,
            [officerId, id]
        );
    } else {
        await execute(
            `UPDATE society_applications
             SET status = 'legal_review', legalOfficerId = ?, updatedAt = NOW()
             WHERE id = ?`,
            [officerId, id]
        );
    }

    const updated = await getApplicationById(id);
    if (!updated) throw new Error('Application not found after workflow assignment');
    return updated;
}

/** Bulk assign applications to the same workflow role. */
export async function bulkAssignToWorkflow(
    ids: string[],
    officerId: string,
    targetRole: 'intelligence' | 'legal'
): Promise<ISocietyApplication[]> {
    return Promise.all(ids.map((id) => assignToWorkflow(id, officerId, targetRole)));
}

/** Security officer submits clearance decision. */
export async function submitSecurityClearance(
    id: string,
    officerId: string,
    isCleared: boolean,
    notes: string
): Promise<ISocietyApplication> {
    const newStatus = isCleared ? ApplicationStatus.LEGAL_REVIEW : ApplicationStatus.SECURITY_FAILED;
    await execute(
        `UPDATE society_applications
         SET status = ?,
             securityVettingNotes = ?,
             intelligenceLiaisonId = ?,
             securityClearedAt = ?,
             updatedAt = NOW()
         WHERE id = ?`,
        [newStatus, notes, officerId, isCleared ? new Date() : null, id]
    );
    const updated = await getApplicationById(id);
    if (!updated) throw new Error('Application not found after security clearance');
    return updated;
}

/** Legal officer submits review outcome. */
export async function submitLegalReview(
    id: string,
    officerId: string,
    approved: boolean,
    notes?: string
): Promise<ISocietyApplication> {
    const newStatus = approved ? ApplicationStatus.PENDING_DECISION : ApplicationStatus.LEGAL_REJECTED;
    await execute(
        `UPDATE society_applications
         SET status = ?,
             legalOfficerId = ?,
             legalApprovedAt = ?,
             rejectionReasons = ?,
             updatedAt = NOW()
         WHERE id = ?`,
        [newStatus, officerId, approved ? new Date() : null, notes ?? null, id]
    );
    const updated = await getApplicationById(id);
    if (!updated) throw new Error('Application not found after legal review');
    return updated;
}

/** Registrar/Director final approval — generates registration number. */
export async function approveApplication(
    id: string,
    registrarId: string,
    notes?: string
): Promise<ISocietyApplication> {
    return withTransaction(async (conn) => {
        const [appRows] = await conn.query<RowDataPacket[]>(
            'SELECT * FROM society_applications WHERE id = ? LIMIT 1',
            [id]
        );
        const app = appRows[0] as ISocietyApplication | undefined;
        if (!app) throw new Error('Application not found');
        if (app.status !== ApplicationStatus.PENDING_DECISION) {
            throw new Error(`Application in status ${app.status} cannot be approved`);
        }

        const certNumber = app.certificateNumber || await generateRegistrationNumber(app.applicationType as ApplicationType);

        await conn.execute(
            `UPDATE society_applications
             SET status = 'approved',
                 finalDecisionMakerId = ?,
                 finalDecisionAt = NOW(),
                 certificateNumber = ?,
                 updatedAt = NOW()
             WHERE id = ?`,
            [registrarId, certNumber, id]
        );

        // Log to application_workflow_logs
        await conn.execute(
            `INSERT INTO application_workflow_logs (id, applicationId, fromStatus, toStatus, performedBy, notes, createdAt)
             VALUES (?, ?, ?, 'approved', ?, ?, NOW())`,
            [uuidv4(), id, app.status, registrarId, notes ?? 'Final approval granted.']
        );

        const [updated] = await conn.query<RowDataPacket[]>(
            'SELECT * FROM society_applications WHERE id = ? LIMIT 1',
            [id]
        );
        return parseApp(updated[0] as RowDataPacket);
    });
}

/** Registrar/Director final rejection. */
export async function rejectApplication(
    id: string,
    registrarId: string,
    reasons: string
): Promise<ISocietyApplication> {
    const app = await getApplicationById(id);
    if (!app) throw new Error('Application not found');
    if (app.status !== ApplicationStatus.PENDING_DECISION) {
        throw new Error(`Application in status ${app.status} cannot be rejected`);
    }

    await execute(
        `UPDATE society_applications
         SET status = 'rejected',
             finalDecisionMakerId = ?,
             finalDecisionAt = NOW(),
             rejectionReasons = ?,
             updatedAt = NOW()
         WHERE id = ?`,
        [registrarId, reasons, id]
    );
    const updated = await getApplicationById(id);
    if (!updated) throw new Error('Application not found after rejection');
    return updated;
}

/** Applicant submits an appeal on a rejected application. */
export async function submitAppeal(
    id: string,
    applicantUserId: string,
    notes: string
): Promise<ISocietyApplication> {
    const app = await getApplicationByIdForApplicant(id, applicantUserId);
    if (!app) throw new Error('Application not found or unauthorized');
    if (!canApplicationAppeal(app)) throw new Error('Application is not eligible for appeal');

    await execute(
        `UPDATE society_applications
         SET status = 'appeal_lodged',
             appealLodgedAt = NOW(),
             appealOutcome = ?,
             updatedAt = NOW()
         WHERE id = ?`,
        [notes, id]
    );
    const updated = await getApplicationById(id);
    if (!updated) throw new Error('Application not found after appeal');
    return updated;
}

/** Decision-maker handles the appeal (approve or reject). */
export async function handleAppeal(
    id: string,
    decisionMakerId: string,
    decision: 'APPROVE' | 'REJECT',
    notes: string
): Promise<ISocietyApplication> {
    return withTransaction(async (conn) => {
        const [appRows] = await conn.query<RowDataPacket[]>(
            'SELECT * FROM society_applications WHERE id = ? LIMIT 1',
            [id]
        );
        const app = appRows[0] as ISocietyApplication | undefined;
        if (!app) throw new Error('Application not found');
        if (app.status !== ApplicationStatus.APPEAL_LODGED) throw new Error('Application is not under appeal');

        const toStatus = decision === 'APPROVE' ? ApplicationStatus.APPEAL_APPROVED : ApplicationStatus.APPEAL_REJECTED;
        let certNumber = app.certificateNumber;
        if (decision === 'APPROVE' && !certNumber) {
            certNumber = await generateRegistrationNumber(app.applicationType as ApplicationType);
        }

        await conn.execute(
            `UPDATE society_applications
             SET status = ?,
                 appealDecisionMakerId = ?,
                 appealDecisionAt = NOW(),
                 appealOutcome = ?,
                 certificateNumber = COALESCE(?, certificateNumber),
                 updatedAt = NOW()
             WHERE id = ?`,
            [toStatus, decisionMakerId, notes, certNumber ?? null, id]
        );

        await conn.execute(
            `INSERT INTO application_workflow_logs (id, applicationId, fromStatus, toStatus, performedBy, notes, createdAt)
             VALUES (?, ?, 'appeal_lodged', ?, ?, ?, NOW())`,
            [uuidv4(), id, toStatus, decisionMakerId, notes]
        );

        const [updated] = await conn.query<RowDataPacket[]>(
            'SELECT * FROM society_applications WHERE id = ? LIMIT 1',
            [id]
        );
        return parseApp(updated[0] as RowDataPacket);
    });
}

/** Log a communication event on an application. */
export async function logCommunication(
    applicationId: string,
    data: {
        type: string;
        direction: string;
        subject?: string;
        content: string;
        recordedById: string;
    }
): Promise<void> {
    await execute(
        `INSERT INTO application_communications
         (id, applicationId, type, direction, subject, content, recordedById, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
        [uuidv4(), applicationId, data.type, data.direction, data.subject ?? null, data.content, data.recordedById]
    );
}

/** Fetch communication log for an application. */
export async function getCommunications(applicationId: string): Promise<RowDataPacket[]> {
    return query<RowDataPacket>(
        'SELECT * FROM application_communications WHERE applicationId = ? ORDER BY createdAt DESC',
        [applicationId]
    );
}

// Re-export enums/helpers
export {
    ApplicationStatus, ApplicationType,
    canApplicationAppeal, isApplicationApproved, isApplicationRejected,
    REGISTRY_ACTIVE_STATUSES,
};
