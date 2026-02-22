import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { storage } from '@/lib/firebase-client';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

interface KYCData {
    id?: string;
    identityVerified: boolean;
    residenceVerified: boolean;
    incomeVerified: boolean;
    pipVerified: boolean;
    isPip: boolean;
    pipPosition?: string;
    pipDeclarationDate?: string;
    [key: string]: any;
}

export default function KYCManagement() {
    const [kycData, setKycData] = useState<KYCData | null>(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchKYC();
    }, []);

    async function fetchKYC() {
        try {
            const res = await fetch('/api/member/kyc');
            const data = await res.json();
            setKycData(data.data || {});
        } catch (error) {
            console.error('Failed to fetch KYC data', error);
        } finally {
            setLoading(false);
        }
    }

    async function handleFileUpload(file: File, fieldBase: string) {
        if (!file) return;

        // Create a reference to 'kyc/<memberId>/<filename>'
        // We need memberId, but if we don't have it in state, we might need to fetch profile first
        // Or we can just use a timestamp based path if we don't care about folder structure too much for now
        // Ideally: `kyc_documents/${auth.currentUser.uid}/${file.name}`
        // But we don't have auth.currentUser directly available here easily without hook
        // Let's assume we use a simplified path with timestamp to avoid collision

        const timestamp = Date.now();
        const storageRef = ref(storage, `kyc_uploads/${timestamp}_${file.name}`);
        const uploadTask = uploadBytesResumable(storageRef, file);

        setUploading(fieldBase);

        uploadTask.on('state_changed',
            (snapshot) => {
                // Progress
            },
            (error) => {
                console.error(error);
                setUploading(null);
                alert('Upload failed');
            },
            async () => {
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                await updateKYCField(`${fieldBase}Url`, downloadURL);
                setUploading(null);
            }
        );
    }

    async function updateKYCField(field: string, value: any) {
        try {
            setSaving(true);
            const res = await fetch('/api/member/kyc', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ [field]: value }),
            });
            if (!res.ok) throw new Error('Failed to update');

            setKycData(prev => ({ ...prev!, [field]: value }));
        } catch (error) {
            console.error(error);
            alert('Failed to save changes');
        } finally {
            setSaving(false);
        }
    }

    const FileUpload = ({ label, fieldBase, currentUrl }: any) => (
        <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            <div className="flex items-center gap-4">
                <div className="flex-1">
                    <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={(e) => e.target.files && handleFileUpload(e.target.files[0], fieldBase)}
                        disabled={!!uploading}
                        className="block w-full text-sm text-gray-500
                            file:mr-4 file:py-2 file:px-4
                            file:rounded-full file:border-0
                            file:text-sm file:font-semibold
                            file:bg-primary-50 file:text-primary-700
                            hover:file:bg-primary-100"
                    />
                </div>
                {uploading === fieldBase && <span className="text-xs text-info-600 animate-pulse">Uploading...</span>}
            </div>
            {currentUrl && (
                <a href={currentUrl} target="_blank" rel="noopener noreferrer" className="block mt-2 text-xs text-primary-600 hover:underline flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    File Uploaded (Click to View)
                </a>
            )}
        </div>
    );

    if (loading) return <div className="animate-pulse h-64 bg-gray-100 rounded-xl"></div>;

    const data = kycData || {} as KYCData;

    return (
        <div className="space-y-8">
            <div className="card p-6 border border-gray-100 shadow-sm">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center justify-between">
                    <span>KYC Documents</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${data.identityVerified && data.residenceVerified && data.incomeVerified ? 'bg-success-100 text-success-700' : 'bg-warning-100 text-warning-800'}`}>
                        {data.identityVerified && data.residenceVerified && data.incomeVerified ? 'VERIFIED' : 'PENDING'}
                    </span>
                </h2>

                <div className="space-y-8">
                    {/* Identity Section */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${data.identityVerified ? 'bg-success-500' : 'bg-gray-300'}`}></span>
                            1. Proof of Identity
                        </h3>
                        {data.identityVerified ? (
                            <div className="p-4 bg-success-50 rounded-lg text-success-800 text-sm font-medium">
                                ✓ Identity documents verified. Contact support to make changes.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-6 rounded-xl">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">National ID / Omang Number</label>
                                    <input
                                        type="text"
                                        className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-primary-500"
                                        value={data.omangNumber || ''}
                                        onChange={(e) => setKycData(prev => ({ ...prev!, omangNumber: e.target.value }))}
                                        onBlur={(e) => updateKYCField('omangNumber', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                                    <input
                                        type="date"
                                        className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-primary-500"
                                        value={data.omangExpiryDate ? new Date(data.omangExpiryDate).toISOString().split('T')[0] : ''}
                                        onChange={(e) => updateKYCField('omangExpiryDate', e.target.value)}
                                    />
                                </div>
                                <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
                                    <FileUpload label="Omang (Front)" fieldBase="omangFront" currentUrl={data.omangFrontUrl} />
                                    <FileUpload label="Omang (Back)" fieldBase="omangBack" currentUrl={data.omangBackUrl} />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Residence Section */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${data.residenceVerified ? 'bg-success-500' : 'bg-gray-300'}`}></span>
                            2. Proof of Residence
                        </h3>
                        {data.residenceVerified ? (
                            <div className="p-4 bg-success-50 rounded-lg text-success-800 text-sm font-medium">
                                ✓ Residence verified.
                            </div>
                        ) : (
                            <div className="bg-gray-50 p-6 rounded-xl space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Document Type</label>
                                    <select
                                        className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-primary-500"
                                        value={data.residenceProofType || ''}
                                        onChange={(e) => updateKYCField('residenceProofType', e.target.value)}
                                    >
                                        <option value="">Select Document Type</option>
                                        <option value="utility_bill">Utility Bill (Water/Elec/Phone)</option>
                                        <option value="lease_agreement">Lease Agreement</option>
                                        <option value="police_affidavit">Police Affidavit</option>
                                        <option value="chief_letter">Letter from Kgosi</option>
                                    </select>
                                </div>
                                <FileUpload label="Upload Document" fieldBase="proofOfResidence" currentUrl={data.proofOfResidenceUrl} />
                            </div>
                        )}
                    </div>

                    {/* PIP Declaration */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${data.pipVerified ? 'bg-success-500' : 'bg-gray-300'}`}></span>
                            3. PIP Declaration
                        </h3>
                        <div className="bg-gray-50 p-6 rounded-xl">
                            <label className="flex items-start gap-3 mb-4 cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="mt-1 w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
                                    checked={data.isPip || false}
                                    onChange={(e) => {
                                        updateKYCField('isPip', e.target.checked);
                                        if (e.target.checked && !data.pipDeclarationDate) {
                                            updateKYCField('pipDeclarationDate', new Date().toISOString());
                                        }
                                    }}
                                />
                                <span className="text-sm text-gray-700">
                                    I declare that I am (or a close family member is) a <strong>Prominent Influential Person (PIP)</strong>.
                                    <br /><span className="text-xs text-gray-500">Includes: MP, Minister, Kgosi, Senior Govt Official, Judge, SOE Executive.</span>
                                </span>
                            </label>

                            {data.isPip && (
                                <div className="ml-8 mt-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Position / Role</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Member of Parliament"
                                        className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-primary-500"
                                        value={data.pipPosition || ''}
                                        onChange={(e) => setKycData(prev => ({ ...prev!, pipPosition: e.target.value }))}
                                        onBlur={(e) => updateKYCField('pipPosition', e.target.value)}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
