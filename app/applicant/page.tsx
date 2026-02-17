'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-hooks';
import { SocietyApplication, ApplicationStatus } from '@/src/entities/SocietyApplication';
import {
    FileText,
    ArrowRight,
    CheckCircle2,
    Clock,
    AlertCircle,
    ShieldCheck,
    Scale,
    Award,
    Plus
} from 'lucide-react';
import Link from 'next/link';

export default function ApplicantDashboard() {
    const { user } = useAuth();
    const [applications, setApplications] = useState<SocietyApplication[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchApplications = async () => {
            try {
                // Fetch applications for this user
                // For simplicity, we'll fetch from a generic list or a user-specific endpoint
                const res = await fetch('/api/registration/applications');
                if (res.ok) {
                    const data = await res.json();
                    // Filter for user's own if the API doesn't handle it
                    setApplications(data.filter((app: any) => app.applicantUserId === user?.id));
                }
            } catch (error) {
                console.error('Error fetching applications:', error);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchApplications();
        }
    }, [user]);

    const getStatusIcon = (status: ApplicationStatus) => {
        switch (status) {
            case ApplicationStatus.APPROVED:
            case ApplicationStatus.APPEAL_APPROVED:
                return <CheckCircle2 className="text-green-500" size={24} />;
            case ApplicationStatus.REJECTED:
            case ApplicationStatus.SECURITY_FAILED:
            case ApplicationStatus.LEGAL_REJECTED:
                return <AlertCircle className="text-red-500" size={24} />;
            case ApplicationStatus.DRAFT:
                return <FileText className="text-gray-400" size={24} />;
            default:
                return <Clock className="text-primary-500 animate-pulse" size={24} />;
        }
    };

    const getStatusColor = (status: ApplicationStatus) => {
        switch (status) {
            case ApplicationStatus.APPROVED:
            case ApplicationStatus.APPEAL_APPROVED:
                return 'bg-green-50 text-green-700 border-green-200';
            case ApplicationStatus.REJECTED:
            case ApplicationStatus.SECURITY_FAILED:
            case ApplicationStatus.LEGAL_REJECTED:
                return 'bg-red-50 text-red-700 border-red-200';
            case ApplicationStatus.DRAFT:
                return 'bg-gray-50 text-gray-700 border-gray-200';
            default:
                return 'bg-primary-50 text-primary-700 border-primary-200';
        }
    };

    const workflowStages = [
        { name: 'Intake', icon: FileText, status: 'completed' },
        { name: 'Vetting', icon: ShieldCheck, status: 'current' },
        { name: 'Legal', icon: Scale, status: 'upcoming' },
        { name: 'Decision', icon: Award, status: 'upcoming' },
    ];

    if (loading) {
        return (
            <div className="animate-pulse space-y-8">
                <div className="h-32 bg-white rounded-3xl border border-gray-100 shadow-sm" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="h-64 bg-white rounded-3xl border border-gray-100 shadow-sm" />
                    <div className="h-64 bg-white rounded-3xl border border-gray-100 shadow-sm" />
                </div>
            </div>
        );
    }

    const currentApp = applications[0];

    return (
        <div className="space-y-8 pb-12">
            {/* Welcome Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
                        Hello, {user?.name?.split(' ')[0]}
                    </h1>
                    <p className="text-gray-500 mt-2 font-medium">
                        Welcome to your society registration portal.
                    </p>
                </div>
                {!currentApp && (
                    <Link
                        href="/applicant/apply"
                        className="inline-flex items-center gap-2 px-6 py-3.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-2xl shadow-xl shadow-primary-200 transition-all hover:scale-105 active:scale-95"
                    >
                        <Plus size={20} />
                        New Application
                    </Link>
                )}
            </div>

            {currentApp ? (
                <>
                    {/* Status Overview Card */}
                    <div className="bg-white rounded-[32px] p-8 md:p-10 shadow-2xl shadow-gray-200/50 border border-gray-100 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-50 rounded-full -mr-32 -mt-32 opacity-50 group-hover:scale-110 transition-transform duration-700" />

                        <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-8">
                            <div className={`w-20 h-20 rounded-3xl flex items-center justify-center shadow-lg ${getStatusColor(currentApp.status)}`}>
                                {getStatusIcon(currentApp.status)}
                            </div>

                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border ${getStatusColor(currentApp.status)}`}>
                                        {currentApp.status.replace('_', ' ')}
                                    </span>
                                    {currentApp.fileNumber && (
                                        <span className="text-sm font-bold text-gray-500">#{currentApp.fileNumber}</span>
                                    )}
                                </div>
                                <h2 className="text-3xl font-black text-gray-900 mb-2">{currentApp.proposedName}</h2>
                                <p className="text-gray-500 font-medium">
                                    Last updated on {new Date(currentApp.updatedAt).toLocaleDateString()}
                                </p>
                            </div>

                            <div className="flex flex-col gap-3">
                                <Link
                                    href={`/applicant/apply?id=${currentApp.id}`}
                                    className="px-6 py-3 bg-white border-2 border-primary-100 text-primary-600 font-bold rounded-xl hover:bg-primary-50 transition-all text-center"
                                >
                                    View Details
                                </Link>
                                {currentApp.status === ApplicationStatus.DRAFT && (
                                    <Link
                                        href={`/applicant/apply?id=${currentApp.id}`}
                                        className="px-6 py-3 bg-primary-600 text-white font-bold rounded-xl shadow-lg shadow-primary-200 hover:bg-primary-700 transition-all text-center"
                                    >
                                        Resume Application
                                    </Link>
                                )}
                            </div>
                        </div>

                        {/* Workflow Progress Bar */}
                        <div className="mt-12 pt-8 border-t border-gray-50">
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-8">Registration Progress</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {workflowStages.map((stage, idx) => {
                                    const Icon = stage.icon;
                                    return (
                                        <div key={idx} className="flex flex-col items-center gap-4 group">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${stage.status === 'completed' ? 'bg-green-100 text-green-600' :
                                                    stage.status === 'current' ? 'bg-primary-600 text-white shadow-lg shadow-primary-200 scale-110' :
                                                        'bg-gray-100 text-gray-400'
                                                }`}>
                                                <Icon size={24} />
                                            </div>
                                            <div className="text-center">
                                                <p className={`text-sm font-bold ${stage.status === 'current' ? 'text-gray-900' : 'text-gray-500'}`}>{stage.name}</p>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{stage.status}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="mt-8 h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-primary-500 rounded-full w-1/4 transition-all duration-1000 ease-out shadow-sm" />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Member Management Preview */}
                        <div className="md:col-span-2 bg-white rounded-3xl p-8 border border-gray-100 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative">
                            <div className="flex justify-between items-center mb-8">
                                <h3 className="text-xl font-bold text-gray-900">Founding Members</h3>
                                <Link href="/applicant/members" className="text-primary-600 font-bold text-sm hover:underline flex items-center gap-1">
                                    Manage All <ArrowRight size={16} />
                                </Link>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100">
                                    <div className="w-10 h-10 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold">TM</div>
                                    <div className="flex-1">
                                        <p className="font-bold text-gray-900">Thabo Molefe</p>
                                        <p className="text-xs text-gray-500 font-medium tracking-wide">CHAIRPERSON</p>
                                    </div>
                                    <div className="px-2 py-1 rounded bg-green-100 text-green-700 text-[10px] font-bold">VERIFIED</div>
                                </div>
                                <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100">
                                    <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold">LM</div>
                                    <div className="flex-1">
                                        <p className="font-bold text-gray-900">Lesedi Moroka</p>
                                        <p className="text-xs text-gray-500 font-medium tracking-wide">SECRETARY</p>
                                    </div>
                                    <div className="px-2 py-1 rounded bg-orange-100 text-orange-700 text-[10px] font-bold">PENDING VETTING</div>
                                </div>
                            </div>
                        </div>

                        {/* Quick Tips/Help */}
                        <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-3xl p-8 text-white shadow-xl shadow-indigo-100 relative overflow-hidden">
                            <div className="absolute -right-8 -bottom-8 opacity-10">
                                <FileText size={160} />
                            </div>
                            <h3 className="text-lg font-bold mb-6">Application Tips</h3>
                            <ul className="space-y-6 relative z-10">
                                <li className="flex gap-4">
                                    <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0 text-xs font-bold">1</div>
                                    <p className="text-sm font-medium leading-relaxed opacity-90">Ensure your constitution is signed by all members before uploading.</p>
                                </li>
                                <li className="flex gap-4">
                                    <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0 text-xs font-bold">2</div>
                                    <p className="text-sm font-medium leading-relaxed opacity-90">Founding members must provide ID copies for security vetting.</p>
                                </li>
                                <li className="flex gap-4">
                                    <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0 text-xs font-bold">3</div>
                                    <p className="text-sm font-medium leading-relaxed opacity-90">Registration fees can be paid online via the portal.</p>
                                </li>
                            </ul>
                        </div>
                    </div>
                </>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[48px] border-2 border-dashed border-gray-200">
                    <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                        <FileText size={48} className="text-gray-300" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">No Applications Yet</h2>
                    <p className="text-gray-500 mb-8 max-w-sm text-center font-medium">
                        You haven't started any society registration applications. Click below to begin.
                    </p>
                    <Link
                        href="/applicant/apply"
                        className="px-8 py-4 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-2xl shadow-xl shadow-primary-200 transition-all hover:scale-105"
                    >
                        Start Registration Process
                    </Link>
                </div>
            )}
        </div>
    );
}
