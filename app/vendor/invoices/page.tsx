'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import VendorSidebar from '@/components/layout/VendorSidebar';
import { InvoiceStatus } from '@/src/entities/MerchandiseInvoice';

interface Invoice {
    id: string;
    invoiceNumber: string;
    amount: number;
    dueDate: string;
    status: InvoiceStatus;
    order: {
        orderNumber: string;
        product: { name: string };
        member: { name: string };
    };
    createdAt: string;
}

export default function VendorInvoices() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchInvoices();
    }, []);

    const fetchInvoices = async () => {
        try {
            const res = await fetch('/api/vendor/invoices');
            const data = await res.json();
            setInvoices(data);
        } catch (error) {
            console.error('Error fetching invoices:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout sidebar={<VendorSidebar />}>
            <div className="p-8 max-w-7xl mx-auto">
                <header className="mb-12">
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Invoice Management</h1>
                    <p className="text-slate-500 font-medium text-lg">Track your billed orders and payment statuses.</p>
                </header>

                <div className="glass-panel overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Invoice Details</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Order Info</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Due Date</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {invoices.length === 0 && !loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-medium">
                                        No invoices found. Invoices are generated when you fulfill an order.
                                    </td>
                                </tr>
                            ) : (
                                invoices.map((invoice) => (
                                    <tr key={invoice.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-6">
                                            <div className="font-black text-slate-900">#{invoice.invoiceNumber}</div>
                                            <div className="text-xs text-slate-500 font-medium">{new Date(invoice.createdAt).toLocaleDateString()}</div>
                                        </td>
                                        <td className="px-6 py-6">
                                            <div className="font-bold text-slate-900">{invoice.order.product.name}</div>
                                            <div className="text-xs text-slate-500">Order: #{invoice.order.orderNumber}</div>
                                        </td>
                                        <td className="px-6 py-6">
                                            <div className="font-black text-slate-900">N$ {invoice.amount.toLocaleString()}</div>
                                        </td>
                                        <td className="px-6 py-6">
                                            <div className="font-medium text-slate-600">{new Date(invoice.dueDate).toLocaleDateString()}</div>
                                        </td>
                                        <td className="px-6 py-6">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${invoice.status === InvoiceStatus.PAID ? 'bg-green-100 text-green-700' :
                                                    invoice.status === InvoiceStatus.SENT ? 'bg-amber-100 text-amber-700' :
                                                        'bg-slate-100 text-slate-700'
                                                }`}>
                                                {invoice.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-6 text-right">
                                            <button className="text-indigo-600 hover:text-indigo-900 font-black text-xs">View PDF</button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </DashboardLayout>
    );
}
