This logic is critical for maintaining high-integrity data between the SACCOS (Tenant), the Government Payroll System, and the Employer payrolls. The following specification outlines the **Delta-Based Deduction Engine** and the **Full-State Reconciliation Module**.

---

## 1. Delta-Based Deduction Engine (Tenant View)

The system must be "state-aware," comparing the current billing cycle to the previous one to identify changes.

* **Change-Detection Logic:** The engine scans for specific "Triggers of Change" to include a member in the monthly CSV:
* 
**New Enrollments:** Addition of new policies, savings plans, or loan repayments.


* 
**Status Changes:** Exits due to death, resignation, or retirement.


* 
**Policy Maturity:** Completion of a loan or fixed-term insurance policy.


* 
**Manual Adjustments:** Member-initiated increases or decreases in voluntary savings.




* 
**CSV Generation:** The platform generates the file formatted specifically to the **Government Payroll System** CSV specifications.


* **Pre-Submission Validation:** A "dry-run" check to ensure the total deduction amount for the tenant remains within any global caps set by the regulator.

---

## 2. Full-State Reconciliation Module (Regulator to Tenant)

While the tenant only sends "updates," the MoF provides a "Full Snapshot" of what was actually deducted from salaries. This is used for "Gap Analysis."

* **Bulk File Ingestion:** The platform receives the MoF return file containing all member deductions for that period.
* **Three-Way Matching:** The system automatically performs a match between:
1. **Expected Deduction:** What the SACCOS system calculated for the month.
2. **Requested Deduction:** The Delta CSV sent to the MoF.
3. **Actual Deduction:** The amount returned in the MoF's full-state list.


* **Variance Flagging:** The system highlights discrepancies (e.g., if a member was in the MoF list but the deduction was  due to "Net Pay Too Low").
* 
**Automated Journaling:** Upon successful reconciliation, the **Accounting Module** automatically credits individual member accounts and the General Ledger.



---

## 3. Detailed Logic Flow

| Action | Party | Data Scope | System Requirement |
| --- | --- | --- | --- |
| **Deduction Request** | **Tenant (SACCOS)** | **Delta Only** | Filter: `Current_Period_Amount != Previous_Period_Amount` |
| **Deduction Processing** | **MoF (Regulator)** | **Full List** | Processing of all active instructions on payroll.

 |
| **Reconciliation** | **Tenant (SACCOS)** | **Full List** | Match MoF records against internal member sub-ledgers.

 |

---

## 4. Operational Guardrails

* 
**Versioned CSV Engine:** If the MoF updates their CSV format, the system can update the engine without losing historical "Delta" records.


* 
**Orphan Record Handling:** If the MoF returns a deduction for a member who is "Inactive" in the SACCOS, the system parks the funds in a **Suspense Account** for manual investigation by the Accountant.


* 
**Audit Trail:** Every variance identified during reconciliation is logged, noting the reason for the mismatch (e.g., "Insufficient Funds," "Member Terminated").



---

### Summary of Benefits

* **Reduced File Size:** Sending only changes minimizes the risk of bulk data corruption and reduces processing time at the Ministry.
* **Total Accuracy:** Receiving a full list back ensures that even members whose deductions *didn't* change are verified every single month, preventing "silent failures" in collection.

