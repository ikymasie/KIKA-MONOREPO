import { query, execute } from '../db/query';

export interface KYCVerificationRequest {
    kycId: string;
    documentType: 'identity' | 'residence' | 'income';
    verified: boolean;
    notes?: string;
    verifiedBy: string;
}

export class KYCVerificationService {
    /**
     * Get all pending KYC verifications across all SACCOs
     */
    static async getPendingVerifications(tenantId?: string, limit: number = 50) {
        let sql = `
            SELECT k.*, m.firstName, m.lastName, m.omangNumber as memberOmang, t.name as tenantName
            FROM kyc k
            LEFT JOIN members m ON m.id = k.memberId
            LEFT JOIN tenants t ON t.id = m.tenantId
            WHERE (k.identityVerified = false OR k.residenceVerified = false OR k.incomeVerified = false)
        `;
        const params: any[] = [];

        if (tenantId) {
            sql += ' AND m.tenantId = ?';
            params.push(tenantId);
        }

        sql += ' ORDER BY k.createdAt ASC LIMIT ?';
        params.push(limit);

        const pendingKYCs = await query(sql, params) as any[];

        return pendingKYCs.map(k => ({
            ...k,
            member: k.memberId ? {
                id: k.memberId,
                firstName: k.firstName,
                lastName: k.lastName,
                omangNumber: k.memberOmang,
                tenant: k.tenantName ? { name: k.tenantName } : undefined
            } : undefined
        }));
    }

    /**
     * Verify a specific KYC document
     */
    static async verifyKYCDocument(request: KYCVerificationRequest): Promise<any> {
        const [kyc] = await query('SELECT * FROM kyc WHERE id = ? LIMIT 1', [request.kycId]) as any;

        if (!kyc) {
            throw new Error('KYC record not found');
        }

        const now = new Date();
        let updateSql = 'UPDATE kyc SET ';
        const params: any[] = [];

        switch (request.documentType) {
            case 'identity':
                updateSql += 'identityVerified = ?, identityVerifiedBy = ?, identityVerifiedAt = ?';
                params.push(request.verified, request.verified ? request.verifiedBy : null, request.verified ? now : null);
                break;
            case 'residence':
                updateSql += 'residenceVerified = ?, residenceVerifiedBy = ?, residenceVerifiedAt = ?';
                params.push(request.verified, request.verified ? request.verifiedBy : null, request.verified ? now : null);
                break;
            case 'income':
                updateSql += 'incomeVerified = ?, incomeVerifiedBy = ?, incomeVerifiedAt = ?';
                params.push(request.verified, request.verified ? request.verifiedBy : null, request.verified ? now : null);
                break;
        }

        if (request.notes) {
            const newNotes = kyc.notes
                ? `${kyc.notes}\n\n[${now.toISOString()}] ${request.documentType}: ${request.notes}`
                : `[${now.toISOString()}] ${request.documentType}: ${request.notes}`;
            updateSql += ', notes = ?';
            params.push(newNotes);
        }

        updateSql += ', updatedAt = NOW() WHERE id = ?';
        params.push(request.kycId);

        await execute(updateSql, params);

        const [updatedKyc] = await query('SELECT * FROM kyc WHERE id = ? LIMIT 1', [request.kycId]) as any;

        return updatedKyc;
    }

    /**
     * Get KYC compliance rate for a SACCO
     */
    static async getKYCComplianceRate(tenantId: string): Promise<number> {
        const [totalMembersRow] = await query('SELECT COUNT(*) as count FROM members WHERE tenantId = ?', [tenantId]) as any;
        const totalMembers = Number(totalMembersRow?.count || 0);

        if (totalMembers === 0) return 100;

        const [verifiedKYCsRow] = await query(`
            SELECT COUNT(*) as count 
            FROM kyc k
            INNER JOIN members m ON m.id = k.memberId
            WHERE m.tenantId = ? 
              AND k.identityVerified = true 
              AND k.residenceVerified = true 
              AND k.incomeVerified = true
        `, [tenantId]) as any;

        const verifiedKYCs = Number(verifiedKYCsRow?.count || 0);

        return (verifiedKYCs / totalMembers) * 100;
    }

    /**
     * Get KYC details by ID
     */
    static async getKYCById(kycId: string): Promise<any | null> {
        const [kyc] = await query(`
            SELECT k.*, m.firstName, m.lastName, t.name as tenantName 
            FROM kyc k
            LEFT JOIN members m ON m.id = k.memberId
            LEFT JOIN tenants t ON t.id = m.tenantId
            WHERE k.id = ? 
            LIMIT 1
        `, [kycId]) as any;

        if (!kyc) return null;

        return {
            ...kyc,
            member: kyc.memberId ? {
                id: kyc.memberId,
                firstName: kyc.firstName,
                lastName: kyc.lastName,
                tenant: kyc.tenantName ? { name: kyc.tenantName } : undefined
            } : undefined
        } as any;
    }

    /**
     * Get KYC statistics for dashboard
     */
    static async getKYCStatistics() {
        const [totalResult] = await query('SELECT COUNT(*) as count FROM kyc') as any;
        const totalKYCs = Number(totalResult?.count || 0);

        const [fullyVerifiedResult] = await query(`
            SELECT COUNT(*) as count FROM kyc 
            WHERE identityVerified = true AND residenceVerified = true AND incomeVerified = true
        `) as any;
        const fullyVerified = Number(fullyVerifiedResult?.count || 0);

        const [pendingIdentityResult] = await query('SELECT COUNT(*) as count FROM kyc WHERE identityVerified = false') as any;
        const pendingIdentity = Number(pendingIdentityResult?.count || 0);

        const [pendingResidenceResult] = await query('SELECT COUNT(*) as count FROM kyc WHERE residenceVerified = false') as any;
        const pendingResidence = Number(pendingResidenceResult?.count || 0);

        const [pendingIncomeResult] = await query('SELECT COUNT(*) as count FROM kyc WHERE incomeVerified = false') as any;
        const pendingIncome = Number(pendingIncomeResult?.count || 0);

        return {
            totalKYCs,
            fullyVerified,
            pendingIdentity,
            pendingResidence,
            pendingIncome,
            verificationRate: totalKYCs > 0 ? (fullyVerified / totalKYCs) * 100 : 0,
        };
    }

    /**
     * Bulk verify multiple KYC records
     */
    static async batchVerify(
        kycIds: string[],
        verifiedBy: string,
        verified: boolean = true,
        notes?: string
    ): Promise<void> {
        if (kycIds.length === 0) return;

        const placeholders = kycIds.map(() => '?').join(',');
        const kycs = await query(`SELECT id, notes FROM kyc WHERE id IN (${placeholders})`, kycIds) as any[];

        const now = new Date();
        for (const kyc of kycs) {
            let newNotes = kyc.notes;
            if (notes) {
                newNotes = kyc.notes
                    ? `${kyc.notes}\n\n[${now.toISOString()}] Batch Verify: ${notes}`
                    : `[${now.toISOString()}] Batch Verify: ${notes}`;
            }

            await execute(`
                UPDATE kyc 
                SET identityVerified = ?, identityVerifiedBy = ?, identityVerifiedAt = ?,
                    residenceVerified = ?, residenceVerifiedBy = ?, residenceVerifiedAt = ?,
                    incomeVerified = ?, incomeVerifiedBy = ?, incomeVerifiedAt = ?,
                    notes = ?, updatedAt = NOW()
                WHERE id = ?
            `, [
                verified, verified ? verifiedBy : null, verified ? now : null,
                verified, verified ? verifiedBy : null, verified ? now : null,
                verified, verified ? verifiedBy : null, verified ? now : null,
                newNotes, kyc.id
            ]);
        }
    }
}
