'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface WorkingPaper {
    id: string;
    fileName: string;
    fileUrl: string;
    createdAt: string;
}

export default function WorkingPapersPage() {
    const params = useParams();
    const router = useRouter();
    const requestId = params.tenantId as string;

    const [papers, setPapers] = useState<WorkingPaper[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [tenantInfo, setTenantInfo] = useState<{ name: string } | null>(null);

    useEffect(() => {
        async function fetchData() {
            try {
                const reqRes = await fetch('/api/external-auditor/access-request');
                if (reqRes.ok) {
                    const requests = await reqRes.json();
                    const currentReq = requests.find((r: any) => r.id === requestId);
                    if (currentReq) {
                        setTenantInfo({ name: currentReq.tenant.name });

                        const papersRes = await fetch(`/api/external-auditor/working-papers?requestId=${requestId}`);
                        if (papersRes.ok) setPapers(await papersRes.json());
                    }
                }
            } catch (e) {
                console.error('Error fetching working papers:', e);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [requestId]);

    const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setUploading(true);

        // Mocking file upload for now - in a real app, this would use Firebase Storage
        const mockUrl = `https://storage.kika.com/audits/${requestId}/working-paper-${Date.now()}.pdf`;
        const fileName = (e.currentTarget.elements.namedItem('fileName') as HTMLInputElement).value;

        try {
            const res = await fetch('/api/external-auditor/working-papers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    requestId,
                    fileName,
                    fileUrl: mockUrl
                }),
            });

            if (res.ok) {
                alert('Working paper uploaded successfully!');
                const newPaper = await res.json();
                setPapers([newPaper, ...papers]);
                (e.target as HTMLFormElement).reset();
            } else {
                const err = await res.json();
                alert(err.error || 'Failed to upload paper');
            }
        } catch (e) {
            console.error('Error uploading paper:', e);
        } finally {
            setUploading(false);
        }
    };

    if (loading) return <div className="p-12 text-center text-gray-500">Loading working papers...</div>;
    if (!tenantInfo) return <div className="p-12 text-center text-danger-600 font-bold">Audit engagement not found or access expired.</div>;

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Audit Working Papers</h1>
                    <p className="text-gray-600">Organization: {tenantInfo.name}</p>
                </div>
                <button onClick={() => router.push(`/auditor/${requestId}/records`)} className="btn btn-outline">
                    ← Back to Records
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Upload Form */}
                <div className="lg:col-span-1">
                    <div className="glass-panel p-6 sticky top-8">
                        <h2 className="text-xl font-bold mb-4">Add Working Paper</h2>
                        <form onSubmit={handleUpload} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Description / Name</label>
                                <input
                                    type="text"
                                    name="fileName"
                                    className="input w-full"
                                    placeholder="e.g. Sampling Methodology.pdf"
                                    required
                                />
                            </div>
                            <div className="p-8 border-2 border-dashed border-gray-200 rounded-xl text-center hover:border-emerald-500 transition-colors cursor-pointer group">
                                <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">📁</div>
                                <div className="text-sm font-medium text-gray-500">Click to select or drag and drop</div>
                                <div className="text-xs text-gray-400 mt-1">PDF, XLSX up to 10MB</div>
                            </div>
                            <button
                                type="submit"
                                className="btn btn-primary w-full shadow-emerald-200"
                                disabled={uploading}
                            >
                                {uploading ? 'Uploading...' : 'Upload Paper'}
                            </button>
                        </form>
                    </div>
                </div>

                {/* List of Papers */}
                <div className="lg:col-span-2">
                    <div className="glass-panel overflow-hidden">
                        <div className="p-6 border-b border-white/20 bg-white/10">
                            <h2 className="text-xl font-bold text-gray-900">Uploaded Papers</h2>
                        </div>
                        <div className="divide-y divide-gray-100">
                            {papers.length === 0 ? (
                                <div className="p-12 text-center text-gray-500">No working papers uploaded yet.</div>
                            ) : (
                                papers.map((paper) => (
                                    <div key={paper.id} className="p-6 flex items-center justify-between hover:bg-white/30 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="text-2xl">📄</div>
                                            <div>
                                                <div className="font-semibold text-gray-900">{paper.fileName}</div>
                                                <div className="text-xs text-gray-500">Uploaded on {new Date(paper.createdAt).toLocaleString()}</div>
                                            </div>
                                        </div>
                                        <a href={paper.fileUrl} target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:text-emerald-800 font-bold text-sm">
                                            View File
                                        </a>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
