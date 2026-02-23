const fs = require('fs');
const path = require('path');

const OUTPUT_FILE = path.join(__dirname, 'KIKA_Postman_Collection.json');

// Read existing collection
const collection = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf8'));

// Define the Simulation Journeys sequence
const simulationJourneys = [
    // --- 1. Member Registration (Public) ---
    {
        name: "1. Member Registration",
        request: {
            method: "POST",
            header: [
                { key: "Content-Type", value: "application/json" }
            ],
            url: {
                raw: "{{baseUrl}}/api/registration",
                host: ["{{baseUrl}}"],
                path: ["api", "registration"]
            },
            body: {
                mode: "raw",
                raw: JSON.stringify({
                    nationalId: "SIMULATION-12345",
                    firstName: "John",
                    lastName: "Doe",
                    phoneNumber: "255700000000",
                    email: "johndoe.sim@example.com",
                    employerId: null // or valid entity ID
                }, null, 2)
            }
        },
        event: [
            {
                listen: "test",
                script: {
                    exec: [
                        "let res = pm.response.json();",
                        "pm.collectionVariables.set('application_id', res.applicationId || res.id);",
                        "pm.test('Registration successful', function() { pm.response.to.have.status(200); });"
                    ],
                    type: "text/javascript"
                }
            }
        ]
    },

    // --- 2. Admin Login ---
    {
        name: "2. Admin Login",
        request: {
            method: "POST",
            header: [
                { key: "Content-Type", value: "application/json" }
            ],
            url: {
                raw: "{{baseUrl}}/api/auth/login", // Or your NextAuth / auth route equivalent. Adjust as needed.
                host: ["{{baseUrl}}"],
                path: ["api", "auth", "login"]
            },
            body: {
                mode: "raw",
                raw: JSON.stringify({
                    email: "admin@kika.tld", // Update to real seed admin later
                    password: "passwordxyz"
                }, null, 2)
            }
        },
        event: [
            {
                listen: "test",
                script: {
                    exec: [
                        "let res = pm.response.json();",
                        "pm.collectionVariables.set('admin_token', res.token || res.accessToken);",
                        "pm.test('Admin Login successful', function() { pm.response.to.have.status(200); });"
                    ],
                    type: "text/javascript"
                }
            }
        ]
    },

    // --- 3. Admin Approves Registration ---
    {
        name: "3. Admin Approves Registration",
        request: {
            method: "POST",
            header: [
                { key: "Content-Type", value: "application/json" },
                { key: "Authorization", value: "Bearer {{admin_token}}" }
            ],
            url: {
                raw: "{{baseUrl}}/api/admin/applications/{{application_id}}/approve",
                host: ["{{baseUrl}}"],
                path: ["api", "admin", "applications", "{{application_id}}", "approve"]
            },
            body: {
                mode: "raw",
                raw: "{}"
            }
        },
        event: [
            {
                listen: "test",
                script: {
                    exec: [
                        "let res = pm.response.json();",
                        "pm.collectionVariables.set('member_number', res.memberId || res.memberNumber);",
                        "pm.test('Application Approved', function() { pm.response.to.be.success; });"
                    ],
                    type: "text/javascript"
                }
            }
        ]
    },

    // --- 4. Member Login ---
    {
        name: "4. Member Login",
        request: {
            method: "POST",
            header: [
                { key: "Content-Type", value: "application/json" }
            ],
            url: {
                raw: "{{baseUrl}}/api/auth/login", // Or NextAuth creds endpoint
                host: ["{{baseUrl}}"],
                path: ["api", "auth", "login"]
            },
            body: {
                mode: "raw",
                raw: JSON.stringify({
                    email: "johndoe.sim@example.com",
                    password: "passwordxyz" // Or whatever default is generated on approval
                }, null, 2)
            }
        },
        event: [
            {
                listen: "test",
                script: {
                    exec: [
                        "let res = pm.response.json();",
                        "pm.collectionVariables.set('member_token', res.token || res.accessToken);",
                        "pm.test('Member Login successful', function() { pm.response.to.have.status(200); });"
                    ],
                    type: "text/javascript"
                }
            }
        ]
    },

    // --- 5. Member Applies for Loan ---
    {
        name: "5. Member Requests Loan",
        request: {
            method: "POST",
            header: [
                { key: "Content-Type", value: "application/json" },
                { key: "Authorization", value: "Bearer {{member_token}}" }
            ],
            url: {
                raw: "{{baseUrl}}/api/member/loans",
                host: ["{{baseUrl}}"],
                path: ["api", "member", "loans"]
            },
            body: {
                mode: "raw",
                raw: JSON.stringify({
                    amount: 500000,
                    type: "EMERGENCY_LOAN",
                    durationMonths: 6,
                    purpose: "Medical emergency"
                }, null, 2)
            }
        },
        event: [
            {
                listen: "test",
                script: {
                    exec: [
                        "let res = pm.response.json();",
                        "pm.collectionVariables.set('loan_id', res.loanId || res.id);",
                        "pm.test('Loan requested', function() { pm.response.to.have.status(200); });"
                    ],
                    type: "text/javascript"
                }
            }
        ]
    },

    // --- 6. Admin Approves Loan ---
    {
        name: "6. Admin Approves Loan",
        request: {
            method: "POST",
            header: [
                { key: "Content-Type", value: "application/json" },
                { key: "Authorization", value: "Bearer {{admin_token}}" }
            ],
            url: {
                raw: "{{baseUrl}}/api/admin/loans/{{loan_id}}/approve",
                host: ["{{baseUrl}}"],
                path: ["api", "admin", "loans", "{{loan_id}}", "approve"]
            },
            body: {
                mode: "raw",
                raw: "{}"
            }
        },
        event: [
            {
                listen: "test",
                script: {
                    exec: [
                        "pm.test('Loan approved', function() { pm.response.to.be.success; });"
                    ],
                    type: "text/javascript"
                }
            }
        ]
    },

    // --- 7. Admin Disburses Loan (Triggers Accounts & GL) ---
    {
        name: "7. Admin Disburses Loan (Accounts Trigger)",
        request: {
            method: "POST",
            header: [
                { key: "Content-Type", value: "application/json" },
                { key: "Authorization", value: "Bearer {{admin_token}}" }
            ],
            url: {
                raw: "{{baseUrl}}/api/admin/loans/{{loan_id}}/disburse",
                host: ["{{baseUrl}}"],
                path: ["api", "admin", "loans", "{{loan_id}}", "disburse"]
            },
            body: {
                mode: "raw",
                raw: JSON.stringify({ paymentMethod: "BANK_TRANSFER" }, null, 2)
            }
        },
        event: [
            {
                listen: "test",
                script: {
                    exec: [
                        "pm.test('Loan disbursed and GL updated', function() { pm.response.to.be.success; });"
                    ],
                    type: "text/javascript"
                }
            }
        ]
    },

    // --- 8. Regulator Log Review ---
    {
        name: "8. Regulator Reviews System Trails",
        request: {
            method: "GET",
            header: [
                { key: "Content-Type", value: "application/json" },
                { key: "Authorization", value: "Bearer {{regulator_token}}" } // Assuming regulator logged in or token supplied
            ],
            url: {
                raw: "{{baseUrl}}/api/regulator/directory/export", // Just using an existing regulator route to simulate audit
                host: ["{{baseUrl}}"],
                path: ["api", "regulator", "directory", "export"]
            }
        },
        event: [
            {
                listen: "test",
                script: {
                    exec: [
                        "pm.test('Regulator export successful', function() { pm.response.to.be.success; });"
                    ],
                    type: "text/javascript"
                }
            }
        ]
    }
];

// Find the "Simulation Journeys" placeholder in the initial script
const simIndex = collection.item.findIndex(i => i.name === "Simulation Journeys");

if (simIndex !== -1) {
    // Add a subfolder to group the main E2E flow
    collection.item[simIndex].item.push({
        name: "E2E: Full Lifecycle Simulation",
        description: "Registers member, admin approves, member logs in, applies for loan, admin approves and disburses, regulator reviews.",
        item: simulationJourneys
    });

    // Also create a smaller workflow: "Member Merchandise Order Workflow"
    collection.item[simIndex].item.push({
        name: "E2E: Member Orders Merchandise",
        description: "Member orders item, Admin approves, Vendor fulfills.",
        item: [
            {
                name: "1. Member Orders Item",
                request: {
                    method: "POST",
                    header: [
                        { key: "Content-Type", value: "application/json" },
                        { key: "Authorization", value: "Bearer {{member_token}}" }
                    ],
                    url: { raw: "{{baseUrl}}/api/member/merchandise", host: ["{{baseUrl}}"], path: ["api", "member", "merchandise"] },
                    body: { mode: "raw", raw: JSON.stringify({ itemId: "ITEM-ABC", quantity: 1, paymentMethod: "DEDUCT_FROM_SAVINGS" }, null, 2) }
                },
                event: [{ listen: "test", script: { exec: ["let res = pm.response.json();", "pm.collectionVariables.set('order_id', res.orderId || res.id);"], type: "text/javascript" } }]
            },
            {
                name: "2. Admin Approves Order",
                request: {
                    method: "POST",
                    header: [
                        { key: "Content-Type", value: "application/json" },
                        { key: "Authorization", value: "Bearer {{admin_token}}" }
                    ],
                    url: { raw: "{{baseUrl}}/api/admin/merchandise/orders/{{order_id}}", host: ["{{baseUrl}}"], path: ["api", "admin", "merchandise", "orders", "{{order_id}}"] },
                    body: { mode: "raw", raw: JSON.stringify({ action: "APPROVE" }, null, 2) }
                }
            },
            {
                name: "3. Vendor Fulfills Order",
                request: {
                    method: "POST",
                    header: [
                        { key: "Content-Type", value: "application/json" },
                        { key: "Authorization", value: "Bearer {{vendor_token}}" } // requires vendor auth flow
                    ],
                    url: { raw: "{{baseUrl}}/api/vendor/orders/{{order_id}}/fulfill", host: ["{{baseUrl}}"], path: ["api", "vendor", "orders", "{{order_id}}", "fulfill"] },
                    body: { mode: "raw", raw: "{}" }
                }
            }
        ]
    });

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(collection, null, 2));
    console.log('Successfully injected Postman Simulation Journeys into the collection.');
} else {
    console.log('Error: "Simulation Journeys" root folder not found in JSON.');
}
