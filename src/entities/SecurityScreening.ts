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
import { SocietyApplication } from './SocietyApplication';
import { User } from './User';
import { RiskFlag } from './RiskFlag';

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

    @ManyToOne(() => SocietyApplication)
    @JoinColumn({ name: 'applicationId' })
    application!: SocietyApplication;

    @Column({ type: 'uuid' })
    officerId!: string;

    @ManyToOne(() => User)
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

    @OneToMany(() => RiskFlag, (flag) => flag.screening)
    riskFlags!: RiskFlag[];

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
