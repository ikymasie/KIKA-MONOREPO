# TC-MEM-05 | Member Insurance

**Module:** Member Portal — Insurance  
**Version:** 1.0  
**Date:** 2026-02-21  
**Prepared By:** QA Team  
**Sign-Off Required From:** Product Owner, Tech Lead

---

## Scope
Covers insurance policy overview, policy detail, waiting period display, and claims management from the member side.

---

## Test Cases

### TC-MEM-05-001 | View Insurance Policies
| Field | Detail |
|---|---|
| **Priority** | P0 — Critical |
| **Precondition** | Member has 1+ insurance policies |
| **Steps** | 1. Navigate to Insurance |
| **Expected Result** | All policies listed with: policy number, product name, coverage amount, monthly premium, status, waiting period end date |
| **Pass Criteria** | All policies shown. Status badges correct (active/waiting_period/lapsed). |
| **Status** | ☐ Pass ☐ Fail ☐ Blocked |
| **Notes** | |

---

### TC-MEM-05-002 | Policy — Waiting Period Display
| Field | Detail |
|---|---|
| **Priority** | P1 — High |
| **Precondition** | Member has policy in waiting period |
| **Steps** | 1. View policy in waiting_period status |
| **Expected Result** | Banner/badge shows "In Waiting Period". End date displayed. Claims action hidden/disabled. |
| **Pass Criteria** | Cannot submit a claim during waiting period. Warning is clear. |
| **Status** | ☐ Pass ☐ Fail ☐ Blocked |
| **Notes** | |

---

### TC-MEM-05-003 | View Policy Detail
| Field | Detail |
|---|---|
| **Priority** | P0 — Critical |
| **Precondition** | Member has active policy |
| **Steps** | 1. Click on an active policy |
| **Expected Result** | Shows: policy number, product name, coverage type, coverage amount, start date, waiting period end, monthly premium, months paid, total premiums paid |
| **Pass Criteria** | All values match DB. |
| **Status** | ☐ Pass ☐ Fail ☐ Blocked |
| **Notes** | |

---

### TC-MEM-05-004 | View Claims on a Policy
| Field | Detail |
|---|---|
| **Priority** | P1 — High |
| **Precondition** | Member has policy with at least one claim |
| **Steps** | 1. On policy detail page<br>2. View Claims section |
| **Expected Result** | Claims listed with: claim number, type, amount, date submitted, current status |
| **Pass Criteria** | All claim statuses accurate. |
| **Status** | ☐ Pass ☐ Fail ☐ Blocked |
| **Notes** | |

---

### TC-MEM-05-005 | Lapsed Policy Display
| Field | Detail |
|---|---|
| **Priority** | P1 — High |
| **Precondition** | Member has a lapsed policy |
| **Steps** | 1. View lapsed policy |
| **Expected Result** | Status = "Lapsed". Reason displayed if available. No claim submission allowed. |
| **Pass Criteria** | Lapsed policies clearly distinguished from active ones. |
| **Status** | ☐ Pass ☐ Fail ☐ Blocked |
| **Notes** | |

---

### TC-MEM-05-006 | Multiple Insurance Products
| Field | Detail |
|---|---|
| **Priority** | P1 — High |
| **Precondition** | Member enrolled in 3 different insurance products |
| **Steps** | 1. Navigate to Insurance |
| **Expected Result** | All 3 policies shown independently |
| **Pass Criteria** | Policies not merged. Each shows distinct product name and coverage. |
| **Status** | ☐ Pass ☐ Fail ☐ Blocked |
| **Notes** | |

---

## Sign-Off

| Role | Name | Signature | Date |
|---|---|---|---|
| Product Owner | | | |
| Tech Lead | | | |
| QA Lead | | | |
