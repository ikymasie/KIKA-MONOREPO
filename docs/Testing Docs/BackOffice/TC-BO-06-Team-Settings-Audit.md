# TC-BO-06 | BackOffice — Team Management, Settings & Audit Log

**Module:** Admin Portal — Team, Settings, Governance  
**Version:** 1.0  
**Date:** 2026-02-21  
**Prepared By:** QA Team  
**Sign-Off Required From:** Product Owner, SACCOS Admin Rep, Tech Lead

---

## Scope
Covers user/role management, system settings (bylaws, workflow config), savings/loan product management, and audit log review.

---

## Test Cases

### TC-BO-06-001 | View Team Members
| Field | Detail |
|---|---|
| **Priority** | P1 — High |
| **Precondition** | Admin-level user logged in |
| **Steps** | 1. Navigate to Team |
| **Expected Result** | All staff users listed: name, role, email, status, last login |
| **Pass Criteria** | Only tenant-scoped users shown. Regulator users not included. |
| **Status** | ☐ Pass ☐ Fail ☐ Blocked |
| **Notes** | |

---

### TC-BO-06-002 | Invite New Team Member
| Field | Detail |
|---|---|
| **Priority** | P1 — High |
| **Precondition** | Logged in as saccos_admin |
| **Steps** | 1. Click "Invite User"<br>2. Enter email, select role (loan_officer, accountant, etc.)<br>3. Send invite |
| **Expected Result** | User created with temporary password. Welcome email/SMS sent. User appears in team list. |
| **Pass Criteria** | New user can login with credentials. Role permissions apply correctly. |
| **Status** | ☐ Pass ☐ Fail ☐ Blocked |
| **Notes** | |

---

### TC-BO-06-003 | Update Team Member Role
| Field | Detail |
|---|---|
| **Priority** | P1 — High |
| **Precondition** | Staff user exists |
| **Steps** | 1. Open team member<br>2. Change role from loan_officer to credit_committee<br>3. Save |
| **Expected Result** | Role updated. User's permissions change immediately. Audit log entry. |
| **Pass Criteria** | User gains new role permissions. Old role permissions removed. |
| **Status** | ☐ Pass ☐ Fail ☐ Blocked |
| **Notes** | |

---

### TC-BO-06-004 | Deactivate Team Member
| Field | Detail |
|---|---|
| **Priority** | P1 — High |
| **Precondition** | Active staff user |
| **Steps** | 1. Click "Deactivate" on staff member<br>2. Confirm |
| **Expected Result** | User status = inactive. User cannot login. Audit log entry. |
| **Pass Criteria** | Deactivated user returns 401 on login attempt. |
| **Status** | ☐ Pass ☐ Fail ☐ Blocked |
| **Notes** | |

---

### TC-BO-06-005 | View & Edit Bylaws
| Field | Detail |
|---|---|
| **Priority** | P1 — High |
| **Precondition** | Admin in Settings |
| **Steps** | 1. Navigate to Settings > Bylaws<br>2. View existing bylaws<br>3. Update a bylaw section<br>4. Save |
| **Expected Result** | Bylaws saved. Version history maintained. |
| **Pass Criteria** | Changes persist. Previous version retrievable. |
| **Status** | ☐ Pass ☐ Fail ☐ Blocked |
| **Notes** | |

---

### TC-BO-06-006 | Configure Tenant Settings
| Field | Detail |
|---|---|
| **Priority** | P1 — High |
| **Steps** | 1. Navigate to Settings > General<br>2. Update: max borrowing limit, max deduction %, liquidity target<br>3. Save |
| **Expected Result** | Settings saved. New limits apply on next loan application. |
| **Pass Criteria** | Changes reflected in DB. Applied to new loans immediately. |
| **Status** | ☐ Pass ☐ Fail ☐ Blocked |
| **Notes** | |

---

### TC-BO-06-007 | View Savings Product List
| Field | Detail |
|---|---|
| **Priority** | P1 — High |
| **Steps** | 1. Navigate to Settings or Products (wherever product management lives)<br>2. View savings products |
| **Expected Result** | All savings products listed: name, min balance, interest rate, status |
| **Pass Criteria** | Active/inactive filter works. |
| **Status** | ☐ Pass ☐ Fail ☐ Blocked |
| **Notes** | |

---

### TC-BO-06-008 | Deactivate a Loan Product
| Field | Detail |
|---|---|
| **Priority** | P2 — Medium |
| **Precondition** | Active loan product |
| **Steps** | 1. Set loan product status to inactive |
| **Expected Result** | Product no longer shown to members in apply-loan flow. Existing loans unaffected. |
| **Pass Criteria** | Inactive product not available for new applications. |
| **Status** | ☐ Pass ☐ Fail ☐ Blocked |
| **Notes** | |

---

### TC-BO-06-009 | Audit Log — View Events
| Field | Detail |
|---|---|
| **Priority** | P0 — Critical |
| **Precondition** | Various actions performed (KYC approve, loan approval, member suspend, etc.) |
| **Steps** | 1. Navigate to Audit Log (if accessible from admin) |
| **Expected Result** | All logged events shown: event type, actor, target, before state, after state, timestamp |
| **Pass Criteria** | Every major action produces an audit log entry. Filterable by event type and actor. |
| **Status** | ☐ Pass ☐ Fail ☐ Blocked |
| **Notes** | |

---

### TC-BO-06-010 | Workstation Sharing
| Field | Detail |
|---|---|
| **Priority** | P2 — Medium |
| **Precondition** | Staff user A assigned to workstation |
| **Steps** | 1. User A grants temporary access to User B<br>2. User B accepts<br>3. User B accesses workstation within 6-hour window |
| **Expected Result** | User B gains workstation access. Access expires after 6 hours. Audit log records share. |
| **Pass Criteria** | Expired sessions auto-revoked. User B loses access after 6 hours. |
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
