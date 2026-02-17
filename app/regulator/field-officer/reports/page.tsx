'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import RegulatorSidebar from '@/components/layout/RegulatorSidebar';

interface FieldReport {
    id: string;
    tenant: { name: string };
    submittedBy: { firstName: string, lastName: string };
    createdAt: string;
    generalFindings: string;
    memberVerificationResults: {
        verifiedCount: number;
        totalChecked: number;
    };
}

export default function FieldReportsPage() {
    const [reports, setReports] = useState<FieldReport[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchReports() {
            try {
                const res = await fetch('/api/regulator/field-reports');
                if (res.ok) {
                    const data = await res.json();
                    setReports(data);
                }
            } catch (error) {
                console.error('Failed to fetch reports:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchReports();
    }, []);

    return (
        <DashboardLayout sidebar={<RegulatorSidebar />}>
            <div className="p-8 max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">Submitted Field Reports</h1>
                    <p className="text-gray-600">History of all on-site inspections and reports.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {reports.length === 0 ? (
                        <div className="col-span-full py-12 text-center text-gray-500 card bg-gray-50/50">
                            No reports submitted yet.
                        </div>
                    ) : (
                        reports.map((report) => (
                            <div key={report.id} className="card p-6 bg-white shadow-sm hover:shadow-md transition-all border-white/40 flex flex-col">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="font-bold text-lg text-gray-900">{report.tenant.name}</h3>
                                        <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">{new Date(report.createdAt).toLocaleDateString()}</p>
                                    </div>
                                    <div className="bg-primary-50 text-primary-700 px-3 py-1 rounded-full text-xs font-bold">
                                        REPORT
                                    </div>
                                </div>

                                <div className="mb-4 flex-1">
                                    <p className="text-sm text-gray-600 line-clamp-3 italic mb-4">"{report.generalFindings}"</p>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="bg-gray-50 p-2 rounded-lg text-center">
                                            <p className="text-[10px] text-gray-400 font-bold uppercase">Verified</p>
                                            <p className="text-lg font-bold text-success-600">{report.memberVerificationResults?.verifiedCount || 0}</p>
                                        </div>
                                        <div className="bg-gray-50 p-2 rounded-lg text-center">
                                            <p className="text-[10px] text-gray-400 font-bold uppercase">Total Checked</p>
                                            <p className="text-lg font-bold text-gray-700">{report.memberVerificationResults?.totalChecked || 0}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 border-t flex justify-between items-center text-xs">
                                    <span className="text-gray-500">By: {report.submittedBy.firstName} {report.submittedBy.lastName}</span>
                                    <button className="text-primary-600 font-bold hover:underline">View Full Report →</button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
