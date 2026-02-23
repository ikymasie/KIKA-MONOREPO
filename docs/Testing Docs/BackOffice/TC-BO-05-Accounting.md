# TC-BO-05 | BackOffice — Accounting & Journal Entries

**Module:** Admin Portal — Accounting  
**Version:** 1.0  
**Date:** 2026-02-21  
**Prepared By:** QA Team  
**Sign-Off Required From:** Product Owner, Chief Accountant, Tech Lead

---

## Scope
Covers chart of accounts management, journal entries, transaction ledger, trial balance, and financial reporting.

---

## Test Cases

### TC-BO-05-001 | View Chart of Accounts
| Field | Detail |
|---|---|
| **Priority** | P0 — Critical |
| **Precondition** | Chart of accounts seeded |
| **Steps** | 1. Navigate to Accounting > Chart of Accounts |
| **Expected Result** | All accounts listed: code, name, type (asset/liability/equity/revenue), balance, status |
| **Pass Criteria** | Grouped by account type. Balances match sum of transactions. |
| **Status** | ☐ Pass ☐ Fail ☐ Blocked |
| **Notes** | |

---

### TC-BO-05-002 | View Account Detail & Ledger
| Field | Detail |
|---|---|
| **Priority** | P1 — High |
| **Precondition** | Account with journal entries |
| **Steps** | 1. Click on account (e.g. Cash and Bank — code 1001) |
| **Expected Result** | Running ledger shown: date, transaction ref, debit, credit, running balance |
| **Pass Criteria** | Ledger is balanced. Running balance is accurate. Sortable by date. |
| **Status** | ☐ Pass ☐ Fail ☐ Blocked |
| **Notes** | |

---

### TC-BO-05-003 | View All Transactions
| Field | Detail |
|---|---|
| **Priority** | P0 — Critical |
| **Precondition** | Transactions seeded |
| **Steps** | 1. Navigate to Accounting > Transactions |
| **Expected Result** | All transactions: number, type, amount, date, member, status |
| **Pass Criteria** | Filterable by type (loan_disbursement, deposit, deduction, etc). Searchable by reference. |
| **Status** | ☐ Pass ☐ Fail ☐ Blocked |
| **Notes** | |

---

### TC-BO-05-004 | Transaction Detail — Journal Entries
| Field | Detail |
|---|---|
| **Priority** | P1 — High |
| **Precondition** | Any completed transaction |
| **Steps** | 1. Click on a transaction |
| **Expected Result** | Both journal entries shown: debit entry and credit entry with account names, amounts |
| **Pass Criteria** | Debits = Credits (balanced). Account codes correct per transaction type. |
| **Status** | ☐ Pass ☐ Fail ☐ Blocked |
| **Notes** | |

---

### TC-BO-05-005 | Filter Transactions by Type
| Field | Detail |
|---|---|
| **Priority** | P1 — High |
| **Steps** | 1. Filter by type: loan_disbursement<br>2. Filter by: deposit<br>3. Filter by: deduction<br>4. Filter by: insurance_premium |
| **Expected Result** | Only selected type shown each time |
| **Pass Criteria** | All type filters work correctly. Count changes on filter. |
| **Status** | ☐ Pass ☐ Fail ☐ Blocked |
| **Notes** | |

---

### TC-BO-05-006 | Filter Transactions by Date Range
| Field | Detail |
|---|---|
| **Priority** | P1 — High |
| **Steps** | 1. Set from date: 2024-01-01, to date: 2024-03-31<br>2. Apply |
| **Expected Result** | Only transactions in Q1 2024 shown |
| **Pass Criteria** | Date filter applies correctly to transactionDate field. |
| **Status** | ☐ Pass ☐ Fail ☐ Blocked |
| **Notes** | |

---

### TC-BO-05-007 | Trial Balance Report
| Field | Detail |
|---|---|
| **Priority** | P1 — High |
| **Precondition** | Multiple transactions across all account types |
| **Steps** | 1. Navigate to Accounting > Trial Balance<br>2. Select reporting date |
| **Expected Result** | All accounts shown: name, total debits, total credits. Total debits = Total credits (balanced). |
| **Pass Criteria** | Sum of all debit balances = sum of all credit balances. |
| **Status** | ☐ Pass ☐ Fail ☐ Blocked |
| **Notes** | |

---

### TC-BO-05-008 | Analytics — Loan Portfolio Summary
| Field | Detail |
|---|---|
| **Priority** | P1 — High |
| **Precondition** | Loans with various statuses |
| **Steps** | 1. Navigate to Analytics |
| **Expected Result** | Charts show: total portfolio value, active loans, paid off, defaulted. Monthly trend chart. |
| **Pass Criteria** | Figures match DB aggregates. Charts render without blank state. |
| **Status** | ☐ Pass ☐ Fail ☐ Blocked |
| **Notes** | |

---

## Sign-Off

| Role | Name | Signature | Date |
|---|---|---|---|
| Product Owner | | | |
| Chief Accountant | | | |
| Tech Lead | | | |
| QA Lead | | | |
