import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { DeductionRequest } from './DeductionRequest';
import { Member } from './Member';

export enum ChangeReason {
    NEW_ENROLLMENT = 'new_enrollment',
    STATUS_CHANGE = 'status_change',
    POLICY_MATURITY = 'policy_maturity',
    MANUAL_ADJUSTMENT = 'manual_adjustment',
    AMOUNT_CHANGE = 'amount_change',
}

@Entity('deduction_items')
export class DeductionItem {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    requestId!: string;

    @ManyToOne(() => DeductionRequest, (request) => request.items)
    @JoinColumn({ name: 'requestId' })
    request!: DeductionRequest;

    @Column({ type: 'uuid' })
    memberId!: string;

    @ManyToOne(() => Member)
    @JoinColumn({ name: 'memberId' })
    member!: Member;

    @Column()
    memberNumber!: string;

    @Column()
    nationalId!: string;

    @Column()
    employeeNumber!: string;

    @Column({ type: 'decimal', precision: 15, scale: 2 })
    currentAmount!: number;

    @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
    previousAmount!: number;

    @Column({ type: 'enum', enum: ChangeReason })
    changeReason!: ChangeReason;

    @Column({ type: 'json', nullable: true })
    breakdown?: {
        savings?: number;
        loanRepayment?: number;
        insurance?: number;
        merchandise?: number;
    };

    @CreateDateColumn()
    createdAt!: Date;
}
