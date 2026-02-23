# TC-REG-04 | Regulation — Deduction Officer & MOF Interface

**Module:** Regulator Portal — Deductions (Cross-Tenant View)  
**Version:** 1.0  
**Date:** 2026-02-21  
**Prepared By:** QA Team  
**Sign-Off Required From:** DCD Director, Deduction Officer, Tech Lead

---

## Scope
Covers deduction officer's cross-tenant view of all deduction batches, MOF file upload and tracking, cross-SACCOS reconciliation oversight, and escalation management.

---

## Test Cases

### TC-REG-04-001 | Deduction Officer — View All Deduction Batches (Cross-Tenant)
| Field | Detail |
|---|---|
| **Priority** | P0 — Critical |
| **Precondition** | Logged in as deduction_officer. Multiple SACCOS have submitted deduction batches. |
| **Steps** | 1. Navigate to Deductions overview |
| **Expected Result** | All deduction batches from all SACCOS listed: SACCOS name, batch number, month/year, status, total amount |
| **Pass Criteria** | Cross-tenant view. Not restricted to one SACCOS. |
| **Status** | ☐ Pass ☐ Fail ☐ Blocked |
| **Notes** | |

---

### TC-REG-04-002 | Filter Batches by SACCOS
| Field | Detail |
|---|---|
| **Priority** | P1 — High |
| **Steps** | 1. Filter by SACCOS name |
| **Expected Result** | Only batches from selected SACCOS shown |
| **Pass Criteria** | Other SACCOS batches hidden. |
| **Status** | ☐ Pass ☐ Fail ☐ Blocked |
| **Notes** | |

---

### TC-REG-04-003 | Filter Batches by Month/Year
| Field | Detail |
|---|---|
| **Priority** | P1 — High |
| **Steps** | 1. Select month: January 2025 |
| **Expected Result** | Only Jan 2025 batches from all SACCOS shown |
| **Pass Criteria** | Results limited to selected period across all tenants. |
| **Status** | ☐ Pass ☐ Fail ☐ Blocked |
| **Notes** | |

---

### TC-REG-04-004 | View Reconciliation Summary Across All SACCOS
| Field | Detail |
|---|---|
| **Priority** | P0 — Critical |
| **Precondition** | Reconciliation batches completed by multiple SACCOS |
| **Steps** | 1. Navigate to Reconciliation overview |
| **Expected Result** | Per SACCOS: total expected, total actual, total variance, match rate % |
| **Pass Criteria** | Aggregate totals shown across all SACCOS. Exportable. |
| **Status** | ☐ Pass ☐ Fail ☐ Blocked |
| **Notes** | |

---

### TC-REG-04-005 | Drill into SACCOS Reconciliation Detail
| Field | Detail |
|---|---|
| **Priority** | P1 — High |
| **Steps** | 1. Click on a SACCOS reconciliation row<br>2. View item-level detail |
| **Expected Result** | Each member's deduction: matched/variance/missing. Variance reasons shown. |
| **Pass Criteria** | Item count matches SACCOS member count. |
| **Status** | ☐ Pass ☐ Fail ☐ Blocked |
| **Notes** | |

---

### TC-REG-04-006 | Flag SACCOS for Non-Compliance on Submissions
| Field | Detail |
|---|---|
| **Priority** | P1 — High |
| **Precondition** | SACCOS has not submitted deduction batch for current month |
| **Steps** | 1. Note SACCOS missing from submission list<br>2. Issue non-compliance alert |
| **Expected Result** | Alert created. SACCOS admin notified. Alert visible in compliance module. |
| **Pass Criteria** | Alert linked to specific month/year. |
| **Status** | ☐ Pass ☐ Fail ☐ Blocked |
| **Notes** | |

---

### TC-REG-04-007 | MOF Reconciliation Variance — Escalate to Legal
| Field | Detail |
|---|---|
| **Priority** | P2 — Medium |
| **Precondition** | SACCOS with persistent variance > threshold |
| **Steps** | 1. Flag variance batch for legal review<br>2. Intelligence liaison assigned |
| **Expected Result** | Escalation record created. Legal officer notified. Escalation linked to reconciliation batch. |
| **Pass Criteria** | Escalation visible in legal officer's queue. |
| **Status** | ☐ Pass ☐ Fail ☐ Blocked |
| **Notes** | |

---

### TC-REG-04-008 | Deduction Cap Enforcement — Auto-Flag
| Field | Detail |
|---|---|
| **Priority** | P0 — Critical |
| **Precondition** | Member deduction exceeds `regulatorDeductionCap` (40%) |
| **Steps** | 1. View deduction items<br>2. Check isOverLimit flag |
| **Expected Result** | Members with deduction > 40% of salary flagged with isOverLimit = true and limitNotes populated |
| **Pass Criteria** | System auto-flags on batch creation. Not manual. |
| **Status** | ☐ Pass ☐ Fail ☐ Blocked |
| **Notes** | |

---

## Sign-Off

| Role | Name | Signature | Date |
|---|---|---|---|
| DCD Director | | | |
| Deduction Officer | | | |
| Tech Lead | | | |
| QA Lead | | | |
