const fs = require('fs');
const path = require('path');

function findRouteFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            findRouteFiles(filePath, fileList);
        } else if (file === 'route.ts' || file === 'route.tsx') {
            fileList.push(filePath);
        }
    }
    return fileList;
}

const apiDir = path.join(__dirname, 'app/api');
const routeFiles = findRouteFiles(apiDir);

const unpaginatedGetRoutes = [];
const paginatedGetRoutes = [];

for (const file of routeFiles) {
    const content = fs.readFileSync(file, 'utf-8');

    // Only care if it has a GET handler
    if (content.includes('export async function GET') || content.includes('export const GET')) {
        // Check if it looks for 'page' or 'limit'
        if (content.includes('searchParams.get(\'page\')') || content.includes('searchParams.get("page")') || content.includes('searchParams.get(`page`)')) {
            paginatedGetRoutes.push(file);
        } else {
            // Might be a by-id route, so check if URL has [id]
            if (file.includes('[') && file.includes(']')) {
                // Ignore detail routes
                continue;
            }
            // Some routes might just return config, so we should visually inspect the output
            unpaginatedGetRoutes.push(file.replace(apiDir, ''));
        }
    }
}

console.log("=== PAGINATED ROUTES ===");
console.log(paginatedGetRoutes.map(f => f.replace(apiDir, '')).join('\n'));
console.log("\n=== UNPAGINATED ROUTES (Potential Candidates) ===");
console.log(unpaginatedGetRoutes.join('\n'));
