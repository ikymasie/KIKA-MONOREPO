# TC-REG-01 | Regulation — SACCOS Application & Registration

**Module:** Regulator Portal — Applications & Registration  
**Version:** 1.0  
**Date:** 2026-02-21  
**Prepared By:** QA Team  
**Sign-Off Required From:** Registrar, DCD Director, Tech Lead

---

## Scope
Covers the SACCOS/Cooperative application submission flow, DCD review, approval/rejection, certificate issuance, and the applicant portal.

---

## Test Cases

### TC-REG-01-001 | View Applications Queue
| Field | Detail |
|---|---|
| **Priority** | P0 — Critical |
| **Precondition** | Applications submitted by SACCOS applicants |
| **Steps** | 1. Login as dcd_field_officer or registrar<br>2. Navigate to Applications |
| **Expected Result** | All applications listed: org name, application type, date submitted, status |
| **Pass Criteria** | Filterable by type (society/cooperative) and status. |
| **Status** | ☐ Pass ☐ Fail ☐ Blocked |
| **Notes** | |

---

### TC-REG-01-002 | Applicant — Submit Society Application
| Field | Detail |
|---|---|
| **Priority** | P0 — Critical |
| **Precondition** | User logged in as society_applicant |
| **Steps** | 1. Navigate to applicant portal<br>2. Fill application: org name, registration type, address, founding members, documents<br>3. Submit |
| **Expected Result** | Application created with unique reference number. Status = submitted. Applicant sees tracking page. |
| **Pass Criteria** | Application visible in regulator queue. Documents uploaded. |
| **Status** | ☐ Pass ☐ Fail ☐ Blocked |
| **Notes** | |

---

### TC-REG-01-003 | Field Officer — Review Application
| Field | Detail |
|---|---|
| **Priority** | P0 — Critical |
| **Precondition** | Application in submitted state |
| **Steps** | 1. Open application<br>2. Review all documents and sections<br>3. Add field assessment notes<br>4. Submit for approval |
| **Expected Result** | Application advanced to next stage. Assessment notes saved. |
| **Pass Criteria** | Status transitions correctly. Audit log entry created. |
| **Status** | ☐ Pass ☐ Fail ☐ Blocked |
| **Notes** | |

---

### TC-REG-01-004 | Registrar — Approve Application
| Field | Detail |
|---|---|
| **Priority** | P0 — Critical |
| **Precondition** | Application reviewed and ready for final approval |
| **Steps** | 1. Open reviewed application<br>2. Click "Approve"<br>3. Confirm |
| **Expected Result** | Application status = approved. SACCOS tenant created in system. Certificate generation triggered. |
| **Pass Criteria** | New tenant record exists in DB. Applicant notified. |
| **Status** | ☐ Pass ☐ Fail ☐ Blocked |
| **Notes** | |

---

### TC-REG-01-005 | Registrar — Reject Application with Reason
| Field | Detail |
|---|---|
| **Priority** | P1 — High |
| **Precondition** | Application under review |
| **Steps** | 1. Click "Reject"<br>2. Enter detailed rejection reason<br>3. Confirm |
| **Expected Result** | Application status = rejected. Reason stored. Applicant sees rejection reason in their portal. |
| **Pass Criteria** | Applicant cannot resubmit with same info. Clear reason communicated. |
| **Status** | ☐ Pass ☐ Fail ☐ Blocked |
| **Notes** | |

---

### TC-REG-01-006 | Applicant — Track Application Status
| Field | Detail |
|---|---|
| **Priority** | P1 — High |
| **Precondition** | Application submitted |
| **Steps** | 1. Login as applicant<br>2. View application status page |
| **Expected Result** | Status shown with clear stage indicator. Stage history visible. |
| **Pass Criteria** | Applicant can see current stage without contacting regulator. |
| **Status** | ☐ Pass ☐ Fail ☐ Blocked |
| **Notes** | |

---

### TC-REG-01-007 | Certificate Issuance on Approval
| Field | Detail |
|---|---|
| **Priority** | P0 — Critical |
| **Precondition** | Application approved |
| **Steps** | 1. Navigate to Certificates section<br>2. View newly issued certificate |
| **Expected Result** | Certificate generated with: registration number, SACCOS name, issue date, registrar name/signature, expiry if applicable |
| **Pass Criteria** | Certificate downloadable as PDF. All fields populated. |
| **Status** | ☐ Pass ☐ Fail ☐ Blocked |
| **Notes** | |

---

## Sign-Off

| Role | Name | Signature | Date |
|---|---|---|---|
| Registrar | | | |
| DCD Director | | | |
| Tech Lead | | | |
| QA Lead | | | |
