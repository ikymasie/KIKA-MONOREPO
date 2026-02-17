'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import VendorSidebar from '@/components/layout/VendorSidebar';

interface Order {
    id: string;
    orderNumber: string;
    productName: string;
    quantity: number;
    status: string;
    createdAt: string;
    customerName: string;
}

export default function VendorOrders() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Mock orders for now
        setTimeout(() => {
            setOrders([
                { id: '1', orderNumber: 'ORD-77A1', productName: 'Solar Power Kit', quantity: 1, status: 'approved', createdAt: '2024-03-20', customerName: 'Itumeleng Masie' },
                { id: '2', orderNumber: 'ORD-88B2', productName: 'Water Tank 5000L', quantity: 2, status: 'shipped', createdAt: '2024-03-19', customerName: 'Kago Motsamai' },
            ]);
            setLoading(false);
        }, 1000);
    }, []);

    const updateStatus = (id: string, newStatus: string) => {
        setOrders(orders.map(o => o.id === id ? { ...o, status: newStatus } : o));
    };

    return (
        <DashboardLayout sidebar={<VendorSidebar />}>
            <div className="p-8 max-w-7xl mx-auto">
                <header className="mb-12 flex justify-between items-end">
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Order Fulfillment</h1>
                        <p className="text-slate-500 font-medium">Track and process your assigned SACCO merchandise orders.</p>
                    </div>
                </header>

                <div className="glass-panel overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Order Details</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Product</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Customer</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {orders.map((order) => (
                                <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-6">
                                        <div className="font-black text-slate-900">#{order.orderNumber}</div>
                                        <div className="text-xs text-slate-500">{new Date(order.createdAt).toLocaleDateString()}</div>
                                    </td>
                                    <td className="px-6 py-6">
                                        <div className="font-bold text-slate-900">{order.productName}</div>
                                        <div className="text-xs text-slate-500">Qty: {order.quantity}</div>
                                    </td>
                                    <td className="px-6 py-6">
                                        <div className="font-medium text-slate-900">{order.customerName}</div>
                                    </td>
                                    <td className="px-6 py-6">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${order.status === 'approved' ? 'bg-amber-100 text-amber-700' :
                                                order.status === 'shipped' ? 'bg-indigo-100 text-indigo-700' :
                                                    'bg-green-100 text-green-700'
                                            }`}>
                                            {order.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-6 text-right">
                                        <div className="flex justify-end gap-2">
                                            {order.status === 'approved' && (
                                                <button
                                                    onClick={() => updateStatus(order.id, 'shipped')}
                                                    className="px-4 py-2 bg-indigo-600 text-white text-xs font-black rounded-lg hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100"
                                                >
                                                    Mark Shipped
                                                </button>
                                            )}
                                            {order.status === 'shipped' && (
                                                <button
                                                    onClick={() => updateStatus(order.id, 'delivered')}
                                                    className="px-4 py-2 bg-green-600 text-white text-xs font-black rounded-lg hover:bg-green-700 transition-all shadow-md shadow-green-100"
                                                >
                                                    Mark Delivered
                                                </button>
                                            )}
                                        </div>
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
