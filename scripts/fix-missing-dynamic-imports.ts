import * as fs from 'fs';
import { glob } from 'glob';

/**
 * Script to find all route files that use getUserFromRequest but don't have it in dynamic imports
 */

async function fixFile(filePath: string) {
    let content = fs.readFileSync(filePath, 'utf-8');
    let modified = false;

    // Check if file uses getUserFromRequest
    if (!content.includes('getUserFromRequest')) {
        return;
    }

    // Find all function definitions
    const functionTypes = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];

    for (const funcType of functionTypes) {
        // Match function that uses getUserFromRequest
        const funcPattern = new RegExp(
            `export async function ${funcType}\\([^)]*\\)\\s*{[^]*?}`,
            'g'
        );

        const matches = content.match(funcPattern);
        if (!matches) continue;

        for (const match of matches) {
            // Check if this function uses getUserFromRequest
            if (!match.includes('getUserFromRequest')) continue;

            // Check if it already has dynamic import for getUserFromRequest
            if (match.includes("await import('@/lib/auth-server')")) continue;

            console.log(`Fixing ${funcType} in ${filePath}...`);

            // Find the try block start
            const tryMatch = match.match(/try\s*{/);
            if (!tryMatch) {
                console.log(`  ⚠ No try block found in ${funcType}`);
                continue;
            }

            const tryIndex = tryMatch.index! + tryMatch[0].length;
            const beforeTry = match.substring(0, tryIndex);
            const afterTry = match.substring(tryIndex);

            // Add dynamic import at the start of try block
            const dynamicImport = `\n        // Dynamic imports to avoid circular dependencies\n        const { getUserFromRequest } = await import('@/lib/auth-server');\n`;

            const newFunction = beforeTry + dynamicImport + afterTry;
            content = content.replace(match, newFunction);
            modified = true;
        }
    }

    if (modified) {
        fs.writeFileSync(filePath, content, 'utf-8');
        console.log(`✓ Fixed ${filePath}`);
    }
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
