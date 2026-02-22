# TC-BO-04 | BackOffice — Insurance Administration

**Module:** Admin Portal — Insurance  
**Version:** 1.0  
**Date:** 2026-02-21  
**Prepared By:** QA Team  
**Sign-Off Required From:** Product Owner, Insurance Administrator, Tech Lead

---

## Scope
Covers insurance product management, policy overview, claim processing workflow, and ex-gratia payments.

---

## Test Cases

### TC-BO-04-001 | View All Insurance Policies
| Field | Detail |
|---|---|
| **Priority** | P0 — Critical |
| **Precondition** | Insurance policies seeded |
| **Steps** | 1. Navigate to Insurance > Policies |
| **Expected Result** | All policies listed: policy number, member, product, coverage, premium, status, start date |
| **Pass Criteria** | Filter by status works. Total count correct. |
| **Status** | ☐ Pass ☐ Fail ☐ Blocked |
| **Notes** | |

---

### TC-BO-04-002 | View Policy Detail
| Field | Detail |
|---|---|
| **Priority** | P1 — High |
| **Precondition** | Any policy selected |
| **Steps** | 1. Click on a policy |
| **Expected Result** | Full detail: member info, product, coverage amount, monthly premium, start date, waiting period end, months paid, claims history |
| **Pass Criteria** | Claims history loads. All values accurate. |
| **Status** | ☐ Pass ☐ Fail ☐ Blocked |
| **Notes** | |

---

### TC-BO-04-003 | View Claims Queue
| Field | Detail |
|---|---|
| **Priority** | P0 — Critical |
| **Precondition** | Claims seeded |
| **Steps** | 1. Navigate to Insurance > Claims |
| **Expected Result** | All claims listed: claim number, member, claim type, amount, incident date, status |
| **Pass Criteria** | Filterable by status. Sortable by date. |
| **Status** | ☐ Pass ☐ Fail ☐ Blocked |
| **Notes** | |

---

### TC-BO-04-004 | Claim — Verify and Submit for Adjudication
| Field | Detail |
|---|---|
| **Priority** | P0 — Critical |
| **Precondition** | Claim in "submitted" status |
| **Steps** | 1. Open claim<br>2. Review supporting documents<br>3. Mark verified fields<br>4. Click "Send for Adjudication" |
| **Expected Result** | Claim status = in_review. Verified by and verified at stamped. |
| **Pass Criteria** | Status updates instantly. Adjudicator notified. |
| **Status** | ☐ Pass ☐ Fail ☐ Blocked |
| **Notes** | |

---

### TC-BO-04-005 | Claim — Adjudication: Approve with Amount
| Field | Detail |
|---|---|
| **Priority** | P0 — Critical |
| **Precondition** | Claim in "in_review" status |
| **Steps** | 1. Open claim<br>2. Enter approved payout amount<br>3. Add adjudication notes<br>4. Click "Approve Claim" |
| **Expected Result** | Claim status = approved. Approved amount recorded. Adjudicated by/at stamped. |
| **Pass Criteria** | Approved amount ≤ max claim amount. Status updates correctly. |
| **Status** | ☐ Pass ☐ Fail ☐ Blocked |
| **Notes** | |

---

### TC-BO-04-006 | Claim — Adjudication: Reject
| Field | Detail |
|---|---|
| **Priority** | P1 — High |
| **Precondition** | Claim in "in_review" status |
| **Steps** | 1. Enter rejection reason<br>2. Click "Reject Claim" |
| **Expected Result** | Claim status = rejected. Rejection reason stored. Member notified. |
| **Pass Criteria** | Rejected claim cannot be re-opened without escalation. |
| **Status** | ☐ Pass ☐ Fail ☐ Blocked |
| **Notes** | |

---

### TC-BO-04-007 | Claim — Mark as Paid
| Field | Detail |
|---|---|
| **Priority** | P0 — Critical |
| **Precondition** | Claim in "approved" status |
| **Steps** | 1. Click "Mark as Paid"<br>2. Confirm payment date and amount |
| **Expected Result** | Claim status = paid. Disbursed by/at stamped. Payment transaction created. |
| **Pass Criteria** | Transaction visible in accounting. Member notified. |
| **Status** | ☐ Pass ☐ Fail ☐ Blocked |
| **Notes** | |

---

### TC-BO-04-008 | Claim Submitted During Waiting Period — Rejected at Intake
| Field | Detail |
|---|---|
| **Priority** | P1 — High |
| **Precondition** | Member's policy is in waiting period |
| **Steps** | 1. Attempt to process claim on waiting period policy |
| **Expected Result** | Claim flagged as invalid. Error shown. Waiting period end date displayed. |
| **Pass Criteria** | System prevents claim approval on waiting period policies. |
| **Status** | ☐ Pass ☐ Fail ☐ Blocked |
| **Notes** | |

---

### TC-BO-04-009 | Ex-Gratia Claim
| Field | Detail |
|---|---|
| **Priority** | P2 — Medium |
| **Precondition** | Claim rejected but ex-gratia is warranted |
| **Steps** | 1. On rejected claim<br>2. Mark as ex-gratia payment<br>3. Enter amount and reason |
| **Expected Result** | isExGratia = true. Payment processed outside normal coverage rules. |
| **Pass Criteria** | Ex-gratia flag set. Audit trail shows override. |
| **Status** | ☐ Pass ☐ Fail ☐ Blocked |
| **Notes** | |

---

## Sign-Off

| Role | Name | Signature | Date |
|---|---|---|---|
| Product Owner | | | |
| Insurance Administrator | | | |
| Tech Lead | | | |
| QA Lead | | | |
