import { AppDataSource } from '../config/database';
import { AuditorAccessRequest, AccessRequestStatus } from '../entities/AuditorAccessRequest';
import { AuditWorkingPaper } from '../entities/AuditWorkingPaper';
import { AuditReport, AuditReportStatus } from '../entities/AuditReport';
import { User, UserRole } from '../entities/User';
import { Repository, MoreThanOrEqual, LessThanOrEqual, And } from 'typeorm';

export class AuditorService {
    private accessRepo: Repository<AuditorAccessRequest>;
    private workingPaperRepo: Repository<AuditWorkingPaper>;
    private reportRepo: Repository<AuditReport>;

    constructor() {
        this.accessRepo = AppDataSource.getRepository(AuditorAccessRequest);
        this.workingPaperRepo = AppDataSource.getRepository(AuditWorkingPaper);
        this.reportRepo = AppDataSource.getRepository(AuditReport);
    }

    async createAccessRequest(data: {
        auditorId: string;
        tenantId: string;
        startDate: Date;
        endDate: Date;
        purpose: string;
    }) {
        const request = this.accessRepo.create({
            ...data,
            status: AccessRequestStatus.PENDING,
        });
        return await this.accessRepo.save(request);
    }

    async approveAccessRequest(requestId: string, approvedById: string) {
        const request = await this.accessRepo.findOne({ where: { id: requestId } });
        if (!request) throw new Error('Access request not found');

        request.status = AccessRequestStatus.APPROVED;
        request.approvedById = approvedById;
        return await this.accessRepo.save(request);
    }

    async rejectAccessRequest(requestId: string) {
        const request = await this.accessRepo.findOne({ where: { id: requestId } });
        if (!request) throw new Error('Access request not found');

        request.status = AccessRequestStatus.REJECTED;
        return await this.accessRepo.save(request);
    }

    async getAuditorAccess(auditorId: string) {
        return await this.accessRepo.find({
            where: { auditorId },
            relations: ['tenant'],
            order: { createdAt: 'DESC' },
        });
    }

    async hasActiveAccess(auditorId: string, tenantId: string): Promise<boolean> {
        const now = new Date();
        const access = await this.accessRepo.findOne({
            where: {
                auditorId,
                tenantId,
                status: AccessRequestStatus.APPROVED,
                startDate: LessThanOrEqual(now),
                endDate: MoreThanOrEqual(now),
            },
        });
        return !!access;
    }

    async uploadWorkingPaper(data: {
        requestId: string;
        fileName: string;
        fileUrl: string;
        uploadedById: string;
    }) {
        const workingPaper = this.workingPaperRepo.create(data);
        return await this.workingPaperRepo.save(workingPaper);
    }

    async submitAuditReport(data: {
        requestId: string;
        fileName: string;
        fileUrl: string;
    }) {
        let report = await this.reportRepo.findOne({ where: { requestId: data.requestId } });

        if (report) {
            report.fileName = data.fileName;
            report.fileUrl = data.fileUrl;
            report.status = AuditReportStatus.SUBMITTED;
            report.submittedAt = new Date();
        } else {
            report = this.reportRepo.create({
                ...data,
                status: AuditReportStatus.SUBMITTED,
                submittedAt: new Date(),
            });
        }

        return await this.reportRepo.save(report);
    }

    async getWorkingPapers(requestId: string) {
        return await this.workingPaperRepo.find({
            where: { requestId },
            order: { createdAt: 'DESC' },
        });
    }

    async getAuditReport(requestId: string) {
        return await this.reportRepo.findOne({
            where: { requestId },
        });
    }
}
