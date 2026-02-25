import { query, queryOne, execute } from '@/src/db/query';
import { v4 as uuidv4 } from 'uuid';
import { RowDataPacket } from 'mysql2/promise';

interface MemberBankAccount {
    id: string;
    memberId: string;
    bankName: string;
    branchCode: string;
    accountNumber: string;
    accountHolderName: string;
    accountType: string;
    isPrimary: boolean;
    isActive: boolean;
    notes?: string;
    createdAt?: Date;
}

/**
 * Service to manage member bank accounts with business logic
 * Ensures one account is always marked as primary
 */
export class BankAccountService {
    /**
     * Add a new bank account for a member
     * If this is the first account, automatically set it as primary
     */
    static async addBankAccount(
        memberId: string,
        accountData: {
            bankName: string;
            branchCode: string;
            accountNumber: string;
            accountHolderName: string;
            accountType?: 'savings' | 'current' | 'cheque';
            isPrimary?: boolean;
            notes?: string;
        }
    ): Promise<MemberBankAccount> {
        // Check if member has any existing accounts
        const existingAccounts = await query<RowDataPacket>(
            'SELECT id FROM member_bank_accounts WHERE memberId = ? AND isActive = true',
            [memberId]
        );

        // If this is the first account, force it to be primary
        const isPrimary = existingAccounts.length === 0 ? true : (accountData.isPrimary || false);

        // If setting this as primary, unset other primary accounts
        if (isPrimary) {
            await execute(
                'UPDATE member_bank_accounts SET isPrimary = false WHERE memberId = ? AND isPrimary = true',
                [memberId]
            );
        }

        const id = uuidv4();
        await execute(
            `INSERT INTO member_bank_accounts 
             (id, memberId, bankName, branchCode, accountNumber, accountHolderName, accountType, isPrimary, isActive, notes, createdAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, true, ?, NOW())`,
            [
                id, memberId, accountData.bankName, accountData.branchCode,
                accountData.accountNumber, accountData.accountHolderName,
                accountData.accountType || 'savings', isPrimary, accountData.notes || null
            ]
        );

        const newAccount = await queryOne<RowDataPacket & MemberBankAccount>(
            'SELECT * FROM member_bank_accounts WHERE id = ?',
            [id]
        );

        return newAccount!;
    }

    /**
     * Set an account as primary
     * Automatically unsets other primary accounts for the member
     */
    static async setPrimaryAccount(accountId: string): Promise<MemberBankAccount> {
        const account = await queryOne<RowDataPacket & MemberBankAccount>(
            'SELECT * FROM member_bank_accounts WHERE id = ?',
            [accountId]
        );

        if (!account) {
            throw new Error('Bank account not found');
        }

        // Unset other primary accounts for this member
        await execute(
            'UPDATE member_bank_accounts SET isPrimary = false WHERE memberId = ? AND isPrimary = true',
            [account.memberId]
        );

        // Set this account as primary
        await execute('UPDATE member_bank_accounts SET isPrimary = true WHERE id = ?', [accountId]);

        return { ...account, isPrimary: true };
    }

    /**
     * Get the primary bank account for a member
     */
    static async getPrimaryAccount(memberId: string): Promise<MemberBankAccount | null> {
        return queryOne<RowDataPacket & MemberBankAccount>(
            'SELECT * FROM member_bank_accounts WHERE memberId = ? AND isPrimary = true AND isActive = true',
            [memberId]
        );
    }

    /**
     * Get all active bank accounts for a member
     */
    static async getMemberAccounts(memberId: string): Promise<MemberBankAccount[]> {
        return query<RowDataPacket & MemberBankAccount>(
            'SELECT * FROM member_bank_accounts WHERE memberId = ? AND isActive = true ORDER BY isPrimary DESC, createdAt ASC',
            [memberId]
        );
    }

    /**
     * Deactivate a bank account
     * If deactivating the primary account, automatically set another as primary
     */
    static async deactivateAccount(accountId: string): Promise<void> {
        const account = await queryOne<RowDataPacket & MemberBankAccount>(
            'SELECT * FROM member_bank_accounts WHERE id = ?',
            [accountId]
        );

        if (!account) {
            throw new Error('Bank account not found');
        }

        const wasPrimary = account.isPrimary;
        await execute(
            'UPDATE member_bank_accounts SET isActive = false, isPrimary = false WHERE id = ?',
            [accountId]
        );

        // If we deactivated the primary account, set another as primary
        if (wasPrimary) {
            const otherAccounts = await query<RowDataPacket & { id: string }>(
                'SELECT id FROM member_bank_accounts WHERE memberId = ? AND isActive = true ORDER BY createdAt ASC LIMIT 1',
                [account.memberId]
            );

            if (otherAccounts.length > 0) {
                await execute(
                    'UPDATE member_bank_accounts SET isPrimary = true WHERE id = ?',
                    [otherAccounts[0].id]
                );
            }
        }
    }

    /**
     * Validate that a member always has exactly one primary account
     * This can be run as a data integrity check
     */
    static async validatePrimaryAccounts(memberId: string): Promise<boolean> {
        const result = await queryOne<RowDataPacket & { count: number }>(
            'SELECT COUNT(*) as count FROM member_bank_accounts WHERE memberId = ? AND isPrimary = true AND isActive = true',
            [memberId]
        );
        return (result?.count || 0) === 1;
    }
}
