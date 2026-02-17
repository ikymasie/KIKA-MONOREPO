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
import { Member } from './Member';

@Entity('member_bank_accounts')
@Index(['memberId', 'isPrimary'])
export class MemberBankAccount {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    memberId!: string;

    @ManyToOne(() => Member, (member) => member.bankAccounts)
    @JoinColumn({ name: 'memberId' })
    member!: Member;

    @Column()
    bankName!: string;

    @Column()
    branchCode!: string;

    @Column()
    accountNumber!: string;

    @Column()
    accountHolderName!: string;

    @Column({ type: 'enum', enum: ['savings', 'current', 'cheque'], default: 'savings' })
    accountType!: string;

    @Column({ default: false })
    isPrimary!: boolean; // One account must always be primary

    @Column({ default: true })
    isActive!: boolean;

    @Column({ type: 'text', nullable: true })
    notes?: string; // e.g., "For salary deposits", "For loan disbursements"

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
