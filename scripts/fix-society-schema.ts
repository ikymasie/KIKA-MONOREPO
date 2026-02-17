import { AppDataSource } from '../src/config/database';

async function fixSchema() {
    try {
        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }

        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();

        console.log('Checking for missing columns in society_applications...');

        const columns = [
            'securityVettingNotes TEXT',
            'registryClerkId VARCHAR(36)',
            'intelligenceLiaisonId VARCHAR(36)',
            'legalOfficerId VARCHAR(36)',
            'finalDecisionMakerId VARCHAR(36)',
            'assignedFileNumberAt TIMESTAMP NULL',
            'securityClearedAt TIMESTAMP NULL',
            'legalApprovedAt TIMESTAMP NULL',
            'finalDecisionAt TIMESTAMP NULL',
            'certificateNumber VARCHAR(255)',
            'certificateIssuedAt TIMESTAMP NULL',
            'rejectionReasons TEXT',
            'feeAmount DECIMAL(10,2) DEFAULT 0'
        ];

        for (const col of columns) {
            const colName = col.split(' ')[0];
            try {
                await queryRunner.query(`ALTER TABLE society_applications ADD COLUMN ${col} `);
                console.log(`✅ Added ${colName}`);
            } catch (e: any) {
                if (e.errno === 1060 || e.errno === 1061) {
                    console.log(`ℹ️ Column ${colName} already exists`);
                } else {
                    console.log(`❌ Error adding ${colName}:`, e.message);
                }
            }
        }

        // Create missing tables
        console.log('Creating missing tables...');

        const createWorkflowLog = `
            CREATE TABLE IF NOT EXISTS application_workflow_logs (
                id CHAR(36) PRIMARY KEY,
                applicationId CHAR(36) NOT NULL,
                fromStatus VARCHAR(50),
                toStatus VARCHAR(50) NOT NULL,
                performedBy CHAR(36) NOT NULL,
                notes TEXT,
                metadata JSON,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX (applicationId),
                INDEX (createdAt)
            ) ENGINE=InnoDB;
        `;

        const createCertificates = `
            CREATE TABLE IF NOT EXISTS certificates (
                id CHAR(36) PRIMARY KEY,
                tenantId CHAR(36),
                certificateNumber VARCHAR(255) UNIQUE NOT NULL,
                certificateType VARCHAR(50) NOT NULL,
                issuedDate TIMESTAMP NOT NULL,
                expiryDate TIMESTAMP NULL,
                issuedBy CHAR(36),
                documentUrl VARCHAR(255),
                metadata JSON,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX (tenantId),
                INDEX (certificateNumber)
            ) ENGINE=InnoDB;
        `;

        try {
            await queryRunner.query(createWorkflowLog);
            console.log('✅ Table application_workflow_logs confirmed');
        } catch (e: any) {
            console.error('❌ Error creating application_workflow_logs:', e.message);
        }

        try {
            await queryRunner.query(createCertificates);
            console.log('✅ Table certificates confirmed');
        } catch (e: any) {
            console.error('❌ Error creating certificates:', e.message);
        }

        await queryRunner.release();
        console.log('Schema fix completed.');

    } catch (error) {
        console.error('Failed to fix schema:', error);
    } finally {
        await AppDataSource.destroy();
    }
}

fixSchema();
