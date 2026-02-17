import { AppDataSource } from '../config/database';
import { SocietyApplication, ApplicationType, ApplicationStatus } from '../entities/SocietyApplication';
import { RegulatorSettings } from '../entities/RegulatorSettings';
import { User } from '../entities/User';
import { SecurityScreening, ScreeningStatus, RiskLevel } from '../entities/SecurityScreening';
import { RiskFlag, RiskFlagType } from '../entities/RiskFlag';
import { ApplicationWorkflowLog } from '../entities/ApplicationWorkflowLog';
import { ApplicationCommunication, CommunicationType, CommunicationDirection } from '../entities/ApplicationCommunication';

export class SocietyApplicationService {
    private static applicationRepo = AppDataSource.getRepository(SocietyApplication);
    private static settingsRepo = AppDataSource.getRepository(RegulatorSettings);

    static async createApplication(
        data: Partial<SocietyApplication>,
        user: User
    ): Promise<SocietyApplication> {
        // Ensure settings exist and get current fees
        let settings = await this.settingsRepo.findOne({
            where: {},
            order: { updatedAt: 'DESC' }
        });

        if (!settings) {
            // Create default settings if missing
            settings = this.settingsRepo.create({});
            await this.settingsRepo.save(settings);
        }

        // Determine fee based on application type
        let feeAmount = 0;
        switch (data.applicationType) {
            case ApplicationType.SACCOS:
                feeAmount = settings.saccosApplicationFee;
                break;
            case ApplicationType.RELIGIOUS_SOCIETY:
                feeAmount = settings.religiousSocietyApplicationFee;
                break;
            case ApplicationType.GENERAL_SOCIETY:
                feeAmount = settings.generalSocietyApplicationFee;
                break;
            case ApplicationType.BURIAL_SOCIETY:
                feeAmount = settings.burialSocietyApplicationFee;
                break;
            case ApplicationType.COOPERATIVE:
                feeAmount = settings.cooperativeApplicationFee;
                break;
            default:
                feeAmount = settings.generalSocietyApplicationFee;
        }

        const application = this.applicationRepo.create({
            ...data,
            applicantUserId: user.id,
            status: ApplicationStatus.DRAFT,
            feeAmount: feeAmount
        });

        return await this.applicationRepo.save(application);
    }

    /**
     * Refreshes the fee for a draft application from current settings.
     * Useful if fees changed while application was in draft.
     */
    static async refreshApplicationFee(applicationId: string): Promise<SocietyApplication | null> {
        const application = await this.applicationRepo.findOneBy({ id: applicationId });
        if (!application || application.status !== ApplicationStatus.DRAFT) {
            return application;
        }

        const settings = await this.settingsRepo.findOne({
            where: {},
            order: { updatedAt: 'DESC' }
        });

        if (!settings) return application;

        let feeAmount = 0;
        switch (application.applicationType) {
            case ApplicationType.SACCOS:
                feeAmount = settings.saccosApplicationFee;
                break;
            case ApplicationType.RELIGIOUS_SOCIETY:
                feeAmount = settings.religiousSocietyApplicationFee;
                break;
            case ApplicationType.GENERAL_SOCIETY:
                feeAmount = settings.generalSocietyApplicationFee;
                break;
            case ApplicationType.BURIAL_SOCIETY:
                feeAmount = settings.burialSocietyApplicationFee;
                break;
            case ApplicationType.COOPERATIVE:
                feeAmount = settings.cooperativeApplicationFee;
                break;
            default:
                feeAmount = settings.generalSocietyApplicationFee;
        }

        application.feeAmount = feeAmount;
        return await this.applicationRepo.save(application);
    }

    /**
     * Get applications for Registry Clerk view
     */
    static async getApplicationsForRegistry(filters?: {
        status?: ApplicationStatus;
        type?: ApplicationType;
        search?: string;
    }): Promise<SocietyApplication[]> {
        const query = this.applicationRepo.createQueryBuilder('app')
            .leftJoinAndSelect('app.applicant', 'applicant')
            .where('app.status IN (:...statuses)', {
                statuses: [
                    ApplicationStatus.SUBMITTED,
                    ApplicationStatus.INCOMPLETE,
                    ApplicationStatus.UNDER_REVIEW,
                    ApplicationStatus.SECURITY_VETTING,
                    ApplicationStatus.LEGAL_REVIEW,
                    ApplicationStatus.PENDING_DECISION
                ]
            });

        if (filters?.status) {
            query.andWhere('app.status = :status', { status: filters.status });
        }

        if (filters?.type) {
            query.andWhere('app.applicationType = :type', { type: filters.type });
        }

        if (filters?.search) {
            query.andWhere('(app.proposedName LIKE :search OR app.fileNumber LIKE :search)', {
                search: `%${filters.search}%`
            });
        }

        return await query.orderBy('app.createdAt', 'DESC').getMany();
    }

    /**
     * Update document verification status
     */
    static async verifyDocument(
        documentId: string,
        isVerified: boolean,
        clerkId: string
    ): Promise<any> {
        const docRepo = AppDataSource.getRepository('ApplicationDocument');
        const document = await docRepo.findOneBy({ id: documentId });

        if (!document) throw new Error('Document not found');

        (document as any).isVerified = isVerified;
        (document as any).verifiedAt = new Date();
        (document as any).verifiedById = clerkId;

        return await docRepo.save(document);
    }

    /**
     * Complete registry phase and set file number
     */
    static async completeRegistryIntake(
        applicationId: string,
        clerkId: string,
        isIncomplete: boolean,
        notes?: string
    ): Promise<SocietyApplication> {
        const application = await this.applicationRepo.findOneBy({ id: applicationId });
        if (!application) throw new Error('Application not found');

        if (isIncomplete) {
            application.status = ApplicationStatus.INCOMPLETE;
            application.rejectionReasons = notes;
        } else {
            application.status = ApplicationStatus.UNDER_REVIEW;
            application.registryClerkId = clerkId;
            application.assignedFileNumberAt = new Date();

            // Generate file number if not present (simple generator)
            if (!application.fileNumber) {
                const prefix = application.applicationType === ApplicationType.SACCOS ? 'SACCOS' : 'SOC';
                const year = new Date().getFullYear();
                const count = await this.applicationRepo.count();
                application.fileNumber = `${prefix}-${year}-${(count + 1).toString().padStart(4, '0')}`;
            }
        }

        return await this.applicationRepo.save(application);
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
    ): Promise<SocietyApplication> {
        const application = await this.applicationRepo.findOne({
            where: { id: applicationId },
            relations: ['applicant']
        });
        if (!application) throw new Error('Application not found');

        const fromStatus = application.status;

        if (targetRole === 'intelligence') {
            application.status = ApplicationStatus.SECURITY_VETTING;
            application.intelligenceLiaisonId = officerId;
        } else {
            application.status = ApplicationStatus.LEGAL_REVIEW;
            application.legalOfficerId = officerId;
        }

        const savedApplication = await this.applicationRepo.save(application);

        // Log the workflow change
        if (performerId) {
            const logRepo = AppDataSource.getRepository(ApplicationWorkflowLog);
            const log = logRepo.create({
                applicationId,
                fromStatus,
                toStatus: application.status,
                performedBy: performerId,
                notes: notes || `Assigned to ${targetRole} review`
            });
            await logRepo.save(log);
        }

        return savedApplication;
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
    ): Promise<SocietyApplication[]> {
        const results: SocietyApplication[] = [];
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
            type: CommunicationType,
            direction: CommunicationDirection,
            subject?: string,
            content: string,
            recordedById: string
        }
    ): Promise<ApplicationCommunication> {
        const commRepo = AppDataSource.getRepository(ApplicationCommunication);
        const comm = commRepo.create({
            applicationId,
            ...data
        });
        return await commRepo.save(comm);
    }

    /**
     * Get communication logs for an application
     */
    static async getCommunications(applicationId: string): Promise<ApplicationCommunication[]> {
        const commRepo = AppDataSource.getRepository(ApplicationCommunication);
        return await commRepo.find({
            where: { applicationId },
            relations: ['recordedBy'],
            order: { createdAt: 'DESC' }
        });
    }

    /**
     * Get applications for Security Vetting view
     */
    static async getApplicationsForVetting(officerId: string): Promise<SocietyApplication[]> {
        return await this.applicationRepo.find({
            where: {
                status: ApplicationStatus.SECURITY_VETTING,
                intelligenceLiaisonId: officerId
            },
            relations: ['applicant'],
            order: { updatedAt: 'DESC' }
        });
    }

    /**
     * Submit security clearance decision
     */
    static async submitSecurityClearance(
        applicationId: string,
        officerId: string,
        isCleared: boolean,
        notes: string,
        riskLevel: RiskLevel = RiskLevel.LOW
    ): Promise<SocietyApplication> {
        const application = await this.applicationRepo.findOneBy({ id: applicationId });
        if (!application) throw new Error('Application not found');

        // Update or create screening record
        const screeningRepo = AppDataSource.getRepository(SecurityScreening);
        let screening = await screeningRepo.findOneBy({ applicationId });

        if (!screening) {
            screening = screeningRepo.create({
                applicationId,
                officerId,
                status: isCleared ? ScreeningStatus.CLEARED : ScreeningStatus.FAILED,
                notes,
                riskLevel,
                checks: {
                    criminalRecordMatched: false,
                    sanctionsListMatched: false,
                    adverseMediaFound: false,
                    pepStatusConfirmed: false,
                    sourceOfWealthVerified: true
                }
            });
        } else {
            screening.status = isCleared ? ScreeningStatus.CLEARED : ScreeningStatus.FAILED;
            screening.notes = notes;
            screening.riskLevel = riskLevel;
            screening.officerId = officerId;
        }
        await screeningRepo.save(screening);

        application.securityVettingNotes = notes;
        application.securityClearedAt = isCleared ? new Date() : undefined;
        application.intelligenceLiaisonId = officerId;

        if (isCleared) {
            application.status = ApplicationStatus.LEGAL_REVIEW;
        } else {
            application.status = ApplicationStatus.SECURITY_FAILED;
        }

        return await this.applicationRepo.save(application);
    }

    /**
     * Get security screening for an application
     */
    static async getSecurityScreening(applicationId: string): Promise<SecurityScreening | null> {
        return await AppDataSource.getRepository(SecurityScreening).findOne({
            where: { applicationId },
            relations: ['riskFlags', 'officer']
        });
    }

    /**
     * Add risk flag to a screening
     */
    static async addRiskFlag(
        screeningId: string,
        data: { type: RiskFlagType; description: string }
    ): Promise<RiskFlag> {
        const riskFlagRepo = AppDataSource.getRepository(RiskFlag);
        const flag = riskFlagRepo.create({
            screeningId,
            ...data
        });
        return await riskFlagRepo.save(flag);
    }

    /**
     * Resolve a risk flag
     */
    static async resolveRiskFlag(flagId: string, userId: string): Promise<RiskFlag> {
        const riskFlagRepo = AppDataSource.getRepository(RiskFlag);
        const flag = await riskFlagRepo.findOneBy({ id: flagId });
        if (!flag) throw new Error('Risk flag not found');

        flag.isResolved = true;
        flag.resolvedAt = new Date();
        flag.resolvedById = userId;

        return await riskFlagRepo.save(flag);
    }

    /**
     * Get applications pending security vetting
     */
    static async getApplicationsPendingVetting(): Promise<SocietyApplication[]> {
        return await this.applicationRepo.find({
            where: { status: ApplicationStatus.SECURITY_VETTING },
            relations: ['applicant'],
            order: { updatedAt: 'DESC' }
        });
    }

    /**
     * Get a specific application by ID
     */
    static async getApplicationById(id: string): Promise<SocietyApplication | null> {
        return await this.applicationRepo.findOne({
            where: { id },
            relations: ['applicant', 'registryClerk', 'intelligenceLiaison', 'legalOfficer']
        });
    }

    /**
     * Get all applications for a specific applicant
     */
    static async getApplicantApplications(userId: string): Promise<SocietyApplication[]> {
        return await this.applicationRepo.find({
            where: { applicantUserId: userId },
            order: { createdAt: 'DESC' }
        });
    }

    /**
     * Get application by ID ensuring it belongs to the applicant
     */
    static async getApplicantApplication(id: string, userId: string): Promise<SocietyApplication | null> {
        return await this.applicationRepo.findOne({
            where: { id, applicantUserId: userId },
            relations: ['applicant']
        });
    }

    /**
     * Update an application
     */
    static async updateApplication(
        id: string,
        data: Partial<SocietyApplication>,
        userId?: string
    ): Promise<SocietyApplication> {
        const application = userId
            ? await this.getApplicantApplication(id, userId)
            : await this.getApplicationById(id);

        if (!application) throw new Error('Application not found or unauthorized');

        // Only allow updating in certain statuses if it's the applicant
        if (userId && ![ApplicationStatus.DRAFT, ApplicationStatus.INCOMPLETE].includes(application.status)) {
            throw new Error('Application cannot be updated in its current status');
        }

        Object.assign(application, data);
        return await this.applicationRepo.save(application);
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
        const docRepo = AppDataSource.getRepository('ApplicationDocument');
        const document = docRepo.create({
            applicationId,
            ...data,
            uploadedBy: userId,
            uploadedAt: new Date()
        });
        return await docRepo.save(document);
    }

    /**
     * Get documents for an application
     */
    static async getDocuments(applicationId: string): Promise<any[]> {
        const docRepo = AppDataSource.getRepository('ApplicationDocument');
        return await docRepo.find({
            where: { applicationId },
            order: { uploadedAt: 'DESC' }
        });
    }

    /**
     * Remove a document
     */
    static async removeDocument(documentId: string, userId: string): Promise<void> {
        const docRepo = AppDataSource.getRepository('ApplicationDocument');
        const document = await docRepo.findOneBy({ id: documentId, uploadedBy: userId } as any);
        if (!document) throw new Error('Document not found or unauthorized');
        await docRepo.remove(document);
    }

    // --- Member Management ---

    /**
     * Add a member to an application
     */
    static async addMember(
        applicationId: string,
        data: any
    ): Promise<any> {
        const memberRepo = AppDataSource.getRepository('ApplicationMember');
        const member = memberRepo.create({
            applicationId,
            ...data
        });
        return await memberRepo.save(member);
    }

    /**
     * Get members for an application
     */
    static async getMembers(applicationId: string): Promise<any[]> {
        const memberRepo = AppDataSource.getRepository('ApplicationMember');
        return await memberRepo.find({
            where: { applicationId },
            order: { createdAt: 'ASC' }
        });
    }

    /**
     * Update a member's details
     */
    static async updateMember(
        memberId: string,
        data: any
    ): Promise<any> {
        const memberRepo = AppDataSource.getRepository('ApplicationMember');
        const member = await memberRepo.findOneBy({ id: memberId });
        if (!member) throw new Error('Member not found');
        Object.assign(member, data);
        return await memberRepo.save(member);
    }

    /**
     * Remove a member from an application
     */
    static async removeMember(memberId: string): Promise<void> {
        const memberRepo = AppDataSource.getRepository('ApplicationMember');
        const member = await memberRepo.findOneBy({ id: memberId });
        if (!member) throw new Error('Member not found');
        await memberRepo.remove(member);
    }

    /**
     * Submit an appeal for a rejected application
     */
    static async submitAppeal(
        applicationId: string,
        userId: string,
        notes: string
    ): Promise<SocietyApplication> {
        const application = await this.getApplicantApplication(applicationId, userId);
        if (!application) throw new Error('Application not found or unauthorized');

        if (!application.canAppeal) {
            throw new Error('Application is not eligible for appeal');
        }

        application.status = ApplicationStatus.APPEAL_LODGED;
        application.appealLodgedAt = new Date();
        application.appealOutcome = notes; // Using appealOutcome to store the applicant's reasoning

        return await this.applicationRepo.save(application);
    }
}
