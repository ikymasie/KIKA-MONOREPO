import * as fs from 'fs';
import { glob } from 'glob';

/**
 * Fix syntax errors where import was inserted in the middle of a comment
 */

async function fixFile(filePath: string) {
    let content = fs.readFileSync(filePath, 'utf-8');

    // Fix the broken comment pattern
    const brokenPattern = /\/\/ Dynamic imports\s+const { AppDataSource } = await import\('@\/src\/config\/database'\);\s+to avoid circular dependencies/g;

    if (!brokenPattern.test(content)) {
        return;
    }

    console.log(`Fixing ${filePath}...`);

    // Replace with correct format
    content = content.replace(
        brokenPattern,
        '// Dynamic imports to avoid circular dependencies\n        const { AppDataSource } = await import(\'@/src/config/database\');'
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
