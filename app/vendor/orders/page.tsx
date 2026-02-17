'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import VendorSidebar from '@/components/layout/VendorSidebar';
import { OrderStatus } from '@/src/entities/MerchandiseOrder';

interface Order {
    id: string;
    orderNumber: string;
    product: { name: string };
    quantity: number;
    status: OrderStatus;
    createdAt: string;
    member: { name: string };
    totalPrice: number;
}

export default function VendorOrders() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [showFulfillModal, setShowFulfillModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [fulfillmentNotes, setFulfillmentNotes] = useState('');

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const res = await fetch('/api/vendor/orders');
            const data = await res.json();
            setOrders(data);
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFulfill = async () => {
        if (!selectedOrder) return;
        try {
            const res = await fetch(`/api/vendor/orders/${selectedOrder.id}/fulfill`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ notes: fulfillmentNotes }),
            });
            if (res.ok) {
                // Also create an invoice automatically when fulfilled
                await fetch('/api/vendor/invoices', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        orderId: selectedOrder.id,
                        invoiceNumber: `INV-${selectedOrder.orderNumber}`,
                        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                        notes: 'Automatically generated on fulfillment'
                    }),
                });

                setShowFulfillModal(false);
                setSelectedOrder(null);
                setFulfillmentNotes('');
                fetchOrders();
            }
        } catch (error) {
            console.error('Error fulfilling order:', error);
        }
    };

    const handleUpdateDelivery = async (id: string, status: string) => {
        try {
            const res = await fetch(`/api/vendor/orders/${id}/delivery`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status,
                    deliveryDate: status === OrderStatus.DELIVERED ? new Date().toISOString() : undefined
                }),
            });
            if (res.ok) {
                fetchOrders();
            }
        } catch (error) {
            console.error('Error updating delivery:', error);
        }
    };

    return (
        <DashboardLayout sidebar={<VendorSidebar />}>
            <div className="p-8 max-w-7xl mx-auto">
                <header className="mb-12 flex justify-between items-end">
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Order Fulfillment</h1>
                        <p className="text-slate-500 font-medium text-lg">Track and process your assigned SACCO merchandise orders.</p>
                    </div>
                </header>

                <div className="glass-panel overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Order Details</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Product</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Customer</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Total</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {orders.length === 0 && !loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-medium">
                                        No orders found.
                                    </td>
                                </tr>
                            ) : (
                                orders.map((order) => (
                                    <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-6">
                                            <div className="font-black text-slate-900">#{order.orderNumber}</div>
                                            <div className="text-xs text-slate-500">{new Date(order.createdAt).toLocaleDateString()}</div>
                                        </td>
                                        <td className="px-6 py-6">
                                            <div className="font-bold text-slate-900">{order.product.name}</div>
                                            <div className="text-xs text-slate-500 font-medium">Qty: {order.quantity}</div>
                                        </td>
                                        <td className="px-6 py-6">
                                            <div className="font-medium text-slate-900">{order.member.name}</div>
                                        </td>
                                        <td className="px-6 py-6 font-black text-slate-900">
                                            N$ {Number(order.totalPrice).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-6">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${order.status === OrderStatus.APPROVED ? 'bg-amber-100 text-amber-700' :
                                                order.status === OrderStatus.IN_TRANSIT ? 'bg-indigo-100 text-indigo-700' :
                                                    order.status === OrderStatus.DELIVERED ? 'bg-green-100 text-green-700' :
                                                        'bg-slate-100 text-slate-700'
                                                }`}>
                                                {order.status.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-6 text-right">
                                            <div className="flex justify-end gap-2">
                                                {order.status === OrderStatus.APPROVED && (
                                                    <button
                                                        onClick={() => handleUpdateDelivery(order.id, OrderStatus.ORDERED)}
                                                        className="px-4 py-2 bg-amber-500 text-white text-xs font-black rounded-lg hover:bg-amber-600 transition-all shadow-md shadow-amber-100"
                                                    >
                                                        Acknowledge PO
                                                    </button>
                                                )}
                                                {order.status === OrderStatus.ORDERED && (
                                                    <button
                                                        onClick={() => {
                                                            setSelectedOrder(order);
                                                            setShowFulfillModal(true);
                                                        }}
                                                        className="px-4 py-2 bg-indigo-600 text-white text-xs font-black rounded-lg hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100"
                                                    >
                                                        Fulfill Order
                                                    </button>
                                                )}
                                                {order.status === OrderStatus.IN_TRANSIT && (
                                                    <button
                                                        onClick={() => handleUpdateDelivery(order.id, OrderStatus.DELIVERED)}
                                                        className="px-4 py-2 bg-green-600 text-white text-xs font-black rounded-lg hover:bg-green-700 transition-all shadow-md shadow-green-100"
                                                    >
                                                        Mark Delivered
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Fulfillment Modal */}
                {showFulfillModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                        <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
                            <div className="p-8 border-b border-slate-100">
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Fulfill Order</h2>
                                <p className="text-slate-500 font-medium text-sm mt-1">Order #{selectedOrder?.orderNumber}</p>
                            </div>
                            <div className="p-8">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Shipping/Fulfillment Notes</label>
                                <textarea
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none transition-all font-medium h-32"
                                    placeholder="Enter tracking number or delivery notes..."
                                    value={fulfillmentNotes}
                                    onChange={(e) => setFulfillmentNotes(e.target.value)}
                                ></textarea>
                            </div>
                            <div className="p-8 bg-slate-50 flex justify-end gap-4">
                                <button
                                    onClick={() => setShowFulfillModal(false)}
                                    className="px-6 py-3 font-black text-slate-400 hover:text-slate-900 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleFulfill}
                                    className="px-8 py-3 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
                                >
                                    Confirm Fulfillment
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
