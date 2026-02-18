import * as fs from 'fs';
import { glob } from 'glob';

/**
 * Final comprehensive script to fix all remaining issues:
 * 1. Add params parameter to dynamic routes that use params.id or params.slug
 * 2. Add missing dynamic imports for entities/services used in functions
 */

async function fixFile(filePath: string) {
    let content = fs.readFileSync(filePath, 'utf-8');
    let modified = false;

    // Check if this is a dynamic route (has [id] or [slug] in path)
    const isDynamicRoute = filePath.includes('[') && filePath.includes(']');

    // Find all function definitions
    const functionTypes = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];

    for (const funcType of functionTypes) {
        // Match function signature
        const funcPattern = new RegExp(
            `(export async function ${funcType}\\(request: NextRequest)(\\)\\s*{[^]*?})`,
            'g'
        );

        const matches = [...content.matchAll(funcPattern)];

        for (const match of matches) {
            const fullMatch = match[0];
            const funcSignature = match[1];
            const funcBody = match[2];

            let newSignature = funcSignature;
            let newBody = funcBody;
            let functionModified = false;

            // Fix 1: Add params if this is a dynamic route and function uses params
            if (isDynamicRoute && funcBody.includes('params.') && !fullMatch.includes('{ params }')) {
                newSignature = `${funcSignature}, { params }: { params: { id: string } }`;
                functionModified = true;
                console.log(`  Adding params to ${funcType} in ${filePath}`);
            }

            // Fix 2: Add missing AppDataSource import if used but not imported
            if (funcBody.includes('AppDataSource') && !funcBody.includes("await import('@/src/config/database')")) {
                const tryMatch = newBody.match(/(try\s*{\s*)(\/\/ Dynamic imports[^]*?)?/);
                if (tryMatch) {
                    const beforeImports = tryMatch[1];
                    const existingImports = tryMatch[2] || '';

                    if (!existingImports.includes('AppDataSource')) {
                        const newImport = existingImports ?
                            `${existingImports}        const { AppDataSource } = await import('@/src/config/database');\n` :
                            `\n        // Dynamic imports to avoid circular dependencies\n        const { AppDataSource } = await import('@/src/config/database');\n`;

                        newBody = newBody.replace(tryMatch[0], beforeImports + newImport);
                        functionModified = true;
                        console.log(`  Adding AppDataSource import to ${funcType} in ${filePath}`);
                    }
                }
            }

            if (functionModified) {
                content = content.replace(fullMatch, newSignature + newBody);
                modified = true;
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
