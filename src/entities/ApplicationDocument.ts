import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
} from 'typeorm';
import { SocietyApplication } from './SocietyApplication';
import { User } from './User';

export enum DocumentType {
    CONSTITUTION = 'constitution',
    FORM_A = 'form_a',
    MEMBERSHIP_LIST = 'membership_list',
    VIABILITY_REPORT = 'viability_report',
    PROOF_OF_CAPITAL = 'proof_of_capital',
    CERTIFICATE = 'certificate',
    REJECTION_NOTICE = 'rejection_notice',
    APPEAL_LETTER = 'appeal_letter',
}

@Entity('application_documents')
@Index(['applicationId'])
@Index(['documentType'])
export class ApplicationDocument {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    applicationId!: string;

    @ManyToOne(() => SocietyApplication)
    @JoinColumn({ name: 'applicationId' })
    application?: SocietyApplication;

    @Column({ type: 'enum', enum: DocumentType })
    documentType!: DocumentType;

    @Column()
    fileName!: string;

    @Column({ type: 'text' })
    fileUrl!: string; // Cloud storage URL

    @Column({ type: 'bigint', nullable: true })
    fileSizeBytes?: number;

    @Column({ nullable: true })
    mimeType?: string;

    @Column({ type: 'uuid' })
    uploadedBy!: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'uploadedBy' })
    uploader?: User;

    @Column({ default: false })
    isVerified!: boolean;

    @Column({ type: 'timestamp', nullable: true })
    verifiedAt?: Date;

    @Column({ type: 'uuid', nullable: true })
    verifiedById?: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'verifiedById' })
    verifiedBy?: User;

    @CreateDateColumn()
    uploadedAt!: Date;

    // Helper methods
    get isRequired(): boolean {
        // All applications need constitution and Form A
        if (this.documentType === DocumentType.CONSTITUTION ||
            this.documentType === DocumentType.FORM_A) {
            return true;
        }

        // SACCOS need viability report and proof of capital
        if (this.application?.applicationType === 'saccos') {
            return this.documentType === DocumentType.VIABILITY_REPORT ||
                this.documentType === DocumentType.PROOF_OF_CAPITAL;
        }

        return false;
    }

    get isGenerated(): boolean {
        return this.documentType === DocumentType.CERTIFICATE ||
            this.documentType === DocumentType.REJECTION_NOTICE;
    }
}
