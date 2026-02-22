# TC-MEM-03 | Member Loans — Application & Management

**Module:** Member Portal — Loans  
**Version:** 1.0  
**Date:** 2026-02-21  
**Prepared By:** QA Team  
**Sign-Off Required From:** Product Owner, Tech Lead, Credit Committee Rep

---

## Scope
Covers loan product browsing, loan application submission, guarantor assignment, loan status tracking, repayment schedule viewing, and statement download.

---

## Test Cases

### TC-MEM-03-001 | Browse Available Loan Products
| Field | Detail |
|---|---|
| **Priority** | P1 — High |
| **Precondition** | Member logged in. Loan products seeded. |
| **Steps** | 1. Navigate to Loans<br>2. View "Apply for a Loan" section |
| **Expected Result** | All available loan products listed with: name, interest rate, min/max amount, min/max term |
| **Pass Criteria** | Products are tenant-scoped (only tenant's products shown). |
| **Status** | ☐ Pass ☐ Fail ☐ Blocked |
| **Notes** | |

---

### TC-MEM-03-002 | Loan Application — Happy Path
| Field | Detail |
|---|---|
| **Priority** | P0 — Critical |
| **Precondition** | Member has KYC verified, active savings account |
| **Steps** | 1. Click "Apply Now" on a loan product<br>2. Enter loan amount within allowed range<br>3. Select term (months)<br>4. Enter purpose<br>5. View repayment schedule preview<br>6. Submit application |
| **Expected Result** | Application submitted. Status = "eligibility_check". Confirmation shown with loan number. |
| **Pass Criteria** | Loan record created in DB. Status visible in My Loans list. |
| **Status** | ☐ Pass ☐ Fail ☐ Blocked |
| **Notes** | |

---

### TC-MEM-03-003 | Loan Amount Validation — Below Minimum
| Field | Detail |
|---|---|
| **Priority** | P1 — High |
| **Precondition** | On loan application form |
| **Steps** | 1. Enter amount below product minimum<br>2. Attempt to proceed |
| **Expected Result** | Inline validation: "Amount must be at least BWP [minimum]" |
| **Pass Criteria** | Form not submitted. Error shown next to field. |
| **Status** | ☐ Pass ☐ Fail ☐ Blocked |
| **Notes** | |

---

### TC-MEM-03-004 | Loan Amount Validation — Exceeds Max Borrowing Limit
| Field | Detail |
|---|---|
| **Priority** | P1 — High |
| **Precondition** | On loan application form |
| **Steps** | 1. Enter amount above tenant's max borrowing limit<br>2. Attempt to proceed |
| **Expected Result** | Validation error referencing max borrowing limit |
| **Pass Criteria** | Amount capped at tenant-configured maximum. |
| **Status** | ☐ Pass ☐ Fail ☐ Blocked |
| **Notes** | |

---

### TC-MEM-03-005 | Repayment Schedule Preview
| Field | Detail |
|---|---|
| **Priority** | P1 — High |
| **Precondition** | On loan application form with valid amount and term entered |
| **Steps** | 1. Enter loan amount: BWP 50,000<br>2. Enter term: 24 months<br>3. View amortization table |
| **Expected Result** | Table shows each month's: payment number, installment, principal portion, interest portion, balance |
| **Pass Criteria** | Final balance = 0.00. Monthly installment matches formula (reducing balance). |
| **Status** | ☐ Pass ☐ Fail ☐ Blocked |
| **Notes** | |

---

### TC-MEM-03-006 | View My Loans List
| Field | Detail |
|---|---|
| **Priority** | P0 — Critical |
| **Precondition** | Member has active and historical loans |
| **Steps** | 1. Navigate to My Loans |
| **Expected Result** | All loans listed with: loan number, product name, amount, status, outstanding balance, next payment date |
| **Pass Criteria** | Status badges correct. Sorting works. Filtering by status works. |
| **Status** | ☐ Pass ☐ Fail ☐ Blocked |
| **Notes** | |

---

### TC-MEM-03-007 | View Individual Loan Detail
| Field | Detail |
|---|---|
| **Priority** | P0 — Critical |
| **Precondition** | Member has at least one active loan |
| **Steps** | 1. Click on a loan in the list<br>2. View detail page |
| **Expected Result** | Shows: Loan number, status, principal, disbursement date, maturity date, total paid, outstanding balance, full repayment schedule |
| **Pass Criteria** | All figures accurate. Repayment schedule matches DB. |
| **Status** | ☐ Pass ☐ Fail ☐ Blocked |
| **Notes** | |

---

### TC-MEM-03-008 | Loan Status — Rejected Application
| Field | Detail |
|---|---|
| **Priority** | P1 — High |
| **Precondition** | Member has a rejected loan application |
| **Steps** | 1. Navigate to rejected loan |
| **Expected Result** | Status badge = "Rejected". Rejection reason displayed. |
| **Pass Criteria** | Rejection reason text visible to member. |
| **Status** | ☐ Pass ☐ Fail ☐ Blocked |
| **Notes** | |

---

### TC-MEM-03-009 | Loan — Guarantor Status View
| Field | Detail |
|---|---|
| **Priority** | P2 — Medium |
| **Precondition** | Member has a loan that required guarantors |
| **Steps** | 1. View active loan detail<br>2. Check guarantors section |
| **Expected Result** | Guarantors listed with: member name, guaranteed amount, status (pending/accepted/rejected) |
| **Pass Criteria** | Guarantor status reflects DB. Pending guarantors indicated. |
| **Status** | ☐ Pass ☐ Fail ☐ Blocked |
| **Notes** | |

---

### TC-MEM-03-010 | Download Loan Statement
| Field | Detail |
|---|---|
| **Priority** | P2 — Medium |
| **Precondition** | Member has active or completed loan |
| **Steps** | 1. On loan detail page<br>2. Click "Download Statement" |
| **Expected Result** | PDF generated and downloaded with full repayment history |
| **Pass Criteria** | PDF opens. Content is correct. Date range is accurate. |
| **Status** | ☐ Pass ☐ Fail ☐ Blocked |
| **Notes** | |

---

## Sign-Off

| Role | Name | Signature | Date |
|---|---|---|---|
| Product Owner | | | |
| Tech Lead | | | |
| Credit Committee Rep | | | |
| QA Lead | | | |
