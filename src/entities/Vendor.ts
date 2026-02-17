import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';

export enum VendorStatus {
    ACTIVE = 'active',
    INACTIVE = 'inactive',
    SUSPENDED = 'suspended',
}

@Entity('vendors')
export class Vendor {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column()
    name!: string;

    @Column()
    code!: string;

    @Column({ nullable: true })
    registrationNumber?: string;

    @Column({ nullable: true })
    contactPerson?: string;

    @Column({ nullable: true })
    email?: string;

    @Column({ nullable: true })
    phone?: string;

    @Column({ type: 'text', nullable: true })
    address?: string;

    @Column({ nullable: true })
    bankName?: string;

    @Column({ nullable: true })
    bankAccountNumber?: string;

    @Column({ type: 'enum', enum: VendorStatus, default: VendorStatus.ACTIVE })
    status!: VendorStatus;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
