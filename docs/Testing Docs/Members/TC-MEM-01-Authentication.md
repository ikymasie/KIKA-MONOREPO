# TC-MEM-01 | Member Authentication & Onboarding

**Module:** Member Portal — Authentication  
**Version:** 1.0  
**Date:** 2026-02-21  
**Prepared By:** QA Team  
**Sign-Off Required From:** Product Owner, Tech Lead

---

## Scope
Covers login, OTP verification, password management, KYC gate, and first-time onboarding for KIKA members.

---

## Test Cases

### TC-MEM-01-001 | Email + OTP Login (Happy Path)
| Field | Detail |
|---|---|
| **Priority** | P0 — Critical |
| **Precondition** | Member account exists with verified email |
| **Steps** | 1. Navigate to member login page<br>2. Enter valid email address<br>3. Click "Send OTP"<br>4. Enter 6-digit OTP received via SMS/email<br>5. Click "Verify" |
| **Expected Result** | Redirected to member dashboard. Session token is set. |
| **Pass Criteria** | Dashboard loads within 3s. No error messages. |
| **Status** | ☐ Pass ☐ Fail ☐ Blocked |
| **Notes** | |

---

### TC-MEM-01-002 | Invalid OTP Entry
| Field | Detail |
|---|---|
| **Priority** | P0 — Critical |
| **Precondition** | OTP has been sent to member |
| **Steps** | 1. On OTP screen, enter incorrect 6-digit code<br>2. Click "Verify" |
| **Expected Result** | Error message: "Invalid OTP. Please try again." Attempt counter decrements. |
| **Pass Criteria** | Error shown without page reload. Member not logged in. |
| **Status** | ☐ Pass ☐ Fail ☐ Blocked |
| **Notes** | |

---

### TC-MEM-01-003 | OTP Expiry
| Field | Detail |
|---|---|
| **Priority** | P1 — High |
| **Precondition** | OTP sent but not used within 10 minutes |
| **Steps** | 1. Wait for OTP to expire (10 min)<br>2. Enter the expired OTP<br>3. Click "Verify" |
| **Expected Result** | Error message: "OTP has expired. Please request a new one." |
| **Pass Criteria** | Expired OTP rejected. Resend option is available. |
| **Status** | ☐ Pass ☐ Fail ☐ Blocked |
| **Notes** | |

---

### TC-MEM-01-004 | OTP Resend
| Field | Detail |
|---|---|
| **Priority** | P1 — High |
| **Precondition** | OTP screen is showing |
| **Steps** | 1. Click "Resend OTP"<br>2. Check that new OTP is received |
| **Expected Result** | New OTP sent. Previous OTP invalidated. 60-second cooldown shown. |
| **Pass Criteria** | New OTP works. Old OTP no longer valid. |
| **Status** | ☐ Pass ☐ Fail ☐ Blocked |
| **Notes** | |

---

### TC-MEM-01-005 | Forced KYC on First Login
| Field | Detail |
|---|---|
| **Priority** | P0 — Critical |
| **Precondition** | Member has not completed KYC |
| **Steps** | 1. Login successfully<br>2. Observe redirect |
| **Expected Result** | Redirected to KYC wizard before dashboard. Dashboard inaccessible until KYC complete. |
| **Pass Criteria** | All dashboard routes return to KYC wizard. No bypass possible. |
| **Status** | ☐ Pass ☐ Fail ☐ Blocked |
| **Notes** | |

---

### TC-MEM-01-006 | KYC Wizard — Document Upload
| Field | Detail |
|---|---|
| **Priority** | P0 — Critical |
| **Precondition** | Member logged in, KYC not complete |
| **Steps** | 1. Upload Omang front image (JPG < 5MB)<br>2. Upload Omang back image<br>3. Upload proof of residence<br>4. Upload proof of income<br>5. Submit form |
| **Expected Result** | All documents upload. Status shows "Pending Review". |
| **Pass Criteria** | Documents stored. KYC status = pending. Member can see status on profile. |
| **Status** | ☐ Pass ☐ Fail ☐ Blocked |
| **Notes** | |

---

### TC-MEM-01-007 | KYC Wizard — Invalid File Type
| Field | Detail |
|---|---|
| **Priority** | P1 — High |
| **Precondition** | On KYC document upload step |
| **Steps** | 1. Attempt to upload a .exe or .pdf file in image field<br>2. Observe validation |
| **Expected Result** | File rejected with message "Only JPG, PNG, PDF allowed" |
| **Pass Criteria** | File not uploaded. Field shows error. |
| **Status** | ☐ Pass ☐ Fail ☐ Blocked |
| **Notes** | |

---

### TC-MEM-01-008 | Password Change (Forced)
| Field | Detail |
|---|---|
| **Priority** | P1 — High |
| **Precondition** | Member account has `mustChangePassword = true` |
| **Steps** | 1. Login<br>2. Observe redirect to change password page<br>3. Enter old temporary password<br>4. Enter new password (meets policy)<br>5. Confirm new password<br>6. Submit |
| **Expected Result** | Password updated. Redirected to dashboard. `mustChangePassword = false`. |
| **Pass Criteria** | Cannot access any page until password changed. |
| **Status** | ☐ Pass ☐ Fail ☐ Blocked |
| **Notes** | |

---

### TC-MEM-01-009 | Session Expiry / Auto-Logout
| Field | Detail |
|---|---|
| **Priority** | P1 — High |
| **Precondition** | Logged-in member session |
| **Steps** | 1. Leave session idle for session timeout period<br>2. Attempt to navigate to any page |
| **Expected Result** | Redirected to login page with message "Your session has expired." |
| **Pass Criteria** | API calls return 401. No data accessible without re-login. |
| **Status** | ☐ Pass ☐ Fail ☐ Blocked |
| **Notes** | |

---

## Sign-Off

| Role | Name | Signature | Date |
|---|---|---|---|
| Product Owner | | | |
| Tech Lead | | | |
| QA Lead | | | |
