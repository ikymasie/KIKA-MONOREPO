import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    Index,
} from 'typeorm';

@Entity('otps')
export class Otp {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column()
    @Index()
    phone!: string;

    @Column()
    code!: string;

    @Column({ type: 'timestamp' })
    expiresAt!: Date;

    @Column({ default: false })
    used!: boolean;

    @CreateDateColumn()
    createdAt!: Date;
}
