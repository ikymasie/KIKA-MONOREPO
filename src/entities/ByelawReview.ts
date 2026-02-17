import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
} from 'typeorm';
import { Tenant } from './Tenant';
import { User } from './User';

export enum ByelawReviewStatus {
    PENDING = 'pending',
    UNDER_REVIEW = 'under_review',
    APPROVED = 'approved',
    REJECTED = 'rejected',
    REVISION_REQUIRED = 'revision_required',
}

@Entity('byelaw_reviews')
@Index(['tenantId'])
@Index(['status'])
@Index(['submittedAt'])
export class ByelawReview {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    tenantId!: string;

    @ManyToOne(() => Tenant)
    @JoinColumn({ name: 'tenantId' })
    tenant!: Tenant;

    @Column({ type: 'text' })
    bylawDocumentUrl!: string;

    @Column({ type: 'timestamp' })
    submittedAt!: Date;

    @Column({ type: 'enum', enum: ByelawReviewStatus, default: ByelawReviewStatus.PENDING })
    status!: ByelawReviewStatus;

    @Column({ type: 'uuid', nullable: true })
    reviewedBy?: string;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'reviewedBy' })
    reviewer?: User;

    @Column({ type: 'timestamp', nullable: true })
    reviewedAt?: Date;

    @Column({ type: 'text', nullable: true })
    reviewNotes?: string;

    @Column({ type: 'timestamp', nullable: true })
    approvalDate?: Date;

    @Column({ type: 'text', nullable: true })
    rejectionReason?: string;

    @Column({ type: 'int', default: 1 })
    version!: number;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;

    get isPending(): boolean {
        return this.status === ByelawReviewStatus.PENDING || this.status === ByelawReviewStatus.UNDER_REVIEW;
    }

    get isApproved(): boolean {
        return this.status === ByelawReviewStatus.APPROVED;
    }

    get isRejected(): boolean {
        return this.status === ByelawReviewStatus.REJECTED;
    }
}
