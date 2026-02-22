import { useState } from 'react';

interface KYCVerificationProps {
    memberId: string;
    kycData: any;
    onUpdate: () => void;
}

export default function KYCVerification({ memberId, kycData, onUpdate }: KYCVerificationProps) {
    const [loading, setLoading] = useState<string | null>(null);

    async function updateKYC(field: string, value: any) {
        setLoading(field);
        try {
            const response = await fetch(`/api/admin/members/${memberId}/kyc`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ [field]: value }),
            });

            if (!response.ok) throw new Error('Failed to update');
            onUpdate();
        } catch (error) {
            console.error(error);
            alert('Failed to update KYC status');
        } finally {
            setLoading(null);
        }
    }

    const VerificationCard = ({ title, verified, verifyField, children }: any) => (
        <div className={`card overflow-hidden border-2 ${verified ? 'border-success-100' : 'border-gray-100'}`}>
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <h3 className="font-bold text-gray-900">{title}</h3>
                <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 text-xs font-bold rounded-full ${verified ? 'bg-success-100 text-success-700' : 'bg-warning-100 text-warning-700'}`}>
                        {verified ? 'VERIFIED' : 'PENDING'}
                    </span>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <div className="relative inline-block w-10 h-6 align-middle select-none transition duration-200 ease-in">
                            <input
                                type="checkbox"
                                name="toggle"
                                className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer border-gray-300 checked:right-0 checked:border-success-500"
                                checked={verified}
                                onChange={(e) => updateKYC(verifyField, e.target.checked)}
                                disabled={loading === verifyField}
                            />
                            <label className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${verified ? 'bg-success-500' : 'bg-gray-300'}`}></label>
                        </div>
                    </label>
                </div>
            </div>
            <div className="p-6">
                {children}
            </div>
        </div>
    );

    const DocumentLink = ({ label, url, expiryDate }: any) => (
        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg mb-2">
            <div>
                <p className="text-sm font-semibold text-gray-700">{label}</p>
                {expiryDate && (
                    <p className={`text-xs ${new Date(expiryDate) < new Date() ? 'text-danger-600 font-bold' : 'text-gray-500'}`}>
                        Expires: {new Date(expiryDate).toLocaleDateString()}
                    </p>
                )}
            </div>
            {url ? (
                <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:text-primary-800 text-sm font-bold flex items-center gap-1"
                >
                    View
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                </a>
            ) : (
                <span className="text-gray-400 text-xs italic">Not Uploaded</span>
            )}
        </div>
    );

    if (!kycData) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-500">No KYC record found for this member.</p>
                <button
                    onClick={() => updateKYC('identityVerified', false)}
                    className="mt-4 btn btn-primary"
                >
                    Initialize KYC Record
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* PIP Warning */}
            {kycData.isPip && (
                <div className="bg-danger-50 border-l-4 border-danger-500 p-4 rounded-r-lg">
                    <div className="flex items-start">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-danger-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-bold text-danger-800 uppercase tracking-wide">
                                Prominent Influential Person (PIP)
                            </h3>
                            <div className="mt-2 text-sm text-danger-700">
                                <p>This member has declared themselves as a PIP.</p>
                                <p className="font-semibold mt-1">Position: {kycData.pipPosition || 'Unspecified'}</p>
                                <p>Declared: {kycData.pipDeclarationDate ? new Date(kycData.pipDeclarationDate).toLocaleDateString() : 'Unknown Date'}</p>
                            </div>
                        </div>
                        <div className="ml-auto">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <span className="text-xs font-bold text-danger-800">PIP VERIFIED</span>
                                <input
                                    type="checkbox"
                                    className="form-checkbox h-5 w-5 text-danger-600 rounded focus:ring-danger-500"
                                    checked={kycData.pipVerified}
                                    onChange={(e) => updateKYC('pipVerified', e.target.checked)}
                                />
                            </label>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Identity Verification */}
                <VerificationCard
                    title="1. Primary Identification"
                    verified={kycData.identityVerified}
                    verifyField="identityVerified"
                >
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs text-gray-500">Omang Number</label>
                                <p className="font-mono font-medium">{kycData.omangNumber || 'N/A'}</p>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500">Omang Expiry</label>
                                <p className="font-mono font-medium">{kycData.omangExpiryDate ? new Date(kycData.omangExpiryDate).toLocaleDateString() : 'N/A'}</p>
                            </div>
                        </div>
                        <div className="border-t border-gray-100 pt-4">
                            <DocumentLink label="Omang (Front)" url={kycData.omangFrontUrl} expiryDate={kycData.omangExpiryDate} />
                            <DocumentLink label="Omang (Back)" url={kycData.omangBackUrl} />
                            <DocumentLink label="Passport" url={kycData.passportUrl} expiryDate={kycData.passportExpiryDate} />
                            <DocumentLink label="Work Permit" url={kycData.workPermitUrl} expiryDate={kycData.workPermitExpiryDate} />
                        </div>
                    </div>
                </VerificationCard>

                {/* Residence Verification */}
                <VerificationCard
                    title="2. Proof of Residence"
                    verified={kycData.residenceVerified}
                    verifyField="residenceVerified"
                >
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs text-gray-500">Document Type</label>
                            <p className="font-medium capitalize">{kycData.residenceProofType?.replace('_', ' ') || 'Not Specified'}</p>
                        </div>
                        <DocumentLink label="Residence Document" url={kycData.proofOfResidenceUrl} expiryDate={kycData.residenceDocumentDate} />
                        {kycData.residenceDocumentDate && (
                            <p className="text-xs text-gray-500">Document Date: {new Date(kycData.residenceDocumentDate).toLocaleDateString()}</p>
                        )}
                    </div>
                </VerificationCard>

                {/* Income Verification */}
                <VerificationCard
                    title="3. Income & Wealth"
                    verified={kycData.incomeVerified}
                    verifyField="incomeVerified"
                >
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs text-gray-500">Income Source</label>
                            <p className="font-medium capitalize">{kycData.incomeSourceType?.replace('_', ' ') || 'Not Specified'}</p>
                        </div>
                        <DocumentLink label="Proof of Income (Payslip)" url={kycData.proofOfIncomeUrl} />
                        <DocumentLink label="Source of Funds Affidavit" url={kycData.sourceOfFundsAffidavitUrl} />
                    </div>
                </VerificationCard>

                {/* Notes Section */}
                <div className="col-span-1 md:col-span-2 card p-6">
                    <h3 className="font-bold text-gray-900 mb-4">Compliance Notes</h3>
                    <textarea
                        className="w-full border rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                        rows={3}
                        placeholder="Add internal notes regarding this member's risk profile..."
                        value={kycData.notes || ''}
                        onChange={(e) => {
                            // This should likely be debounced in a real app
                        }}
                        onBlur={(e) => updateKYC('notes', e.target.value)}
                    />
                </div>
            </div>
        </div>
    );
}
