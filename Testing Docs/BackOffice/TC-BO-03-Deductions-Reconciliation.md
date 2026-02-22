# TC-BO-03 | BackOffice — Deductions & Reconciliation

**Module:** Admin Portal — Deductions & Reconciliation  
**Version:** 1.0  
**Date:** 2026-02-21  
**Prepared By:** QA Team  
**Sign-Off Required From:** Product Owner, Finance Manager, Tech Lead

---

## Scope
Covers monthly deduction batch creation, CSV export, MOF file upload, reconciliation processing, variance management, and journal posting.

---

## Test Cases

### TC-BO-03-001 | View Deduction Requests List
| Field | Detail |
|---|---|
| **Priority** | P0 — Critical |
| **Precondition** | Deduction requests seeded |
| **Steps** | 1. Navigate to Deductions |
| **Expected Result** | All batches listed with: batch number, month/year, total members, total amount, status |
| **Pass Criteria** | Sortable by date. Filter by status works. |
| **Status** | ☐ Pass ☐ Fail ☐ Blocked |
| **Notes** | |

---

### TC-BO-03-002 | Create New Deduction Batch
| Field | Detail |
|---|---|
| **Priority** | P0 — Critical |
| **Precondition** | Admin in Deductions section. Active members with loans/savings exist. |
| **Steps** | 1. Click "New Deduction Request"<br>2. Select month and year<br>3. System auto-generates member deduction list<br>4. Review totals<br>5. Submit |
| **Expected Result** | Deduction request created with status = submitted. All active members included. Individual deduction items generated. |
| **Pass Criteria** | Count matches active member count. Amounts calculated correctly (savings + loan repayment + insurance). |
| **Status** | ☐ Pass ☐ Fail ☐ Blocked |
| **Notes** | |

---

### TC-BO-03-003 | Cannot Create Duplicate Month Batch
| Field | Detail |
|---|---|
| **Priority** | P1 — High |
| **Precondition** | Deduction batch for current month already exists |
| **Steps** | 1. Attempt to create another batch for same month/year |
| **Expected Result** | Error: "A deduction request for this period already exists" |
| **Pass Criteria** | Duplicate batch not created. |
| **Status** | ☐ Pass ☐ Fail ☐ Blocked |
| **Notes** | |

---

### TC-BO-03-004 | View Deduction Batch Detail
| Field | Detail |
|---|---|
| **Priority** | P0 — Critical |
| **Precondition** | Deduction batch exists |
| **Steps** | 1. Click on a deduction batch |
| **Expected Result** | Summary shown: total members, total amount, status. Table shows each member's deduction breakdown (savings, loan, insurance). |
| **Pass Criteria** | All deduction items render. Pagination works for large batches. |
| **Status** | ☐ Pass ☐ Fail ☐ Blocked |
| **Notes** | |

---

### TC-BO-03-005 | Export Deduction Request CSV
| Field | Detail |
|---|---|
| **Priority** | P1 — High |
| **Precondition** | Deduction request in submitted status |
| **Steps** | 1. On batch detail<br>2. Click "Export CSV" |
| **Expected Result** | CSV file downloaded with: member number, employee number, national ID, deduction amount, breakdown |
| **Pass Criteria** | CSV opens correctly. Column headers match expected format. All members included. |
| **Status** | ☐ Pass ☐ Fail ☐ Blocked |
| **Notes** | |

---

### TC-BO-03-006 | Upload MOF Actuals File
| Field | Detail |
|---|---|
| **Priority** | P0 — Critical |
| **Precondition** | Deduction batch in processing status |
| **Steps** | 1. Navigate to Reconciliation<br>2. Click "Upload MOF File"<br>3. Select CSV file from Ministry of Finance<br>4. Submit |
| **Expected Result** | File parsed. Reconciliation batch created. Items matched against deduction items. |
| **Pass Criteria** | Matched count, variance count, and missing count shown in summary. |
| **Status** | ☐ Pass ☐ Fail ☐ Blocked |
| **Notes** | |

---

### TC-BO-03-007 | View Reconciliation Summary
| Field | Detail |
|---|---|
| **Priority** | P0 — Critical |
| **Precondition** | Reconciliation batch processed |
| **Steps** | 1. Open reconciliation batch |
| **Expected Result** | Shows: matched count/amount, variance count/amount, missing in MOF count, total expected vs actual, total variance |
| **Pass Criteria** | Numbers reconcile correctly. Percentages shown. |
| **Status** | ☐ Pass ☐ Fail ☐ Blocked |
| **Notes** | |

---

### TC-BO-03-008 | View Variance Details
| Field | Detail |
|---|---|
| **Priority** | P1 — High |
| **Precondition** | Reconciliation has variance items |
| **Steps** | 1. Filter reconciliation items by "Variance"<br>2. View each variance item |
| **Expected Result** | Each item shows: expected amount, actual amount, variance amount, variance reason (insufficient_funds, member_terminated, etc.) |
| **Pass Criteria** | Variance reasons populated. Requires manual review flag shown. |
| **Status** | ☐ Pass ☐ Fail ☐ Blocked |
| **Notes** | |

---

### TC-BO-03-009 | View Missing in MOF Items
| Field | Detail |
|---|---|
| **Priority** | P1 — High |
| **Precondition** | Reconciliation has missing_in_mof items |
| **Steps** | 1. Filter by "Missing in MOF" |
| **Expected Result** | Members whose deduction was expected but not seen in MOF file listed. |
| **Pass Criteria** | Member details shown. Manual review required flag set. |
| **Status** | ☐ Pass ☐ Fail ☐ Blocked |
| **Notes** | |

---

### TC-BO-03-010 | Post Journal Entries
| Field | Detail |
|---|---|
| **Priority** | P0 — Critical |
| **Precondition** | Reconciliation reviewed and approved by deduction officer |
| **Steps** | 1. Click "Post Journals"<br>2. Confirm |
| **Expected Result** | Journal entries created: Debit Deductions Receivable, Credit appropriate revenue accounts. `journalsPosted = true`. |
| **Pass Criteria** | Journal entries visible in accounting module. Cannot re-post same batch. |
| **Status** | ☐ Pass ☐ Fail ☐ Blocked |
| **Notes** | |

---

### TC-BO-03-011 | Reconciliation — Batch Status Lifecycle
| Field | Detail |
|---|---|
| **Priority** | P1 — High |
| **Steps** | Verify status transitions: pending → in_progress → completed |
| **Expected Result** | Status changes at correct points. Cannot go backward. |
| **Pass Criteria** | Completed batches cannot be re-processed. |
| **Status** | ☐ Pass ☐ Fail ☐ Blocked |
| **Notes** | |

---

## Sign-Off

| Role | Name | Signature | Date |
|---|---|---|---|
| Product Owner | | | |
| Finance Manager | | | |
| Tech Lead | | | |
| QA Lead | | | |
