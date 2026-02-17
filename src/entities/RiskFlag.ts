import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { SecurityScreening } from './SecurityScreening';
import { User } from './User';

export enum RiskFlagType {
    IDENTITY = 'identity',
    FINANCIAL = 'financial',
    POLITICAL = 'political',
    REPUTATIONAL = 'reputational',
    OTHER = 'other',
}

@Entity('risk_flags')
export class RiskFlag {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    screeningId!: string;

    @ManyToOne(() => SecurityScreening, (screening) => screening.riskFlags)
    @JoinColumn({ name: 'screeningId' })
    screening!: SecurityScreening;

    @Column({ type: 'enum', enum: RiskFlagType })
    type!: RiskFlagType;

    @Column({ type: 'text' })
    description!: string;

    @Column({ default: false })
    isResolved!: boolean;

    @Column({ type: 'timestamp', nullable: true })
    resolvedAt?: Date;

    @Column({ type: 'uuid', nullable: true })
    resolvedById?: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'resolvedById' })
    resolvedBy?: User;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
