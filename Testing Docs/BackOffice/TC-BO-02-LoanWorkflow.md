# TC-BO-02 | BackOffice — Loan Workflow (Application to Disbursement)

**Module:** Admin Portal — Loans  
**Version:** 1.0  
**Date:** 2026-02-21  
**Prepared By:** QA Team  
**Sign-Off Required From:** Product Owner, Credit Committee Rep, Tech Lead

---

## Scope
Covers the full loan lifecycle in the backoffice: eligibility check, loan officer review, committee approval, guarantor management, and disbursement.

---

## Test Cases

### TC-BO-02-001 | View Loan Applications Queue
| Field | Detail |
|---|---|
| **Priority** | P0 — Critical |
| **Precondition** | Loan applications exist in DB |
| **Steps** | 1. Navigate to Loans section |
| **Expected Result** | All loans listed with: loan number, member name, amount, product, status, application date |
| **Pass Criteria** | Filterable by status. Sortable by date/amount. |
| **Status** | ☐ Pass ☐ Fail ☐ Blocked |
| **Notes** | |

---

### TC-BO-02-002 | Filter Loans by Status
| Field | Detail |
|---|---|
| **Priority** | P1 — High |
| **Steps** | 1. Filter by each status: eligibility_check, guarantor_staking, technical_appraisal, committee_approval, disbursement, completed |
| **Expected Result** | Only loans in selected workflow stage displayed |
| **Pass Criteria** | Counts match DB per stage. |
| **Status** | ☐ Pass ☐ Fail ☐ Blocked |
| **Notes** | |

---

### TC-BO-02-003 | Loan Officer — Eligibility Review
| Field | Detail |
|---|---|
| **Priority** | P0 — Critical |
| **Precondition** | Loan in eligibility_check stage. Logged in as loan_officer. |
| **Steps** | 1. Open loan<br>2. Review member eligibility (salary, existing loans, deduction percentage)<br>3. Add notes<br>4. Click "Pass Eligibility" |
| **Expected Result** | Workflow stage advances to guarantor_staking. Loan officer notes saved. Review date stamped. |
| **Pass Criteria** | Stage change reflected immediately. Audit log entry created. |
| **Status** | ☐ Pass ☐ Fail ☐ Blocked |
| **Notes** | |

---

### TC-BO-02-004 | Loan Officer — Fail Eligibility
| Field | Detail |
|---|---|
| **Priority** | P1 — High |
| **Precondition** | Loan in eligibility_check stage |
| **Steps** | 1. Add failure reason<br>2. Click "Fail Eligibility" |
| **Expected Result** | Loan status = rejected. Rejection reason stored. Member notified. |
| **Pass Criteria** | Loan removed from active queue. Member can see rejection reason. |
| **Status** | ☐ Pass ☐ Fail ☐ Blocked |
| **Notes** | |

---

### TC-BO-02-005 | Guarantor Management
| Field | Detail |
|---|---|
| **Priority** | P1 — High |
| **Precondition** | Loan in guarantor_staking stage |
| **Steps** | 1. View guarantors section<br>2. Verify guarantors have accepted<br>3. Advance to technical appraisal |
| **Expected Result** | All required guarantors shown with statuses. Advance only allowed if minimum guarantors accepted. |
| **Pass Criteria** | Cannot advance without required guarantor acceptance count. |
| **Status** | ☐ Pass ☐ Fail ☐ Blocked |
| **Notes** | |

---

### TC-BO-02-006 | Committee Approval — Vote to Approve
| Field | Detail |
|---|---|
| **Priority** | P0 — Critical |
| **Precondition** | Loan in committee_approval stage. Logged in as credit_committee member. |
| **Steps** | 1. Open loan for review<br>2. Cast "Approve" vote<br>3. Multiple committee members vote |
| **Expected Result** | Vote recorded. When quorum reached with positive majority, loan advances to disbursement. Committee approval date stamped. |
| **Pass Criteria** | Vote counts shown. Stage advances when quorum met. |
| **Status** | ☐ Pass ☐ Fail ☐ Blocked |
| **Notes** | |

---

### TC-BO-02-007 | Committee Approval — Vote to Reject
| Field | Detail |
|---|---|
| **Priority** | P1 — High |
| **Precondition** | Loan in committee_approval stage |
| **Steps** | 1. Committee votes to reject<br>2. Rejection reason added |
| **Expected Result** | Loan status = rejected. Member notified of rejection. |
| **Pass Criteria** | Vote tallied correctly. Rejection reason visible to member. |
| **Status** | ☐ Pass ☐ Fail ☐ Blocked |
| **Notes** | |

---

### TC-BO-02-008 | Loan Disbursement
| Field | Detail |
|---|---|
| **Priority** | P0 — Critical |
| **Precondition** | Loan in disbursement stage. Member has primary bank account. |
| **Steps** | 1. Review disbursement summary<br>2. Enter disbursement date<br>3. Confirm disbursement |
| **Expected Result** | Loan status = disbursed → active. Disbursement date stamped. Transaction record created. Journal entries created (debit: Loan Book, credit: Cash). |
| **Pass Criteria** | Member account shows new active loan. Transaction visible in ledger. |
| **Status** | ☐ Pass ☐ Fail ☐ Blocked |
| **Notes** | |

---

### TC-BO-02-009 | Loan Detail — Full Repayment History
| Field | Detail |
|---|---|
| **Priority** | P1 — High |
| **Precondition** | Active loan with repayment history |
| **Steps** | 1. Open any active loan<br>2. View repayment schedule tab |
| **Expected Result** | Each payment shown: date, amount paid, principal, interest, balance remaining |
| **Pass Criteria** | Amounts accurate. Paid installments marked. Outstanding balance correct. |
| **Status** | ☐ Pass ☐ Fail ☐ Blocked |
| **Notes** | |

---

### TC-BO-02-010 | Mark Loan as Defaulted
| Field | Detail |
|---|---|
| **Priority** | P1 — High |
| **Precondition** | Loan overdue by defined threshold |
| **Steps** | 1. Open overdue loan<br>2. Click "Mark as Defaulted"<br>3. Add reason |
| **Expected Result** | Loan status = defaulted. Default date recorded. Member flagged. |
| **Pass Criteria** | Defaulted status cannot be reversed without admin escalation. |
| **Status** | ☐ Pass ☐ Fail ☐ Blocked |
| **Notes** | |

---

## Sign-Off

| Role | Name | Signature | Date |
|---|---|---|---|
| Product Owner | | | |
| Credit Committee Rep | | | |
| Tech Lead | | | |
| QA Lead | | | |
