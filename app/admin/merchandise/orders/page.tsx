'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import AdminSidebar from '@/components/layout/AdminSidebar';
import Link from 'next/link';

interface Order {
    id: string;
    orderNumber: string;
    member: {
        firstName: string;
        lastName: string;
    };
    product: {
        name: string;
    };
    quantity: number;
    totalPrice: number;
    status: string;
    createdAt: string;
}

export default function OrdersPage() {
    const router = useRouter();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');

    useEffect(() => {
        fetchOrders();
    }, [statusFilter]);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const url = statusFilter
                ? `/api/admin/merchandise/orders?status=${statusFilter}`
                : '/api/admin/merchandise/orders';
            const response = await fetch(url);
            const data = await response.json();
            setOrders(data);
        } catch (error) {
            console.error('Failed to fetch orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'approved': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'delivered': return 'bg-success-100 text-success-700 border-success-200';
            case 'cancelled': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
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
                        <h1 className="text-3xl font-black text-gray-900">Order Management</h1>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
                    {['', 'pending', 'approved', 'delivered', 'cancelled'].map((status) => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={`px-6 py-2 rounded-xl text-sm font-bold border-2 transition-all whitespace-nowrap ${statusFilter === status
                                    ? 'bg-primary-600 border-primary-600 text-white shadow-lg shadow-primary-200'
                                    : 'bg-white border-gray-100 text-gray-500 hover:border-gray-200'
                                }`}
                        >
                            {status === '' ? 'All Orders' : status.charAt(0).toUpperCase() + status.slice(1)}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => <div key={i} className="h-20 glass-panel animate-pulse"></div>)}
                    </div>
                ) : (
                    <div className="glass-panel overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50/50 border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Order</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Member</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Product</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Amount</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Status</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Date</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {orders.map((order) => (
                                    <tr key={order.id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <span className="font-bold text-gray-900">{order.orderNumber}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900">{order.member.firstName} {order.member.lastName}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-gray-900">{order.product.name}</div>
                                            <div className="text-xs text-gray-500">Qty: {order.quantity}</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-black text-gray-900">
                                            P {Number(order.totalPrice).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 text-[10px] font-black uppercase rounded-full border ${getStatusStyle(order.status)}`}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-xs text-gray-500 font-medium">
                                            {new Date(order.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => router.push(`/admin/merchandise/orders/${order.id}`)}
                                                className="px-4 py-2 bg-gray-100 text-gray-900 text-xs font-bold rounded-lg hover:bg-primary-600 hover:text-white transition-all shadow-sm"
                                            >
                                                View Details
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {orders.length === 0 && (
                            <div className="py-20 text-center">
                                <div className="text-4xl mb-4">🛒</div>
                                <h3 className="text-lg font-bold text-gray-900">No orders found</h3>
                                <p className="text-gray-500">There are no orders matching your current filter.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
