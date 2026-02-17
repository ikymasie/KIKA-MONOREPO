import 'dotenv/config';
import 'reflect-metadata';
import { AppDataSource } from '../src/config/database';

async function updateSchema() {
    try {
        console.log('Connecting to database...');
        await AppDataSource.initialize();
        const queryRunner = AppDataSource.createQueryRunner();

        console.log('Updating insurance_claims table schema...');

        // Update Status Enum (MySQL specific way to update enum)
        // Note: For MySQL, we might need to modify the column
        await queryRunner.query(`ALTER TABLE insurance_claims MODIFY COLUMN status ENUM(
            'draft', 'submitted', 'in_review', 'pending_approval', 'queried', 
            'approved', 'paid', 'rejected', 'under_appeal', 'appeal_declined', 
            'committee_review', 'regulator_review', 'final_rejection'
        ) DEFAULT 'submitted'`);

        const columnsToAdd = [
            { name: 'verifiedBy', type: 'VARCHAR(36)', nullable: true },
            { name: 'verifiedAt', type: 'TIMESTAMP', nullable: true },
            { name: 'adjudicatedBy', type: 'VARCHAR(36)', nullable: true },
            { name: 'adjudicatedAt', type: 'TIMESTAMP', nullable: true },
            { name: 'disbursedBy', type: 'VARCHAR(36)', nullable: true },
            { name: 'disbursedAt', type: 'TIMESTAMP', nullable: true },
            { name: 'disputeReason', type: 'TEXT', nullable: true },
            { name: 'disputeEvidenceUrls', type: 'JSON', nullable: true },
            { name: 'committeeReviewNotes', type: 'TEXT', nullable: true },
            { name: 'regulatorRuling', type: 'TEXT', nullable: true },
            { name: 'isExGratia', type: 'BOOLEAN', default: 'FALSE' },
            { name: 'queryReason', type: 'TEXT', nullable: true },
            { name: 'rejectionReason', type: 'TEXT', nullable: true }
        ];

        for (const col of columnsToAdd) {
            try {
                let sql = `ALTER TABLE insurance_claims ADD COLUMN ${col.name} ${col.type}`;
                if (col.nullable === false) sql += ' NOT NULL';
                if (col.default !== undefined) sql += ` DEFAULT ${col.default}`;

                await queryRunner.query(sql);
                console.log(`✅ Added column ${col.name}`);
            } catch (err: any) {
                if (err.message.includes('Duplicate column name')) {
                    console.log(`ℹ️ Column ${col.name} already exists`);
                } else {
                    console.error(`❌ Error adding column ${col.name}:`, err.message);
                }
            }
        }

        console.log('✨ Insurance claims schema update complete');
        await AppDataSource.destroy();
    } catch (error) {
        console.error('❌ Schema update failed:', error);
        process.exit(1);
    }
}

updateSchema();
