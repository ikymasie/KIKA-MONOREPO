# KIKA Platform — User Roles & Test Credentials

**Version:** 1.0  
**Date:** 2026-02-21  
**Classification:** Confidential — Internal / QA Use Only  
**Environment:** Demo / Staging Database

---

> [!NOTE]
> All accounts below exist in the database. Firebase Auth accounts must be created per user using the Admin Portal or Firebase Console before login is possible. Authentication is OTP-based — no fixed passwords. The login flow is: **Enter Email → Receive OTP → Verify**.

---

## Portal URLs

| Portal | URL | Roles |
|---|---|---|
| Member Portal | `/member` | member |
| Admin Portal (SACCOS) | `/admin` | saccos_admin, loan_officer, accountant, member_service_rep, credit_committee |
| Regulator Portal | `/regulator` | dcd_director, dcd_field_officer, dcd_compliance_officer, bob_prudential_supervisor, deduction_officer, registrar, registry_clerk, legal_officer |
| Applicant Portal | `/applicant` | society applicants (pre-registration) |

---

## SACCOS Tenants (Demo)

| Code | Full Name | Portal Domain |
|---|---|---|
| **BGES** | Botswana Government Employees SACCOS | bges.co.bw |
| **TSAC** | Teachers SACCOS | tsac.co.bw |
| **PSAC** | Police Officers SACCOS | psac.co.bw |
| **HWSAC** | Healthcare Workers SACCOS | hwsac.co.bw |
| **GCCSAC** | Gaborone City Council SACCOS | gccsac.co.bw |

---

## Role Descriptions

| Role | Portal | Permissions Summary |
|---|---|---|
| `dcd_director` | Regulator | Full oversight: approve/reject SACCOS, suspend tenants, broadcast directives |
| `registrar` | Regulator | Process SACCOS applications, issue certificates |
| `dcd_compliance_officer` | Regulator | Monitor compliance scores, issue alerts |
| `dcd_field_officer` | Regulator | Field assessments, assigned SACCOS review |
| `deduction_officer` | Regulator | Cross-tenant deduction oversight, MOF reconciliation |
| `registry_clerk` | Regulator | Maintain official SACCOS registry |
| `legal_officer` | Regulator | Legal reviews, escalation handling |
| `bob_prudential_supervisor` | Regulator | Prudential/financial oversight read + flag |
| `saccos_admin` | Admin | Full SACCOS management: members, products, team, settings |
| `loan_officer` | Admin | Loan eligibility reviews, technical appraisal |
| `credit_committee` | Admin | Committee voting on loan approvals |
| `accountant` | Admin | Accounting, journal entries, reconciliation posting |
| `member_service_rep` | Admin | Member onboarding, KYC review, OBO sessions |
| `member` | Member | Self-service: loans, savings, insurance, profile |

---

## Regulator Accounts

### DCD — Department of Cooperative Development

| Role | Email | Notes |
|---|---|---|
| dcd_director | `oarabile.mmusi0@gov.bw` | High-privilege: can suspend SACCOS |
| dcd_director | `boitumelo.kgomanyane1@gov.bw` | Secondary director account |
| registrar | `dineo.tiro0@gov.bw` | Approves applications, issues certificates |
| dcd_compliance_officer | `boago.kgomanyane0@gov.bw` | Primary compliance officer |
| dcd_compliance_officer | `tebogo.raditladi1@gov.bw` | |
| dcd_compliance_officer | `mothusi.motlhanka2@gov.bw` | |
| dcd_field_officer | `oarabile.kgomanyane0@gov.bw` | |
| dcd_field_officer | `katlego.mogapi2@gov.bw` | |
| dcd_field_officer | `mpho.kgalemang4@gov.bw` | |
| dcd_field_officer | `gofaone.gaborone1@gov.bw` | |
| dcd_field_officer | `onalenna.molefe3@gov.bw` | |
| deduction_officer | `kitso.lekorwe2@gov.bw` | Cross-tenant deduction oversight |
| deduction_officer | `lebogang.segwagwa0@gov.bw` | |
| deduction_officer | `thabo.tlhagale1@gov.bw` | |
| registry_clerk | `yaone.seretse0@gov.bw` | Maintains official register |
| registry_clerk | `wame.tshwane1@gov.bw` | |
| legal_officer | `reatile.moeti0@gov.bw` | |
| legal_officer | `otsile.masisi1@gov.bw` | |

### BoB — Bank of Botswana

| Role | Email | Notes |
|---|---|---|
| bob_prudential_supervisor | `oarabile.modise0@gov.bw` | Read + flag only |
| bob_prudential_supervisor | `mpho.tiro1@gov.bw` | |

---

## SACCOS Admin Accounts

One primary admin account per SACCOS for demo purposes:

| SACCOS | Role | Email |
|---|---|---|
| **BGES** | saccos_admin | `kelebogile.kebaabetswe0@bges.co.bw` |
| **BGES** | saccos_admin | `gorata.diaho1@bges.co.bw` |
| **TSAC** | saccos_admin | `nthabiseng.kebaabetswe1@tsac.co.bw` |
| **TSAC** | saccos_admin | `pelonomi.marumo0@tsac.co.bw` |
| **PSAC** | saccos_admin | `tebogo.seitiso0@psac.co.bw` |
| **PSAC** | saccos_admin | `dimpho.tshwane1@psac.co.bw` |
| **HWSAC** | saccos_admin | `lebogang.tiro0@hwsac.co.bw` |
| **HWSAC** | saccos_admin | `neo.ramotswa1@hwsac.co.bw` |
| **GCCSAC** | saccos_admin | `pelonomi.masisi1@gccsac.co.bw` |
| **GCCSAC** | saccos_admin | `boago.kgosana0@gccsac.co.bw` |

---

## Loan Officers

| SACCOS | Email |
|---|---|
| BGES | `mpho.gaborone0@bges.co.bw` |
| BGES | `masego.modise1@bges.co.bw` |
| TSAC | `phenyo.seretse0@tsac.co.bw` |
| TSAC | `tebogo.tlhagale1@tsac.co.bw` |
| PSAC | `mompati.seboni1@psac.co.bw` |
| PSAC | `tebogo.ramotswa0@psac.co.bw` |
| HWSAC | `boago.gaborone1@hwsac.co.bw` |
| HWSAC | `tebogo.kgosana0@hwsac.co.bw` |
| GCCSAC | `masego.seboni2@gccsac.co.bw` |
| GCCSAC | `refilwe.seretse0@gccsac.co.bw` |

---

## Accountants

| SACCOS | Email |
|---|---|
| BGES | `kagiso.lekorwe1@bges.co.bw` |
| BGES | `keabetswe.diaho0@bges.co.bw` |
| TSAC | `dineo.raditladi1@tsac.co.bw` |
| TSAC | `nthabiseng.nkwe0@tsac.co.bw` |
| PSAC | `mompati.tlhagale0@psac.co.bw` |
| PSAC | `tlotlo.mosweu1@psac.co.bw` |
| HWSAC | `gofaone.tlhagale1@hwsac.co.bw` |
| HWSAC | `boago.ntshingila0@hwsac.co.bw` |
| GCCSAC | `gofaone.ramotswa1@gccsac.co.bw` |
| GCCSAC | `tumelo.nkwe0@gccsac.co.bw` |

---

## Member Service Reps (for OBO/KYC testing)

| SACCOS | Email |
|---|---|
| BGES | `tumelo.gaborone0@bges.co.bw` |
| BGES | `dineo.kebaabetswe1@bges.co.bw` |
| TSAC | `tebogo.kebonang1@tsac.co.bw` |
| PSAC | `dimpho.tshwane0@psac.co.bw` |
| HWSAC | `pelonomi.moeti1@hwsac.co.bw` |

---

## Test Member Accounts (BGES)

These are seeded members belonging to the **BGES** SACCOS for member portal testing:

| Member # | Name | Email | Status |
|---|---|---|---|
| BGES-00001 | Keabetswe Kedikilwe | `keabetswe.kedikilwe.0.0@email.co.bw` | Active |
| BGES-00003 | Mothusi Kedikilwe | `mothusi.kedikilwe.0.2@email.co.bw` | Active |
| BGES-00004 | Otsile Kgalemang | `otsile.kgalemang.0.3@email.co.bw` | Active |
| BGES-00006 | Kabelo Tiro | `kabelo.tiro.0.5@email.co.bw` | Active |
| BGES-00010 | Oarabile Kebaabetswe | `oarabile.kebaabetswe.0.9@email.co.bw` | Active |

> To get members from other tenants, query: `SELECT memberNumber, firstName, lastName, email, status FROM members WHERE tenantId = '<tenantId>' AND status = 'active' LIMIT 10;`

---

## Quick Login Reference Card

| Who are you testing as? | Use this email |
|---|---|
| 🏛️ DCD Director | `oarabile.mmusi0@gov.bw` |
| 📋 Registrar | `dineo.tiro0@gov.bw` |
| 🔍 Compliance Officer | `boago.kgomanyane0@gov.bw` |
| 🚗 Field Officer | `oarabile.kgomanyane0@gov.bw` |
| 💳 Deduction Officer | `kitso.lekorwe2@gov.bw` |
| 🏢 SACCOS Admin (BGES) | `kelebogile.kebaabetswe0@bges.co.bw` |
| 🏢 SACCOS Admin (TSAC) | `nthabiseng.kebaabetswe1@tsac.co.bw` |
| 💰 Loan Officer (BGES) | `mpho.gaborone0@bges.co.bw` |
| 📒 Accountant (BGES) | `kagiso.lekorwe1@bges.co.bw` |
| 👤 Member (BGES) | `keabetswe.kedikilwe.0.0@email.co.bw` |

---

## Setting Up Firebase Auth for Test Accounts

Since Firebase Auth accounts are separate from the DB records, you need to create Firebase users for any account you intend to test with:

1. Go to **Firebase Console → Authentication → Users**
2. Click **Add User**
3. Enter the email from this document
4. Set a temporary password (or use the existing Firebase Admin SDK script)
5. Copy the `uid` and update the `users` table: `UPDATE users SET firebaseUid = '<uid>' WHERE email = '<email>';`

Or use the admin-facing OTP login — the system will look up the user by email and send an OTP.

---

*Document generated: 2026-02-21 | Environment: kikadb @ 34.63.62.50*
