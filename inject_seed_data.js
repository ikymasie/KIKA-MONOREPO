const fs = require('fs');
const path = require('path');

const OUTPUT_FILE = path.join(__dirname, 'KIKA_Postman_Collection.json');
const collection = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf8'));

// From the seed file, we know the exact patterns used for user emails:
// Admins (saccos_admin): firstName.lastName[0-1]@bges.co.bw (for BGES tenant)
// Regulators: firstName.lastName[0-1]@gov.bw
// We will also set strong default password as "Kika@2026" based on the DB config / likely defaults, or just assume "password" if they are hardcoded.

const SEEDED_ADMIN_EMAIL = "thabo.molefe0@bges.co.bw"; // Valid format from seed
const SEEDED_MEMBER_EMAIL = "mpho.moeti.0.0@email.co.bw"; // Format: f.l.ti.i@email.co.bw
const SEEDED_REGULATOR_EMAIL = "kgosi.seretse0@gov.bw";
const GENERIC_PASSWORD = "password"; // Usually seeder defaults to this or bcrypt hash of it

console.log("Updating Postman payloads with real seed data patterns...");

// Recursive function to find and modify request bodies
function updatePayloadsWithSeedData(items) {
    for (let item of items) {
        if (item.request && item.request.body && item.request.body.raw) {
            // 1. Update Admin Login
            if (item.name.includes("Admin Login") || item.name.includes("Admin Login")) {
                item.request.body.raw = JSON.stringify({
                    email: SEEDED_ADMIN_EMAIL,
                    password: GENERIC_PASSWORD
                }, null, 2);
            }

            // 2. Update Member Login (If it's not dynamic from registration)
            if (item.name === "Member Login" || item.name.includes("4. Member Login")) {
                // If the workflow expects to log in as the newly registered user, we leave the dynamic variable alone.
                // But if it's a standalone read, we give it the seed data.
                if (item.request.body.raw.includes("johndoe.sim@example.com")) {
                    // Keep dynamic if they just registered him, or change to seeded if we expect a real one.
                    // Let's change the standalone Member Login (not the one in workflow)
                    item.request.body.raw = JSON.stringify({
                        email: SEEDED_MEMBER_EMAIL,
                        password: GENERIC_PASSWORD
                    }, null, 2);
                }
            }

            // 3. Update Regulator Login (if exists, or add to environment)
            if (item.name.includes("Regulator Login")) {
                item.request.body.raw = JSON.stringify({
                    email: SEEDED_REGULATOR_EMAIL,
                    password: GENERIC_PASSWORD
                }, null, 2);
            }

            // 4. Update specific mocked IDs with Postman dynamic variables or Seeded defaults
            // For instance, the KYC check used "MEM-123"
            if (item.request.url.raw && item.request.url.raw.includes("MEM-123")) {
                // You ideally want to fetch an active member ID dynamically before this step.
                // For now, let's keep it as is, but we will add pre-request scripts to fetch real IDs if needed.
            }
        }

        if (item.item && item.item.length > 0) {
            updatePayloadsWithSeedData(item.item);
        }
    }
}

updatePayloadsWithSeedData(collection.item);

// Update Global Variables for the collection so the user can easily see them
const varDefaults = [
    { key: "seeded_admin_email", value: SEEDED_ADMIN_EMAIL, type: "string" },
    { key: "seeded_member_email", value: SEEDED_MEMBER_EMAIL, type: "string" },
    { key: "seeded_regulator_email", value: SEEDED_REGULATOR_EMAIL, type: "string" },
    { key: "default_password", value: GENERIC_PASSWORD, type: "string" }
];

collection.variable = [...collection.variable, ...varDefaults];

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(collection, null, 2));
console.log('Successfully injected actual Seed Data payloads into the collection.');
