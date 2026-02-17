Given the high variability in tenant data maturity—ranging from paper records/Excel to legacy SQL databases—the best strategy is an **"Airlock" Staging Strategy**.

This approach avoids importing data directly into your clean production database. Instead, all data enters a temporary "Staging Area" (the Airlock) where it must pass strict validation rules before being "promoted" to the live system.

Here is the comprehensive Data Migration Strategy for the MTSMMP:

### 1. The "Airlock" Architecture

This is a quarantine zone within the platform where uploaded data sits. It allows tenants to upload, view errors, correct them, and re-validate *without* corrupting the main database.

* **Zone A: Raw Import (The Dump):** Accepts data "as is" (CSV, Excel, JSON).
* **Zone B: Validation & Transformation:** The system runs scripts to check data quality (e.g., "Is the ID Number valid?", "Does the loan balance match the repayment schedule?").
* **Zone C: Production Load:** Only clean, validated rows are moved into the actual MTSMMP database.

---

### 2. Path A: For Tenants with No Database (Paper/Excel)

For SACCOS operating on spreadsheets or physical ledgers, you must provide a **Standardized Digital Template**.

* **The "Golden Template":** The platform generates a strict Excel/CSV template with locked headers (e.g., `Member_ID`, `First_Name`, `Savings_Balance`, `Loan_ID`).
* **Self-Service Upload Wizard:**
1. Tenant downloads the template from the portal.
2. Tenant (or data clerk) fills in the rows.
3. Tenant uploads the file.
4. **Real-Time Feedback:** The system immediately flags rows with errors (e.g., "Row 45: Invalid Phone Number format"). The tenant fixes the Excel file and re-uploads.



### 3. Path B: For Tenants with Legacy Databases (Inconsistent Structures)

For SACCOS with existing but messy SQL/Access databases, you need a **Field Mapping Tool**.

* **Schema Discovery:** The migration team extracts the legacy data into a flat file (CSV).
* **The "Mapper" Interface:** A UI tool where the admin maps the "Old Column" to the "New Column."
* *Example:* Map Legacy Column `User_DOB`  MTSMMP Column `Date_of_Birth`.
* *Example:* Map Legacy Status `Active_M`  MTSMMP Status `ACTIVE`.


* **Transformation Scripts:** Automated scripts handle simple conversions (e.g., converting "Male/Female" text to "M/F" codes).

---

### 4. Critical Validation Rules (The "Gatekeepers")

The "Airlock" must enforce these rules before allowing data into Production:

| Category | Validation Rule | Action on Fail |
| --- | --- | --- |
| **Identity** | National ID must be unique and valid format. | Reject Row |
| **Financial** | `Total Savings` + `Total Loans` must equal `Member Equity`. | Flag for Review |
| **Products** | Member cannot have a loan product that doesn't exist in config. | Default to "Generic Loan" |
| **Mandatory** | Name, Surname, DOB, and Mobile Number must be present. | Reject Row |

---

### 5. The "Opening Balance" Problem

Migrating financial history (every transaction from 10 years ago) is risky and unnecessary. The best practice is **Balance Forward Migration**.

* **Cutover Date:** Pick a specific date (e.g., 1st of the Month).
* **Snapshot Migration:** You only migrate the *closing balance* of that date.
* *Migration:* `Member A` has Savings: P 5,000.00 and Loan: P 2,500.00.
* *Archive:* The full 10-year transaction history is kept as a PDF/Read-Only file attached to the member's profile for reference, but *not* imported as active ledger lines.


* **Audit Trail:** The system creates a generic system user called "MIGRATION_BOT" that logs these initial balances as "Opening Balance" entries in the General Ledger.

---

### 6. Post-Migration "Spot Check" Workflow

Before a tenant goes "Live," they must sign off on the migration.

1. **Parallel Run:** For the first month, the SACCOS runs the old system (Excel/Paper) and the new MTSMMP side-by-side.
2. **Variance Report:** At month-end, the platform generates a report comparing the two.
* *If variance = 0:* Sign-off and Go Live.
* *If variance > 0:* Investigate specific members and adjust the Opening Balance.

 