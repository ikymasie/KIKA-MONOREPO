import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Loan } from './Loan';
import { User } from './User';

export enum WorkflowActionType {
    ELIGIBILITY_CHECK = 'eligibility_check',
    GUARANTOR_PLEDGE = 'guarantor_pledge',
    GUARANTOR_REJECT = 'guarantor_reject',
    OFFICER_ASSIGN = 'officer_assign',
    OFFICER_REVIEW = 'officer_review',
    COMMITTEE_VOTE = 'committee_vote',
    DISBURSEMENT = 'disbursement',
    STATUS_CHANGE = 'status_change',
    REJECTION = 'rejection',
}

@Entity('loan_workflow_logs')
export class LoanWorkflowLog {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    loanId!: string;

    @ManyToOne(() => Loan)
    @JoinColumn({ name: 'loanId' })
    loan!: Loan;

    @Column({ nullable: true })
    fromStatus?: string;

    @Column({ nullable: true })
    toStatus?: string;

    @Column({ type: 'enum', enum: WorkflowActionType })
    actionType!: WorkflowActionType;

    @Column({ type: 'uuid', nullable: true })
    actionBy?: string;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'actionBy' })
    actionByUser?: User;

    @Column({ type: 'text', nullable: true })
    notes?: string;

    @Column({ type: 'json', nullable: true })
    metadata?: {
        eligibilityResults?: any;
        guarantorId?: string;
        committeeVote?: any;
        disbursementDetails?: any;
        [key: string]: any;
    };

    @CreateDateColumn()
    timestamp!: Date;
}
