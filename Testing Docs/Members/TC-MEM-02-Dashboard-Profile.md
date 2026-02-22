# TC-MEM-02 | Member Dashboard & Profile

**Module:** Member Portal — Dashboard & Profile Management  
**Version:** 1.0  
**Date:** 2026-02-21  
**Prepared By:** QA Team  
**Sign-Off Required From:** Product Owner, Tech Lead

---

## Scope
Covers member dashboard summary widgets, profile viewing and editing, beneficiary management, dependent management, and bank account management.

---

## Test Cases

### TC-MEM-02-001 | Dashboard Summary Loads
| Field | Detail |
|---|---|
| **Priority** | P0 — Critical |
| **Precondition** | Member logged in with active account, seeded data present |
| **Steps** | 1. Login as member<br>2. Navigate to dashboard |
| **Expected Result** | Dashboard shows: Total Savings balance, Active Loans summary, Insurance coverage, Recent transactions |
| **Pass Criteria** | All widgets load with correct figures. No "NaN" or undefined values. |
| **Status** | ☐ Pass ☐ Fail ☐ Blocked |
| **Notes** | |

---

### TC-MEM-02-002 | Dashboard — No Data Empty States
| Field | Detail |
|---|---|
| **Priority** | P1 — High |
| **Precondition** | Member with no loans, savings, or insurance |
| **Steps** | 1. Login as such member<br>2. View dashboard |
| **Expected Result** | Each empty section shows a friendly empty state with a CTA (e.g. "Apply for your first loan") |
| **Pass Criteria** | No JavaScript errors. No blank white boxes. |
| **Status** | ☐ Pass ☐ Fail ☐ Blocked |
| **Notes** | |

---

### TC-MEM-02-003 | View Profile Details
| Field | Detail |
|---|---|
| **Priority** | P0 — Critical |
| **Precondition** | Member logged in |
| **Steps** | 1. Navigate to Profile<br>2. View Personal Information tab |
| **Expected Result** | Shows: Full name, national ID, DOB, gender, email, phone, address, employment status, employer, employee number |
| **Pass Criteria** | All fields populated from DB. No missing required fields. |
| **Status** | ☐ Pass ☐ Fail ☐ Blocked |
| **Notes** | |

---

### TC-MEM-02-004 | Edit Profile — Contact Details
| Field | Detail |
|---|---|
| **Priority** | P1 — High |
| **Precondition** | Member on profile page |
| **Steps** | 1. Click "Edit"<br>2. Update phone number to new valid number<br>3. Update physical address<br>4. Save changes |
| **Expected Result** | Changes saved. Success toast shown. Updated values displayed. |
| **Pass Criteria** | DB record updated. Changes persist on refresh. |
| **Status** | ☐ Pass ☐ Fail ☐ Blocked |
| **Notes** | |

---

### TC-MEM-02-005 | Add Beneficiary
| Field | Detail |
|---|---|
| **Priority** | P1 — High |
| **Precondition** | Member on Profile > Beneficiaries tab |
| **Steps** | 1. Click "Add Beneficiary"<br>2. Enter: First name, Last name, Relationship, DOB, National ID, Phone, Allocation %<br>3. Submit |
| **Expected Result** | Beneficiary added. Listed in beneficiary table. Total allocation % shown. |
| **Pass Criteria** | DB record created. Allocation percentages sum validation works (cannot exceed 100%). |
| **Status** | ☐ Pass ☐ Fail ☐ Blocked |
| **Notes** | |

---

### TC-MEM-02-006 | Beneficiary Allocation Over 100%
| Field | Detail |
|---|---|
| **Priority** | P1 — High |
| **Precondition** | Existing beneficiaries already account for 80% |
| **Steps** | 1. Add new beneficiary with 30% allocation<br>2. Submit |
| **Expected Result** | Validation error: "Total allocation cannot exceed 100%" |
| **Pass Criteria** | Submission blocked. Error message shown. |
| **Status** | ☐ Pass ☐ Fail ☐ Blocked |
| **Notes** | |

---

### TC-MEM-02-007 | Remove Beneficiary
| Field | Detail |
|---|---|
| **Priority** | P2 — Medium |
| **Precondition** | At least 2 beneficiaries exist |
| **Steps** | 1. Click delete on a beneficiary<br>2. Confirm in modal |
| **Expected Result** | Beneficiary removed. Remaining beneficiaries still shown. |
| **Pass Criteria** | DB record deleted. List refreshes. |
| **Status** | ☐ Pass ☐ Fail ☐ Blocked |
| **Notes** | |

---

### TC-MEM-02-008 | Add Dependent
| Field | Detail |
|---|---|
| **Priority** | P1 — High |
| **Precondition** | Member on Profile > Dependents tab |
| **Steps** | 1. Click "Add Dependent"<br>2. Enter: First name, Last name, Relationship, DOB, National ID, Gender<br>3. Submit |
| **Expected Result** | Dependent added to list |
| **Pass Criteria** | DB record created. Dependent appears in list immediately. |
| **Status** | ☐ Pass ☐ Fail ☐ Blocked |
| **Notes** | |

---

### TC-MEM-02-009 | Add Bank Account
| Field | Detail |
|---|---|
| **Priority** | P1 — High |
| **Precondition** | Member on Profile > Bank Accounts tab |
| **Steps** | 1. Click "Add Bank Account"<br>2. Enter: Bank name, Branch code, Account number, Account holder name, Account type<br>3. Submit |
| **Expected Result** | Bank account added. If first account, marked as primary. |
| **Pass Criteria** | DB record created. Primary flag set correctly. |
| **Status** | ☐ Pass ☐ Fail ☐ Blocked |
| **Notes** | |

---

### TC-MEM-02-010 | Set Primary Bank Account
| Field | Detail |
|---|---|
| **Priority** | P2 — Medium |
| **Precondition** | Member has 2+ bank accounts |
| **Steps** | 1. Click "Set as Primary" on non-primary account |
| **Expected Result** | Selected account marked as primary. Previous primary unmarked. |
| **Pass Criteria** | Only one account can be primary at a time. |
| **Status** | ☐ Pass ☐ Fail ☐ Blocked |
| **Notes** | |

---

## Sign-Off

| Role | Name | Signature | Date |
|---|---|---|---|
| Product Owner | | | |
| Tech Lead | | | |
| QA Lead | | | |
