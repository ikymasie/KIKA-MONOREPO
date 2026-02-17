import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Tenant } from './Tenant';

export enum AssetType {
    LAND = 'land',
    BUILDING = 'building',
    EQUIPMENT = 'equipment',
    VEHICLE = 'vehicle',
    OTHER = 'other',
}

export enum AssetStatus {
    ACTIVE = 'active',
    DISPOSED = 'disposed',
    ENCUMBERED = 'encumbered', // Pledged as collateral
}

@Entity('assets')
export class Asset {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    tenantId!: string;

    @ManyToOne(() => Tenant)
    @JoinColumn({ name: 'tenantId' })
    tenant!: Tenant;

    @Column()
    name!: string;

    @Column({ type: 'enum', enum: AssetType })
    assetType!: AssetType;

    @Column({ type: 'text', nullable: true })
    description?: string;

    @Column({ type: 'decimal', precision: 15, scale: 2 })
    purchasePrice!: number;

    @Column({ type: 'date', nullable: true })
    purchaseDate?: Date;

    @Column({ type: 'decimal', precision: 15, scale: 2 })
    currentValuation!: number;

    @Column({ type: 'date', nullable: true })
    lastValuationDate?: Date;

    @Column({ type: 'enum', enum: AssetStatus, default: AssetStatus.ACTIVE })
    status!: AssetStatus;

    @Column({ type: 'text', nullable: true })
    collateralDetails?: string;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
