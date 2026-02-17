'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import RegulatorSidebar from '@/components/layout/RegulatorSidebar';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function BulkAssignment() {
    const router = useRouter();
    const [applications, setApplications] = useState<any[]>([]);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [officers, setOfficers] = useState<any[]>([]);
    const [targetRole, setTargetRole] = useState<'intelligence' | 'legal' | null>(null);
    const [assignedOfficerId, setAssignedOfficerId] = useState('');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        async function fetchData() {
            try {
                const [appRes, usersRes] = await Promise.all([
                    fetch('/api/registration/applications'),
                    fetch('/api/regulator/users')
                ]);

                if (appRes.ok) {
                    const apps = await appRes.json();
                    // Show only applications that are in intake_verified / under_review stage
                    setApplications(apps.filter((a: any) => a.status === 'under_review'));
                }
                if (usersRes.ok) setOfficers(await usersRes.json());
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    const toggleSelect = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleBulkAssign = async () => {
        if (selectedIds.length === 0 || !targetRole || !assignedOfficerId) return;
        setProcessing(true);
        try {
            const res = await fetch('/api/registration/bulk-assign', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    applicationIds: selectedIds,
                    officerId: assignedOfficerId,
                    role: targetRole,
                    notes
                })
            });

            if (res.ok) {
                router.push('/registry/dashboard');
            } else {
                alert('Bulk assignment failed');
            }
        } catch (e) {
            console.error(e);
        } finally {
            setProcessing(false);
        }
    };

    return (
        <DashboardLayout sidebar={<RegulatorSidebar />}>
            <div className="p-8 max-w-6xl mx-auto">
                <header className="mb-8">
                    <Link href="/registry/dashboard" className="text-sm text-primary-600 hover:underline mb-2 block font-bold uppercase tracking-wider">← Workspace</Link>
                    <h1 className="text-3xl font-bold">Bulk Workflow Assignment</h1>
                    <p className="text-gray-600">Assign multiple applications to specific review pipelines in one action.</p>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        <div className="card overflow-hidden">
                            <div className="bg-gray-50 p-4 border-b border-gray-100 flex justify-between items-center">
                                <h2 className="font-bold">Select Applications ({selectedIds.length} selected)</h2>
                                <button
                                    onClick={() => setSelectedIds(selectedIds.length === applications.length ? [] : applications.map(a => a.id))}
                                    className="text-xs font-bold text-primary-600 hover:underline"
                                >
                                    {selectedIds.length === applications.length ? 'Deselect All' : 'Select All'}
                                </button>
                            </div>
                            <div className="divide-y divide-gray-50 max-h-[600px] overflow-y-auto">
                                {loading ? (
                                    <div className="p-8 text-center text-gray-500 italic">Loading applications...</div>
                                ) : applications.length === 0 ? (
                                    <div className="p-8 text-center text-gray-500 italic">No applications pending assignment.</div>
                                ) : (
                                    applications.map(app => (
                                        <div
                                            key={app.id}
                                            onClick={() => toggleSelect(app.id)}
                                            className={`p-4 flex items-center gap-4 cursor-pointer transition-colors ${selectedIds.includes(app.id) ? 'bg-primary-50' : 'hover:bg-gray-50'}`}
                                        >
                                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${selectedIds.includes(app.id) ? 'bg-primary-500 border-primary-500' : 'border-gray-200 bg-white'}`}>
                                                {selectedIds.includes(app.id) && <span className="text-white text-[10px]">✓</span>}
                                            </div>
                                            <div className="flex-1">
                                                <div className="font-semibold text-gray-900">{app.proposedName}</div>
                                                <div className="text-xs text-gray-500 flex gap-3">
                                                    <span>{app.fileNumber}</span>
                                                    <span>•</span>
                                                    <span>{app.applicationType?.replace('_', ' ')}</span>
                                                </div>
                                            </div>
                                            <div className="text-xs font-medium px-2 py-1 bg-white border border-gray-100 rounded text-gray-600">
                                                {new Date(app.submittedAt).toLocaleDateString()}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <section className="card p-6 border-t-4 border-primary-500 shadow-xl">
                            <h2 className="text-lg font-bold mb-6">Assignment Configuration</h2>

                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">Workflow Step</label>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => { setTargetRole('intelligence'); setAssignedOfficerId(''); }}
                                            className={`flex-1 py-3 rounded-xl border-2 text-sm font-bold transition-all ${targetRole === 'intelligence' ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-100 bg-white text-gray-400 hover:border-gray-200'}`}
                                        >
                                            Intelligence
                                        </button>
                                        <button
                                            onClick={() => { setTargetRole('legal'); setAssignedOfficerId(''); }}
                                            className={`flex-1 py-3 rounded-xl border-2 text-sm font-bold transition-all ${targetRole === 'legal' ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-100 bg-white text-gray-400 hover:border-gray-200'}`}
                                        >
                                            Legal
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">Assign to Officer</label>
                                    <select
                                        className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-primary-500 bg-white text-sm"
                                        value={assignedOfficerId}
                                        onChange={(e) => setAssignedOfficerId(e.target.value)}
                                        disabled={!targetRole}
                                    >
                                        <option value="">Select an officer...</option>
                                        {officers.filter((o: any) => {
                                            if (targetRole === 'intelligence') return o.role === 'intelligence_liaison';
                                            if (targetRole === 'legal') return o.role === 'legal_officer';
                                            return false;
                                        }).map((o: any) => (
                                            <option key={o.id} value={o.id}>{o.firstName} {o.lastName}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-3">
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">Global Rationale</label>
                                    <textarea
                                        className="w-full h-32 p-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 outline-none text-sm"
                                        placeholder="Internal notes for this batch assignment..."
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                    />
                                </div>

                                <button
                                    onClick={handleBulkAssign}
                                    disabled={selectedIds.length === 0 || !targetRole || !assignedOfficerId || processing}
                                    className="w-full btn btn-primary py-4 rounded-2xl font-bold shadow-lg shadow-primary-500/20 disabled:opacity-50 transition-all active:scale-[0.98]"
                                >
                                    {processing ? 'Processing Batch...' : `Assign ${selectedIds.length} Applications`}
                                </button>
                            </div>
                        </section>

                        <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                            <h3 className="text-amber-800 font-bold text-sm mb-1 flex items-center gap-2">
                                <span>⚠️</span> Batch Action Warning
                            </h3>
                            <p className="text-xs text-amber-700 leading-relaxed">
                                Bulk assignment will move all selected applications to the next review stage and notify the assigned officer. This action cannot be undone as a batch.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
