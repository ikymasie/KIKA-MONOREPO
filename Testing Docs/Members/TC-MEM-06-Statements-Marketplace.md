# TC-MEM-06 | Member Statements & Marketplace

**Module:** Member Portal — Statements & Marketplace  
**Version:** 1.0  
**Date:** 2026-02-21  
**Prepared By:** QA Team  
**Sign-Off Required From:** Product Owner, Tech Lead

---

## Scope
Covers account statements generation, transaction history, and marketplace product browsing/ordering.

---

## Test Cases

### TC-MEM-06-001 | Generate Account Statement
| Field | Detail |
|---|---|
| **Priority** | P1 — High |
| **Precondition** | Member has transaction history |
| **Steps** | 1. Navigate to Statements<br>2. Select account type (savings/loan)<br>3. Select date range<br>4. Click "Generate" |
| **Expected Result** | PDF statement generated with header (member info, dates), all transactions in range, and closing balance |
| **Pass Criteria** | PDF downloads. Figures match transaction history. |
| **Status** | ☐ Pass ☐ Fail ☐ Blocked |
| **Notes** | |

---

### TC-MEM-06-002 | Statement — Future Date Range Rejected
| Field | Detail |
|---|---|
| **Priority** | P2 — Medium |
| **Precondition** | On statement generation page |
| **Steps** | 1. Set end date to a future date<br>2. Click Generate |
| **Expected Result** | Validation error: "End date cannot be in the future" |
| **Pass Criteria** | No statement generated. Error shown. |
| **Status** | ☐ Pass ☐ Fail ☐ Blocked |
| **Notes** | |

---

### TC-MEM-06-003 | Statement — No Transactions in Range
| Field | Detail |
|---|---|
| **Priority** | P2 — Medium |
| **Precondition** | Date range has no transactions |
| **Steps** | 1. Set date range with no activity<br>2. Generate |
| **Expected Result** | Statement generated showing 0 transactions note. No error. |
| **Pass Criteria** | Empty statement is valid output. |
| **Status** | ☐ Pass ☐ Fail ☐ Blocked |
| **Notes** | |

---

### TC-MEM-06-004 | Browse Marketplace Products
| Field | Detail |
|---|---|
| **Priority** | P1 — High |
| **Precondition** | Marketplace merchandise products seeded |
| **Steps** | 1. Navigate to Marketplace |
| **Expected Result** | Products listed with: name, price, description, category, available stock |
| **Pass Criteria** | Only active products shown. Images load. |
| **Status** | ☐ Pass ☐ Fail ☐ Blocked |
| **Notes** | |

---

### TC-MEM-06-005 | Place Marketplace Order
| Field | Detail |
|---|---|
| **Priority** | P1 — High |
| **Precondition** | Member browsing marketplace with available products |
| **Steps** | 1. Select a product<br>2. Choose quantity<br>3. Confirm order |
| **Expected Result** | Order created. Order number shown. Status = "pending". Payment deducted or scheduled. |
| **Pass Criteria** | Order record created in DB. Member notified. |
| **Status** | ☐ Pass ☐ Fail ☐ Blocked |
| **Notes** | |

---

### TC-MEM-06-006 | View Order History
| Field | Detail |
|---|---|
| **Priority** | P2 — Medium |
| **Precondition** | Member has placed orders |
| **Steps** | 1. View order history in Marketplace |
| **Expected Result** | All past orders listed with: order number, date, items, total, status |
| **Pass Criteria** | Orders from DB displayed. Status badges accurate. |
| **Status** | ☐ Pass ☐ Fail ☐ Blocked |
| **Notes** | |

---

## Sign-Off

| Role | Name | Signature | Date |
|---|---|---|---|
| Product Owner | | | |
| Tech Lead | | | |
| QA Lead | | | |
