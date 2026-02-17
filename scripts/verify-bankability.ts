import 'reflect-metadata';
import { AppDataSource } from '../src/config/database';
import { AccountingService } from '../src/services/AccountingService';
import { Transaction, TransactionType, TransactionStatus } from '../src/entities/Transaction';
import { Tenant } from '../src/entities/Tenant';
import { Account } from '../src/entities/Account';

async function verify() {
    console.log('🚀 Starting Bankability Verification...');

    if (!AppDataSource.isInitialized) {
        await AppDataSource.initialize();
    }

    const accountingService = new AccountingService();
    const tenantRepo = AppDataSource.getRepository(Tenant);
    const txnRepo = AppDataSource.getRepository(Transaction);
    const accountRepo = AppDataSource.getRepository(Account);

    // 1. Setup Tenant
    const tenant = tenantRepo.create({
        name: 'Test Bankability SACCOS ' + Date.now(),
        code: 'TBANK' + Date.now().toString().slice(-4),
    });
    await tenantRepo.save(tenant);
    console.log('✅ Tenant Created:', tenant.id);

    // 2. Initialize Accounts
    await accountingService.initializeChartOfAccounts(tenant.id);
    console.log('✅ Chart of Accounts Initialized');

    // 3. Simulate Loan Disbursement
    const txn = txnRepo.create({
        tenantId: tenant.id,
        transactionNumber: 'DISB-' + Date.now().toString().slice(-6),
        transactionType: TransactionType.LOAN_DISBURSEMENT,
        amount: 10000,
        transactionDate: new Date(),
        status: TransactionStatus.COMPLETED,
        description: 'Test Loan Disbursement',
    });
    await txnRepo.save(txn);
    console.log('✅ Loan Disbursement Transaction Created');

    // 4. Process Journaling
    const entries = await accountingService.processTransaction(txn.id);
    console.log('✅ Journal Entries Generated:', entries.length);

    // 5. Verify Balances
    const loanAcc = await accountRepo.findOne({
        where: { tenantId: tenant.id, code: '1100' }
    });
    const cashAcc = await accountRepo.findOne({
        where: { tenantId: tenant.id, code: '1000' }
    });

    console.log('📊 Balance Check:');
    console.log('   - Loan Portfolio (1100): P', loanAcc?.balance);
    console.log('   - Cash at Bank (1000): P', cashAcc?.balance);

    const success = Number(loanAcc?.balance) === 10000 && Number(cashAcc?.balance) === -10000;

    if (success) {
        console.log('✨ SUCCESS: Automated Journaling Verified!');
    } else {
        console.log('❌ FAILURE: Balance mismatch!');
        process.exit(1);
    }

    // 6. Cleanup (Optional: remove test data)
    // For now we keep it to verify in DB if needed.

    console.log('🎉 All Bankability Core Verifications Passed!');
    process.exit(0);
}

verify().catch(e => {
    console.error('❌ Verification Error:', e);
    process.exit(1);
});
