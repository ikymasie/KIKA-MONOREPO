

## 1. Tenant Features (SACCOS Administration)

As a tenant, the SACCOS admin manages the day-to-day operations, finances, and member lifecycle.

### Member & Portfolio Management

* **KYC & Onboarding**: Register members manually or via bulk import, capturing bio-data, national ID/passport, and employment details.
* **Share & Savings Management**: Define and manage different savings products (e.g., Main Savings, Fixed Deposits) and track member shareholdings.
* **Deduction Management**: Generate and upload deduction files (CSV) for employer or Government payroll systems and reconcile incoming payments.

### Credit & Loan Operations

* **Loan Product Factory**: Configure unlimited loan products with specific interest rates, repayment periods, and eligibility rules.
* **Loan Lifecycle**: Manage the full process from application review to digital disbursement and automated repayment tracking.
* **Guarantor Tracking**: Digitally capture and manage member-to-member loan guarantees.

### Finance & Compliance

* **Automated Accounting**: A built-in General Ledger that automates journal entries for every transaction, including interest and penalty calculations.
* **Regulatory Reporting**: One-click generation of statutory reports (e.g., Trial Balance, Balance Sheet, and PAR reports) for the Regulator.
* **Audit Trail**: An electronic record of every action taken by staff to prevent fraud and ensure accountability.

---

## 2. Customer Features (Member Self-Service)

The member portal (Web and Mobile) empowers the end-user with 24/7 access to their financial information.

### Personal Financial Dashboard

* **Account Summary**: View real-time balances for savings, total share capital, and outstanding loan amounts.
* **Digital Statements**: Generate and download detailed transaction statements for any period.
* **Next Repayment Alert**: Visual countdown and notifications for the next loan installment due date.

### Transactional Services

* **Loan Application**: Apply for loans digitally by uploading required documents directly through the app.
* **Guarantor Management**: Accept or reject requests from fellow members to act as a guarantor for their loans.
* **Contribution Tracking**: Track monthly salary deductions to ensure they have been successfully credited to the member's account.

### Communication & Support

* **Automated Notifications**: Receive instant SMS or Email alerts for deposits, withdrawals, and loan approvals.
* **Self-Service KYC**: Update personal contact details or beneficiary/next-of-kin information without visiting an office.

| Feature | Tenant (Admin) | Customer (Member) |
| --- | --- | --- |
| **Loan Setup** | Configures loan rules/rates | Applies based on rules |
| **Reports** | Sector/Society-wide analytics | Personal account statements |
| **Data Control** | Approves/Rejects entries | Initiates requests/updates |
| **Visibility** | 360° view of all members | Private view of own account |

 In a Botswana context, SACCOS are often more than just credit providers; they act as retail hubs and insurance aggregators for their members. The **MTSMMP** architecture supports this through a "Product Factory" that handles diverse non-credit products.

Here is the system specification for the **Insurance and Merchandise Modules**:

---

## 1. Insurance Products Module

Rather than just a "funeral scheme," this module treats insurance as a configurable subscription product. 

* **Group Scheme Management:** Allows the SACCOS to act as a master policyholder for third-party insurers (e.g., Botswana Life or Hollard).
* 
**Premium Collection Engine:** Automatically adds insurance premiums to the monthly deduction file generated for the Government Payroll System. 


* 
**Dependant & Beneficiary Registry:** Captures specific data required for insurance underwriting, including age limits for children and extended family members. 


* 
**Waiting Period Logic:** Automated "cooling-off" or waiting period tracking where the system prevents claim payouts if the member has not contributed for the required duration (e.g., 6 months). 


* 
**Claims Workflow:** A digital submission portal for death certificates or medical reports, which are then routed to the insurer for payout. 



---

## 2. Merchandise & Asset Financing Module

This module handles the sale of physical goods (e.g., tractors for farming co-ops, electronics, or building materials) via the platform.

* **Vendor Catalog:** A sub-module for the SACCOS to list approved vendors and their products.
* **Hire Purchase & Installment Logic:** * Calculates monthly installments for physical goods separate from interest-bearing cash loans.
* Supports "In-Kind" loans where the member receives the item, but the SACCOS pays the vendor directly.


* **Inventory Tracking (Basic):** Tracks the quantity of merchandise held by the SACCOS (if they keep stock) or the status of orders from external suppliers.
* **Asset Register:** Automatically adds high-value merchandise (like vehicles or equipment) to the member’s "collateral profile," which can be used to secure future cash loans.

---

## 3. Integrated Accounting for Multi-Product Sales

The **Accounting Module** must differentiate these revenue streams to satisfy bank lending requirements.

* **Sub-Ledger Separation:**
* **Ledger A:** Interest Income (from cash loans).
* **Ledger B:** Commission Income (from insurance premiums).
* **Ledger C:** Trading Income (from merchandise markups).


* 
**Payout Automation:** When a member buys merchandise, the system generates a payment voucher for the vendor, ensuring the SACCOS's books stay balanced. 



---

## 4. Member Self-Service (Insurance & Merchandise)

Members can manage these products via the same portal used for their savings. 

* 
**Marketplace View:** A digital storefront where members can browse available merchandise or insurance packages. 


* 
**Coverage Certificate:** Instant download of insurance "Member Certificates" to prove coverage. 


* 
**Order Tracking:** Status updates for merchandise (e.g., "Ordered," "At Warehouse," "Ready for Collection"). 



---

### Comparison of Product Types in MTSMMP

| Feature | Cash Loans | Insurance | Merchandise |
| --- | --- | --- | --- |
| **Primary Goal** | Liquidity | Risk Protection | Asset Acquisition |
| **System Trigger** | Interest Rate | Monthly Premium | Purchase Price |
| **Regulatory View** | PAR & Credit Risk | Actuarial/Underwriting | Inventory & Vendor Debt |
| **Member Benefit** | Cash in hand | Peace of mind | Tangible goods |

 