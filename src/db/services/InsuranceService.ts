import { query, queryOne, execute, buildSetClause } from '../query';
import { RowDataPacket } from 'mysql2/promise';
import { v4 as uuidv4 } from 'uuid';
import {
    IInsuranceProduct, IInsurancePolicy, IInsuranceClaim,
    InsuranceProductStatus, PolicyStatus, ClaimStatus
} from '../../interfaces/IInsurance';

export async function listInsuranceProducts(tenantId: string, activeOnly = false): Promise<IInsuranceProduct[]> {
    let sql = `SELECT * FROM insurance_products WHERE tenantId = ?`;
    const params: any[] = [tenantId];

    if (activeOnly) {
        sql += ` AND status = 'active'`;
    }
    sql += ` ORDER BY name ASC`;

    return await query<RowDataPacket & IInsuranceProduct>(sql, params);
}

export async function getInsuranceProduct(id: string, tenantId: string): Promise<IInsuranceProduct | null> {
    return await queryOne<RowDataPacket & IInsuranceProduct>(
        `SELECT * FROM insurance_products WHERE id = ? AND tenantId = ? LIMIT 1`,
        [id, tenantId]
    ) ?? null;
}

export async function createInsuranceProduct(tenantId: string, data: Partial<IInsuranceProduct>): Promise<IInsuranceProduct> {
    const id = uuidv4();
    await execute(
        `INSERT INTO insurance_products (
            id, tenantId, name, code, description, coverageType, underwriter, monthlyPremium, coverageAmount, 
            status, createdAt, updatedAt
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
            id, tenantId, data.name, data.code, data.description, data.coverageType, data.underwriter,
            data.monthlyPremium, data.coverageAmount, data.status ?? InsuranceProductStatus.ACTIVE
        ]
    );

    const product = await queryOne<RowDataPacket & IInsuranceProduct>('SELECT * FROM insurance_products WHERE id = ?', [id]);
    if (!product) throw new Error('Product creation failed');
    return product;
}

export async function listPolicies(tenantId: string, memberId?: string): Promise<IInsurancePolicy[]> {
    let sql = `
        SELECT ip.*, pr.name AS productName, CONCAT(m.firstName, ' ', m.lastName) AS memberFullName
        FROM insurance_policies ip
        INNER JOIN insurance_products pr ON pr.id = ip.productId
        INNER JOIN members m ON m.id = ip.memberId
        WHERE ip.tenantId = ?
    `;
    const params: any[] = [tenantId];

    if (memberId) {
        sql += ` AND ip.memberId = ?`;
        params.push(memberId);
    }
    sql += ` ORDER BY ip.createdAt DESC`;

    return await query<RowDataPacket & IInsurancePolicy>(sql, params);
}

export async function createPolicy(tenantId: string, data: Partial<IInsurancePolicy>): Promise<IInsurancePolicy> {
    const id = uuidv4();
    await execute(
        `INSERT INTO insurance_policies (
            id, tenantId, policyNumber, memberId, productId, 
            monthlyPremium, coverageAmount, startDate, endDate, 
            waitingPeriodEndDate, status, monthsPaid, createdAt, updatedAt
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
            id, tenantId, data.policyNumber, data.memberId, data.productId,
            data.monthlyPremium, data.coverageAmount, data.startDate, data.endDate ?? null,
            data.waitingPeriodEndDate ?? null, data.status ?? PolicyStatus.WAITING_PERIOD, data.monthsPaid ?? 0
        ]
    );

    const policy = await queryOne<RowDataPacket & IInsurancePolicy>('SELECT * FROM insurance_policies WHERE id = ?', [id]);
    if (!policy) throw new Error('Policy creation failed');
    return policy;
}

export async function listClaims(
    tenantId: string,
    memberId?: string,
    filter?: { status?: string },
    pagination?: { page?: number; limit?: number }
) {
    const page = Math.max(1, pagination?.page ?? 1);
    const limit = pagination?.limit ? Math.min(10000, Math.max(1, pagination.limit)) : 10000;
    const offset = (page - 1) * limit;

    let baseWhere = `WHERE ic.tenantId = ?`;
    const params: any[] = [tenantId];

    if (memberId) {
        baseWhere += ` AND ip.memberId = ?`;
        params.push(memberId);
    }
    if (filter?.status) {
        baseWhere += ` AND ic.status = ?`;
        params.push(filter.status);
    }

    const countRow = await queryOne<RowDataPacket & { total: string }>(
        `SELECT COUNT(*) as total 
         FROM insurance_claims ic
         INNER JOIN insurance_policies ip ON ip.id = ic.policyId
         ${baseWhere}`,
        params
    );
    const total = parseInt(countRow?.total ?? '0', 10);

    const sql = `
        SELECT ic.*, ip.policyNumber, pr.name AS productName, CONCAT(m.firstName, ' ', m.lastName) AS memberFullName, m.email AS memberEmail
        FROM insurance_claims ic
        INNER JOIN insurance_policies ip ON ip.id = ic.policyId
        INNER JOIN insurance_products pr ON pr.id = ip.productId
        INNER JOIN members m ON m.id = ip.memberId
        ${baseWhere}
        ORDER BY ic.createdAt DESC
        LIMIT ? OFFSET ?
    `;

    const rows = await query<RowDataPacket & IInsuranceClaim>(sql, [...params, limit, offset]);

    const claims = rows.map(r => ({
        ...r,
        supportingDocuments: typeof r.supportingDocuments === 'string' ? JSON.parse(r.supportingDocuments) : r.supportingDocuments,
        disputeEvidenceUrls: typeof r.disputeEvidenceUrls === 'string' ? JSON.parse(r.disputeEvidenceUrls) : r.disputeEvidenceUrls
    }));

    return {
        claims,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    };
}

export async function getClaim(id: string, tenantId: string): Promise<IInsuranceClaim | null> {
    const row = await queryOne<RowDataPacket & IInsuranceClaim>(
        `SELECT ic.*, ip.policyNumber, pr.name AS productName, CONCAT(m.firstName, ' ', m.lastName) AS memberFullName, m.email AS memberEmail
         FROM insurance_claims ic
         INNER JOIN insurance_policies ip ON ip.id = ic.policyId
         INNER JOIN insurance_products pr ON pr.id = ip.productId
         INNER JOIN members m ON m.id = ip.memberId
         WHERE ic.id = ? AND ic.tenantId = ? LIMIT 1`,
        [id, tenantId]
    );

    if (!row) return null;
    return {
        ...row,
        supportingDocuments: typeof row.supportingDocuments === 'string' ? JSON.parse(row.supportingDocuments) : row.supportingDocuments,
        disputeEvidenceUrls: typeof row.disputeEvidenceUrls === 'string' ? JSON.parse(row.disputeEvidenceUrls) : row.disputeEvidenceUrls
    };
}

export async function createClaim(tenantId: string, data: Partial<IInsuranceClaim>): Promise<IInsuranceClaim> {
    const id = uuidv4();
    await execute(
        `INSERT INTO insurance_claims (
            id, tenantId, claimNumber, policyId, claimType, claimAmount, 
            incidentDate, description, supportingDocuments, status, isExGratia,
            createdAt, updatedAt
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
            id, tenantId, data.claimNumber, data.policyId, data.claimType, data.claimAmount,
            data.incidentDate, data.description,
            data.supportingDocuments ? JSON.stringify(data.supportingDocuments) : null,
            data.status ?? ClaimStatus.SUBMITTED,
            data.isExGratia ? 1 : 0
        ]
    );

    return (await getClaim(id, tenantId))!;
}

export async function updateClaim(id: string, tenantId: string, data: Partial<IInsuranceClaim>): Promise<IInsuranceClaim> {
    const dbData = { ...data };
    if (dbData.supportingDocuments) dbData.supportingDocuments = JSON.stringify(dbData.supportingDocuments) as any;
    if (dbData.disputeEvidenceUrls) dbData.disputeEvidenceUrls = JSON.stringify(dbData.disputeEvidenceUrls) as any;

    const { clause, values } = buildSetClause(dbData);
    if (!clause) throw new Error('No fields provided to update');

    await execute(
        `UPDATE insurance_claims SET ${clause}, updatedAt = NOW() WHERE id = ? AND tenantId = ?`,
        [...values, id, tenantId]
    );

    return (await getClaim(id, tenantId))!;
}
