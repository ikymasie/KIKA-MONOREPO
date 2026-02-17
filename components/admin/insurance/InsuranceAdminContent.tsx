'use client';

import { useState, useEffect } from 'react';
import PolicyTable from './PolicyTable';
import ClaimWorkflow from './ClaimWorkflow';
import { useBranding } from '@/components/providers/BrandingProvider';
import ProductFactory from '../settings/ProductFactory';

export default function InsuranceAdminContent() {
    const [activeTab, setActiveTab] = useState<'overview' | 'policies' | 'claims' | 'products'>('overview');
    const [stats, setStats] = useState({
        activePolicies: 0,
        pendingClaims: 0,
        totalPremiums: 0,
    });
    const [loading, setLoading] = useState(true);
    const { branding } = useBranding();

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            setLoading(true);
            const [policiesRes, claimsRes] = await Promise.all([
                fetch('/api/admin/insurance/policies'),
                fetch('/api/admin/insurance/claims'),
            ]);

            if (policiesRes.ok && claimsRes.ok) {
                const policies = await policiesRes.json();
                const claims = await claimsRes.json();

                const active = policies.filter((p: any) => p.status === 'active').length;
                const totalPremiums = policies.reduce((sum: number, p: any) => sum + Number(p.monthlyPremium), 0);
                const pending = claims.filter((c: any) => c.status === 'submitted' || c.status === 'under_review').length;

                setStats({
                    activePolicies: active,
                    pendingClaims: pending,
                    totalPremiums: totalPremiums,
                });
            }
        } catch (error) {
            console.error('Failed to fetch insurance stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const tabs = [
        { id: 'overview', name: 'Overview', icon: '📊' },
        { id: 'policies', name: 'Policies', icon: '🛡️' },
        { id: 'claims', name: 'Claims', icon: '📁' },
        { id: 'products', name: 'Products', icon: '⚙️' },
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Insurance Management</h1>
                    <p className="text-gray-500 font-medium">Monitor policies, process claims, and manage coverage products.</p>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-panel p-6 border-l-4 border-primary-500 bg-white shadow-sm">
                    <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">Active Policies</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-gray-900">{stats.activePolicies}</span>
                        <span className="text-xs font-bold text-success-600 bg-success-50 px-2 py-0.5 rounded-full">Active Now</span>
                    </div>
                </div>
                <div className="glass-panel p-6 border-l-4 border-blue-500 bg-white shadow-sm">
                    <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">Pending Claims</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-gray-900">{stats.pendingClaims}</span>
                        {stats.pendingClaims > 0 && (
                            <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full animate-pulse">Needs Attention</span>
                        )}
                    </div>
                </div>
                <div className="glass-panel p-6 border-l-4 border-success-500 bg-white shadow-sm">
                    <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">Monthly Premiums</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-gray-900">P {stats.totalPremiums.toLocaleString()}</span>
                        <span className="text-xs font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full">Projected Revenue</span>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 p-1 bg-gray-100/50 rounded-2xl w-fit">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all ${activeTab === tab.id
                                ? 'bg-white text-primary-600 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
                            }`}
                    >
                        <span>{tab.icon}</span>
                        {tab.name}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className="glass-panel min-h-[500px] bg-white/40 backdrop-blur-md rounded-3xl overflow-hidden border border-white/20 shadow-xl">
                {activeTab === 'overview' && (
                    <div className="p-12 text-center space-y-4">
                        <div className="w-20 h-20 bg-primary-50 text-primary-500 rounded-3xl flex items-center justify-center text-4xl mx-auto shadow-inner">
                            🛡️
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">Insurance Dashboard Summary</h3>
                        <p className="text-gray-500 max-w-md mx-auto">Select a tab above to manage specific areas of your insurance operations.</p>
                        <div className="grid grid-cols-2 gap-4 max-w-lg mx-auto pt-8">
                            <button onClick={() => setActiveTab('policies')} className="p-6 bg-white border border-gray-100 rounded-2xl hover:shadow-md transition-all text-left group">
                                <span className="text-2xl block mb-2">👥</span>
                                <h4 className="font-bold text-gray-900 group-hover:text-primary-600">Review Policies</h4>
                                <p className="text-xs text-gray-500">Manage member enrollment and coverage status.</p>
                            </button>
                            <button onClick={() => setActiveTab('claims')} className="p-6 bg-white border border-gray-100 rounded-2xl hover:shadow-md transition-all text-left group">
                                <span className="text-2xl block mb-2">📁</span>
                                <h4 className="font-bold text-gray-900 group-hover:text-primary-600">Process Claims</h4>
                                <p className="text-xs text-gray-500">Review and approve new claim submissions.</p>
                            </button>
                        </div>
                    </div>
                )}
                {activeTab === 'policies' && <PolicyTable />}
                {activeTab === 'claims' && <ClaimWorkflow />}
                {activeTab === 'products' && (
                    <div className="p-8">
                        <ProductFactory />
                    </div>
                )}
            </div>
        </div>
    );
}
