import 'reflect-metadata';
import 'dotenv/config';
import { DataSource, DataSourceOptions } from 'typeorm';
import { Tenant } from '../entities/Tenant';
import { User } from '../entities/User';
import { Member } from '../entities/Member';
import { KYC } from '../entities/KYC';
import { Beneficiary } from '../entities/Beneficiary';
import { Dependent } from '../entities/Dependent';
import { SavingsProduct } from '../entities/SavingsProduct';
import { LoanProduct } from '../entities/LoanProduct';
import { InsuranceProduct } from '../entities/InsuranceProduct';
import { MerchandiseProduct } from '../entities/MerchandiseProduct';
import { MemberSavings } from '../entities/MemberSavings';
import { Loan } from '../entities/Loan';
import { LoanGuarantor } from '../entities/LoanGuarantor';
import { InsurancePolicy } from '../entities/InsurancePolicy';
import { InsuranceClaim } from '../entities/InsuranceClaim';
import { MerchandiseOrder } from '../entities/MerchandiseOrder';
import { DeductionRequest } from '../entities/DeductionRequest';
import { DeductionItem } from '../entities/DeductionItem';
import { ReconciliationBatch } from '../entities/ReconciliationBatch';
import { ReconciliationItem } from '../entities/ReconciliationItem';
import { Account } from '../entities/Account';
import { JournalEntry } from '../entities/JournalEntry';
import { Transaction } from '../entities/Transaction';
import { AuditLog } from '../entities/AuditLog';
import { Vendor } from '../entities/Vendor';
import { Otp } from '../entities/Otp';
import { RegulatorSettings } from '../entities/RegulatorSettings';
import { SocietyApplication } from '../entities/SocietyApplication';
import { Asset } from '../entities/Asset';
import { ComplianceScore } from '../entities/ComplianceScore';
import { ByelawReview } from '../entities/ByelawReview';
import { MemberBankAccount } from '../entities/MemberBankAccount';
import { ComplianceIssue } from '../entities/ComplianceIssue';
import { RegulatoryAlert } from '../entities/RegulatoryAlert';
import { RegulatoryBroadcast } from '../entities/RegulatoryBroadcast';
import { FieldVisit } from '../entities/FieldVisit';
import { Investigation } from '../entities/Investigation';
import { FieldReport } from '../entities/FieldReport';
import { SecurityScreening } from '../entities/SecurityScreening';
import { RiskFlag } from '../entities/RiskFlag';
import { ApplicationWorkflowLog } from '../entities/ApplicationWorkflowLog';
import { Certificate } from '../entities/Certificate';
import { ApplicationMember } from '../entities/ApplicationMember';
import { ApplicationDocument } from '../entities/ApplicationDocument';
import { ApplicationStatusHistory } from '../entities/ApplicationStatusHistory';
import { AgmResolution } from '../entities/AgmResolution';
import { BoardMinute } from '../entities/BoardMinute';
import { Bylaw } from '../entities/Bylaw';
import { MemberCommunication } from '../entities/MemberCommunication';
import { ComplianceRule } from '../entities/ComplianceRule';
import { ComplianceAudit } from '../entities/ComplianceAudit';
import { ApplicationCommunication } from '../entities/ApplicationCommunication';



const options: DataSourceOptions = {
    type: 'mysql',
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '3306'),
    username: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
    synchronize: true, // Enabled for development to sync schema (e.g. minBalance). DISABLE FOR PRODUCTION.
    logging: process.env.DATABASE_LOGGING === 'true',
    entities: [
        Tenant,
        User,
        Member,
        KYC,
        Beneficiary,
        Dependent,
        SavingsProduct,
        LoanProduct,
        InsuranceProduct,
        MerchandiseProduct,
        MemberSavings,
        Loan,
        LoanGuarantor,
        InsurancePolicy,
        InsuranceClaim,
        MerchandiseOrder,
        DeductionRequest,
        DeductionItem,
        ReconciliationBatch,
        ReconciliationItem,
        Account,
        JournalEntry,
        Transaction,
        AuditLog,
        Vendor,
        Otp,
        RegulatorSettings,
        SocietyApplication,
        Asset,
        ComplianceScore,
        ByelawReview,
        MemberBankAccount,
        ComplianceIssue,
        RegulatoryAlert,
        RegulatoryBroadcast,
        FieldVisit,
        Investigation,
        FieldReport,
        SecurityScreening,
        RiskFlag,
        ApplicationWorkflowLog,
        Certificate,
        ApplicationMember,
        ApplicationDocument,
        ApplicationStatusHistory,
        AgmResolution,
        BoardMinute,
        Bylaw,
        MemberCommunication,
        ApplicationCommunication,
        ComplianceRule,
        ComplianceAudit,
    ],

    migrations: ['src/migrations/**/*.ts'],
    subscribers: [],
    extra: {
        max: 20,
        connectionTimeoutMillis: 5000,
    },
};

export const AppDataSource = new DataSource(options);

let isInitialized = false;

export async function getDataSource(): Promise<DataSource> {
    if (!isInitialized) {
        await AppDataSource.initialize();
        isInitialized = true;
        console.log('✅ Database connection established');
    }
    return AppDataSource;
}

export async function closeDataSource(): Promise<void> {
    if (isInitialized && AppDataSource.isInitialized) {
        await AppDataSource.destroy();
        isInitialized = false;
        console.log('Database connection closed');
    }
}
