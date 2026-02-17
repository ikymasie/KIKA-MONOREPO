'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import AdminSidebar from '@/components/layout/AdminSidebar';
import Link from 'next/link';

interface DashboardStats {
    totalProducts: number;
    activeProducts: number;
    pendingOrders: number;
    totalOrders: number;
    lowStockItems: number;
}

export default function MerchandiseDashboard() {
    const router = useRouter();
    const [stats, setStats] = useState<DashboardStats>({
        totalProducts: 0,
        activeProducts: 0,
        pendingOrders: 0,
        totalOrders: 0,
        lowStockItems: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const [productsRes, ordersRes] = await Promise.all([
                fetch('/api/admin/products/merchandise'),
                fetch('/api/admin/merchandise/orders')
            ]);

            const products = await productsRes.json();
            const orders = await ordersRes.json();

            setStats({
                totalProducts: products.length,
                activeProducts: products.filter((p: any) => p.status === 'active').length,
                pendingOrders: orders.filter((o: any) => o.status === 'pending').length,
                totalOrders: orders.length,
                lowStockItems: products.filter((p: any) => p.stockQuantity < 5).length
            });
        } catch (error) {
            console.error('Failed to fetch merchandise stats:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout sidebar={<AdminSidebar />}>
            <div className="p-8 max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Merchandise Hub</h1>
                        <p className="text-gray-500 mt-2 font-medium">Manage SACCO assets, stock, and member hire-purchase orders.</p>
                    </div>
                    <div className="flex gap-4">
                        <Link
                            href="/admin/settings?tab=products"
                            className="px-6 py-3 bg-white border-2 border-primary-500 text-primary-600 rounded-xl font-bold hover:bg-primary-50 transition-all flex items-center gap-2"
                        >
                            <span className="text-xl">+</span> Add Product
                        </Link>
                        <button
                            onClick={fetchDashboardData}
                            className="p-3 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-all"
                            title="Refresh Data"
                        >
                            🔄
                        </button>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
                    {[
                        { label: 'Total Products', value: stats.totalProducts, icon: '📦', color: 'blue' },
                        { label: 'Pending Orders', value: stats.pendingOrders, icon: '⏳', color: 'amber', highlight: stats.pendingOrders > 0 },
                        { label: 'Low Stock', value: stats.lowStockItems, icon: '⚠️', color: 'red', highlight: stats.lowStockItems > 0 },
                        { label: 'Total Orders', value: stats.totalOrders, icon: '🛒', color: 'purple' },
                    ].map((stat, i) => (
                        <div key={i} className={`glass-panel p-6 border-b-4 ${stat.highlight ? `border-b-${stat.color}-500 shadow-xl shadow-${stat.color}-100` : 'border-b-transparent'}`}>
                            <div className="flex justify-between items-start mb-4">
                                <span className="text-3xl">{stat.icon}</span>
                                <span className={`text-xs font-bold uppercase tracking-widest text-${stat.color}-600 bg-${stat.color}-50 px-2 py-1 rounded`}>
                                    {stat.label.split(' ')[0]}
                                </span>
                            </div>
                            <div className="text-4xl font-black text-gray-900">{loading ? '...' : stat.value}</div>
                            <div className="text-sm text-gray-500 font-medium mt-1">{stat.label}</div>
                        </div>
                    ))}
                </div>

                {/* Quick Navigation Sections */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Products Card */}
                    <Link href="/admin/merchandise/products" className="group">
                        <div className="glass-panel p-8 h-full border-2 border-transparent group-hover:border-primary-500 transition-all relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 text-6xl opacity-10 group-hover:scale-110 transition-transform">🛍️</div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Product Catalog</h2>
                            <p className="text-gray-500 mb-6 max-w-md">View detailed inventory, update stock levels, and manage pricing for all merchandise products.</p>
                            <ul className="space-y-3 mb-8">
                                <li className="flex items-center gap-2 text-sm font-medium text-gray-600">
                                    <span className="w-1.5 h-1.5 bg-success-500 rounded-full"></span>
                                    {stats.activeProducts} Active Products
                                </li>
                                <li className="flex items-center gap-2 text-sm font-medium text-gray-600">
                                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                                    {stats.lowStockItems} Low Stock Alerts
                                </li>
                            </ul>
                            <div className="inline-flex items-center gap-2 text-primary-600 font-bold group-hover:translate-x-2 transition-transform">
                                Manage Products <span>→</span>
                            </div>
                        </div>
                    </Link>

                    {/* Orders Card */}
                    <Link href="/admin/merchandise/orders" className="group">
                        <div className="glass-panel p-8 h-full border-2 border-transparent group-hover:border-amber-500 transition-all relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 text-6xl opacity-10 group-hover:scale-110 transition-transform">📝</div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Management</h2>
                            <p className="text-gray-500 mb-6 max-w-md">Process pending hire-purchase applications, track shipments, and mark items as delivered.</p>
                            <ul className="space-y-3 mb-8">
                                <li className="flex items-center gap-2 text-sm font-medium text-gray-600">
                                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                                    {stats.pendingOrders} Orders Awaiting Approval
                                </li>
                                <li className="flex items-center gap-2 text-sm font-medium text-gray-600">
                                    <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                                    {stats.totalOrders} Lifetime Orders
                                </li>
                            </ul>
                            <div className="inline-flex items-center gap-2 text-amber-600 font-bold group-hover:translate-x-2 transition-transform">
                                Review Orders <span>→</span>
                            </div>
                        </div>
                    </Link>
                </div>
            </div>
        </DashboardLayout>
    );
}
