'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import AdminSidebar from '@/components/layout/AdminSidebar';
import Link from 'next/link';

interface OrderDetail {
    id: string;
    orderNumber: string;
    member: {
        firstName: string;
        lastName: string;
        memberNumber: string;
        email: string;
        phone: string;
    };
    product: {
        id: string;
        name: string;
        sku: string;
        retailPrice: number;
        stockQuantity: number;
    };
    quantity: number;
    totalPrice: number;
    termMonths: number;
    monthlyInstallment: number;
    status: string;
    createdAt: string;
    deliveryNotes?: string;
}

export default function OrderDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [order, setOrder] = useState<OrderDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchOrder();
    }, [params.id]);

    const fetchOrder = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/admin/merchandise/orders/${params.id}`);
            if (!response.ok) throw new Error('Order not found');
            const data = await response.json();
            setOrder(data);
        } catch (error: any) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (newStatus: string) => {
        try {
            setUpdating(true);
            const response = await fetch(`/api/admin/merchandise/orders/${params.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to update status');
            }
            await fetchOrder();
        } catch (error: any) {
            alert(error.message);
        } finally {
            setUpdating(false);
        }
    };

    if (loading) {
        return (
            <DashboardLayout sidebar={<AdminSidebar />}>
                <div className="p-8 max-w-5xl mx-auto animate-pulse">
                    <div className="h-8 bg-gray-100 rounded w-1/4 mb-8"></div>
                    <div className="h-64 bg-gray-50 rounded-3xl mb-8"></div>
                    <div className="grid grid-cols-2 gap-8">
                        <div className="h-48 bg-gray-50 rounded-3xl"></div>
                        <div className="h-48 bg-gray-50 rounded-3xl"></div>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    if (error || !order) {
        return (
            <DashboardLayout sidebar={<AdminSidebar />}>
                <div className="p-20 text-center">
                    <div className="text-6xl mb-4">⚠️</div>
                    <h2 className="text-2xl font-bold text-gray-900">Order not found</h2>
                    <Link href="/admin/merchandise/orders" className="text-primary-600 font-bold mt-4 block underline">
                        Back to Orders
                    </Link>
                </div>
            </DashboardLayout>
        );
    }

    const { status } = order;

    return (
        <DashboardLayout sidebar={<AdminSidebar />}>
            <div className="p-8 max-w-5xl mx-auto">
                {/* Breadcrumb & Header */}
                <div className="mb-8">
                    <Link href="/admin/merchandise/orders" className="text-primary-600 font-bold flex items-center gap-1 mb-4 hover:underline">
                        ← Back to Orders
                    </Link>
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <h1 className="text-4xl font-black text-gray-900">Order {order.orderNumber}</h1>
                                <span className={`px-4 py-1 text-xs font-black uppercase rounded-full border shadow-sm ${status === 'pending' ? 'bg-amber-500 text-white border-amber-600' :
                                        status === 'approved' ? 'bg-blue-500 text-white border-blue-600' :
                                            status === 'delivered' ? 'bg-success-500 text-white border-success-600' :
                                                'bg-gray-500 text-white border-gray-600'
                                    }`}>
                                    {status}
                                </span>
                            </div>
                            <p className="text-gray-500 font-medium">Placed on {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString()}</p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                            {status === 'pending' && (
                                <>
                                    <button
                                        disabled={updating}
                                        onClick={() => updateStatus('approved')}
                                        className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50"
                                    >
                                        Approve Order
                                    </button>
                                    <button
                                        disabled={updating}
                                        onClick={() => updateStatus('cancelled')}
                                        className="px-6 py-3 bg-white border-2 border-red-500 text-red-500 rounded-xl font-bold hover:bg-red-50 transition-all active:scale-95 disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>
                                </>
                            )}
                            {status === 'approved' && (
                                <button
                                    disabled={updating}
                                    onClick={() => updateStatus('delivered')}
                                    className="px-8 py-4 bg-success-600 text-white rounded-xl font-black shadow-2xl shadow-success-200 hover:bg-success-700 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-3"
                                >
                                    <span>Mark as Delivered</span>
                                    <span className="text-xl">🚚</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Product Info */}
                        <div className="glass-panel p-8">
                            <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-6">Product Information</h3>
                            <div className="flex gap-6 items-center">
                                <div className="w-24 h-24 bg-gray-50 rounded-2xl flex items-center justify-center text-4xl shadow-inner">
                                    📦
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-2xl font-bold text-gray-900">{order.product.name}</h4>
                                    <p className="text-gray-500 font-medium">SKU: {order.product.sku}</p>
                                    <p className={`text-sm font-bold mt-1 ${order.product.stockQuantity < order.quantity ? 'text-red-500' : 'text-success-600'}`}>
                                        Available Stock: {order.product.stockQuantity} units
                                    </p>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm text-gray-500 uppercase font-black tracking-tighter mb-1">Total Price</div>
                                    <div className="text-3xl font-black text-gray-900">P {Number(order.totalPrice).toLocaleString()}</div>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-8 mt-8 pt-8 border-t border-gray-100">
                                <div>
                                    <div className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Quantity</div>
                                    <div className="text-xl font-bold text-gray-900">{order.quantity} units</div>
                                </div>
                                <div>
                                    <div className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Unit Price</div>
                                    <div className="text-xl font-bold text-gray-900">P {Number(order.product.retailPrice).toLocaleString()}</div>
                                </div>
                                <div>
                                    <div className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Monthly Installment</div>
                                    <div className="text-xl font-black text-primary-600">P {Number(order.monthlyInstallment).toLocaleString()}</div>
                                    <div className="text-[10px] text-gray-400 font-bold uppercase">{order.termMonths} month term</div>
                                </div>
                            </div>
                        </div>

                        {/* Order Timeline Placeholder */}
                        <div className="glass-panel p-8 bg-gray-50/50">
                            <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-6">Order Lifecycle</h3>
                            <div className="space-y-6">
                                <div className="flex gap-4">
                                    <div className="flex flex-col items-center">
                                        <div className="w-4 h-4 rounded-full bg-success-500 ring-4 ring-success-100"></div>
                                        <div className="w-0.5 h-full bg-success-200"></div>
                                    </div>
                                    <div className="pb-6">
                                        <div className="font-bold text-gray-900">Order Placed</div>
                                        <div className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleString()}</div>
                                    </div>
                                </div>
                                {status !== 'pending' && (
                                    <div className="flex gap-4">
                                        <div className="flex flex-col items-center">
                                            <div className="w-4 h-4 rounded-full bg-success-500 ring-4 ring-success-100"></div>
                                            {(status === 'delivered') && <div className="w-0.5 h-full bg-success-200"></div>}
                                        </div>
                                        <div className="pb-6">
                                            <div className="font-bold text-gray-900">Order Approved</div>
                                            <div className="text-xs text-gray-500">Processing collection/delivery</div>
                                        </div>
                                    </div>
                                )}
                                {status === 'delivered' && (
                                    <div className="flex gap-4">
                                        <div className="flex flex-col items-center">
                                            <div className="w-4 h-4 rounded-full bg-success-500 ring-4 ring-success-100"></div>
                                        </div>
                                        <div>
                                            <div className="font-bold text-gray-900">Order Delivered</div>
                                            <div className="text-xs text-gray-500 font-medium">Payroll deduction scheduled</div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar Info */}
                    <div className="space-y-8">
                        {/* Member Card */}
                        <div className="glass-panel p-8 bg-primary-600 text-white">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-primary-200 mb-6">Requesting Member</h3>
                            <div className="flex flex-col items-center text-center">
                                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center text-3xl font-bold mb-4 backdrop-blur-md">
                                    {order.member.firstName.charAt(0)}
                                </div>
                                <h4 className="text-xl font-bold">{order.member.firstName} {order.member.lastName}</h4>
                                <p className="text-primary-100 text-sm font-medium">{order.member.memberNumber}</p>
                            </div>
                            <div className="mt-8 space-y-4 pt-8 border-t border-primary-500/50">
                                <div>
                                    <div className="text-[10px] text-primary-200 font-black uppercase tracking-widest mb-1">Phone</div>
                                    <div className="text-sm font-bold">{order.member.phone || 'N/A'}</div>
                                </div>
                                <div>
                                    <div className="text-[10px] text-primary-200 font-black uppercase tracking-widest mb-1">Email</div>
                                    <div className="text-sm font-bold truncate">{order.member.email}</div>
                                </div>
                            </div>
                            <button className="w-full mt-8 py-3 bg-white text-primary-600 rounded-xl font-bold text-sm hover:bg-primary-50 transition-all">
                                View Full Profile
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
