# TC-REG-03 | Regulation — SACCOS Monitoring & Field Operations

**Module:** Regulator Portal — SACCOS Oversight & Field Officers  
**Version:** 1.0  
**Date:** 2026-02-21  
**Prepared By:** QA Team  
**Sign-Off Required From:** DCD Director, Field Officer Lead, Tech Lead

---

## Scope
Covers regulator's ability to monitor all SACCOS tenants, view detailed per-SACCOS dashboards, field officer visit tracking, and intelligence liaison functions.

---

## Test Cases

### TC-REG-03-001 | View All Registered SACCOS
| Field | Detail |
|---|---|
| **Priority** | P0 — Critical |
| **Precondition** | Regulator logged in. Multiple SACCOS tenants exist. |
| **Steps** | 1. Navigate to SACCOS Registry / SACCOS list |
| **Expected Result** | All registered SACCOS shown: name, code, registration number, registration date, status, member count |
| **Pass Criteria** | All 5 seeded SACCOS visible. Sortable. Filterable by status. |
| **Status** | ☐ Pass ☐ Fail ☐ Blocked |
| **Notes** | |

---

### TC-REG-03-002 | View SACCOS Detail from Regulator View
| Field | Detail |
|---|---|
| **Priority** | P0 — Critical |
| **Precondition** | Registered SACCOS exists |
| **Steps** | 1. Click on any SACCOS |
| **Expected Result** | Detailed panel: total members, active loans, total loan portfolio, total savings, insurance policies, deduction compliance status, contact info |
| **Pass Criteria** | All metrics read from live DB. No static/hardcoded values. |
| **Status** | ☐ Pass ☐ Fail ☐ Blocked |
| **Notes** | |

---

### TC-REG-03-003 | Field Officer — View Assigned SACCOS
| Field | Detail |
|---|---|
| **Priority** | P1 — High |
| **Precondition** | Logged in as dcd_field_officer |
| **Steps** | 1. Navigate to field-officer portal |
| **Expected Result** | Field officer sees only their assigned SACCOS. Not all SACCOS. |
| **Pass Criteria** | Data is scoped. Cross-SACCOS access not possible. |
| **Status** | ☐ Pass ☐ Fail ☐ Blocked |
| **Notes** | |

---

### TC-REG-03-004 | Regulator Auditor — Read-Only Access
| Field | Detail |
|---|---|
| **Priority** | P1 — High |
| **Precondition** | Logged in as bob_financial_auditor or external_auditor |
| **Steps** | 1. Navigate through all sections of regulator portal |
| **Expected Result** | Can view all data. No create/edit/delete buttons visible. |
| **Pass Criteria** | POST/PUT/DELETE API calls return 403 for auditor role. |
| **Status** | ☐ Pass ☐ Fail ☐ Blocked |
| **Notes** | |

---

### TC-REG-03-005 | Regulator — Suspend a SACCOS Tenant
| Field | Detail |
|---|---|
| **Priority** | P1 — High |
| **Precondition** | Active SACCOS with compliance issues. Logged in as registrar or dcd_director. |
| **Steps** | 1. Navigate to SACCOS detail<br>2. Click "Suspend SACCOS"<br>3. Enter reason and duration<br>4. Confirm |
| **Expected Result** | SACCOS status = suspended. All tenant users cannot login. Admin portal shows maintenance message. Audit log entry created. |
| **Pass Criteria** | SACCOS members and staff blocked from access immediately. |
| **Status** | ☐ Pass ☐ Fail ☐ Blocked |
| **Notes** | |

---

### TC-REG-03-006 | Regulator — Reinstate Suspended SACCOS
| Field | Detail |
|---|---|
| **Priority** | P1 — High |
| **Precondition** | SACCOS in suspended status |
| **Steps** | 1. Click "Reinstate SACCOS"<br>2. Confirm |
| **Expected Result** | SACCOS status = active. Staff and member access restored. |
| **Pass Criteria** | All access restored immediately. Reinstatement logged. |
| **Status** | ☐ Pass ☐ Fail ☐ Blocked |
| **Notes** | |

---

### TC-REG-03-007 | Registry — View Official Registers
| Field | Detail |
|---|---|
| **Priority** | P1 — High |
| **Precondition** | Multiple SACCOS registered |
| **Steps** | 1. Navigate to Registry<br>2. View official register of all SACCOS |
| **Expected Result** | Official register showing: registration number, name, registration date, type, status, address |
| **Pass Criteria** | Exportable as PDF. Data matches DB. |
| **Status** | ☐ Pass ☐ Fail ☐ Blocked |
| **Notes** | |

---

### TC-REG-03-008 | Regulator Insurance Oversight
| Field | Detail |
|---|---|
| **Priority** | P1 — High |
| **Steps** | 1. Navigate to Insurance overview<br>2. View cross-SACCOS insurance stats |
| **Expected Result** | Total policies per SACCOS, claim ratios, payout amounts, pending claims |
| **Pass Criteria** | Data aggregated across all SACCOS correctly. |
| **Status** | ☐ Pass ☐ Fail ☐ Blocked |
| **Notes** | |

---

### TC-REG-03-009 | regulator Bylaws — View and Mandate
| Field | Detail |
|---|---|
| **Priority** | P2 — Medium |
| **Precondition** | Logged in as registrar |
| **Steps** | 1. Navigate to Bylaws<br>2. View standard bylaws for SACCOS |
| **Expected Result** | Model bylaws viewable. Can be pushed to specific SACCOS for compliance. |
| **Pass Criteria** | Bylaws content accurate. Changes tracked. |
| **Status** | ☐ Pass ☐ Fail ☐ Blocked |
| **Notes** | |

---

### TC-REG-03-010 | Role-Based Access Control — Regulator Roles
| Field | Detail |
|---|---|
| **Priority** | P0 — Critical |
| **Steps** | Test each regulator role: dcd_director, dcd_field_officer, dcd_compliance_officer, bob_prudential_supervisor, bob_financial_auditor, bob_compliance_officer, deduction_officer, registrar, registry_clerk, legal_officer |
| **Expected Result** | Each role can only access permitted sections |
| **Pass Criteria** | No cross-role data leakage. Unauthorized routes return 403/redirect to dashboard. |
| **Status** | ☐ Pass ☐ Fail ☐ Blocked |
| **Notes** | |

---

## Sign-Off

| Role | Name | Signature | Date |
|---|---|---|---|
| DCD Director | | | |
| Field Officer Lead | | | |
| Tech Lead | | | |
| QA Lead | | | |
