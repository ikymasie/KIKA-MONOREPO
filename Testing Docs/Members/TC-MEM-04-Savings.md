# TC-MEM-04 | Member Savings

**Module:** Member Portal — Savings  
**Version:** 1.0  
**Date:** 2026-02-21  
**Prepared By:** QA Team  
**Sign-Off Required From:** Product Owner, Tech Lead

---

## Scope
Covers savings account overview, balance tracking, contribution history, transaction history, and statement downloads.

---

## Test Cases

### TC-MEM-04-001 | View Savings Accounts Overview
| Field | Detail |
|---|---|
| **Priority** | P0 — Critical |
| **Precondition** | Member has one or more savings accounts |
| **Steps** | 1. Navigate to Savings |
| **Expected Result** | All savings accounts listed with: product name, current balance, monthly contribution, interest rate |
| **Pass Criteria** | Balances match DB. Interest rate displayed correctly. |
| **Status** | ☐ Pass ☐ Fail ☐ Blocked |
| **Notes** | |

---

### TC-MEM-04-002 | View Savings Account Detail
| Field | Detail |
|---|---|
| **Priority** | P0 — Critical |
| **Precondition** | Member clicks on a savings account |
| **Steps** | 1. Click on specific savings account<br>2. View detail page |
| **Expected Result** | Shows: balance, monthly contribution, total deposits, interest earned, account opening date, transaction history |
| **Pass Criteria** | All figures match DB. Transaction history is paginated. |
| **Status** | ☐ Pass ☐ Fail ☐ Blocked |
| **Notes** | |

---

### TC-MEM-04-003 | Transaction History — Filter by Date Range
| Field | Detail |
|---|---|
| **Priority** | P1 — High |
| **Precondition** | Savings account with 6+ months of transaction history |
| **Steps** | 1. On savings transaction history<br>2. Set date range to last 3 months<br>3. Apply filter |
| **Expected Result** | Only transactions within the selected date range shown |
| **Pass Criteria** | No transactions outside date range shown. |
| **Status** | ☐ Pass ☐ Fail ☐ Blocked |
| **Notes** | |

---

### TC-MEM-04-004 | Transaction History — Filter by Type
| Field | Detail |
|---|---|
| **Priority** | P2 — Medium |
| **Precondition** | Savings account with deposits and deductions |
| **Steps** | 1. Select filter type "Deposits Only"<br>2. Apply |
| **Expected Result** | Only deposit transactions displayed |
| **Pass Criteria** | Transaction type filter works correctly for all types. |
| **Status** | ☐ Pass ☐ Fail ☐ Blocked |
| **Notes** | |

---

### TC-MEM-04-005 | Share Capital Balance Display
| Field | Detail |
|---|---|
| **Priority** | P1 — High |
| **Precondition** | Member has share capital > 0 |
| **Steps** | 1. Navigate to Savings<br>2. View share capital widget |
| **Expected Result** | Share capital amount shown separately from regular savings |
| **Pass Criteria** | Share capital value matches member record. |
| **Status** | ☐ Pass ☐ Fail ☐ Blocked |
| **Notes** | |

---

### TC-MEM-04-006 | Download Savings Statement
| Field | Detail |
|---|---|
| **Priority** | P2 — Medium |
| **Precondition** | Member has savings transaction history |
| **Steps** | 1. Navigate to Statements<br>2. Select savings account<br>3. Select date range<br>4. Click "Generate Statement" |
| **Expected Result** | PDF statement downloaded with: member name, account details, transaction list, opening/closing balance |
| **Pass Criteria** | PDF is readable. Figures match transaction history in UI. |
| **Status** | ☐ Pass ☐ Fail ☐ Blocked |
| **Notes** | |

---

### TC-MEM-04-007 | Multiple Savings Products
| Field | Detail |
|---|---|
| **Priority** | P1 — High |
| **Precondition** | Member enrolled in 3 savings products |
| **Steps** | 1. Navigate to Savings |
| **Expected Result** | All 3 savings accounts shown separately with distinct product names and balances |
| **Pass Criteria** | Each account is independent. Balances do not mix. |
| **Status** | ☐ Pass ☐ Fail ☐ Blocked |
| **Notes** | |

---

## Sign-Off

| Role | Name | Signature | Date |
|---|---|---|---|
| Product Owner | | | |
| Tech Lead | | | |
| QA Lead | | | |
