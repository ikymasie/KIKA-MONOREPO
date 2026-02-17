'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import AdminSidebar from '@/components/layout/AdminSidebar';
import Link from 'next/link';

interface Vendor {
    id: string;
    name: string;
    code: string;
    email: string;
    phone: string;
    status: string;
}

export default function VendorsPage() {
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchVendors();
    }, []);

    const fetchVendors = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/admin/merchandise/vendors'); // Logic to be added if not exists
            if (!response.ok) throw new Error('Failed to fetch');
            const data = await response.json();
            setVendors(data);
        } catch (error) {
            // Mock data for now if API route is not yet created
            setVendors([
                { id: '1', name: 'Elite Electronics', code: 'ELITE-01', email: 'orders@elite.bw', phone: '3901234', status: 'active' },
                { id: '2', name: 'Home Comforts Ltd', code: 'HOME-02', email: 'sales@homecomforts.co.bw', phone: '3905678', status: 'active' },
            ]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout sidebar={<AdminSidebar />}>
            <div className="p-8 max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <Link href="/admin/merchandise" className="text-primary-600 font-bold flex items-center gap-1 mb-2 hover:underline">
                            ← Back to Hub
                        </Link>
                        <h1 className="text-3xl font-black text-gray-900">Partner Vendors</h1>
                    </div>
                    <button className="px-6 py-3 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 transition-all">
                        + Register Vendor
                    </button>
                </div>

                <div className="glass-panel overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50/50 border-b">
                            <tr>
                                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Vendor Name</th>
                                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Code</th>
                                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Contact Info</th>
                                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Status</th>
                                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {vendors.map((vendor) => (
                                <tr key={vendor.id} className="hover:bg-gray-50/50">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-gray-900">{vendor.name}</div>
                                    </td>
                                    <td className="px-6 py-4 text-sm font-medium text-gray-500">{vendor.code}</td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-bold text-gray-900">{vendor.email}</div>
                                        <div className="text-xs text-gray-500">{vendor.phone}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-2 py-1 bg-success-50 text-success-600 text-[10px] font-black uppercase rounded border border-success-100">
                                            {vendor.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="p-2 text-gray-400 hover:text-primary-600 transition-colors">✏️</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </DashboardLayout>
    );
}
