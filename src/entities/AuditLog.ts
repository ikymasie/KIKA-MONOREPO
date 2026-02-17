import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    Index,
} from 'typeorm';

export enum AuditAction {
    CREATE = 'create',
    UPDATE = 'update',
    DELETE = 'delete',
    LOGIN = 'login',
    LOGOUT = 'logout',
    APPROVE = 'approve',
    REJECT = 'reject',
    DISBURSE = 'disburse',
    RECONCILE = 'reconcile',
    EXPORT = 'export',
    IMPORT = 'import',
}

@Entity('audit_logs')
@Index(['tenantId', 'createdAt'])
@Index(['userId', 'createdAt'])
export class AuditLog {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid', nullable: true })
    tenantId?: string;

    @Column({ type: 'uuid' })
    userId!: string;

    @Column()
    userEmail!: string;

    @Column({ type: 'enum', enum: AuditAction })
    action!: AuditAction;

    @Column()
    entityType!: string;

    @Column({ type: 'uuid', nullable: true })
    entityId?: string;

    @Column({ type: 'json', nullable: true })
    oldValues?: Record<string, any>;

    @Column({ type: 'json', nullable: true })
    newValues?: Record<string, any>;

    @Column({ nullable: true })
    ipAddress?: string;

    @Column({ nullable: true })
    userAgent?: string;

    @Column({ type: 'text', nullable: true })
    description?: string;

    @CreateDateColumn()
    createdAt!: Date;
}
