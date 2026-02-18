import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

/**
 * Script to fix circular dependency issues in API routes
 * by converting static imports to dynamic imports
 */

const PROBLEMATIC_IMPORTS = [
    "import { getUserFromRequest } from '@/lib/auth-server';",
    "import { AppDataSource } from '@/src/config/database';",
    "import { AccountingService } from '@/src/services/AccountingService';",
    "import { Member } from '@/src/entities/Member';",
    "import { Transaction } from '@/src/entities/Transaction';",
    "import { Account, AccountStatus, AccountType } from '@/src/entities/Account';",
    "import { Account } from '@/src/entities/Account';",
];

async function fixFile(filePath: string) {
    let content = fs.readFileSync(filePath, 'utf-8');
    let modified = false;

    // Check if file already uses dynamic imports
    if (content.includes('await import(')) {
        console.log(`✓ ${filePath} already uses dynamic imports`);
        return;
    }

    // Check if file has problematic imports
    const hasProblematicImports = PROBLEMATIC_IMPORTS.some(imp => content.includes(imp));
    if (!hasProblematicImports) {
        return;
    }

    console.log(`Fixing ${filePath}...`);

    // Extract all imports to remove
    const importsToRemove: string[] = [];
    const lines = content.split('\n');
    const importLines: string[] = [];

    for (const line of lines) {
        if (line.trim().startsWith('import ') &&
            (line.includes('@/lib/auth-server') ||
                line.includes('@/src/config/database') ||
                line.includes('@/src/services/') ||
                line.includes('@/src/entities/'))) {
            importLines.push(line.trim());
        }
    }

    // Remove the problematic imports
    for (const importLine of importLines) {
        content = content.replace(importLine + '\n', '');
    }

    // Find the first async function (GET, POST, PUT, DELETE, PATCH)
    const functionMatch = content.match(/export async function (GET|POST|PUT|DELETE|PATCH)\([^)]*\)\s*{/);
    if (!functionMatch) {
        console.log(`⚠ No async function found in ${filePath}`);
        return;
    }

    const functionStart = functionMatch.index! + functionMatch[0].length;

    // Build dynamic imports from the import lines
    const dynamicImports: string[] = [];
    for (const importLine of importLines) {
        // Parse the import statement
        const match = importLine.match(/import\s+{([^}]+)}\s+from\s+['"]([^'"]+)['"]/);
        if (match) {
            const imports = match[1].trim();
            const from = match[2];
            dynamicImports.push(`const { ${imports} } = await import('${from}');`);
        }
    }

    if (dynamicImports.length > 0) {
        // Insert dynamic imports at the start of the function
        const beforeFunction = content.substring(0, functionStart);
        const afterFunction = content.substring(functionStart);

        const dynamicImportBlock = '\n        // Dynamic imports to avoid circular dependencies\n        ' +
            dynamicImports.join('\n        ') + '\n';

        content = beforeFunction + dynamicImportBlock + afterFunction;
        modified = true;
    }

    if (modified) {
        fs.writeFileSync(filePath, content, 'utf-8');
        console.log(`✓ Fixed ${filePath}`);
    }
}

async function main() {
    const routeFiles = await glob('app/api/**/route.ts', { cwd: process.cwd() });

    console.log(`Found ${routeFiles.length} route files`);

    for (const file of routeFiles) {
        try {
            await fixFile(file);
        } catch (error) {
            console.error(`Error fixing ${file}:`, error);
        }
    }

    console.log('Done!');
}

main();
