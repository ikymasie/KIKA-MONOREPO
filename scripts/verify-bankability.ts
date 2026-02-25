import 'reflect-metadata';
import { AppDataSource } from '../src/config/database';
import { initializeChartOfAccounts, processStandardTransaction } from '../src/db/services/AccountingService';
import { TransactionType, TransactionStatus } from '../src/entities/Transaction';
import { Tenant } from '../src/entities/Tenant';
import { Account } from '../src/entities/Account';

async function verify() {
    console.log('🚀 Starting Bankability Verification...');

    if (!AppDataSource.isInitialized) {
        await AppDataSource.initialize();
    }

    // 1. Setup Tenant
    const [tenantResult] = await AppDataSource.query(
        'INSERT INTO tenants (name, code) VALUES (?, ?)',
        ['Test Bankability SACCOS ' + Date.now(), 'TBANK' + Date.now().toString().slice(-4)]
    );
    const tenantId = (await AppDataSource.query('SELECT LAST_INSERT_ID() as id')).id;
    console.log('✅ Tenant Created:', tenantId);

    // 2. Initialize Accounts
    await initializeChartOfAccounts(tenantId);
    console.log('✅ Chart of Accounts Initialized');

    // 3. Simulate Loan Disbursement
    const txnId = `txn_${Date.now()}`;
    await AppDataSource.query(
        'INSERT INTO transactions (id, tenantId, transactionNumber, transactionType, amount, transactionDate, status, description) VALUES (?, ?, ?, ?, ?, NOW(), ?, ?)',
        [txnId, tenantId, 'DISB-' + Date.now().toString().slice(-6), 'loan_disbursement', 10000, 'completed', 'Test Loan Disbursement']
    );
    console.log('✅ Loan Disbursement Transaction Created');

    // 4. Process Journaling
    const entries = await processStandardTransaction(tenantId, txnId);
    console.log('✅ Journal Entries Generated:', entries.length);

    // 5. Verify Balances
    const [loanAcc] = await AppDataSource.query('SELECT balance FROM accounts WHERE tenantId = ? AND code = "1100"', [tenantId]);
    const [cashAcc] = await AppDataSource.query('SELECT balance FROM accounts WHERE tenantId = ? AND code = "1000"', [tenantId]);

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
