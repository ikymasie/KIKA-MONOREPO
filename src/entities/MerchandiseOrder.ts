import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Member } from './Member';
import { MerchandiseProduct } from './MerchandiseProduct';
import { Tenant } from './Tenant';


export enum OrderStatus {
    PENDING = 'pending',
    APPROVED = 'approved',
    ORDERED = 'ordered',
    IN_TRANSIT = 'in_transit',
    READY_FOR_COLLECTION = 'ready_for_collection',
    DELIVERED = 'delivered',
    CANCELLED = 'cancelled',
}

@Entity('merchandise_orders')
export class MerchandiseOrder {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    tenantId!: string;

    @ManyToOne(() => Tenant)
    @JoinColumn({ name: 'tenantId' })
    tenant!: Tenant;

    @Column()
    orderNumber!: string;

    @Column({ type: 'uuid' })
    memberId!: string;

    @ManyToOne(() => Member)
    @JoinColumn({ name: 'memberId' })
    member!: Member;

    @Column({ type: 'uuid' })
    productId!: string;

    @ManyToOne(() => MerchandiseProduct)
    @JoinColumn({ name: 'productId' })
    product!: MerchandiseProduct;

    @Column({ type: 'int', default: 1 })
    quantity!: number;

    @Column({ type: 'decimal', precision: 15, scale: 2 })
    unitPrice!: number;

    @Column({ type: 'decimal', precision: 15, scale: 2 })
    totalPrice!: number;

    @Column({ type: 'int' })
    termMonths!: number;

    @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
    interestRate!: number;

    @Column({ type: 'decimal', precision: 15, scale: 2 })
    monthlyInstallment!: number;

    @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
    amountPaid!: number;

    @Column({ type: 'decimal', precision: 15, scale: 2 })
    outstandingBalance!: number;

    @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING })
    status!: OrderStatus;

    @Column({ type: 'date', nullable: true })
    approvalDate?: Date;

    @Column({ type: 'date', nullable: true })
    deliveryDate?: Date;

    @Column({ type: 'uuid', nullable: true })
    approvedBy?: string;

    @Column({ type: 'text', nullable: true })
    deliveryNotes?: string;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
