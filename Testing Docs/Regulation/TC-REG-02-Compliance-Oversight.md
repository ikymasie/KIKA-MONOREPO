# TC-REG-02 | Regulation — Compliance Oversight

**Module:** Regulator Portal — Compliance  
**Version:** 1.0  
**Date:** 2026-02-21  
**Prepared By:** QA Team  
**Sign-Off Required From:** DCD Director, BoB Supervisor, Tech Lead

---

## Scope
Covers SACCOS compliance monitoring, compliance scoring, compliance alerts, borrowing limit enforcement, deduction cap enforcement, and regulator-level reporting.

---

## Test Cases

### TC-REG-02-001 | View SACCOS Compliance Dashboard
| Field | Detail |
|---|---|
| **Priority** | P0 — Critical |
| **Precondition** | Regulator logged in. Multiple tenants with compliance data. |
| **Steps** | 1. Login as dcd_compliance_officer<br>2. Navigate to Compliance |
| **Expected Result** | All SACCOS listed with: name, compliance score (%), rating (good/fair/poor), last review date |
| **Pass Criteria** | Sortable by score. Low-scoring SACCOS flagged visually. |
| **Status** | ☐ Pass ☐ Fail ☐ Blocked |
| **Notes** | |

---

### TC-REG-02-002 | View SACCOS Compliance Detail
| Field | Detail |
|---|---|
| **Priority** | P0 — Critical |
| **Precondition** | Any SACCOS selected |
| **Steps** | 1. Click on a SACCOS from compliance list |
| **Expected Result** | Detailed compliance view: scoring breakdown, deduction cap utilization, liquidity ratio, borrowing limits vs actuals, reconciliation compliance |
| **Pass Criteria** | Each metric shows current value vs allowed limit. Breaches highlighted. |
| **Status** | ☐ Pass ☐ Fail ☐ Blocked |
| **Notes** | |

---

### TC-REG-02-003 | Compliance Alert — Deduction Cap Exceeded
| Field | Detail |
|---|---|
| **Priority** | P0 — Critical |
| **Precondition** | SACCOS with member deductions exceeding regulatory cap (40%) |
| **Steps** | 1. Navigate to Compliance > Alerts |
| **Expected Result** | Alert shown: "[SACCOS Name] — member [Member Number] deduction exceeds 40% cap" |
| **Pass Criteria** | Alert persists until resolved. Includes member details and amount. |
| **Status** | ☐ Pass ☐ Fail ☐ Blocked |
| **Notes** | |

---

### TC-REG-02-004 | Compliance Alert — Borrowing Limit Breached
| Field | Detail |
|---|---|
| **Priority** | P0 — Critical |
| **Precondition** | SACCOS loan portfolio exceeds maxBorrowingLimit |
| **Steps** | 1. View compliance alerts |
| **Expected Result** | Alert: "[SACCOS Name] — total loan portfolio exceeds configured borrowing limit" |
| **Pass Criteria** | Regulator can view and action alert. |
| **Status** | ☐ Pass ☐ Fail ☐ Blocked |
| **Notes** | |

---

### TC-REG-02-005 | Update Compliance Score
| Field | Detail |
|---|---|
| **Priority** | P1 — High |
| **Precondition** | Compliance review completed for a SACCOS |
| **Steps** | 1. Open SACCOS compliance detail<br>2. Update score and rating<br>3. Add review notes<br>4. Save |
| **Expected Result** | Score and rating updated. Review date stamped. Audit log entry created. |
| **Pass Criteria** | Score change visible immediately on compliance list. |
| **Status** | ☐ Pass ☐ Fail ☐ Blocked |
| **Notes** | |

---

### TC-REG-02-006 | View Deduction Reconciliation Compliance
| Field | Detail |
|---|---|
| **Priority** | P1 — High |
| **Precondition** | Reconciliation batches completed across tenants |
| **Steps** | 1. Navigate to Compliance > Deduction Compliance |
| **Expected Result** | Per SACCOS: total expected vs actual, variance rate, missing member rate, months tracked |
| **Pass Criteria** | SACCOS with >5% variance rate flagged. |
| **Status** | ☐ Pass ☐ Fail ☐ Blocked |
| **Notes** | |

---

### TC-REG-02-007 | Regulator Broadcast — Issue Directive
| Field | Detail |
|---|---|
| **Priority** | P1 — High |
| **Precondition** | Regulator logged in as dcd_director |
| **Steps** | 1. Navigate to Broadcasts<br>2. Create new broadcast/directive<br>3. Target all SACCOS or specific SACCOS<br>4. Publish |
| **Expected Result** | Directive sent. Visible to SACCOS admins in their notification/alerts section. |
| **Pass Criteria** | All targeted SACCOS admins see the directive. |
| **Status** | ☐ Pass ☐ Fail ☐ Blocked |
| **Notes** | |

---

### TC-REG-02-008 | Compliance Reporting — Generate Report
| Field | Detail |
|---|---|
| **Priority** | P1 — High |
| **Steps** | 1. Navigate to Reporting<br>2. Select report type (compliance summary / deduction analysis)<br>3. Select date range<br>4. Generate |
| **Expected Result** | Report generated showing all SACCOS compliance metrics for the period |
| **Pass Criteria** | Report can be exported. Data matches individual SACCOS records. |
| **Status** | ☐ Pass ☐ Fail ☐ Blocked |
| **Notes** | |

---

## Sign-Off

| Role | Name | Signature | Date |
|---|---|---|---|
| DCD Director | | | |
| BoB Prudential Supervisor | | | |
| Tech Lead | | | |
| QA Lead | | | |
