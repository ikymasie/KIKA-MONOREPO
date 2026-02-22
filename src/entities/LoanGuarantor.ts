import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import type { Loan } from './Loan';
import type { Member } from './Member';

export enum GuarantorStatus {
    PENDING = 'pending',
    ACCEPTED = 'accepted',
    REJECTED = 'rejected',
    RELEASED = 'released',
}

@Entity('loan_guarantors')
export class LoanGuarantor {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    loanId!: string;

    @ManyToOne(() => require('./Loan').Loan, (loan: Loan) => loan.guarantors)
    @JoinColumn({ name: 'loanId' })
    loan!: Loan;

    @Column({ type: 'uuid' })
    guarantorMemberId!: string;

    @ManyToOne(() => require('./Member').Member)
    @JoinColumn({ name: 'guarantorMemberId' })
    guarantorMember!: Member;

    @Column({ type: 'decimal', precision: 15, scale: 2 })
    guaranteedAmount!: number;

    @Column({ type: 'enum', enum: GuarantorStatus, default: GuarantorStatus.PENDING })
    status!: GuarantorStatus;

    @Column({ type: 'timestamp', nullable: true })
    acceptedAt?: Date;

    @Column({ type: 'timestamp', nullable: true })
    rejectedAt?: Date;

    @Column({ type: 'text', nullable: true })
    rejectionReason?: string;

    @Column({ type: 'uuid', nullable: true })
    pledgedSavingsId?: string;

    @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
    pledgeAmount?: number;

    @Column({ type: 'timestamp', nullable: true })
    notificationSentAt?: Date;

    @Column({ type: 'date', nullable: true })
    responseDeadline?: Date;

    @Column({ type: 'text', nullable: true })
    notificationMethod?: string;

    @Column({ type: 'int', default: 0 })
    notificationAttempts!: number;

    @CreateDateColumn()
    createdAt!: Date;
}
