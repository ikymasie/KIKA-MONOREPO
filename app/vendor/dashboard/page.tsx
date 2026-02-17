'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import VendorSidebar from '@/components/layout/VendorSidebar';
import { OrderStatus } from '@/src/entities/MerchandiseOrder';

export default function VendorDashboard() {
    const [stats, setStats] = useState({
        pendingOrders: 0,
        shippedOrders: 0,
        lowStockAlerts: 0,
        recentOrders: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // Fetch orders to calculate stats
                const ordersRes = await fetch('/api/vendor/orders');
                const orders = await ordersRes.json();

                // Fetch products for low stock alerts
                const productsRes = await fetch('/api/vendor/products');
                const products = await productsRes.json();

                const pending = orders.filter((o: any) => o.status === OrderStatus.APPROVED).length;
                const shipped = orders.filter((o: any) => o.status === OrderStatus.IN_TRANSIT || o.status === OrderStatus.DELIVERED).length;
                const lowStock = products.filter((p: any) => p.stockQuantity < 5).length;

                setStats({
                    pendingOrders: pending,
                    shippedOrders: shipped,
                    lowStockAlerts: lowStock,
                    recentOrders: orders.slice(0, 5)
                });
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    return (
        <DashboardLayout sidebar={<VendorSidebar />}>
            <div className="p-8 max-w-7xl mx-auto">
                <header className="mb-12">
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Vendor Command Center</h1>
                    <p className="text-slate-500 font-medium text-lg">Manage your SACCO fulfillment operations and monitor inventory levels.</p>
                </header>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                    <div className="glass-panel p-8 bg-amber-50 border-amber-200 relative overflow-hidden group">
                        <div className="relative z-10">
                            <div className="text-xs font-black text-amber-600 uppercase tracking-widest mb-4">Pending Fulfillment</div>
                            <div className="text-5xl font-black text-slate-900 mb-2">{stats.pendingOrders}</div>
                            <div className="text-sm font-bold text-slate-500">Orders awaiting action</div>
                        </div>
                        <span className="absolute bottom-[-20px] right-[-20px] text-9xl opacity-10 rotate-12 group-hover:rotate-0 transition-transform duration-700">📦</span>
                    </div>

                    <div className="glass-panel p-8 bg-indigo-50 border-indigo-200 relative overflow-hidden group">
                        <div className="relative z-10">
                            <div className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-4">Shipped/Completed</div>
                            <div className="text-5xl font-black text-slate-900 mb-2">{stats.shippedOrders}</div>
                            <div className="text-sm font-bold text-slate-500">Filled this period</div>
                        </div>
                        <span className="absolute bottom-[-20px] right-[-20px] text-9xl opacity-10 rotate-12 group-hover:rotate-0 transition-transform duration-700">🚚</span>
                    </div>

                    <div className="glass-panel p-8 bg-rose-50 border-rose-200 relative overflow-hidden group">
                        <div className="relative z-10">
                            <div className="text-xs font-black text-rose-600 uppercase tracking-widest mb-4">Low Stock Alerts</div>
                            <div className="text-5xl font-black text-slate-900 mb-2">{stats.lowStockAlerts}</div>
                            <div className="text-sm font-bold text-slate-500">Items below threshold</div>
                        </div>
                        <span className="absolute bottom-[-20px] right-[-20px] text-9xl opacity-10 rotate-12 group-hover:rotate-0 transition-transform duration-700">⚠️</span>
                    </div>
                </div>

                {/* Recent Activity Mini-List */}
                <div className="glass-panel p-8">
                    <h2 className="text-2xl font-black text-slate-900 mb-6 tracking-tight">Recent Order Activity</h2>
                    <div className="space-y-4">
                        {stats.recentOrders.length === 0 ? (
                            <div className="text-center py-12 text-slate-400 font-medium">No recent activity</div>
                        ) : (
                            stats.recentOrders.map((order: any) => (
                                <div key={order.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-xl shadow-sm">🛒</div>
                                        <div>
                                            <div className="font-bold text-slate-900">Order #{order.orderNumber}</div>
                                            <div className="text-xs text-slate-500 font-medium">{order.product.name} - {order.quantity} Units</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm font-black text-slate-900">
                                            {new Date(order.createdAt).toLocaleDateString()}
                                        </div>
                                        <div className={`text-[10px] font-black uppercase ${order.status === OrderStatus.APPROVED ? 'text-amber-600' :
                                                order.status === OrderStatus.DELIVERED ? 'text-green-600' :
                                                    'text-indigo-600'
                                            }`}>
                                            {order.status.replace('_', ' ')}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
