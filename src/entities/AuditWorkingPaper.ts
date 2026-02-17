import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { AuditorAccessRequest } from './AuditorAccessRequest';
import { User } from './User';

@Entity('audit_working_papers')
export class AuditWorkingPaper {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    requestId!: string;

    @ManyToOne(() => AuditorAccessRequest)
    @JoinColumn({ name: 'requestId' })
    request!: AuditorAccessRequest;

    @Column()
    fileName!: string;

    @Column()
    fileUrl!: string;

    @Column({ type: 'uuid' })
    uploadedById!: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'uploadedById' })
    uploadedBy!: User;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
