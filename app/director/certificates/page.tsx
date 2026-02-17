'use client';

import { useEffect, useState } from 'react';

export default function CertificateSigning() {
    const [pending, setPending] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch certificates that need co-signing
        // For demonstration, we'll use a mocked list or fetch from applications in a specific state
        async function fetchPending() {
            try {
                const res = await fetch('/api/registration/applications?status=approved');
                if (res.ok) {
                    const apps = await res.json();
                    setPending(apps.filter((a: any) => !a.certificateIssuedAt));
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        fetchPending();
    }, []);

    return (
        <div className="space-y-8 animate-fade-in-up">
            <header>
                <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary-700 to-indigo-800 tracking-tight">
                    Certificate Co-signing
                </h1>
                <p className="text-gray-500 mt-2 text-lg">Finalize and digitally sign official registration certificates.</p>
            </header>

            <div className="glass-panel p-8 bg-indigo-900 text-white flex items-center justify-between border-0 shadow-indigo-200/50 shadow-2xl">
                <div>
                    <h2 className="text-xl font-bold mb-1">Electronic Seal of the Director</h2>
                    <p className="text-indigo-300 text-xs font-medium uppercase tracking-widest">Digital Signature Status: <span className="text-green-400">AUTHENTICATED</span></p>
                </div>
                <div className="p-4 bg-white/10 rounded-2xl border border-white/20">
                    <span className="text-4xl">🖋️</span>
                </div>
            </div>

            <div className="glass-panel overflow-hidden border-0 shadow-xl">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                            <th className="p-5 font-bold uppercase text-xs tracking-widest text-gray-500">Society Name</th>
                            <th className="p-5 font-bold uppercase text-xs tracking-widest text-gray-500">Reg Number</th>
                            <th className="p-5 font-bold uppercase text-xs tracking-widest text-gray-500">Type</th>
                            <th className="p-5 font-bold uppercase text-xs tracking-widest text-gray-500">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr><td colSpan={4} className="p-10 text-center text-gray-400">Loading pending certificates...</td></tr>
                        ) : pending.length === 0 ? (
                            <tr><td colSpan={4} className="p-20 text-center">
                                <div className="text-4xl mb-4">✨</div>
                                <div className="text-gray-400 font-medium text-lg">All certificates co-signed</div>
                            </td></tr>
                        ) : (
                            pending.map((app) => (
                                <tr key={app.id} className="hover:bg-primary-50/50 transition-colors group">
                                    <td className="p-5">
                                        <div className="font-bold text-gray-900">{app.proposedName}</div>
                                        <div className="text-xs text-gray-400 mt-1">Approved {new Date(app.finalDecisionAt).toLocaleDateString()}</div>
                                    </td>
                                    <td className="p-5 text-sm font-mono text-primary-600 font-bold">{app.certificateNumber}</td>
                                    <td className="p-5">
                                        <span className="px-3 py-1 bg-gray-100 rounded-full text-[10px] font-black uppercase text-gray-600 tracking-tighter">
                                            {app.applicationType.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="p-5">
                                        <div className="flex gap-2">
                                            <button className="px-4 py-2 bg-gray-900 text-white rounded-xl text-xs font-bold hover:scale-105 transition-transform">Preview</button>
                                            <button className="px-4 py-2 bg-primary-600 text-white rounded-xl text-xs font-bold hover:scale-105 transition-transform shadow-lg shadow-primary-500/20">Sign & Issue</button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
