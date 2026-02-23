import { execute, query, queryOne } from './src/db/query';
import { RowDataPacket } from 'mysql2/promise';

async function run() {
    const loanId = "097724cb-6168-4bba-acc2-c38adf5e4744";
    console.log('Fetching loan...', loanId);
    
    const loan = await queryOne<RowDataPacket>('SELECT * FROM loans WHERE id = ?', [loanId]);
    console.log('Loan:', loan);

    if (loan) {
        const [members, products, guarantors] = await Promise.all([
            query<RowDataPacket>('SELECT id, memberNumber, firstName, lastName, email, phone, nationalId, employer FROM members WHERE id = ? LIMIT 1', [loan.memberId]),
            query<RowDataPacket>('SELECT id, name, code, interestRate, savingsMultiplier FROM loan_products WHERE id = ? LIMIT 1', [loan.productId]),
            query<RowDataPacket>(
                `SELECT lg.*, m.id AS gmId, m.memberNumber AS gmNumber, m.firstName AS gmFirst, m.lastName AS gmLast
                 FROM loan_guarantors lg LEFT JOIN members m ON m.id = lg.guarantorMemberId
                 WHERE lg.loanId = ?`,
                [loan.id]
            ),
        ]);
        console.log('Members:', members);
        console.log('Products:', products);
        console.log('Guarantors:', guarantors);
    }
    process.exit(0);
}

run().catch(console.error);
