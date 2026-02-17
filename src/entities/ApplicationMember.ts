import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
} from 'typeorm';
import { SocietyApplication } from './SocietyApplication';

@Entity('application_members')
@Index(['applicationId'])
@Index(['idNumber'])
export class ApplicationMember {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    applicationId!: string;

    @ManyToOne(() => SocietyApplication)
    @JoinColumn({ name: 'applicationId' })
    application?: SocietyApplication;

    @Column()
    fullName!: string;

    @Column()
    idNumber!: string;

    @Column()
    citizenship!: string; // Botswana Citizen, Resident, Non-Resident

    @Column({ default: false })
    isOfficeBearer!: boolean;

    @Column({ nullable: true })
    officeBearerPosition?: string; // Chairperson, Secretary, Treasurer, etc.

    @Column({ type: 'text', nullable: true })
    residentialAddress?: string;

    // Security vetting (for office bearers only)
    @Column({ default: false })
    securityCleared!: boolean;

    @Column({ type: 'timestamp', nullable: true })
    securityClearedAt?: Date;

    @Column({ type: 'text', nullable: true })
    securityNotes?: string;

    @CreateDateColumn()
    createdAt!: Date;

    // Helper methods
    get isBotswanaResident(): boolean {
        return this.citizenship === 'Botswana Citizen' || this.citizenship === 'Resident';
    }
}
