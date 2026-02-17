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
    Plus
} from 'lucide-react';
import MemberManagement from '@/components/applicant/MemberManagement';
import DocumentUpload from '@/components/applicant/DocumentUpload';
import { SpinnerCentered } from '@/components/common/Spinner';

const STEPS = [
    { id: 'basics', title: 'Basic Info', icon: Building2 },
    { id: 'members', title: 'Founding Members', icon: Users },
    { id: 'documents', title: 'Required Documents', icon: FileUp },
    { id: 'review', title: 'Verify & Submit', icon: CheckCircle2 },
];

export default function CooperativeWizard() {
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
                body: JSON.stringify({ ...data, applicationType: ApplicationType.COOPERATIVE }),
            });

            if (res.ok) {
                const newApp = await res.json();
                setApplication(newApp);
                router.push(`/cooperative/new?id=${newApp.id}`);
                setCurrentStep(1);
            }
        } catch (error) {
            console.error('Error creating application:', error);
        } finally {
            setSubmitting(false);
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
                router.push('/cooperative');
            }
        } catch (error) {
            console.error('Error submitting application:', error);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return <SpinnerCentered />;
    }

    return (
        <div className="bg-white rounded-[40px] shadow-2xl shadow-gray-200/50 border border-gray-100 overflow-hidden flex flex-col md:flex-row min-h-[700px]">
            {/* Steps Sidebar */}
            <div className="w-full md:w-96 bg-slate-950 p-12 text-white flex flex-col">
                <div className="mb-12">
                    <h2 className="text-3xl font-black leading-tight">Cooperative Registration</h2>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mt-4">Process Management</p>
                </div>

                <div className="space-y-6 flex-1">
                    {STEPS.map((step, idx) => {
                        const Icon = step.icon;
                        const isCompleted = idx < currentStep;
                        const isActive = idx === currentStep;

                        return (
                            <div
                                key={step.id}
                                className={`flex items-center gap-5 p-5 rounded-[2rem] transition-all ${isActive ? 'bg-primary-600 shadow-xl shadow-primary-900/40 translate-x-2' :
                                    isCompleted ? 'bg-white/5 text-green-400' : 'text-slate-600'
                                    }`}
                            >
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isActive ? 'bg-white/20' : isCompleted ? 'bg-green-400/10' : 'bg-white/5'
                                    }`}>
                                    {isCompleted ? <CheckCircle2 size={24} /> : <Icon size={24} />}
                                </div>
                                <div>
                                    <p className="text-xs font-black uppercase tracking-tighter opacity-50">Step 0{idx + 1}</p>
                                    <p className="font-black text-sm">{step.title}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {application && (
                    <div className="mt-12 p-6 bg-white/5 rounded-3xl border border-white/10">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Application ID</p>
                        <p className="text-xs font-mono font-bold text-slate-300 break-all">{application.id}</p>
                    </div>
                )}
            </div>

            {/* Content Area */}
            <div className="flex-1 p-8 md:p-16 overflow-y-auto bg-slate-50/30">
                {currentStep === 0 && (
                    <div className="max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="mb-12">
                            <h3 className="text-4xl font-black text-slate-900 mb-4">Identity & Contact</h3>
                            <p className="text-slate-500 text-lg font-medium">Provide the foundational details for your cooperative society.</p>
                        </div>

                        <form onSubmit={application ? (e) => { e.preventDefault(); setCurrentStep(1); } : handleCreateApplication} className="space-y-10">
                            <div className="space-y-4">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Proposed Cooperative Name</label>
                                <input
                                    name="proposedName"
                                    defaultValue={application?.proposedName}
                                    required
                                    className="w-full px-8 py-5 bg-white border-2 border-slate-100 rounded-3xl focus:border-primary-500 focus:shadow-xl focus:shadow-primary-100 outline-none transition-all font-black text-xl placeholder:text-slate-300"
                                    placeholder="e.g., Kalahari Farmers Cooperative"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Primary Contact Person</label>
                                    <input
                                        name="primaryContactName"
                                        defaultValue={application?.primaryContactName}
                                        required
                                        className="w-full px-7 py-4 bg-white border border-slate-200 rounded-2xl focus:border-primary-500 outline-none transition-all font-bold"
                                        placeholder="Full Legal Name"
                                    />
                                </div>
                                <div className="space-y-4">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Contact Email</label>
                                    <input
                                        name="primaryContactEmail"
                                        type="email"
                                        defaultValue={application?.primaryContactEmail}
                                        required
                                        className="w-full px-7 py-4 bg-white border border-slate-200 rounded-2xl focus:border-primary-500 outline-none transition-all font-bold"
                                        placeholder="admin@coop.bw"
                                    />
                                </div>
                                <div className="space-y-4">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Contact Phone</label>
                                    <input
                                        name="primaryContactPhone"
                                        defaultValue={application?.primaryContactPhone}
                                        required
                                        className="w-full px-7 py-4 bg-white border border-slate-200 rounded-2xl focus:border-primary-500 outline-none transition-all font-bold"
                                        placeholder="+267 7X XXX XXX"
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Physical/Postal Address</label>
                                <textarea
                                    name="physicalAddress"
                                    defaultValue={application?.physicalAddress}
                                    required
                                    rows={3}
                                    className="w-full px-7 py-4 bg-white border border-slate-200 rounded-2xl focus:border-primary-500 outline-none transition-all font-bold resize-none"
                                    placeholder="Include Plot Number, Ward, and Village/City"
                                />
                            </div>

                            <div className="flex justify-end pt-6">
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="group flex items-center gap-3 px-12 py-5 bg-primary-600 text-white font-black rounded-3xl shadow-2xl shadow-primary-200 hover:bg-primary-700 hover:gap-5 transition-all disabled:opacity-50 active:scale-95"
                                >
                                    {submitting ? 'Processing...' : application ? 'Continue Process' : 'Initialize Registration'}
                                    <Plus size={20} className="group-hover:rotate-90 transition-transform" />
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {currentStep === 1 && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 h-full flex flex-col">
                        <div className="mb-12">
                            <h3 className="text-4xl font-black text-slate-900 mb-4">Founding Members</h3>
                            <p className="text-slate-500 text-lg font-medium">A cooperative require a minimum of 10 founding members. Add them here.</p>
                        </div>

                        <div className="flex-1 overflow-hidden">
                            <MemberManagement
                                applicationId={application.id}
                                onUpdate={() => fetchApplication()}
                            />
                        </div>

                        <div className="flex justify-between items-center mt-12 bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
                            <button onClick={() => setCurrentStep(0)} className="flex items-center gap-2 px-8 py-4 text-slate-400 font-black rounded-2xl hover:bg-slate-50 transition-all uppercase tracking-tighter text-sm">
                                <ChevronLeft size={20} />
                                Previous Step
                            </button>
                            <button
                                onClick={() => setCurrentStep(2)}
                                disabled={members.length < 1}
                                className="flex items-center gap-3 px-12 py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-slate-800 transition-all uppercase tracking-tighter text-sm disabled:opacity-30 shadow-lg shadow-slate-200"
                            >
                                Next: Documents
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    </div>
                )}

                {currentStep === 2 && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="mb-12">
                            <h3 className="text-4xl font-black text-slate-900 mb-4">Legal Documents</h3>
                            <p className="text-slate-500 text-lg font-medium">Upload the required statutes and certified identification.</p>
                        </div>

                        <DocumentUpload
                            applicationId={application.id}
                            onUpdate={() => fetchApplication()}
                        />

                        <div className="flex justify-between items-center mt-12 bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
                            <button onClick={() => setCurrentStep(1)} className="flex items-center gap-2 px-8 py-4 text-slate-400 font-black rounded-2xl hover:bg-slate-50 transition-all uppercase tracking-tighter text-sm">
                                <ChevronLeft size={20} />
                                Previous Step
                            </button>
                            <button
                                onClick={() => setCurrentStep(3)}
                                className="flex items-center gap-3 px-12 py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-slate-800 transition-all uppercase tracking-tighter text-sm shadow-lg shadow-slate-200"
                            >
                                Review & Submit
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    </div>
                )}

                {currentStep === 3 && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto">
                        <div className="text-center mb-16">
                            <div className="w-24 h-24 bg-green-50 text-green-500 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-inner">
                                <CheckCircle2 size={48} />
                            </div>
                            <h3 className="text-4xl font-black text-slate-900 mb-4">Final Review</h3>
                            <p className="text-slate-500 text-lg font-medium">Please confirm all details before formal submission to the Ministry.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="p-10 bg-white rounded-[3rem] border border-slate-100 shadow-sm space-y-8">
                                <h4 className="text-xs font-black text-slate-300 uppercase tracking-widest mb-6">Entity Summary</h4>
                                <div className="space-y-6">
                                    <div className="p-6 bg-slate-50 rounded-2xl">
                                        <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Cooperative Name</p>
                                        <p className="text-xl font-black text-slate-900">{application?.proposedName}</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-5 bg-slate-50 rounded-2xl text-center">
                                            <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Members</p>
                                            <p className="text-2xl font-black text-primary-600">{members.length}</p>
                                        </div>
                                        <div className="p-5 bg-slate-50 rounded-2xl text-center">
                                            <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Documents</p>
                                            <p className="text-2xl font-black text-primary-600">{documents.length}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-8">
                                <div className="p-10 bg-slate-900 text-white rounded-[3rem] shadow-xl space-y-8 relative overflow-hidden">
                                    <Building2 size={100} className="absolute -bottom-6 -right-6 text-white/5 rotate-12" />
                                    <h4 className="font-black text-xl">Legal Declaration</h4>
                                    <div className="space-y-6">
                                        {[
                                            "All members listed are over 18 years of age.",
                                            "The proposed by-laws comply with the Cooperative Societies Act.",
                                            "I am authorized by the founding committee to submit this."
                                        ].map((text, i) => (
                                            <label key={i} className="flex gap-4 cursor-pointer group">
                                                <input type="checkbox" required className="mt-1 w-5 h-5 rounded bg-white/10 border-white/20 checked:bg-primary-500 checked:border-primary-500 focus:ring-primary-500 transition-all" />
                                                <span className="text-sm font-bold text-slate-300 group-hover:text-white transition-colors">{text}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <button
                                        onClick={() => router.push('/cooperative')}
                                        className="flex-1 py-5 px-6 border-2 border-slate-100 text-slate-900 font-black rounded-3xl hover:bg-slate-50 transition-all uppercase tracking-tighter text-sm flex items-center justify-center gap-2"
                                    >
                                        <Save size={18} />
                                        Save Progress
                                    </button>
                                    <button
                                        onClick={handleSubmitForReview}
                                        disabled={submitting}
                                        className="flex-[2] py-5 px-8 bg-primary-600 text-white font-black rounded-3xl hover:bg-primary-700 shadow-2xl shadow-primary-200 transition-all uppercase tracking-tighter text-sm flex items-center justify-center gap-3 active:scale-95"
                                    >
                                        {submitting ? 'Submitting...' : 'Confirm Submission'}
                                        <Send size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        <button onClick={() => setCurrentStep(2)} className="mt-12 mx-auto flex items-center gap-2 text-slate-400 font-black hover:text-slate-600 transition-colors uppercase tracking-widest text-xs">
                            <ChevronLeft size={16} />
                            Go Back to Documents
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
