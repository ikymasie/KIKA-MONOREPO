import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import type { Member } from './Member';
import type { SavingsProduct } from './SavingsProduct';

@Entity('member_savings')
export class MemberSavings {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    memberId!: string;

    @ManyToOne(() => require('./Member').Member, (member: Member) => member.savings)
    @JoinColumn({ name: 'memberId' })
    member!: Member;

    @Column({ type: 'uuid' })
    productId!: string;

    @ManyToOne(() => require('./SavingsProduct').SavingsProduct)
    @JoinColumn({ name: 'productId' })
    product!: SavingsProduct;

    @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
    balance!: number;

    @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
    monthlyContribution!: number;

    @Column({ default: true })
    isActive!: boolean;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
