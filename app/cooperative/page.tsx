'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-hooks';
import { SocietyApplication, ApplicationStatus } from '@/src/entities/SocietyApplication';
import {
    Plus,
    FileText,
    Users,
    Upload,
    Clock,
    CheckCircle2,
    AlertCircle,
    MessageSquare,
    ChevronRight,
    ArrowRight
} from 'lucide-react';
import Link from 'next/link';

export default function CooperativeDashboard() {
    const { user, loading } = useAuth();
    const [applications, setApplications] = useState<SocietyApplication[]>([]);
    const [fetching, setFetching] = useState(true);

    useEffect(() => {
        if (user) {
            fetch('/api/applications/list')
                .then(res => res.json())
                .then(data => {
                    // Filter for cooperative applications if needed, 
                    // though for this user they should all be relevant
                    setApplications(data);
                    setFetching(false);
                })
                .catch(err => {
                    console.error(err);
                    setFetching(false);
                });
        }
    }, [user]);

    if (loading || fetching) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
            </div>
        );
    }

    const activeApplication = applications.find(app =>
        ![ApplicationStatus.APPROVED, ApplicationStatus.REJECTED].includes(app.status)
    );

    const getStatusColor = (status: ApplicationStatus) => {
        switch (status) {
            case ApplicationStatus.DRAFT: return 'bg-gray-100 text-gray-600';
            case ApplicationStatus.SUBMITTED: return 'bg-blue-100 text-blue-600';
            case ApplicationStatus.UNDER_REVIEW: return 'bg-yellow-100 text-yellow-600';
            case ApplicationStatus.APPROVED: return 'bg-green-100 text-green-600';
            case ApplicationStatus.REJECTED: return 'bg-red-100 text-red-600';
            default: return 'bg-primary-100 text-primary-600';
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-12 pb-20">
            {/* Header section with branding */}
            <header className="relative py-12 px-8 overflow-hidden rounded-[2.5rem] bg-slate-950 text-white shadow-2xl">
                <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary-500/20 to-transparent"></div>
                <div className="relative z-10 space-y-4">
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight">
                        Cooperative <span className="text-primary-400 text-glow">Portal</span>
                    </h1>
                    <p className="text-slate-400 text-lg max-w-xl font-medium">
                        Welcome, {user?.name}. Manage your cooperative application and track its progress through the regulatory workflow.
                    </p>
                </div>
            </header>

            {/* Quick Actions and Status */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Main Action Card */}
                <div className="md:col-span-2 space-y-8">
                    {!activeApplication ? (
                        <div className="group relative overflow-hidden bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-primary-100 transition-all duration-500">
                            <div className="relative z-10 space-y-6">
                                <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
                                    <Plus className="text-primary-600" size={32} />
                                </div>
                                <div className="space-y-2">
                                    <h2 className="text-2xl font-black text-slate-900">Start New Application</h2>
                                    <p className="text-slate-500 font-medium">Begin the process of registering a new cooperative society.</p>
                                </div>
                                <Link
                                    href="/cooperative/new"
                                    className="inline-flex items-center gap-2 px-8 py-4 bg-primary-600 text-white font-black rounded-2xl hover:bg-primary-700 hover:gap-4 transition-all"
                                >
                                    Register Cooperative <ArrowRight size={20} />
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 space-y-8">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <h2 className="text-2xl font-black text-slate-900">{activeApplication.proposedName}</h2>
                                    <div className={`inline-flex px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest ${getStatusColor(activeApplication.status)}`}>
                                        {activeApplication.status.replace('_', ' ')}
                                    </div>
                                </div>
                                <Link
                                    href={`/cooperative/wizard?id=${activeApplication.id}`}
                                    className="px-6 py-3 bg-slate-900 text-white font-black rounded-xl hover:bg-slate-800 transition-all text-sm"
                                >
                                    Continue Application
                                </Link>
                            </div>

                            {/* Status Timeline Shorthand */}
                            <div className="relative pt-8 pb-4 px-2">
                                <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-100 -translate-y-1/2"></div>
                                <div className="relative flex justify-between">
                                    {[
                                        { label: 'Draft', active: true },
                                        { label: 'Review', active: activeApplication.status !== ApplicationStatus.DRAFT },
                                        { label: 'Vetting', active: [ApplicationStatus.SECURITY_VETTING, ApplicationStatus.LEGAL_REVIEW, ApplicationStatus.APPROVED].includes(activeApplication.status) },
                                        { label: 'Approved', active: activeApplication.status === ApplicationStatus.APPROVED }
                                    ].map((step, i) => (
                                        <div key={i} className="flex flex-col items-center gap-3">
                                            <div className={`relative z-10 w-6 h-6 rounded-full border-4 border-white shadow-md ${step.active ? 'bg-primary-500' : 'bg-slate-300'}`}></div>
                                            <span className={`text-[10px] font-black uppercase tracking-tighter ${step.active ? 'text-primary-600' : 'text-slate-400'}`}>
                                                {step.label}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* All Applications List */}
                    {applications.length > 0 && (
                        <div className="space-y-6">
                            <h3 className="text-xl font-black text-slate-900 px-4 flex items-center gap-2">
                                <Clock className="text-primary-500" size={24} />
                                Application History
                            </h3>
                            <div className="space-y-4">
                                {applications.map(app => (
                                    <div key={app.id} className="bg-white p-6 rounded-3xl border border-slate-50 shadow-sm flex items-center gap-6 hover:shadow-md transition-shadow">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getStatusColor(app.status)}`}>
                                            <FileText size={24} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-slate-900 truncate">{app.proposedName}</p>
                                            <p className="text-xs text-slate-400 font-bold uppercase">{new Date(app.createdAt).toLocaleDateString()}</p>
                                        </div>
                                        <div className="text-right">
                                            <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${getStatusColor(app.status)}`}>
                                                {app.status}
                                            </span>
                                        </div>
                                        <ChevronRight className="text-slate-300" size={20} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar Cards */}
                <div className="space-y-8">
                    <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-200/50 space-y-6">
                        <h3 className="font-black text-slate-900 flex items-center gap-2">
                            <AlertCircle className="text-slate-600" size={20} />
                            Quick Links
                        </h3>
                        <div className="grid grid-cols-1 gap-3">
                            {[
                                { label: 'Member Management', icon: Users, href: '/cooperative/members' },
                                { label: 'Required Documents', icon: Upload, href: '/cooperative/documents' },
                                { label: 'Submit Appeal', icon: MessageSquare, href: '/cooperative/appeals' }
                            ].map((item, i) => (
                                <Link
                                    key={i}
                                    href={item.href}
                                    className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-slate-200/60 font-bold text-slate-700 hover:border-primary-500 hover:text-primary-600 transition-all text-sm group"
                                >
                                    <div className="p-2 rounded-lg bg-slate-50 text-slate-400 group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">
                                        <item.icon size={18} />
                                    </div>
                                    {item.label}
                                </Link>
                            ))}
                        </div>
                    </div>

                    <div className="p-8 bg-gradient-to-br from-primary-600 to-primary-800 rounded-[2rem] text-white space-y-4 shadow-xl shadow-primary-200">
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md">
                            <Clock size={24} />
                        </div>
                        <h4 className="text-lg font-black leading-tight">Need Assistance?</h4>
                        <p className="text-primary-100 text-xs font-medium leading-relaxed">
                            Our support team is available to help you with your registration process. Contact us at <span className="font-bold underline">support@kika.gov.bw</span>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
