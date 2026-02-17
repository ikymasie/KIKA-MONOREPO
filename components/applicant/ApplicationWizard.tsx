'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ApplicationType, ApplicationStatus } from '@/src/entities/SocietyApplication';
import {
    Building2,
    Users,
    FileUp,
    CheckCircle2,
    ChevronRight,
    ChevronLeft,
    Save,
    Send,
    Trash2,
    Plus
} from 'lucide-react';
import FileUpload from '@/components/common/FileUpload';
import MemberManagement from './MemberManagement';
import DocumentUpload from './DocumentUpload';

const STEPS = [
    { id: 'basics', title: 'Basic Info', icon: Building2 },
    { id: 'members', title: 'Members', icon: Users },
    { id: 'documents', title: 'Documents', icon: FileUp },
    { id: 'review', title: 'Review', icon: CheckCircle2 },
];

export default function ApplicationWizard() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const applicationId = searchParams.get('id');

    const [currentStep, setCurrentStep] = useState(0);
    const [loading, setLoading] = useState(!!applicationId);
    const [submitting, setSubmitting] = useState(false);
    const [application, setApplication] = useState<any>(null);
    const [members, setMembers] = useState<any[]>([]);
    const [documents, setDocuments] = useState<any[]>([]);

    useEffect(() => {
        if (applicationId) {
            fetchApplication();
        }
    }, [applicationId]);

    const fetchApplication = async () => {
        try {
            const res = await fetch(`/api/applications/${applicationId}`);
            if (res.ok) {
                const data = await res.json();
                setApplication(data);

                // Fetch members and docs
                const [mRes, dRes] = await Promise.all([
                    fetch(`/api/applications/members?applicationId=${applicationId}`),
                    fetch(`/api/applications/documents/upload?applicationId=${applicationId}`)
                ]);

                if (mRes.ok) setMembers(await mRes.json());
                if (dRes.ok) setDocuments(await dRes.json());
            }
        } catch (error) {
            console.error('Error fetching application:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateApplication = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSubmitting(true);
        const formData = new FormData(e.currentTarget);
        const data = Object.fromEntries(formData.entries());

        try {
            const res = await fetch('/api/applications/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (res.ok) {
                const newApp = await res.json();
                setApplication(newApp);
                router.push(`/applicant/apply?id=${newApp.id}`);
                setCurrentStep(1);
            }
        } catch (error) {
            console.error('Error creating application:', error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdateApplication = async (data: any) => {
        if (!application) return;
        try {
            const res = await fetch(`/api/applications/${application.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (res.ok) {
                setApplication(await res.json());
            }
        } catch (error) {
            console.error('Error updating application:', error);
        }
    };

    const handleAddMember = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!application) return;

        const formData = new FormData(e.currentTarget);
        const data = Object.fromEntries(formData.entries());

        try {
            const res = await fetch('/api/applications/members', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...data, applicationId: application.id }),
            });
            if (res.ok) {
                const newMember = await res.json();
                setMembers([...members, newMember]);
                (e.target as HTMLFormElement).reset();
            }
        } catch (error) {
            console.error('Error adding member:', error);
        }
    };

    const handleRemoveMember = async (id: string) => {
        try {
            const res = await fetch(`/api/applications/members?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                setMembers(members.filter(m => m.id !== id));
            }
        } catch (error) {
            console.error('Error removing member:', error);
        }
    };

    const handleSubmitForReview = async () => {
        setSubmitting(true);
        try {
            const res = await fetch(`/api/applications/${application.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: ApplicationStatus.SUBMITTED,
                    submittedAt: new Date()
                }),
            });
            if (res.ok) {
                router.push('/applicant');
            }
        } catch (error) {
            console.error('Error submitting application:', error);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent mb-4"></div>
                <p className="text-gray-500 font-medium">Loading application data...</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-[32px] shadow-2xl shadow-gray-200/50 border border-gray-100 overflow-hidden min-h-[600px] flex flex-col md:flex-row">
            {/* Sidebar Navigation */}
            <div className="w-full md:w-80 bg-gray-50 border-r border-gray-100 p-8 flex flex-col">
                <div className="mb-12">
                    <h2 className="text-2xl font-black text-gray-900 leading-tight">Registration Wizard</h2>
                    <p className="text-sm text-gray-400 mt-2 font-bold uppercase tracking-widest">Step {currentStep + 1} of {STEPS.length}</p>
                </div>

                <div className="space-y-4 flex-1">
                    {STEPS.map((step, idx) => {
                        const Icon = step.icon;
                        const isCompleted = idx < currentStep;
                        const isActive = idx === currentStep;

                        return (
                            <div
                                key={step.id}
                                className={`flex items-center gap-4 p-4 rounded-2xl transition-all ${isActive ? 'bg-primary-600 text-white shadow-xl shadow-primary-200' :
                                    isCompleted ? 'bg-green-50 text-green-700' : 'text-gray-400 opacity-60'
                                    }`}
                            >
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isActive ? 'bg-white/20' : isCompleted ? 'bg-green-100' : 'bg-gray-100'
                                    }`}>
                                    {isCompleted ? <CheckCircle2 size={20} /> : <Icon size={20} />}
                                </div>
                                <span className="font-bold text-sm tracking-wide">{step.title}</span>
                                {isActive && (
                                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                )}
                            </div>
                        );
                    })}
                </div>

                {application && (
                    <div className="mt-auto pt-8 border-t border-gray-200">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Status</p>
                        <p className="text-sm font-black text-primary-600 uppercase italic">
                            {application.status.replace('_', ' ')}
                        </p>
                    </div>
                )}
            </div>

            {/* Main Content Area */}
            <div className="flex-1 p-8 md:p-12">
                {currentStep === 0 && (
                    <div className="max-w-2xl animate-fade-in">
                        <div className="mb-10">
                            <h3 className="text-3xl font-black text-gray-900 mb-2">Basic Society Details</h3>
                            <p className="text-gray-500 font-medium">Tell us about the society you are registering.</p>
                        </div>

                        <form onSubmit={application ? (e) => { e.preventDefault(); setCurrentStep(1); } : handleCreateApplication} className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2 col-span-2">
                                    <label className="text-sm font-bold text-gray-700 uppercase tracking-wider">Proposed Name</label>
                                    <input
                                        name="proposedName"
                                        defaultValue={application?.proposedName}
                                        required
                                        className="w-full px-6 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-primary-500 focus:bg-white outline-none transition-all font-bold text-lg"
                                        placeholder="e.g., Gaborone Professional Association"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700 uppercase tracking-wider">Application Type</label>
                                    <select
                                        name="applicationType"
                                        defaultValue={application?.applicationType}
                                        required
                                        className="w-full px-6 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-primary-500 focus:bg-white outline-none transition-all font-bold"
                                    >
                                        <option value={ApplicationType.GENERAL_SOCIETY}>General Society</option>
                                        <option value={ApplicationType.BURIAL_SOCIETY}>Burial Society</option>
                                        <option value={ApplicationType.RELIGIOUS_SOCIETY}>Religious Society</option>
                                        <option value={ApplicationType.SACCOS}>SACCOS / Coop</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700 uppercase tracking-wider">Primary Contact Name</label>
                                    <input
                                        name="primaryContactName"
                                        defaultValue={application?.primaryContactName}
                                        required
                                        className="w-full px-6 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-primary-500 focus:bg-white outline-none transition-all font-bold"
                                        placeholder="Full Name"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700 uppercase tracking-wider">Contact Email</label>
                                    <input
                                        name="primaryContactEmail"
                                        type="email"
                                        defaultValue={application?.primaryContactEmail}
                                        required
                                        className="w-full px-6 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-primary-500 focus:bg-white outline-none transition-all font-bold"
                                        placeholder="email@example.com"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700 uppercase tracking-wider">Contact Phone</label>
                                    <input
                                        name="primaryContactPhone"
                                        defaultValue={application?.primaryContactPhone}
                                        required
                                        className="w-full px-6 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-primary-500 focus:bg-white outline-none transition-all font-bold"
                                        placeholder="+267 71000000"
                                    />
                                </div>

                                <div className="space-y-2 col-span-2">
                                    <label className="text-sm font-bold text-gray-700 uppercase tracking-wider">Physical Address</label>
                                    <textarea
                                        name="physicalAddress"
                                        defaultValue={application?.physicalAddress}
                                        required
                                        rows={3}
                                        className="w-full px-6 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-primary-500 focus:bg-white outline-none transition-all font-bold resize-none"
                                        placeholder="Plot 1234, Main Mall, Gaborone"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end pt-4">
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex items-center gap-2 px-10 py-4 bg-primary-600 text-white font-black rounded-2xl shadow-xl shadow-primary-200 hover:bg-primary-700 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                                >
                                    {submitting ? 'Creating...' : application ? 'Continue' : 'Start Application'}
                                    <ChevronRight size={20} />
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {currentStep === 1 && (
                    <div className="animate-fade-in h-full flex flex-col">
                        <div className="mb-10">
                            <h3 className="text-3xl font-black text-gray-900 mb-2">Founding Members</h3>
                            <p className="text-gray-500 font-medium">Add the founding members and office bearers of your society.</p>
                        </div>

                        <MemberManagement
                            applicationId={application.id}
                            onUpdate={() => fetchApplication()}
                        />

                        <div className="flex justify-between items-center mt-12 pt-8 border-t border-gray-100">
                            <button onClick={() => setCurrentStep(0)} className="flex items-center gap-2 px-8 py-4 text-gray-500 font-bold rounded-2xl hover:bg-gray-100 transition-all">
                                <ChevronLeft size={20} />
                                Back
                            </button>
                            <button
                                onClick={() => setCurrentStep(2)}
                                disabled={members.length < 1}
                                className="flex items-center gap-2 px-10 py-4 bg-primary-600 text-white font-black rounded-2xl shadow-xl shadow-primary-200 hover:bg-primary-700 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                            >
                                Continue to Documents
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    </div>
                )}

                {currentStep === 2 && (
                    <div className="animate-fade-in">
                        <div className="mb-10">
                            <h3 className="text-3xl font-black text-gray-900 mb-2">Required Documents</h3>
                            <p className="text-gray-500 font-medium">Upload the necessary legal documents for your application.</p>
                        </div>

                        <DocumentUpload
                            applicationId={application.id}
                            onUpdate={() => fetchApplication()}
                        />

                        <div className="flex justify-between items-center mt-12 pt-8 border-t border-gray-100">
                            <button onClick={() => setCurrentStep(1)} className="flex items-center gap-2 px-8 py-4 text-gray-500 font-bold rounded-2xl hover:bg-gray-100 transition-all">
                                <ChevronLeft size={20} />
                                Back
                            </button>
                            <button
                                onClick={() => setCurrentStep(3)}
                                className="flex items-center gap-2 px-10 py-4 bg-primary-600 text-white font-black rounded-2xl shadow-xl shadow-primary-200 hover:bg-primary-700 transition-all hover:scale-105 active:scale-95"
                            >
                                Summary & Review
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    </div>
                )}

                {currentStep === 3 && (
                    <div className="animate-fade-in">
                        <div className="mb-10 text-center">
                            <div className="inline-flex p-4 rounded-3xl bg-green-50 text-green-600 mb-6">
                                <CheckCircle2 size={48} />
                            </div>
                            <h3 className="text-3xl font-black text-gray-900 mb-2">Review Your Application</h3>
                            <p className="text-gray-500 font-medium">Please verify all information is accurate before submitting.</p>
                        </div>

                        <div className="space-y-8 max-w-3xl mx-auto">
                            <div className="p-8 bg-gray-50 rounded-3xl border border-gray-100">
                                <h4 className="text-xs font-bold text-gray-400 tracking-widest uppercase mb-6 pb-2 border-b border-gray-200">Society Overview</h4>
                                <div className="grid grid-cols-2 gap-y-6">
                                    <div>
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-tighter mb-1">Proposed Name</p>
                                        <p className="font-black text-gray-900">{application?.proposedName}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-tighter mb-1">Type</p>
                                        <p className="font-black text-primary-600 uppercase italic">{application?.applicationType?.replace('_', ' ')}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-tighter mb-1">Contact</p>
                                        <p className="font-bold text-gray-900">{application?.primaryContactName}</p>
                                        <p className="text-sm text-gray-500">{application?.primaryContactEmail}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-tighter mb-1">Stats</p>
                                        <p className="font-bold text-gray-900">{members.length} Members</p>
                                        <p className="text-sm text-gray-500">{documents.length} Documents Uploaded</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-8 bg-primary-900 text-white rounded-3xl shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-8 opacity-10">
                                    <Building2 size={120} />
                                </div>
                                <h4 className="text-lg font-bold mb-4">Declarations</h4>
                                <div className="space-y-4">
                                    <div className="flex gap-4">
                                        <input type="checkbox" className="mt-1 w-5 h-5 rounded border-transparent bg-white/20 checked:bg-white checked:text-primary-900 focus:ring-offset-primary-900" />
                                        <p className="text-sm font-medium leading-relaxed opacity-90">I certify that all information provided is true and accurate according to our records.</p>
                                    </div>
                                    <div className="flex gap-4">
                                        <input type="checkbox" className="mt-1 w-5 h-5 rounded border-transparent bg-white/20 checked:bg-white checked:text-primary-900 focus:ring-offset-primary-900" />
                                        <p className="text-sm font-medium leading-relaxed opacity-90">I understand that providing false information will lead to immediate rejection and possible legal action.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-between items-center mt-12 pt-8 border-t border-gray-100">
                            <button onClick={() => setCurrentStep(2)} className="flex items-center gap-2 px-8 py-4 text-gray-500 font-bold rounded-2xl hover:bg-gray-100 transition-all">
                                <ChevronLeft size={20} />
                                Back
                            </button>
                            <div className="flex gap-4">
                                <button
                                    onClick={() => router.push('/applicant')}
                                    className="flex items-center gap-2 px-8 py-4 text-primary-600 font-bold rounded-2xl border-2 border-primary-100 hover:bg-primary-50 transition-all"
                                >
                                    <Save size={20} />
                                    Save Draft
                                </button>
                                <button
                                    onClick={handleSubmitForReview}
                                    disabled={submitting}
                                    className="flex items-center gap-2 px-12 py-4 bg-primary-600 text-white font-black rounded-2xl shadow-xl shadow-primary-200 hover:bg-primary-700 transition-all hover:scale-110 active:scale-95 disabled:opacity-50"
                                >
                                    {submitting ? 'Submitting...' : 'Submit Final Application'}
                                    <Send size={20} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
