'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Step {
    id: number;
    title: string;
}

const STEPS: Step[] = [
    { id: 1, title: 'Personal Information' },
    { id: 2, title: 'KYC Documents' },
    { id: 3, title: 'Beneficiaries' },
    { id: 4, title: 'Review & Complete' }
];

export default function MemberOnboardingWizard() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [warning, setWarning] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        middleName: '',
        email: '',
        phone: '',
        nationalId: '',
        dateOfBirth: '',
        gender: 'male',
        employmentStatus: 'employed',
        employer: '',
        physicalAddress: '',
        postalAddress: '',
        monthlyNetSalary: '',
        beneficiaries: [] as any[]
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
    const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

    const handleSubmit = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/admin/members/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to create member');
            }

            const result = await response.json();
            if (result.warning) {
                setWarning(result.warning);
                alert('Member created with warning: ' + result.warning);
            } else {
                alert('Member created successfully!');
            }
            router.push(`/admin/members/${result.data.id}`);
        } catch (err: any) {
            alert(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            {/* Stepper */}
            <div className="flex justify-between mb-8">
                {STEPS.map((step) => (
                    <div key={step.id} className="flex flex-col items-center flex-1">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold mb-2 ${currentStep === step.id ? 'bg-primary-600 text-white' :
                            currentStep > step.id ? 'bg-success-500 text-white' : 'bg-gray-200 text-gray-500'
                            }`}>
                            {currentStep > step.id ? '✓' : step.id}
                        </div>
                        <span className={`text-xs font-bold uppercase ${currentStep === step.id ? 'text-primary-600' : 'text-gray-400'}`}>
                            {step.title}
                        </span>
                    </div>
                ))}
            </div>

            {/* Form Content */}
            <div className="card p-8 bg-white shadow-xl rounded-2xl border border-gray-100">
                {currentStep === 1 && (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Personal Information</h2>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700">First Name</label>
                                <input name="firstName" value={formData.firstName} onChange={handleInputChange} className="input-field" placeholder="John" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700">Last Name</label>
                                <input name="lastName" value={formData.lastName} onChange={handleInputChange} className="input-field" placeholder="Doe" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700">Email Address</label>
                                <input type="email" name="email" value={formData.email} onChange={handleInputChange} className="input-field" placeholder="john.doe@example.com" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700">Phone Number</label>
                                <input name="phone" value={formData.phone} onChange={handleInputChange} className="input-field" placeholder="+267..." />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700">National ID</label>
                                <input name="nationalId" value={formData.nationalId} onChange={handleInputChange} className="input-field" placeholder="ID Number" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700">Date of Birth</label>
                                <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleInputChange} className="input-field" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700">Monthly Net Salary (P)</label>
                                <input type="number" name="monthlyNetSalary" value={formData.monthlyNetSalary} onChange={handleInputChange} className="input-field" placeholder="15000" />
                            </div>
                        </div>
                    </div>
                )}

                {currentStep === 2 && (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">KYC Documents</h2>
                        <div className="p-12 border-2 border-dashed border-gray-300 rounded-2xl text-center">
                            <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            <p className="text-gray-600">Click to upload or drag and drop</p>
                            <p className="text-xs text-gray-400 mt-2">National ID, Proof of Residence, Payslip (PDF, JPG, PNG)</p>
                            <button className="btn btn-secondary mt-6">Select Files</button>
                        </div>
                    </div>
                )}

                {currentStep === 3 && (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Beneficiary Information</h2>
                        <p className="text-gray-500 italic">Beneficiaries can be added after initial registration in the member profile.</p>
                        <div className="bg-primary-50 p-6 rounded-xl border border-primary-100">
                            <p className="text-primary-700 text-sm">Would you like to skip this step for now?</p>
                            <button className="btn btn-primary mt-4" onClick={nextStep}>Skip to Review</button>
                        </div>
                    </div>
                )}

                {currentStep === 4 && (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Review Information</h2>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <p className="text-gray-500 uppercase font-bold text-[10px] mb-1">Full Name</p>
                                <p className="font-bold">{formData.firstName} {formData.lastName}</p>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <p className="text-gray-500 uppercase font-bold text-[10px] mb-1">Email</p>
                                <p className="font-bold">{formData.email}</p>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <p className="text-gray-500 uppercase font-bold text-[10px] mb-1">ID Number</p>
                                <p className="font-bold">{formData.nationalId}</p>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <p className="text-gray-500 uppercase font-bold text-[10px] mb-1">Phone</p>
                                <p className="font-bold">{formData.phone}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Navigation Buttons */}
                <div className="mt-12 flex justify-between">
                    <button
                        onClick={prevStep}
                        disabled={currentStep === 1 || loading}
                        className="btn btn-secondary flex items-center gap-2 disabled:opacity-50"
                    >
                        Previous
                    </button>
                    {currentStep < STEPS.length ? (
                        <button
                            onClick={nextStep}
                            className="btn btn-primary flex items-center gap-2"
                        >
                            Next Step
                        </button>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="btn btn-success text-white flex items-center gap-2"
                        >
                            {loading ? 'Processing...' : 'Complete Onboarding'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
