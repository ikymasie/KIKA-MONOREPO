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

export enum BeneficiaryRelationship {
    SPOUSE = 'spouse',
    CHILD = 'child',
    PARENT = 'parent',
    SIBLING = 'sibling',
    OTHER = 'other',
}

@Entity('beneficiaries')
export class Beneficiary {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    memberId!: string;

    @ManyToOne(() => Member, (member) => member.beneficiaries)
    @JoinColumn({ name: 'memberId' })
    member!: Member;

    @Column()
    firstName!: string;

    @Column()
    lastName!: string;

    @Column({ type: 'enum', enum: BeneficiaryRelationship })
    relationship!: BeneficiaryRelationship;

    @Column({ type: 'date' })
    dateOfBirth!: Date;

    @Column()
    nationalId!: string;

    @Column({ nullable: true })
    phone?: string;

    @Column({ type: 'text', nullable: true })
    address?: string;

    @Column({ type: 'decimal', precision: 5, scale: 2 })
    allocationPercentage!: number;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
