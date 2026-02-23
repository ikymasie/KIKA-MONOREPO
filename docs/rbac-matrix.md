To implement a secure, multi-tenant environment for the **MTSMMP**, the **Role-Based Access Control (RBAC)** matrix must be granular enough to ensure data isolation while providing the **Regulator** and **SACCOS** teams with the tools needed for their specific operational duties.

Below is the comprehensive RBAC matrix for the platform.

---

### 1. Regulator Tier (Global Oversight)

These roles are assigned to government officials from the **Department of Co-operative Development (DCD)** and **Bank of Botswana (BoB)** and provide a "System-Wide View" across all tenants.

| Role | Access Level | Primary Permissions |
| --- | --- | --- |
| **DCD Director** | Read/Write (Global) | Manage SACCO registration, approve bye-laws, oversee cooperative compliance, and manage DCD accounts. |
| **DCD Field Officer** | Read-Only (Global) | Conduct field visits, verify cooperative principles adherence, and investigate compliance issues. |
| **DCD Compliance Officer** | Read-Only (Global) | Monitor cooperative compliance, review bye-laws, and ensure adherence to Co-operative Societies Act. |
| **BoB Prudential Supervisor** | Read/Write (Global) | Monitor financial stability, liquidity, and capital adequacy of deposit-taking SACCOs. |
| **BoB Financial Auditor** | Read-Only (Global) | Access any SACCO General Ledger, PAR reports, and financial records for prudential supervision. |
| **BoB Compliance Officer** | Read-Only (Global) | Review financial compliance, capital adequacy, and regulatory adherence for deposit-taking SACCOs. |
| **Deduction Officer** | Read/Write (Global) | Manage Government Payroll CSV engine, view consolidated deduction files, and resolve reconciliation issues. |

---

### 2. Tenant Tier (SACCOS Administration)

These roles are restricted to a single society's data. Staff in SACCOS A cannot see any data belonging to SACCOS B.

| Role | Access Level | Primary Permissions |
| --- | --- | --- |
| **SACCOS Admin** | Full Access (Tenant) | Setup Bye-Laws, create staff accounts, and manage high-level society configurations.


 |
| **Loan Officer** | Read/Write (Portfolio) | Process loan applications, manage guarantors, and update credit securities (including merchandise financing).

 |
| **Accountant** | Read/Write (Finance) | Manage General Ledger, process insurance premium payouts, vendor payments for merchandise, and generate financial statements.

 |
| **Member Service Rep** | Read/Write (CRM) | Onboard members, update KYC/Beneficiary data, and assist with insurance claim submissions.

 |
| **Credit Committee** | Approval-Only | Digital sign-off on loan applications that exceed a certain threshold, without permission to edit data.

 |

---

### 3. External & End-User Tier

These roles interact with specific transactional layers of the platform.

| Role | Access Level | Primary Permissions |
| --- | --- | --- |
| **Member** | Self-Service | View personal balances, apply for loans/merchandise, update own KYC, and track claims.

 |
| **External Auditor** | Read-Only (Limited) | Time-bound access to a specific tenant's financial records for annual auditing.

 |
| **Vendor** | Limited Portal | View purchase orders from SACCOS, update delivery status for merchandise, and track payment status.

 |

---

### 4. Permission Logic Details

* 
**Multi-Factor Authentication (MFA):** Mandatory for all Regulator and Admin roles.


* 
**Immutable Logs:** Every action taken by any role (e.g., "Accountant approved a payment") is written to a non-editable audit trail.


* 
**Separation of Duties:** The system prevents the same user from holding both the "Loan Officer" (Creator) and "Credit Committee" (Approver) roles to mitigate fraud risk.



---

### 5. Summary of System Roles

* 
**Regulator:** Oversight and system-wide policy enforcement.


* 
**Tenant (SACCOS Staff):** Operational management of the society.


* 
**Member:** Access to personal financial data and self-service.


