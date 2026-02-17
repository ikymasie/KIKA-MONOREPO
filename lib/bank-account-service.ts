import { AppDataSource } from './db';
import { Member } from '../src/entities/Member';
import { MemberBankAccount } from '../src/entities/MemberBankAccount';

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
        const accountRepo = AppDataSource.getRepository(MemberBankAccount);

        // Check if member has any existing accounts
        const existingAccounts = await accountRepo.find({
            where: { memberId, isActive: true }
        });

        // If this is the first account, force it to be primary
        const isPrimary = existingAccounts.length === 0 ? true : (accountData.isPrimary || false);

        // If setting this as primary, unset other primary accounts
        if (isPrimary) {
            await accountRepo.update(
                { memberId, isPrimary: true },
                { isPrimary: false }
            );
        }

        const newAccount = accountRepo.create({
            memberId,
            ...accountData,
            isPrimary,
        });

        return await accountRepo.save(newAccount);
    }

    /**
     * Set an account as primary
     * Automatically unsets other primary accounts for the member
     */
    static async setPrimaryAccount(accountId: string): Promise<MemberBankAccount> {
        const accountRepo = AppDataSource.getRepository(MemberBankAccount);

        const account = await accountRepo.findOne({
            where: { id: accountId }
        });

        if (!account) {
            throw new Error('Bank account not found');
        }

        // Unset other primary accounts for this member
        await accountRepo.update(
            { memberId: account.memberId, isPrimary: true },
            { isPrimary: false }
        );

        // Set this account as primary
        account.isPrimary = true;
        return await accountRepo.save(account);
    }

    /**
     * Get the primary bank account for a member
     */
    static async getPrimaryAccount(memberId: string): Promise<MemberBankAccount | null> {
        const accountRepo = AppDataSource.getRepository(MemberBankAccount);

        return await accountRepo.findOne({
            where: { memberId, isPrimary: true, isActive: true }
        });
    }

    /**
     * Get all active bank accounts for a member
     */
    static async getMemberAccounts(memberId: string): Promise<MemberBankAccount[]> {
        const accountRepo = AppDataSource.getRepository(MemberBankAccount);

        return await accountRepo.find({
            where: { memberId, isActive: true },
            order: { isPrimary: 'DESC', createdAt: 'ASC' }
        });
    }

    /**
     * Deactivate a bank account
     * If deactivating the primary account, automatically set another as primary
     */
    static async deactivateAccount(accountId: string): Promise<void> {
        const accountRepo = AppDataSource.getRepository(MemberBankAccount);

        const account = await accountRepo.findOne({
            where: { id: accountId }
        });

        if (!account) {
            throw new Error('Bank account not found');
        }

        const wasPrimary = account.isPrimary;
        account.isActive = false;
        account.isPrimary = false;
        await accountRepo.save(account);

        // If we deactivated the primary account, set another as primary
        if (wasPrimary) {
            const otherAccounts = await accountRepo.find({
                where: { memberId: account.memberId, isActive: true },
                order: { createdAt: 'ASC' }
            });

            if (otherAccounts.length > 0) {
                otherAccounts[0].isPrimary = true;
                await accountRepo.save(otherAccounts[0]);
            }
        }
    }

    /**
     * Validate that a member always has exactly one primary account
     * This can be run as a data integrity check
     */
    static async validatePrimaryAccounts(memberId: string): Promise<boolean> {
        const accountRepo = AppDataSource.getRepository(MemberBankAccount);

        const primaryAccounts = await accountRepo.count({
            where: { memberId, isPrimary: true, isActive: true }
        });

        return primaryAccounts === 1;
    }
}
