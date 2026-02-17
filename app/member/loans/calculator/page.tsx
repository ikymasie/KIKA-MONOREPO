'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import MemberSidebar from '@/components/layout/MemberSidebar';
import LoanCalculator from '@/components/member/loans/LoanCalculator';

export default function LoanCalculatorPage() {
    return (
        <DashboardLayout sidebar={<MemberSidebar />}>
            <div className="p-8 max-w-6xl mx-auto">
                <div className="mb-10">
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">Loan Calculator</h1>
                    <p className="text-gray-500 font-medium text-lg mt-2">Plan your finances by calculating your estimated loan repayments.</p>
                </div>

                <LoanCalculator />

                <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="p-8 bg-gray-50 rounded-3xl">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">Repayment Guidelines</h3>
                        <ul className="space-y-3 text-sm text-gray-600 font-medium">
                            <li className="flex gap-3"><span>✅</span> Installments are deducted directly from payroll (Check-off).</li>
                            <li className="flex gap-3"><span>✅</span> Interest rates are calculated on reducing balance.</li>
                            <li className="flex gap-3"><span>✅</span> You must have sufficient savings ratio to qualify.</li>
                        </ul>
                    </div>
                    <div className="p-8 bg-indigo-50 rounded-3xl border border-indigo-100">
                        <h3 className="text-xl font-bold text-indigo-900 mb-4">Need Assistance?</h3>
                        <p className="text-sm text-indigo-700 font-medium mb-6">If you're unsure about which loan product suits you best, our member service representatives are here to help.</p>
                        <button className="py-3 px-6 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all">
                            Chat with Support
                        </button>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
