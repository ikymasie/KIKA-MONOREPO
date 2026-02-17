import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    OneToOne,
} from 'typeorm';
import { MerchandiseOrder } from './MerchandiseOrder';
import { Vendor } from './Vendor';
import { Tenant } from './Tenant';

export enum InvoiceStatus {
    DRAFT = 'draft',
    SENT = 'sent',
    PAID = 'paid',
    CANCELLED = 'cancelled',
    OVERDUE = 'overdue',
}

@Entity('merchandise_invoices')
export class MerchandiseInvoice {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    tenantId!: string;

    @ManyToOne(() => Tenant)
    @JoinColumn({ name: 'tenantId' })
    tenant!: Tenant;

    @Column({ type: 'uuid' })
    vendorId!: string;

    @ManyToOne(() => Vendor)
    @JoinColumn({ name: 'vendorId' })
    vendor!: Vendor;

    @Column({ type: 'uuid' })
    orderId!: string;

    @OneToOne(() => MerchandiseOrder)
    @JoinColumn({ name: 'orderId' })
    order!: MerchandiseOrder;

    @Column()
    invoiceNumber!: string;

    @Column({ type: 'decimal', precision: 15, scale: 2 })
    amount!: number;

    @Column({ type: 'date' })
    dueDate!: Date;

    @Column({ type: 'enum', enum: InvoiceStatus, default: InvoiceStatus.DRAFT })
    status!: InvoiceStatus;

    @Column({ nullable: true })
    paymentReference?: string;

    @Column({ type: 'timestamp', nullable: true })
    paidAt?: Date;

    @Column({ type: 'text', nullable: true })
    notes?: string;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
