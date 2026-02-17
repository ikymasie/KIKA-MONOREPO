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

export enum CertificateType {
    REGISTRATION = 'registration',
    RENEWAL = 'renewal',
    AMENDMENT = 'amendment',
}

@Entity('certificates')
@Index(['tenantId'])
@Index(['certificateNumber'], { unique: true })
export class Certificate {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    tenantId!: string;

    @ManyToOne('Tenant', { nullable: false })
    @JoinColumn({ name: 'tenantId' })
    tenant!: any;

    @Column({ unique: true })
    certificateNumber!: string;

    @Column({ type: 'enum', enum: CertificateType })
    certificateType!: CertificateType;

    @Column({ type: 'date', nullable: true })
    issuedDate?: Date;

    @Column({ type: 'date', nullable: true })
    expiryDate?: Date;

    @Column({ type: 'uuid' })
    issuedBy!: string;

    @ManyToOne('User', { nullable: false })
    @JoinColumn({ name: 'issuedBy' })
    issuer!: any;

    @Column({ nullable: true })
    documentUrl?: string;

    @Column({ type: 'json', nullable: true })
    metadata?: {
        registrationNumber?: string;
        registrationDate?: string;
        societyName?: string;
        address?: string;
        [key: string]: any;
    };

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
