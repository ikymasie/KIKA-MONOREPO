import * as fs from 'fs';
import { glob } from 'glob';

/**
 * Script to fix dynamic imports that are placed BEFORE the try block
 * They should be INSIDE the try block
 */

async function fixFile(filePath: string) {
    let content = fs.readFileSync(filePath, 'utf-8');

    // Check if file has dynamic imports before try block
    const pattern = /export async function (GET|POST|PUT|DELETE|PATCH)\([^)]*\)\s*{\s*(\/\/ Dynamic imports[^]*?)try\s*{/;
    const match = content.match(pattern);

    if (!match) {
        return;
    }

    console.log(`Fixing ${filePath}...`);

    const functionType = match[1];
    const dynamicImportsBlock = match[2];

    // Remove the dynamic imports from before the try block
    content = content.replace(pattern, `export async function ${functionType}(request: NextRequest) {\n    try {\n${dynamicImportsBlock}`);

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
