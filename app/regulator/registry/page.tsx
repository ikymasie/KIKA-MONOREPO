'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import RegulatorSidebar from '@/components/layout/RegulatorSidebar';
import Link from 'next/link';
import { Search, Download, Filter } from 'lucide-react';

interface RegisteredSociety {
    id: string;
    proposedName: string;
    applicationType: string;
    certificateNumber: string;
    certificateIssuedAt: string;
    primaryContactName: string;
}

export default function OfficialRegistry() {
    const [societies, setSocieties] = useState<RegisteredSociety[]>([]);
    const [filteredSocieties, setFilteredSocieties] = useState<RegisteredSociety[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        async function fetchRegistry() {
            try {
                const res = await fetch('/api/registration/registry');
                if (res.ok) {
                    const data = await res.json();
                    setSocieties(data);
                    setFilteredSocieties(data);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        fetchRegistry();
    }, []);

    useEffect(() => {
        const filtered = societies.filter(s =>
            s.proposedName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.certificateNumber?.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredSocieties(filtered);
    }, [searchTerm, societies]);

    return (
        <DashboardLayout sidebar={<RegulatorSidebar />}>
            <div className="p-8">
                <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 font-display">Official Society Registry</h1>
                        <p className="text-gray-600 mt-2">Public record of all officially registered and approved societies.</p>
                    </div>
                    <button className="btn btn-secondary flex items-center gap-2 self-start md:self-center">
                        <Download size={18} />
                        Export CSV
                    </button>
                </header>

                <div className="mb-6 flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search by name or registration number..."
                            className="input pl-10 w-full"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button className="btn bg-white border-gray-200 text-gray-700 flex items-center gap-2 hover:bg-gray-50 shadow-sm transition-all px-4">
                        <Filter size={18} />
                        Filter
                    </button>
                </div>

                <div className="card p-0 overflow-hidden border-white/40 shadow-xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50/50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                <tr>
                                    <th className="px-6 py-4">Registration #</th>
                                    <th className="px-6 py-4">Society Name</th>
                                    <th className="px-6 py-4">Category</th>
                                    <th className="px-6 py-4">Contact</th>
                                    <th className="px-6 py-4">Date Registered</th>
                                    <th className="px-6 py-4 text-right">Certificate</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                                {loading ? (
                                    <tr><td colSpan={6} className="px-6 py-10 text-center"><div className="animate-spin inline-block w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full"></div></td></tr>
                                ) : filteredSocieties.length === 0 ? (
                                    <tr><td colSpan={6} className="px-6 py-10 text-center text-gray-500">No records found matching your criteria.</td></tr>
                                ) : (
                                    filteredSocieties.map((society) => (
                                        <tr key={society.id} className="hover:bg-primary-50/20 transition-colors">
                                            <td className="px-6 py-4">
                                                <span className="font-mono text-sm font-bold text-primary-700 bg-primary-50 px-2 py-1 rounded">
                                                    {society.certificateNumber || 'N/A'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 font-bold text-gray-900">{society.proposedName}</td>
                                            <td className="px-6 py-4 capitalize">
                                                <span className="text-xs px-2 py-1 bg-indigo-50 text-indigo-700 rounded-md font-medium">
                                                    {society.applicationType.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">{society.primaryContactName}</td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {society.certificateIssuedAt ? new Date(society.certificateIssuedAt).toLocaleDateString() : 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button className="text-primary-600 hover:text-primary-800 font-bold text-sm">
                                                    View Digital Proof
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
