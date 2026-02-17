import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    OneToMany,
    JoinColumn,
    Index,
} from 'typeorm';
import { Tenant } from './Tenant';
import { JournalEntry } from './JournalEntry';

export enum AccountType {
    ASSET = 'asset',
    LIABILITY = 'liability',
    EQUITY = 'equity',
    REVENUE = 'revenue',
    EXPENSE = 'expense',
}

export enum AccountStatus {
    ACTIVE = 'active',
    INACTIVE = 'inactive',
}

@Entity('accounts')
@Index(['tenantId', 'code'], { unique: true })
export class Account {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    tenantId!: string;

    @ManyToOne(() => Tenant, (tenant) => tenant.accounts)
    @JoinColumn({ name: 'tenantId' })
    tenant!: Tenant;

    @Column()
    code!: string;

    @Column()
    name!: string;

    @Column({ type: 'enum', enum: AccountType })
    accountType!: AccountType;

    @Column({ type: 'text', nullable: true })
    description?: string;

    @Column({ type: 'uuid', nullable: true })
    parentAccountId?: string;

    @ManyToOne(() => Account, { nullable: true })
    @JoinColumn({ name: 'parentAccountId' })
    parentAccount?: Account;

    @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
    balance!: number;

    @Column({ type: 'enum', enum: AccountStatus, default: AccountStatus.ACTIVE })
    status!: AccountStatus;

    @OneToMany(() => JournalEntry, (entry) => entry.account)
    journalEntries!: JournalEntry[];

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
