import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    OneToMany,
} from 'typeorm';
import type { SocietyApplication } from './SocietyApplication';
import type { User } from './User';
import type { RiskFlag } from './RiskFlag';

export enum ScreeningStatus {
    PENDING = 'pending',
    CLEARED = 'cleared',
    FAILED = 'failed',
    FLAGGED = 'flagged',
}

export enum RiskLevel {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high',
    CRITICAL = 'critical',
}

@Entity('security_screenings')
export class SecurityScreening {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    applicationId!: string;

    @ManyToOne(() => require('./SocietyApplication').SocietyApplication)
    @JoinColumn({ name: 'applicationId' })
    application!: SocietyApplication;

    @Column({ type: 'uuid' })
    officerId!: string;

    @ManyToOne(() => require('./User').User)
    @JoinColumn({ name: 'officerId' })
    officer!: User;

    @Column({ type: 'json' })
    checks!: {
        criminalRecordMatched: boolean;
        sanctionsListMatched: boolean;
        adverseMediaFound: boolean;
        pepStatusConfirmed: boolean;
        sourceOfWealthVerified: boolean;
    };

    @Column({ type: 'enum', enum: RiskLevel, default: RiskLevel.LOW })
    riskLevel!: RiskLevel;

    @Column({ type: 'enum', enum: ScreeningStatus, default: ScreeningStatus.PENDING })
    status!: ScreeningStatus;

    @Column({ type: 'text', nullable: true })
    notes?: string;

    @OneToMany(() => require('./RiskFlag').RiskFlag, (flag: RiskFlag) => flag.screening)
    riskFlags!: RiskFlag[];

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
