import * as fs from 'fs';
import { glob } from 'glob';

/**
 * Script to fix dynamic route handlers that are missing the params parameter
 */

async function fixFile(filePath: string) {
    let content = fs.readFileSync(filePath, 'utf-8');

    // Check if file uses params but doesn't have it in function signature
    if (!content.includes('params.id') && !content.includes('params.')) {
        return;
    }

    // Check if already has params in signature
    if (content.includes('{ params }')) {
        return;
    }

    console.log(`Fixing ${filePath}...`);

    // Fix GET, POST, PUT, DELETE, PATCH functions
    const functionTypes = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];

    for (const funcType of functionTypes) {
        // Match function signature without params
        const pattern = new RegExp(
            `export async function ${funcType}\\(request: NextRequest\\)`,
            'g'
        );

        if (pattern.test(content)) {
            content = content.replace(
                pattern,
                `export async function ${funcType}(request: NextRequest, { params }: { params: { id: string } })`
            );
        }
    }

    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`✓ Fixed ${filePath}`);
}

async function main() {
    // Find all route files in [id] or [slug] directories
    const routeFiles = await glob('app/api/**/\\[*\\]/route.ts', { cwd: process.cwd() });
    const nestedRouteFiles = await glob('app/api/**/\\[*\\]/**/route.ts', { cwd: process.cwd() });

    const allFiles = [...new Set([...routeFiles, ...nestedRouteFiles])];

    console.log(`Found ${allFiles.length} dynamic route files`);

    let fixedCount = 0;
    for (const file of allFiles) {
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
