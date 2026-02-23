# KIKA Platform — Test Case Master Index

**Version:** 1.0  
**Date:** 2026-02-21  
**Total Test Cases:** 130  
**Sign-Off Status:** ☐ In Progress

---

## Overview

This folder contains all sign-off test case documents for the KIKA SACCOS Management Platform, organized into three functional groups:

| Group | Folder | Documents | Test Cases |
|---|---|---|---|
| Member Portal | `Members/` | 6 docs | ~55 TCs |
| Back Office (SACCOS Admin) | `BackOffice/` | 6 docs | ~62 TCs |
| Regulation & Oversight | `Regulation/` | 4 docs | ~36 TCs |

---

## Members Group

These test cases cover the **Member Portal** — the self-service interface used by SACCOS members.

| File | Module | Priority Focus |
|---|---|---|
| [TC-MEM-01 — Authentication](Members/TC-MEM-01-Authentication.md) | Login, OTP, KYC Gate, Password | P0/P1 |
| [TC-MEM-02 — Dashboard & Profile](Members/TC-MEM-02-Dashboard-Profile.md) | Dashboard, Profile, Beneficiaries, Dependents, Bank Accounts | P0/P1 |
| [TC-MEM-03 — Loans](Members/TC-MEM-03-Loans.md) | Loan Application, Repayment Schedule, Status Tracking | P0/P1 |
| [TC-MEM-04 — Savings](Members/TC-MEM-04-Savings.md) | Savings Accounts, Transactions, Statements | P0/P1 |
| [TC-MEM-05 — Insurance](Members/TC-MEM-05-Insurance.md) | Policies, Waiting Period, Claims View | P0/P1 |
| [TC-MEM-06 — Statements & Marketplace](Members/TC-MEM-06-Statements-Marketplace.md) | Statement Generation, Marketplace Orders | P1/P2 |

---

## BackOffice Group

These test cases cover the **Admin Portal** — used by SACCOS staff to manage members, loans, deductions, accounting, and settings.

| File | Module | Priority Focus |
|---|---|---|
| [TC-BO-01 — Member Management & KYC](BackOffice/TC-BO-01-MemberManagement-KYC.md) | Member CRUD, KYC Review, OBO Sessions, Suspend/Reactivate | P0/P1 |
| [TC-BO-02 — Loan Workflow](BackOffice/TC-BO-02-LoanWorkflow.md) | Eligibility, Guarantors, Committee Vote, Disbursement | P0/P1 |
| [TC-BO-03 — Deductions & Reconciliation](BackOffice/TC-BO-03-Deductions-Reconciliation.md) | Batch Creation, CSV Export, MOF Upload, Variance, Journal Posting | P0/P1 |
| [TC-BO-04 — Insurance Administration](BackOffice/TC-BO-04-InsuranceAdmin.md) | Policy Overview, Claims Workflow, Ex-Gratia | P0/P1 |
| [TC-BO-05 — Accounting](BackOffice/TC-BO-05-Accounting.md) | Chart of Accounts, Ledger, Transactions, Trial Balance | P0/P1 |
| [TC-BO-06 — Team, Settings & Audit](BackOffice/TC-BO-06-Team-Settings-Audit.md) | User Management, Product Config, Bylaws, Audit Log | P1/P2 |

---

## Regulation Group

These test cases cover the **Regulator Portal** — used by DCD, BoB, and other regulatory bodies to oversee all SACCOS operations.

| File | Module | Priority Focus |
|---|---|---|
| [TC-REG-01 — Applications & Registration](Regulation/TC-REG-01-Applications-Registration.md) | SACCOS Application, Review, Approval, Certificate Issuance | P0/P1 |
| [TC-REG-02 — Compliance Oversight](Regulation/TC-REG-02-Compliance-Oversight.md) | Compliance Scoring, Deduction Cap Alerts, Reporting | P0/P1 |
| [TC-REG-03 — SACCOS Monitoring](Regulation/TC-REG-03-SACCOS-Monitoring.md) | Cross-SACCOS View, Suspend/Reinstate, RBAC, Registry | P0/P1 |
| [TC-REG-04 — Deduction Officer & MOF](Regulation/TC-REG-04-DeductionOfficer-MOF.md) | Cross-Tenant Deduction View, Variance Escalation, Cap Enforcement | P0/P1 |

---

## Test Execution Priority

```
P0 — Critical:  Must pass before any go-live or demo
P1 — High:      Should pass for production readiness
P2 — Medium:    Nice-to-have, can be deferred to next sprint
```

---

## Status Legend

| Symbol | Meaning |
|---|---|
| ☐ Pass | Test executed and passed |
| ☐ Fail | Test executed and failed (log defect) |
| ☐ Blocked | Cannot execute (dependency or environment issue) |
| ☐ | Not yet executed |

---

## Sign-Off Summary

| Group | Documents | Status |
|---|---|---|
| Members | 6 / 6 | ☐ Not Started |
| BackOffice | 6 / 6 | ☐ Not Started |
| Regulation | 4 / 4 | ☐ Not Started |

---

## How to Use

1. Assign each document to a tester
2. Tester executes each test case and marks ☐ Pass / ☐ Fail / ☐ Blocked
3. Failed tests logged as defects with TC reference number (e.g. TC-BO-02-008)
4. After all P0 cases pass → collect sign-offs from stakeholders listed per document
5. QA Lead compiles final report
