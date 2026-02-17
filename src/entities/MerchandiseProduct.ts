import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import type { Tenant } from './Tenant';
import { Vendor } from './Vendor';

export enum MerchandiseProductStatus {
    ACTIVE = 'active',
    INACTIVE = 'inactive',
    OUT_OF_STOCK = 'out_of_stock',
}

export enum MerchandiseCategory {
    ELECTRONICS = 'electronics',
    FURNITURE = 'furniture',
    APPLIANCES = 'appliances',
    AGRICULTURAL = 'agricultural',
    BUILDING_MATERIALS = 'building_materials',
    VEHICLES = 'vehicles',
    OTHER = 'other',
}

@Entity('merchandise_products')
export class MerchandiseProduct {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    tenantId!: string;

    @ManyToOne(() => require('./Tenant').Tenant, (tenant: any) => tenant.merchandiseProducts)
    @JoinColumn({ name: 'tenantId' })
    tenant!: Tenant;

    @Column({ type: 'uuid', nullable: true })
    vendorId?: string;

    @ManyToOne(() => Vendor, { nullable: true })
    @JoinColumn({ name: 'vendorId' })
    vendor?: Vendor;

    @Column()
    name!: string;

    @Column()
    sku!: string;

    @Column({ type: 'text', nullable: true })
    description?: string;

    @Column({ type: 'enum', enum: MerchandiseCategory })
    category!: MerchandiseCategory;

    @Column({ type: 'decimal', precision: 15, scale: 2 })
    retailPrice!: number;

    @Column({ type: 'decimal', precision: 15, scale: 2 })
    costPrice!: number;

    @Column({ type: 'int', default: 0 })
    stockQuantity!: number;

    @Column({ type: 'int', nullable: true })
    minimumTermMonths?: number;

    @Column({ type: 'int', nullable: true })
    maximumTermMonths?: number;

    @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
    interestRate?: number;

    @Column({ nullable: true })
    imageUrl?: string;

    @Column({ nullable: true })
    thumbnailUrl?: string;

    @Column({ default: false })
    allowAutoOrdering!: boolean;

    @Column({ type: 'int', default: 0 })
    reorderLevel!: number;

    @Column({ type: 'enum', enum: MerchandiseProductStatus, default: MerchandiseProductStatus.ACTIVE })
    status!: MerchandiseProductStatus;

    @Column({ nullable: true })
    flyerUrl?: string;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;

    get markup(): number {
        return this.retailPrice - this.costPrice;
    }

    get markupPercentage(): number {
        return (this.markup / this.costPrice) * 100;
    }
}
