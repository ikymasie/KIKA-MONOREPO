const fs = require('fs');
const path = require('path');

const OUTPUT_FILE = path.join(__dirname, 'KIKA_Postman_Collection.json');
const collection = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf8'));

// Helper to create a request with test script
function createRequest(name, method, urlPath, roleTokenVar, bodyObj, testScriptCode) {
    const req = {
        name: name,
        request: {
            method: method,
            header: [
                { key: "Content-Type", value: "application/json" }
            ],
            url: {
                raw: `{{baseUrl}}/api/${urlPath.join('/')}`,
                host: ["{{baseUrl}}"],
                path: ["api", ...urlPath]
            }
        }
    };

    if (roleTokenVar) {
        req.request.header.push({ key: "Authorization", value: `Bearer {{${roleTokenVar}}}` });
    }

    if (bodyObj && ['POST', 'PUT', 'PATCH'].includes(method)) {
        req.request.body = {
            mode: "raw",
            raw: JSON.stringify(bodyObj, null, 2)
        };
    }

    const item = { ...req };

    if (testScriptCode) {
        item.event = [
            {
                listen: "test",
                script: {
                    exec: Array.isArray(testScriptCode) ? testScriptCode : [testScriptCode],
                    type: "text/javascript"
                }
            }
        ];
    }

    // Add pre-request script for dynamic data if it's registration
    if (name.includes("Registration")) {
        item.event = item.event || [];
        item.event.push({
            listen: "prerequest",
            script: {
                exec: [
                    "pm.collectionVariables.set('dynamic_email', 'sim_user_' + Date.now() + '@kika.tld');",
                    "pm.collectionVariables.set('dynamic_phone', '2557' + Math.floor(10000000 + Math.random() * 90000000));",
                    "pm.collectionVariables.set('dynamic_nid', 'NID-' + Date.now());"
                ],
                type: "text/javascript"
            }
        });

        // Update body to use variables
        item.request.body.raw = item.request.body.raw
            .replace('"dynamic_email_placeholder"', 'pm.collectionVariables.get("dynamic_email")')
            .replace('"dynamic_phone_placeholder"', 'pm.collectionVariables.get("dynamic_phone")')
            .replace('"dynamic_nid_placeholder"', 'pm.collectionVariables.get("dynamic_nid")');

        // We actually need to do this differently in Postman. Postman replaces {{var}} in body.
        req.request.body.raw = JSON.stringify({
            nationalId: "{{dynamic_nid}}",
            firstName: "Simulated",
            lastName: "User",
            phoneNumber: "{{dynamic_phone}}",
            email: "{{dynamic_email}}",
            employerId: null
        }, null, 2);
    }

    return item;
}

const advancedJourneys = [
    {
        name: "Workflow 1: Governance & AGM Cycle",
        description: "Admin creates a Board Meeting, configures AGM resolutions, and Member votes on them.",
        item: [
            createRequest("1. Admin Creates Board Meeting", "POST", ["admin", "governance", "board-meetings"], "admin_token", {
                title: "Q3 Strategy Meeting",
                date: "2026-10-15T10:00:00Z",
                agenda: "Discuss Q4 loan interest rate changes."
            }, [
                "let res = pm.response.json();",
                "pm.collectionVariables.set('meeting_id', res.id);",
                "pm.test('Meeting Created', function() { pm.response.to.have.status(200); });"
            ]),
            createRequest("2. Admin Schedules AGM & Resolutions", "POST", ["admin", "governance", "agm"], "admin_token", {
                date: "2026-12-01T09:00:00Z",
                title: "Annual General Meeting 2026",
                resolutions: [{ text: "Approve 10% dividend payout." }]
            }, [
                "let res = pm.response.json();",
                "pm.collectionVariables.set('agm_id', res.id);",
                // Assuming it returns resolution IDs, grab the first one
                "if(res.resolutions && res.resolutions.length > 0) pm.collectionVariables.set('resolution_id', res.resolutions[0].id);",
                "pm.test('AGM Created', function() { pm.response.to.have.status(200); });"
            ])
            // Need a member voting endpoint, skipping if it's strictly server action right now
        ]
    },
    {
        name: "Workflow 2: Full Deduction & Reconciliation Cycle",
        description: "Admin generates deductions for employers, submits them, and reconciles payments.",
        item: [
            createRequest("1. Admin Generates Monthly Deductions", "POST", ["admin", "deductions", "generate"], "admin_token", {
                month: 10,
                year: 2026,
                employerId: "EMP-1" // Replace manually if testing
            }, [
                "let res = pm.response.json();",
                "pm.collectionVariables.set('deduction_batch_id', res.batchId || res.id);",
                "pm.test('Deductions Generated', function() { pm.response.to.have.status(200); });"
            ]),
            createRequest("2. Admin Submits Deductions Batch", "POST", ["admin", "deductions", "{{deduction_batch_id}}", "submit"], "admin_token", {}, [
                "pm.test('Deductions Submitted', function() { pm.response.to.have.status(200); });"
            ]),
            createRequest("3. Admin Reconciles Payments", "POST", ["admin", "deductions", "reconcile"], "admin_token", {
                batchId: "{{deduction_batch_id}}",
                amountReceived: 5000000,
                paymentReference: "TRX-998877"
            }, [
                "pm.test('Deductions Reconciled', function() { pm.response.to.have.status(200); });"
            ])
        ]
    },
    {
        name: "Workflow 3: Insurance Claim Processing",
        description: "Admin assists member in filing a claim, then approves/rejects it.",
        item: [
            createRequest("1. Admin Assists Member with Claim", "POST", ["admin", "member-service", "claims", "assist"], "admin_token", {
                memberId: "MEM-123", // Replace during manual run
                policyType: "LIFE_INSURANCE",
                incidentDate: "2026-09-01",
                description: "Medical emergency cover required."
            }, [
                "let res = pm.response.json();",
                "pm.collectionVariables.set('claim_id', res.claimId || res.id);",
                "pm.test('Claim Filed', function() { pm.response.to.have.status(200); });"
            ]),
            createRequest("2. Admin Approves Claim", "POST", ["admin", "insurance", "claims", "{{claim_id}}", "action"], "admin_token", {
                action: "APPROVE",
                payoutAmount: 100000
            }, [
                "pm.test('Claim Approved', function() { pm.response.to.have.status(200); });"
            ]),
            createRequest("3. Admin Triggers Insurance Payment (Accounting)", "POST", ["admin", "accounting", "payments", "insurance"], "admin_token", {
                claimId: "{{claim_id}}",
                amount: 100000,
                paymentMethod: "BANK_TRANSFER"
            }, [
                "pm.test('Payment Disbursed', function() { pm.response.to.have.status(200); });"
            ])
        ]
    },
    {
        name: "Workflow 4: Enhanced Loan Lifecycle (with KYC & Guarantors)",
        description: "Simulates full loan processing: KYC check -> Apply -> Guarantors -> Committee Vote -> Disburse.",
        item: [
            createRequest("1. Admin Performs KYC Check", "POST", ["admin", "members", "MEM-123", "kyc"], "admin_token", { // Member ID mocked
                status: "VERIFIED",
                notes: "NIDA ID matches successfully."
            }, [
                "pm.test('KYC Verified', function() { pm.response.to.have.status(200); });"
            ]),
            createRequest("2. Member Applies for Loan", "POST", ["member", "loans"], "member_token", {
                amount: 1500000,
                type: "DEVELOPMENT_LOAN",
                durationMonths: 12
            }, [
                "let res = pm.response.json();",
                "pm.collectionVariables.set('dev_loan_id', res.loanId || res.id);",
                "pm.test('Loan Applied', function() { pm.response.to.have.status(200); });"
            ]),
            createRequest("3. Admin Assigns Loan Officer", "POST", ["admin", "loans", "{{dev_loan_id}}", "assign-officer"], "admin_token", {
                officerId: "OFFICER-1"
            }, [
                "pm.test('Officer Assigned', function() { pm.response.to.have.status(200); });"
            ]),
            createRequest("4. Loan Officer Recommends Loan", "POST", ["admin", "loans", "{{dev_loan_id}}", "officer-recommend"], "admin_token", {
                recommendation: "APPROVE",
                notes: "Debt to income ratio is acceptable."
            }, [
                "pm.test('Officer Recommended', function() { pm.response.to.have.status(200); });"
            ]),
            createRequest("5. Credit Committee Votes", "POST", ["admin", "loans", "{{dev_loan_id}}", "committee-vote"], "admin_token", {
                vote: "APPROVE",
                memberId: "COMMITTEE-MEMBER-1"
            }, [
                "pm.test('Committee Voted', function() { pm.response.to.have.status(200); });"
            ]),
            createRequest("6. Admin Fully Approves Loan", "POST", ["admin", "loans", "{{dev_loan_id}}", "approve"], "admin_token", {}, [
                "pm.test('Loan Approved', function() { pm.response.to.have.status(200); });"
            ]),
            createRequest("7. Admin Disburses Loan", "POST", ["admin", "loans", "{{dev_loan_id}}", "disburse"], "admin_token", {
                paymentMethod: "MOBILE_MONEY"
            }, [
                "pm.test('Loan Disbursed', function() { pm.response.to.have.status(200); });"
            ])
        ]
    },
    {
        name: "Workflow 5: Regulator & Compliance Checks",
        description: "Regulator accesses system to run compliance checks and view system health.",
        item: [
            createRequest("1. Regulator Checks Liquidity Ratio", "GET", ["regulator", "liquidity", "ratio"], "regulator_token", null, [
                "pm.test('Liquidity Ratio fetched', function() { pm.response.to.have.status(200); });"
            ]),
            createRequest("2. Regulator Configures Alerts", "POST", ["regulator", "alerts"], "regulator_token", {
                type: "LARGE_TRANSACTION",
                threshold: 10000000
            }, [
                "pm.test('Alert configured', function() { pm.response.to.have.status(200); });"
            ]),
            createRequest("3. Regulator Views Audit Logs", "GET", ["regulator", "audit-logs"], "regulator_token", null, [
                "pm.test('Audit Logs fetched', function() { pm.response.to.have.status(200); });"
            ]),
            createRequest("4. Regulator Runs Compliance Check", "POST", ["regulator", "compliance", "check"], "regulator_token", {
                module: "ALL"
            }, [
                "pm.test('Compliance check initiated', function() { pm.response.to.have.status(200); });"
            ])
        ]
    }
];

// Append these to the "Simulation Journeys" folder
const simIndex = collection.item.findIndex(i => i.name === "Simulation Journeys");

if (simIndex !== -1) {
    // We add these new advanced workflows to the Simulation Journeys array
    for (const journey of advancedJourneys) {
        collection.item[simIndex].item.push(journey);
    }

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(collection, null, 2));
    console.log(`Successfully injected ${advancedJourneys.length} advanced Simulation Workflows into the collection.`);
} else {
    console.log('Error: "Simulation Journeys" folder not found.');
}
