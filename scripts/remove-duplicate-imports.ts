import * as fs from 'fs';
import { glob } from 'glob';

/**
 * Script to remove duplicate dynamic imports
 */

async function fixFile(filePath: string) {
    let content = fs.readFileSync(filePath, 'utf-8');

    // Check if file has duplicate getUserFromRequest imports
    const pattern = /(\/\/ Dynamic imports to avoid circular dependencies\s+const { getUserFromRequest } = await import\('@\/lib\/auth-server'\);\s*\n\s*)+/g;

    const matches = content.match(pattern);
    if (!matches) {
        return;
    }

    console.log(`Fixing ${filePath}...`);

    // Replace multiple occurrences with a single one
    content = content.replace(
        pattern,
        '// Dynamic imports to avoid circular dependencies\n        const { getUserFromRequest } = await import(\'@/lib/auth-server\');\n'
    );

    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`✓ Fixed ${filePath}`);
}

async function main() {
    const routeFiles = await glob('app/api/**/route.ts', { cwd: process.cwd() });

    console.log(`Found ${routeFiles.length} route files`);

    let fixedCount = 0;
    for (const file of routeFiles) {
        try {
            const before = fs.readFileSync(file, 'utf-8');
            await fixFile(file);
            const after = fs.readFileSync(file, 'utf-8');
            if (before !== after) {
                fixedCount++;
            }
        } catch (error) {
            console.error(`Error fixing ${file}:`, error);
        }
    }

    console.log(`\nFixed ${fixedCount} files!`);
}

main();
