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

export enum DependentRelationship {
    SPOUSE = 'spouse',
    CHILD = 'child',
    PARENT = 'parent',
    SIBLING = 'sibling',
    EXTENDED_FAMILY = 'extended_family',
}

@Entity('dependents')
export class Dependent {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    memberId!: string;

    @ManyToOne(() => Member, (member) => member.dependents)
    @JoinColumn({ name: 'memberId' })
    member!: Member;

    @Column()
    firstName!: string;

    @Column()
    lastName!: string;

    @Column({ type: 'enum', enum: DependentRelationship })
    relationship!: DependentRelationship;

    @Column({ type: 'date' })
    dateOfBirth!: Date;

    @Column({ nullable: true })
    nationalId?: string;

    @Column()
    gender!: string;

    @Column({ default: true })
    isActive!: boolean;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;

    get age(): number {
        const today = new Date();
        const birthDate = new Date(this.dateOfBirth);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    }
}
