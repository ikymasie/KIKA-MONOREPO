import { AppDataSource } from '@/src/config/database';
import { KYC } from '@/src/entities/KYC';
import { Member } from '@/src/entities/Member';

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
        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }

        const kycRepo = AppDataSource.getRepository(KYC);

        let query = kycRepo
            .createQueryBuilder('kyc')
            .leftJoinAndSelect('kyc.member', 'member')
            .leftJoinAndSelect('member.tenant', 'tenant')
            .where(
                '(kyc.identityVerified = :notVerified OR kyc.residenceVerified = :notVerified OR kyc.incomeVerified = :notVerified)',
                { notVerified: false }
            );

        if (tenantId) {
            query = query.andWhere('member.tenantId = :tenantId', { tenantId });
        }

        const pendingKYCs = await query
            .orderBy('kyc.createdAt', 'ASC')
            .take(limit)
            .getMany();

        return pendingKYCs;
    }

    /**
     * Verify a specific KYC document
     */
    static async verifyKYCDocument(request: KYCVerificationRequest): Promise<KYC> {
        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }

        const kycRepo = AppDataSource.getRepository(KYC);

        const kyc = await kycRepo.findOne({
            where: { id: request.kycId },
            relations: ['member'],
        });

        if (!kyc) {
            throw new Error('KYC record not found');
        }

        // Update the appropriate verification field
        switch (request.documentType) {
            case 'identity':
                kyc.identityVerified = request.verified;
                break;
            case 'residence':
                kyc.residenceVerified = request.verified;
                break;
            case 'income':
                kyc.incomeVerified = request.verified;
                break;
        }

        // Update verification metadata if all documents are verified
        if (kyc.identityVerified && kyc.residenceVerified && kyc.incomeVerified) {
            kyc.verifiedBy = request.verifiedBy;
            kyc.verifiedAt = new Date();
        }

        // Add notes
        if (request.notes) {
            kyc.notes = kyc.notes
                ? `${kyc.notes}\n\n[${new Date().toISOString()}] ${request.documentType}: ${request.notes}`
                : `[${new Date().toISOString()}] ${request.documentType}: ${request.notes}`;
        }

        await kycRepo.save(kyc);

        return kyc;
    }

    /**
     * Get KYC compliance rate for a SACCO
     */
    static async getKYCComplianceRate(tenantId: string): Promise<number> {
        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }

        const memberRepo = AppDataSource.getRepository(Member);
        const kycRepo = AppDataSource.getRepository(KYC);

        const totalMembers = await memberRepo.count({ where: { tenantId } });
        if (totalMembers === 0) return 100;

        const verifiedKYCs = await kycRepo
            .createQueryBuilder('kyc')
            .innerJoin('kyc.member', 'member')
            .where('member.tenantId = :tenantId', { tenantId })
            .andWhere('kyc.identityVerified = :verified', { verified: true })
            .andWhere('kyc.residenceVerified = :verified', { verified: true })
            .andWhere('kyc.incomeVerified = :verified', { verified: true })
            .getCount();

        return (verifiedKYCs / totalMembers) * 100;
    }

    /**
     * Get KYC details by ID
     */
    static async getKYCById(kycId: string): Promise<KYC | null> {
        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }

        const kycRepo = AppDataSource.getRepository(KYC);

        return await kycRepo.findOne({
            where: { id: kycId },
            relations: ['member', 'member.tenant'],
        });
    }

    /**
     * Get KYC statistics for dashboard
     */
    static async getKYCStatistics() {
        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }

        const kycRepo = AppDataSource.getRepository(KYC);

        const totalKYCs = await kycRepo.count();
        const fullyVerified = await kycRepo.count({
            where: {
                identityVerified: true,
                residenceVerified: true,
                incomeVerified: true,
            },
        });

        const pendingIdentity = await kycRepo.count({
            where: { identityVerified: false },
        });

        const pendingResidence = await kycRepo.count({
            where: { residenceVerified: false },
        });

        const pendingIncome = await kycRepo.count({
            where: { incomeVerified: false },
        });

        return {
            totalKYCs,
            fullyVerified,
            pendingIdentity,
            pendingResidence,
            pendingIncome,
            verificationRate: totalKYCs > 0 ? (fullyVerified / totalKYCs) * 100 : 0,
        };
    }
}
