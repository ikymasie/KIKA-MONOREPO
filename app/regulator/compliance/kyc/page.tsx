'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import RegulatorSidebar from '@/components/layout/RegulatorSidebar';

interface KYCVerification {
    id: string;
    member: {
        id: string;
        fullName: string;
        memberNumber: string;
        tenant: {
            id: string;
            name: string;
        };
    };
    identityVerified: boolean;
    residenceVerified: boolean;
    incomeVerified: boolean;
    proofOfIdentityUrl?: string;
    proofOfResidenceUrl?: string;
    proofOfIncomeUrl?: string;
    notes?: string;
}

export default function KYCVerificationPage() {
    const [verifications, setVerifications] = useState<KYCVerification[]>([]);
    const [selectedKYC, setSelectedKYC] = useState<KYCVerification | null>(null);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [verifyingDoc, setVerifyingDoc] = useState<string | null>(null);
    const [batchLoading, setBatchLoading] = useState(false);

    useEffect(() => {
        fetchVerifications();
    }, []);

    async function fetchVerifications() {
        try {
            const response = await fetch('/api/regulator/kyc/verify');
            if (!response.ok) throw new Error('Failed to fetch KYC verifications');
            const data = await response.json();
            setVerifications(data.verifications || []);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    async function verifyDocument(kycId: string, documentType: string, verified: boolean, notes?: string) {
        setVerifyingDoc(documentType);
        try {
            const response = await fetch(`/api/regulator/kyc/verify/${kycId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ documentType, verified, notes }),
            });

            if (!response.ok) throw new Error('Failed to verify document');

            await fetchVerifications();
            if (selectedKYC?.id === kycId) {
                const updatedResponse = await fetch(`/api/regulator/kyc/verify/${kycId}`);
                const updatedKYC = await updatedResponse.json();
                setSelectedKYC(updatedKYC);
            }
        } catch (err: any) {
            alert(`Error: ${err.message}`);
        } finally {
            setVerifyingDoc(null);
        }
    }

    async function handleBatchVerify() {
        if (selectedIds.length === 0) return;
        if (!confirm(`Are you sure you want to verify ${selectedIds.length} KYC records in bulk?`)) return;

        setBatchLoading(true);
        try {
            const response = await fetch('/api/regulator/kyc/batch-verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    kycIds: selectedIds,
                    verifiedBy: 'CURRENT_USER_ID', // TODO: Get from auth context
                    verified: true,
                    notes: 'Bulk verified via Compliance Portal'
                }),
            });

            if (!response.ok) throw new Error('Failed to perform batch verification');

            await fetchVerifications();
            setSelectedIds([]);
            setSelectedKYC(null);
            alert('Batch verification completed successfully');
        } catch (err: any) {
            alert(`Error: ${err.message}`);
        } finally {
            setBatchLoading(false);
        }
    }

    const toggleSelection = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    if (loading) {
        return (
            <DashboardLayout sidebar={<RegulatorSidebar />}>
                <div className="p-8 flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading KYC verifications...</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout sidebar={<RegulatorSidebar />}>
            <div className="p-8">
                <div className="mb-8 flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">KYC Verification Queue</h1>
                        <p className="text-gray-600 mt-2">
                            Review and verify member KYC documents across all SACCOs
                        </p>
                    </div>
                    {selectedIds.length > 0 && (
                        <button
                            onClick={handleBatchVerify}
                            disabled={batchLoading}
                            className="btn btn-primary flex items-center gap-2"
                        >
                            {batchLoading ? 'Processing...' : `Bulk Verify (${selectedIds.length})`}
                        </button>
                    )}
                </div>

                {error && (
                    <div className="bg-danger-50 border border-danger-200 rounded-lg p-4 mb-6">
                        <p className="text-danger-700">Error: {error}</p>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Verification Queue */}
                    <div className="card p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold">
                                Pending Verifications ({verifications.length})
                            </h2>
                            {verifications.length > 0 && (
                                <button
                                    onClick={() => setSelectedIds(selectedIds.length === verifications.length ? [] : verifications.map(v => v.id))}
                                    className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                                >
                                    {selectedIds.length === verifications.length ? 'Deselect All' : 'Select All'}
                                </button>
                            )}
                        </div>
                        <div className="space-y-3 max-h-[600px] overflow-y-auto custom-scrollbar">
                            {verifications.length === 0 ? (
                                <p className="text-gray-600 text-center py-8">
                                    No pending KYC verifications
                                </p>
                            ) : (
                                verifications.map((kyc) => (
                                    <div
                                        key={kyc.id}
                                        onClick={() => setSelectedKYC(kyc)}
                                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all flex items-start gap-4 ${selectedKYC?.id === kyc.id
                                            ? 'border-primary-500 bg-primary-50'
                                            : 'border-gray-200 hover:border-primary-300'
                                            }`}
                                    >
                                        <div className="pt-1">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.includes(kyc.id)}
                                                onChange={() => { }} // Controlled by toggleSelection
                                                onClick={(e) => toggleSelection(e, kyc.id)}
                                                className="h-4 w-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-medium text-gray-900">
                                                {kyc.member.fullName}
                                            </div>
                                            <div className="text-sm text-gray-600">
                                                {kyc.member.memberNumber} • {kyc.member.tenant.name}
                                            </div>
                                            <div className="flex gap-2 mt-2">
                                                {!kyc.identityVerified && (
                                                    <span className="px-2 py-1 bg-warning-100 text-warning-700 text-xs rounded">
                                                        ID Pending
                                                    </span>
                                                )}
                                                {!kyc.residenceVerified && (
                                                    <span className="px-2 py-1 bg-warning-100 text-warning-700 text-xs rounded">
                                                        Residence Pending
                                                    </span>
                                                )}
                                                {!kyc.incomeVerified && (
                                                    <span className="px-2 py-1 bg-warning-100 text-warning-700 text-xs rounded">
                                                        Income Pending
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Document Viewer & Verification */}
                    <div className="card p-6">
                        {selectedKYC ? (
                            <>
                                <h2 className="text-xl font-semibold mb-4">
                                    Verify Documents
                                </h2>
                                <div className="mb-6">
                                    <div className="text-lg font-medium text-gray-900">
                                        {selectedKYC.member.fullName}
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        {selectedKYC.member.memberNumber} • {selectedKYC.member.tenant.name}
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    {/* Identity Document */}
                                    <div className="border rounded-lg p-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <h3 className="font-semibold">Proof of Identity</h3>
                                            {selectedKYC.identityVerified ? (
                                                <span className="px-3 py-1 bg-success-100 text-success-700 text-sm rounded-full">
                                                    ✓ Verified
                                                </span>
                                            ) : (
                                                <span className="px-3 py-1 bg-warning-100 text-warning-700 text-sm rounded-full">
                                                    Pending
                                                </span>
                                            )}
                                        </div>
                                        {selectedKYC.proofOfIdentityUrl ? (
                                            <>
                                                <a
                                                    href={selectedKYC.proofOfIdentityUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-primary-600 hover:text-primary-700 text-sm mb-3 block"
                                                >
                                                    View Document →
                                                </a>
                                                {!selectedKYC.identityVerified && (
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => verifyDocument(selectedKYC.id, 'identity', true)}
                                                            disabled={verifyingDoc === 'identity'}
                                                            className="btn btn-success px-4 py-2 text-sm"
                                                        >
                                                            Approve
                                                        </button>
                                                        <button
                                                            onClick={() => verifyDocument(selectedKYC.id, 'identity', false, 'Document rejected')}
                                                            disabled={verifyingDoc === 'identity'}
                                                            className="btn btn-danger px-4 py-2 text-sm"
                                                        >
                                                            Reject
                                                        </button>
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <p className="text-sm text-gray-500">No document uploaded</p>
                                        )}
                                    </div>

                                    {/* Residence Document */}
                                    <div className="border rounded-lg p-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <h3 className="font-semibold">Proof of Residence</h3>
                                            {selectedKYC.residenceVerified ? (
                                                <span className="px-3 py-1 bg-success-100 text-success-700 text-sm rounded-full">
                                                    ✓ Verified
                                                </span>
                                            ) : (
                                                <span className="px-3 py-1 bg-warning-100 text-warning-700 text-sm rounded-full">
                                                    Pending
                                                </span>
                                            )}
                                        </div>
                                        {selectedKYC.proofOfResidenceUrl ? (
                                            <>
                                                <a
                                                    href={selectedKYC.proofOfResidenceUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-primary-600 hover:text-primary-700 text-sm mb-3 block"
                                                >
                                                    View Document →
                                                </a>
                                                {!selectedKYC.residenceVerified && (
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => verifyDocument(selectedKYC.id, 'residence', true)}
                                                            disabled={verifyingDoc === 'residence'}
                                                            className="btn btn-success px-4 py-2 text-sm"
                                                        >
                                                            Approve
                                                        </button>
                                                        <button
                                                            onClick={() => verifyDocument(selectedKYC.id, 'residence', false, 'Document rejected')}
                                                            disabled={verifyingDoc === 'residence'}
                                                            className="btn btn-danger px-4 py-2 text-sm"
                                                        >
                                                            Reject
                                                        </button>
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <p className="text-sm text-gray-500">No document uploaded</p>
                                        )}
                                    </div>

                                    {/* Income Document */}
                                    <div className="border rounded-lg p-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <h3 className="font-semibold">Proof of Income</h3>
                                            {selectedKYC.incomeVerified ? (
                                                <span className="px-3 py-1 bg-success-100 text-success-700 text-sm rounded-full">
                                                    ✓ Verified
                                                </span>
                                            ) : (
                                                <span className="px-3 py-1 bg-warning-100 text-warning-700 text-sm rounded-full">
                                                    Pending
                                                </span>
                                            )}
                                        </div>
                                        {selectedKYC.proofOfIncomeUrl ? (
                                            <>
                                                <a
                                                    href={selectedKYC.proofOfIncomeUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-primary-600 hover:text-primary-700 text-sm mb-3 block"
                                                >
                                                    View Document →
                                                </a>
                                                {!selectedKYC.incomeVerified && (
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => verifyDocument(selectedKYC.id, 'income', true)}
                                                            disabled={verifyingDoc === 'income'}
                                                            className="btn btn-success px-4 py-2 text-sm"
                                                        >
                                                            Approve
                                                        </button>
                                                        <button
                                                            onClick={() => verifyDocument(selectedKYC.id, 'income', false, 'Document rejected')}
                                                            disabled={verifyingDoc === 'income'}
                                                            className="btn btn-danger px-4 py-2 text-sm"
                                                        >
                                                            Reject
                                                        </button>
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <p className="text-sm text-gray-500">No document uploaded</p>
                                        )}
                                    </div>

                                    {/* Notes */}
                                    {selectedKYC.notes && (
                                        <div className="border rounded-lg p-4 bg-gray-50">
                                            <h3 className="font-semibold mb-2">Notes</h3>
                                            <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                                {selectedKYC.notes}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-12 text-gray-500">
                                Select a KYC record to review documents
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
