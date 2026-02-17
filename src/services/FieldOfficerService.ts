import { AppDataSource } from '@/src/config/database';
import { FieldVisit, FieldVisitStatus } from '@/src/entities/FieldVisit';
import { Investigation, InvestigationStatus, InvestigationSeverity } from '@/src/entities/Investigation';
import { FieldReport } from '@/src/entities/FieldReport';
import { Tenant } from '@/src/entities/Tenant';

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
        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }

        const visitRepo = AppDataSource.getRepository(FieldVisit);
        const visit = visitRepo.create({
            ...data,
            status: FieldVisitStatus.SCHEDULED,
        });

        return await visitRepo.save(visit);
    }

    /**
     * Get all visits for an officer or tenant
     */
    static async getVisits(filters: {
        officerId?: string;
        tenantId?: string;
        status?: FieldVisitStatus;
    }): Promise<FieldVisit[]> {
        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }

        const visitRepo = AppDataSource.getRepository(FieldVisit);
        return await visitRepo.find({
            where: filters,
            relations: ['tenant', 'officer', 'report'],
            order: { scheduledDate: 'DESC' },
        });
    }

    /**
     * Update visit status
     */
    static async updateVisitStatus(visitId: string, status: FieldVisitStatus, actualDate?: Date): Promise<FieldVisit> {
        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }

        const visitRepo = AppDataSource.getRepository(FieldVisit);
        const updateData: any = { status };
        if (actualDate) updateData.actualDate = actualDate;

        await visitRepo.update(visitId, updateData);
        return (await visitRepo.findOne({ where: { id: visitId } }))!;
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
        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }

        const reportRepo = AppDataSource.getRepository(FieldReport);
        const report = reportRepo.create(data);

        const savedReport = await reportRepo.save(report);

        // Update visit status to completed
        await this.updateVisitStatus(data.visitId, FieldVisitStatus.COMPLETED, new Date());

        return savedReport;
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
        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }

        const investigationRepo = AppDataSource.getRepository(Investigation);
        const investigation = investigationRepo.create({
            ...data,
            status: InvestigationStatus.OPEN,
        });

        return await investigationRepo.save(investigation);
    }

    /**
     * Update investigation findings and recommendations
     */
    static async updateInvestigation(investigationId: string, data: {
        findings?: string;
        recommendations?: string;
        status?: InvestigationStatus;
    }): Promise<Investigation> {
        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }

        const investigationRepo = AppDataSource.getRepository(Investigation);
        const updateData: any = { ...data };
        if (data.status === InvestigationStatus.COMPLETED || data.status === InvestigationStatus.CLOSED) {
            updateData.completedAt = new Date();
        }

        await investigationRepo.update(investigationId, updateData);
        return (await investigationRepo.findOne({ where: { id: investigationId } }))!;
    }

    /**
     * Get all investigations
     */
    static async getInvestigations(filters: {
        officerId?: string;
        tenantId?: string;
        status?: InvestigationStatus;
    }): Promise<Investigation[]> {
        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }

        const investigationRepo = AppDataSource.getRepository(Investigation);
        return await investigationRepo.find({
            where: filters,
            relations: ['tenant', 'officer'],
            order: { createdAt: 'DESC' },
        });
    }

    /**
     * Log GPS coordinates for a field visit
     */
    static async logGeolocation(visitId: string, latitude: number, longitude: number): Promise<FieldVisit> {
        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }

        const visitRepo = AppDataSource.getRepository(FieldVisit);
        await visitRepo.update(visitId, {
            latitude,
            longitude,
            geoLoggedAt: new Date(),
        });

        return (await visitRepo.findOne({ where: { id: visitId } }))!;
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
        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }

        const visitRepo = AppDataSource.getRepository(FieldVisit);
        const query = visitRepo.createQueryBuilder('visit')
            .leftJoinAndSelect('visit.tenant', 'tenant')
            .leftJoinAndSelect('visit.officer', 'officer')
            .where('visit.scheduledDate BETWEEN :startDate AND :endDate', {
                startDate: filters.startDate,
                endDate: filters.endDate,
            });

        if (filters.officerId) {
            query.andWhere('visit.officerId = :officerId', { officerId: filters.officerId });
        }

        if (filters.tenantId) {
            query.andWhere('visit.tenantId = :tenantId', { tenantId: filters.tenantId });
        }

        return await query.getMany();
    }
}
