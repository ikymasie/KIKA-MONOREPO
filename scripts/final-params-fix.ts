import * as fs from 'fs';
import { glob } from 'glob';

/**
 * Final script to fix ALL remaining params issues in dynamic routes
 */

async function fixFile(filePath: string) {
    let content = fs.readFileSync(filePath, 'utf-8');
    let modified = false;

    // Check if this is a dynamic route (has [id] or [slug] in path)
    const isDynamicRoute = filePath.includes('[') && filePath.includes(']');
    if (!isDynamicRoute) return;

    // Check if file uses params but doesn't have it in function signature
    if (!content.includes('params.') && !content.includes('params;')) return;

    // Find all function definitions
    const functionTypes = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];

    for (const funcType of functionTypes) {
        // Match function signature without params parameter
        const pattern = new RegExp(
            `(export async function ${funcType}\\(request: NextRequest)(\\)\\s*{[^]*?})`,
            'g'
        );

        const matches = [...content.matchAll(pattern)];

        for (const match of matches) {
            const fullMatch = match[0];
            const funcSignature = match[1];
            const funcBody = match[2];

            // Check if this function uses params
            if (funcBody.includes('params.') || funcBody.includes('params;')) {
                // Check if it already has params in signature
                if (!fullMatch.includes('{ params }')) {
                    console.log(`  Adding params to ${funcType} in ${filePath}`);
                    const newSignature = `${funcSignature}, { params }: { params: { id: string } }`;
                    content = content.replace(fullMatch, newSignature + funcBody);
                    modified = true;
                }
            }
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
