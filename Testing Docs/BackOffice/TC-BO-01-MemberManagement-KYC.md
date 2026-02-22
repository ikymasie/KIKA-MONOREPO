# TC-BO-01 | BackOffice — Member Management & KYC

**Module:** Admin Portal — Members  
**Version:** 1.0  
**Date:** 2026-02-21  
**Prepared By:** QA Team  
**Sign-Off Required From:** Product Owner, SACCOS Admin Rep, Tech Lead

---

## Scope
Covers member listing, member onboarding, KYC review and approval/rejection, member detail view, OBO (On Behalf Of) session management, and member status changes.

---

## Test Cases

### TC-BO-01-001 | View Member List
| Field | Detail |
|---|---|
| **Priority** | P0 — Critical |
| **Precondition** | Admin logged in. Members seeded. |
| **Steps** | 1. Navigate to Members section |
| **Expected Result** | Members listed with: member number, full name, status, KYC status, join date, employment, monthly salary |
| **Pass Criteria** | Pagination works. Sorting by name/status/date works. Total count accurate. |
| **Status** | ☐ Pass ☐ Fail ☐ Blocked |
| **Notes** | |

---

### TC-BO-01-002 | Search Members
| Field | Detail |
|---|---|
| **Priority** | P1 — High |
| **Precondition** | Admin on members list |
| **Steps** | 1. Enter member name in search<br>2. Enter member number (e.g. BGES-00001)<br>3. Enter national ID |
| **Expected Result** | Results filtered to matching members for each search type |
| **Pass Criteria** | Partial name matches work. Search is case-insensitive. |
| **Status** | ☐ Pass ☐ Fail ☐ Blocked |
| **Notes** | |

---

### TC-BO-01-003 | Filter Members by Status
| Field | Detail |
|---|---|
| **Priority** | P1 — High |
| **Precondition** | Members with various statuses seeded |
| **Steps** | 1. Apply filter: Status = "Active"<br>2. Apply filter: Status = "Inactive"<br>3. Apply filter: Status = "Suspended" |
| **Expected Result** | Only members with selected status shown for each filter |
| **Pass Criteria** | Counts match DB counts for each status. |
| **Status** | ☐ Pass ☐ Fail ☐ Blocked |
| **Notes** | |

---

### TC-BO-01-004 | View Member Detail
| Field | Detail |
|---|---|
| **Priority** | P0 — Critical |
| **Precondition** | Admin selects a member |
| **Steps** | 1. Click on a member<br>2. View all tabs: Personal, Loans, Savings, Insurance, Transactions |
| **Expected Result** | All tabs load with correct data. Personal info complete. Related records linked. |
| **Pass Criteria** | No missing data. No broken tab transitions. |
| **Status** | ☐ Pass ☐ Fail ☐ Blocked |
| **Notes** | |

---

### TC-BO-01-005 | KYC Review — Approve
| Field | Detail |
|---|---|
| **Priority** | P0 — Critical |
| **Precondition** | Member has submitted KYC documents (status = pending) |
| **Steps** | 1. Navigate to member KYC tab<br>2. Review documents<br>3. Check "Identity Verified", "Residence Verified", "Income Verified"<br>4. Click "Approve KYC" |
| **Expected Result** | KYC status = verified. Member gains full access. Audit log entry created. |
| **Pass Criteria** | Member can now access full portal. KYC record updated. |
| **Status** | ☐ Pass ☐ Fail ☐ Blocked |
| **Notes** | |

---

### TC-BO-01-006 | KYC Review — Reject
| Field | Detail |
|---|---|
| **Priority** | P0 — Critical |
| **Precondition** | Member has submitted KYC documents |
| **Steps** | 1. Review documents<br>2. Add rejection notes<br>3. Click "Reject KYC" |
| **Expected Result** | KYC status = rejected. Rejection reason stored. Member notified. |
| **Pass Criteria** | Member shown rejection reason on their portal. Member can resubmit. |
| **Status** | ☐ Pass ☐ Fail ☐ Blocked |
| **Notes** | |

---

### TC-BO-01-007 | Suspend Member
| Field | Detail |
|---|---|
| **Priority** | P1 — High |
| **Precondition** | Member is active |
| **Steps** | 1. On member detail<br>2. Click "Suspend Member"<br>3. Enter suspension reason<br>4. Confirm |
| **Expected Result** | Member status = suspended. Member cannot login. Audit log entry created. |
| **Pass Criteria** | Suspended member gets "account suspended" error on login attempt. |
| **Status** | ☐ Pass ☐ Fail ☐ Blocked |
| **Notes** | |

---

### TC-BO-01-008 | Reactivate Member
| Field | Detail |
|---|---|
| **Priority** | P1 — High |
| **Precondition** | Member is suspended |
| **Steps** | 1. On suspended member detail<br>2. Click "Reactivate"<br>3. Confirm |
| **Expected Result** | Member status = active. Member can login again. |
| **Pass Criteria** | Member immediately able to login after reactivation. |
| **Status** | ☐ Pass ☐ Fail ☐ Blocked |
| **Notes** | |

---

### TC-BO-01-009 | OBO Session — Start
| Field | Detail |
|---|---|
| **Priority** | P1 — High |
| **Precondition** | Admin on member detail page, member is active |
| **Steps** | 1. Click "Act on Behalf"<br>2. Confirm OBO session start |
| **Expected Result** | Admin UI switches to member's view. OBO banner visible at top. Timer shown (6hr limit). Audit log created. |
| **Pass Criteria** | OBO session scoped to that member only. Admin actions on behalf logged separately. |
| **Status** | ☐ Pass ☐ Fail ☐ Blocked |
| **Notes** | |

---

### TC-BO-01-010 | OBO Session — End
| Field | Detail |
|---|---|
| **Priority** | P1 — High |
| **Precondition** | Active OBO session in progress |
| **Steps** | 1. Click "End OBO Session" from banner |
| **Expected Result** | OBO session terminated. Returned to admin view. Audit log entry for session end. |
| **Pass Criteria** | Session end recorded with timestamp. |
| **Status** | ☐ Pass ☐ Fail ☐ Blocked |
| **Notes** | |

---

### TC-BO-01-011 | Add New Member (Admin)
| Field | Detail |
|---|---|
| **Priority** | P0 — Critical |
| **Precondition** | Admin on Members section |
| **Steps** | 1. Click "Add Member"<br>2. Fill all required fields: name, national ID, DOB, gender, contact, employment, salary<br>3. Submit |
| **Expected Result** | Member record created. Member number auto-generated. Welcome credentials sent. |
| **Pass Criteria** | Member appears in list. Member can login with temporary credentials. |
| **Status** | ☐ Pass ☐ Fail ☐ Blocked |
| **Notes** | |

---

## Sign-Off

| Role | Name | Signature | Date |
|---|---|---|---|
| Product Owner | | | |
| SACCOS Admin Rep | | | |
| Tech Lead | | | |
| QA Lead | | | |
