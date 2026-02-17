import { AppDataSource } from '../config/database';
import { SocietyApplication, ApplicationStatus, ApplicationType } from '../entities/SocietyApplication';
import { Certificate, CertificateType } from '../entities/Certificate';
import { ApplicationWorkflowLog } from '../entities/ApplicationWorkflowLog';
import { AuditLog, AuditAction } from '../entities/AuditLog';
import { User } from '../entities/User';

export class RegistrationService {
    private static applicationRepo = AppDataSource.getRepository(SocietyApplication);
    private static certificateRepo = AppDataSource.getRepository(Certificate);
    private static workflowLogRepo = AppDataSource.getRepository(ApplicationWorkflowLog);
    private static auditLogRepo = AppDataSource.getRepository(AuditLog);

    /**
     * Get applications pending final decision
     */
    static async getPendingDecisions(): Promise<SocietyApplication[]> {
        return await this.applicationRepo.find({
            where: { status: ApplicationStatus.PENDING_DECISION },
            relations: ['applicant', 'registryClerk', 'legalOfficer', 'intelligenceLiaison'],
            order: { updatedAt: 'DESC' }
        });
    }

    /**
     * Final approval of an application
     */
    static async approveApplication(
        applicationId: string,
        registrarId: string,
        notes?: string
    ): Promise<SocietyApplication> {
        return await AppDataSource.transaction(async (transactionalEntityManager) => {
            const application = await transactionalEntityManager.findOne(SocietyApplication, {
                where: { id: applicationId },
                relations: ['applicant']
            });

            if (!application) throw new Error('Application not found');
            if (application.status !== ApplicationStatus.PENDING_DECISION) {
                throw new Error(`Application in status ${application.status} cannot be approved`);
            }

            const registrar = await transactionalEntityManager.findOne(User, { where: { id: registrarId } });
            if (!registrar) throw new Error('Registrar not found');

            const fromStatus = application.status;
            application.status = ApplicationStatus.APPROVED;
            application.finalDecisionMakerId = registrarId;
            application.finalDecisionAt = new Date();

            // Generate registration number (Certificate Number)
            if (!application.certificateNumber) {
                application.certificateNumber = await this.generateRegistrationNumber(application.applicationType);
            }

            const savedApp = await transactionalEntityManager.save(application);

            // Log workflow
            const workflowLog = transactionalEntityManager.create(ApplicationWorkflowLog, {
                applicationId: application.id,
                fromStatus,
                toStatus: ApplicationStatus.APPROVED,
                performedBy: registrarId,
                notes: notes || 'Final approval granted.',
                metadata: {
                    registrationNumber: application.certificateNumber,
                    approvedAt: application.finalDecisionAt
                }
            });
            await transactionalEntityManager.save(workflowLog);

            // Log audit
            const auditLog = transactionalEntityManager.create(AuditLog, {
                userId: registrarId,
                userEmail: registrar.email,
                action: AuditAction.APPROVE,
                entityType: 'SocietyApplication',
                entityId: application.id,
                description: `Registrar approved society application: ${application.proposedName}`,
                newValues: { status: ApplicationStatus.APPROVED, registrationNumber: application.certificateNumber }
            });
            await transactionalEntityManager.save(auditLog);

            return savedApp;
        });
    }

    /**
     * Issue official registration certificate
     */
    static async issueCertificate(
        applicationId: string,
        issuerId: string
    ): Promise<Certificate> {
        return await AppDataSource.transaction(async (transactionalEntityManager) => {
            const application = await transactionalEntityManager.findOne(SocietyApplication, {
                where: { id: applicationId }
            });

            if (!application) throw new Error('Application not found');
            if (application.status !== ApplicationStatus.APPROVED && application.status !== ApplicationStatus.APPEAL_APPROVED) {
                throw new Error('Application must be approved before issuing certificate');
            }

            if (!application.certificateNumber) {
                throw new Error('Application does not have a registration number assigned');
            }

            const issuer = await transactionalEntityManager.findOne(User, { where: { id: issuerId } });
            if (!issuer) throw new Error('Issuer not found');

            // Check if certificate already exists
            const existingCert = await transactionalEntityManager.findOne(Certificate, {
                where: { certificateNumber: application.certificateNumber }
            });

            if (existingCert) return existingCert;

            // Create certificate
            const certificate = transactionalEntityManager.create(Certificate, {
                tenantId: application.id, // Using application ID as temporary tenant ID until tenant is fully provisioned
                certificateNumber: application.certificateNumber,
                certificateType: CertificateType.REGISTRATION,
                issuedDate: new Date(),
                issuedBy: issuerId,
                metadata: {
                    societyName: application.proposedName,
                    registrationNumber: application.certificateNumber,
                    registrationDate: new Date().toISOString(),
                    applicationType: application.applicationType,
                    address: application.physicalAddress
                }
            });

            const savedCert = await transactionalEntityManager.save(certificate);

            // Update application
            application.certificateIssuedAt = new Date();
            await transactionalEntityManager.save(application);

            // Log audit
            const auditLog = transactionalEntityManager.create(AuditLog, {
                userId: issuerId,
                userEmail: issuer.email,
                action: AuditAction.CREATE,
                entityType: 'Certificate',
                entityId: savedCert.id,
                description: `Certificate issued for ${application.proposedName} (Reg: ${application.certificateNumber})`
            });
            await transactionalEntityManager.save(auditLog);

            return savedCert;
        });
    }

    /**
     * Generate a unique registration number based on type and year
     */
    private static async generateRegistrationNumber(type: ApplicationType): Promise<string> {
        const prefix = type === ApplicationType.SACCOS ? 'SACCOS' :
            type === ApplicationType.BURIAL_SOCIETY ? 'BUR' :
                type === ApplicationType.RELIGIOUS_SOCIETY ? 'REL' : 'GS';

        const year = new Date().getFullYear();

        // Count existing applications of this type in this year to get next number
        const count = await this.applicationRepo.createQueryBuilder('app')
            .where('app.applicationType = :type', { type })
            .andWhere('app.certificateNumber LIKE :pattern', { pattern: `${prefix}-${year}-%` })
            .getCount();

        return `${prefix}-${year}-${(count + 1).toString().padStart(4, '0')}`;
    }

    /**
     * Get applications currently under appeal
     */
    static async getPendingAppeals(): Promise<SocietyApplication[]> {
        return await this.applicationRepo.find({
            where: { status: ApplicationStatus.APPEAL_LODGED },
            relations: ['applicant', 'finalDecisionMaker'],
            order: { appealLodgedAt: 'DESC' }
        });
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
        return await AppDataSource.transaction(async (transactionalEntityManager) => {
            const application = await transactionalEntityManager.findOne(SocietyApplication, {
                where: { id: applicationId },
                relations: ['applicant']
            });

            if (!application) throw new Error('Application not found');
            if (application.status !== ApplicationStatus.APPEAL_LODGED) {
                throw new Error('Application is not under appeal');
            }

            const decisionMaker = await transactionalEntityManager.findOne(User, { where: { id: decisionMakerId } });
            if (!decisionMaker) throw new Error('Decision maker not found');

            const fromStatus = application.status;
            const toStatus = decision === 'APPROVE' ? ApplicationStatus.APPEAL_APPROVED : ApplicationStatus.APPEAL_REJECTED;

            application.status = toStatus;
            application.appealDecisionAt = new Date();
            application.appealDecisionMakerId = decisionMakerId;
            application.appealOutcome = notes;

            if (decision === 'APPROVE' && !application.certificateNumber) {
                application.certificateNumber = await this.generateRegistrationNumber(application.applicationType);
            }

            const savedApp = await transactionalEntityManager.save(application);

            // Log workflow
            const workflowLog = transactionalEntityManager.create(ApplicationWorkflowLog, {
                applicationId: application.id,
                fromStatus,
                toStatus,
                performedBy: decisionMakerId,
                notes: notes,
                metadata: {
                    decision,
                    decisionAt: application.appealDecisionAt
                }
            });
            await transactionalEntityManager.save(workflowLog);

            // Log audit
            const auditLog = transactionalEntityManager.create(AuditLog, {
                userId: decisionMakerId,
                userEmail: decisionMaker.email,
                action: decision === 'APPROVE' ? AuditAction.APPROVE : AuditAction.REJECT,
                entityType: 'SocietyApplication',
                entityId: application.id,
                description: `Appeal ${decision.toLowerCase()}d for ${application.proposedName}`,
                newValues: { status: toStatus, outcome: notes }
            });
            await transactionalEntityManager.save(auditLog);

            return savedApp;
        });
    }

    /**
     * Get all registered societies (Official Registry)
     */
    static async getOfficialRegistry(): Promise<SocietyApplication[]> {
        return await this.applicationRepo.find({
            where: [
                { status: ApplicationStatus.APPROVED },
                { status: ApplicationStatus.APPEAL_APPROVED }
            ],
            order: { certificateIssuedAt: 'DESC' }
        });
    }
}
