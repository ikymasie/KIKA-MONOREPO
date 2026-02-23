import { query } from './src/db/query.ts';

async function run() {
    try {
        const result = await query('SHOW TABLES LIKE "loan_guarantors"');
        console.log("loan_guarantors:", result);
    } catch(e) {
        console.error(e);
    }
    process.exit(0);
}
run();
