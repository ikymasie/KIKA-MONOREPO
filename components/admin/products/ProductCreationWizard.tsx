'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import FileUpload from '@/components/common/FileUpload';
import { generateUniqueFileName, getProductFilePath } from '@/lib/firebase-storage';

export type ProductType = 'savings' | 'loan' | 'insurance' | 'merchandise';

interface FieldConfig {
    name: string;
    label: string;
    type: 'text' | 'number' | 'select' | 'textarea' | 'file';
    placeholder?: string;
    required?: boolean;
    defaultValue?: any;
    options?: { label: string; value: string }[];
    step?: string;
    isFileUpload?: boolean;
    acceptedTypes?: string[];
    maxSize?: number;
}

interface WizardStep {
    title: string;
    fields: FieldConfig[];
}

export const PRODUCT_CONFIG: Record<ProductType, { title: string; steps: WizardStep[] }> = {
    savings: {
        title: 'Savings Product',
        steps: [
            {
                title: 'Basic Identification',
                fields: [
                    { name: 'name', label: 'Product Name', type: 'text', placeholder: 'e.g., Regular Savings', required: true },
                    { name: 'code', label: 'Product Code', type: 'text', placeholder: 'e.g., SAV-01', required: true },
                    {
                        name: 'status',
                        label: 'Product Status',
                        type: 'select',
                        options: [
                            { label: 'Active', value: 'active' },
                            { label: 'Inactive', value: 'inactive' },
                        ],
                        defaultValue: 'active',
                        required: true
                    },
                ]
            },
            {
                title: 'Rate & Contribution',
                fields: [
                    { name: 'interestRate', label: 'Interest Rate (%)', type: 'number', step: '0.01', defaultValue: '0', required: true },
                    { name: 'minMonthlyContribution', label: 'Min. Monthly Contribution (P)', type: 'number', defaultValue: '100', required: true },
                    { name: 'interestEarningThreshold', label: 'Interest Earning Threshold (P)', type: 'number', defaultValue: '500', required: true },
                ]
            },
            {
                title: 'Balance Limits & Type',
                fields: [
                    { name: 'minimumBalance', label: 'Minimum Balance (P)', type: 'number', defaultValue: '0', required: true },
                    { name: 'maximumBalance', label: 'Maximum Balance (P)', type: 'number', placeholder: 'Leave empty for unlimited' },
                    {
                        name: 'isShareCapital',
                        label: 'Is Share Capital Account?',
                        type: 'select',
                        options: [
                            { label: 'No', value: 'false' },
                            { label: 'Yes', value: 'true' },
                        ],
                        defaultValue: 'false',
                        required: true
                    },
                ]
            },
            {
                title: 'Withdrawal Rules',
                fields: [
                    {
                        name: 'allowWithdrawals',
                        label: 'Allow Withdrawals?',
                        type: 'select',
                        options: [
                            { label: 'Yes', value: 'true' },
                            { label: 'No', value: 'false' },
                        ],
                        defaultValue: 'true',
                        required: true
                    },
                    { name: 'maxWithdrawalsPerMonth', label: 'Max Withdrawals Per Month', type: 'number', placeholder: 'Leave empty for unlimited' },
                    { name: 'minBalanceAfterWithdrawal', label: 'Min Balance After Withdrawal (P)', type: 'number', placeholder: 'Leave empty for no limit' },
                    { name: 'noticePeriodDays', label: 'Notice Period (Days)', type: 'number', placeholder: 'e.g., 7 for 7-day notice' },
                ]
            },
            {
                title: 'Promotional Media',
                fields: [
                    { name: 'flyerUrl', label: 'Product Flyer URL', type: 'text', placeholder: 'https://storage.kika.bw/flyers/savings-01.pdf' },
                    { name: 'description', label: 'Product Summary', type: 'textarea', placeholder: 'Brief summary for members...' },
                ]
            }
        ]
    },
    loan: {
        title: 'Loan Product',
        steps: [
            {
                title: 'Product Identity',
                fields: [
                    { name: 'name', label: 'Product Name', type: 'text', placeholder: 'e.g., Personal Loan', required: true },
                    { name: 'code', label: 'Product Code', type: 'text', placeholder: 'e.g., LOAN-01', required: true },
                ]
            },
            {
                title: 'Interest Settings',
                fields: [
                    { name: 'interestRate', label: 'Interest Rate (%)', type: 'number', step: '0.01', defaultValue: '12', required: true },
                    {
                        name: 'interestMethod', label: 'Interest Method', type: 'select', options: [
                            { label: 'Reducing Balance', value: 'reducing_balance' },
                            { label: 'Flat Rate', value: 'flat_rate' },
                            { label: 'Compound Interest', value: 'compound_interest' },
                        ], defaultValue: 'reducing_balance'
                    },
                ]
            },
            {
                title: 'Lending Constraints',
                fields: [
                    { name: 'savingsMultiplier', label: 'Savings Multiplier (x)', type: 'number', step: '0.1', defaultValue: '3' },
                    { name: 'maxDurationMonths', label: 'Max Duration (Months)', type: 'number', defaultValue: '12' },
                    { name: 'minimumAmount', label: 'Min. Loan Amount', type: 'number', defaultValue: '1000' },
                    { name: 'maximumAmount', label: 'Max. Loan Amount', type: 'number', defaultValue: '50000' },
                ]
            },
            {
                title: 'Promotional Media',
                fields: [
                    { name: 'flyerUrl', label: 'Product Flyer URL', type: 'text', placeholder: 'https://storage.kika.bw/flyers/loan-01.pdf' },
                    { name: 'description', label: 'Product Summary', type: 'textarea', placeholder: 'Brief summary for members...' },
                ]
            }
        ]
    },
    insurance: {
        title: 'Insurance Product',
        steps: [
            {
                title: 'Coverage Identity',
                fields: [
                    { name: 'name', label: 'Product Name', type: 'text', placeholder: 'e.g., Funeral Cover', required: true },
                    { name: 'code', label: 'Product Code', type: 'text', placeholder: 'e.g., INS-01', required: true },
                ]
            },
            {
                title: 'Policy Details',
                fields: [
                    {
                        name: 'coverageType', label: 'Coverage Type', type: 'select', options: [
                            { label: 'Individual', value: 'individual' },
                            { label: 'Family', value: 'family' },
                            { label: 'Extended', value: 'extended' },
                        ], defaultValue: 'individual', required: true
                    },
                    { name: 'coverageAmount', label: 'Coverage Amount (P)', type: 'number', step: '0.01', defaultValue: '10000', required: true },
                ]
            },
            {
                title: 'Financials & Maturity',
                fields: [
                    { name: 'monthlyPremium', label: 'Monthly Premium (P)', type: 'number', step: '0.01', defaultValue: '50', required: true },
                    { name: 'waitingPeriodMonths', label: 'Waiting Period (Months)', type: 'number', defaultValue: '6' },
                ]
            },
            {
                title: 'Promotional Media',
                fields: [
                    { name: 'flyerUrl', label: 'Product Flyer URL', type: 'text', placeholder: 'https://storage.kika.bw/flyers/insurance-01.pdf' },
                    { name: 'description', label: 'Product Summary', type: 'textarea', placeholder: 'Brief summary for members...' },
                ]
            }
        ]
    },
    merchandise: {
        title: 'Merchandise Product',
        steps: [
            {
                title: 'Product Identity',
                fields: [
                    { name: 'name', label: 'Product Name', type: 'text', placeholder: 'e.g., Solar Kit', required: true },
                    { name: 'sku', label: 'SKU / Code', type: 'text', placeholder: 'e.g., SKU-SOLAR', required: true },
                    {
                        name: 'category', label: 'Category', type: 'select', options: [
                            { label: 'Electronics', value: 'electronics' },
                            { label: 'Furniture', value: 'furniture' },
                            { label: 'Appliances', value: 'appliances' },
                            { label: 'Agricultural', value: 'agricultural' },
                            { label: 'Building Materials', value: 'building_materials' },
                            { label: 'Vehicles', value: 'vehicles' },
                            { label: 'Other', value: 'other' },
                        ], defaultValue: 'other', required: true
                    },
                ]
            },
            {
                title: 'Pricing & Terms',
                fields: [
                    { name: 'retailPrice', label: 'Retail Price (P)', type: 'number', step: '0.01', required: true },
                    { name: 'costPrice', label: 'Cost Price (P)', type: 'number', step: '0.01' },
                    { name: 'interestRate', label: 'Annual Interest Rate (%)', type: 'number', step: '0.01', defaultValue: '0' },
                ]
            },
            {
                title: 'Credit Limits',
                fields: [
                    { name: 'minimumTermMonths', label: 'Min. Term (Months)', type: 'number', defaultValue: '1' },
                    { name: 'maximumTermMonths', label: 'Max. Term (Months)', type: 'number', defaultValue: '12' },
                ]
            },
            {
                title: 'Inventory & Logistics',
                fields: [
                    { name: 'stockQuantity', label: 'Initial Stock Quantity', type: 'number', defaultValue: '0' },
                    { name: 'reorderLevel', label: 'Reorder Level (Alert Limit)', type: 'number', defaultValue: '5' },
                    {
                        name: 'allowAutoOrdering', label: 'Enable Automatic Reordering', type: 'select', options: [
                            { label: 'No - Manual only', value: 'false' },
                            { label: 'Yes - Notify Vendor via Email', value: 'true' },
                        ], defaultValue: 'false'
                    },
                    {
                        name: 'vendorId', label: 'Preferred Vendor', type: 'select', options: [
                            { label: 'Elite Electronics', value: '1' },
                            { label: 'Home Comforts Ltd', value: '2' },
                            { label: 'Unassigned', value: '' },
                        ], defaultValue: ''
                    },
                ]
            },
            {
                title: 'Promotional Media',
                fields: [
                    {
                        name: 'imageUrl',
                        label: 'Main Product Image',
                        type: 'file',
                        isFileUpload: true,
                        acceptedTypes: ['image/*'],
                        maxSize: 5 * 1024 * 1024, // 5MB
                        placeholder: 'Upload product image (JPG, PNG, WebP)'
                    },
                    {
                        name: 'flyerUrl',
                        label: 'Product Flyer (PDF)',
                        type: 'file',
                        isFileUpload: true,
                        acceptedTypes: ['application/pdf'],
                        maxSize: 10 * 1024 * 1024, // 10MB
                        placeholder: 'Upload product flyer or brochure'
                    },
                    { name: 'description', label: 'Product Summary', type: 'textarea', placeholder: 'Brief summary for members...' },
                ]
            }
        ]
    }
};

export default function ProductCreationWizard({ type, onSuccess, onCancel }: { type: ProductType, onSuccess: () => void, onCancel: () => void }) {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(0);
    const [formData, setFormData] = useState<Record<string, any>>({});
    const [submitting, setSubmitting] = useState(false);

    const config = PRODUCT_CONFIG[type];
    const step = config.steps[currentStep];

    const handleNext = (e: React.FormEvent) => {
        e.preventDefault();
        const form = e.currentTarget as HTMLFormElement;
        const currentFormData = new FormData(form);
        const data = Object.fromEntries(currentFormData.entries());

        const updatedData = { ...formData, ...data };
        setFormData(updatedData);

        if (currentStep < config.steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            submitProduct(updatedData);
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    async function submitProduct(data: any) {
        try {
            setSubmitting(true);
            const endpoint = `/api/admin/products/${type === 'loan' ? 'loans' : type}`;
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (response.ok) {
                onSuccess();
            }
        } catch (error) {
            console.error(`Failed to create ${type} product:`, error);
        } finally {
            setSubmitting(false);
        }
    }

    const themeColor = type === 'savings' ? 'success' : type === 'loan' ? 'primary' : type === 'insurance' ? 'blue' : 'amber';

    return (
        <div className="bg-gradient-to-br from-gray-50 to-white w-full max-w-7xl mx-auto rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-12 py-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{config.title}</h1>
                        <p className="text-gray-500 mt-2 font-medium">Configure your product settings and activate it for members.</p>
                    </div>
                    <button
                        onClick={onCancel}
                        className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>

            <div className="flex">
                {/* Step Navigation Sidebar */}
                <div className="w-80 bg-white border-r border-gray-200 p-8">
                    <div className="space-y-2">
                        {config.steps.map((s, idx) => {
                            const isActive = idx === currentStep;
                            const isCompleted = idx < currentStep;

                            return (
                                <div
                                    key={idx}
                                    className={`relative flex items-start gap-4 p-4 rounded-xl transition-all cursor-pointer ${isActive ? `bg-${themeColor}-50 border-2 border-${themeColor}-200` :
                                        isCompleted ? 'bg-gray-50 border-2 border-gray-200' :
                                            'border-2 border-transparent hover:bg-gray-50'
                                        }`}
                                    onClick={() => idx < currentStep && setCurrentStep(idx)}
                                >
                                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${isActive ? `bg-${themeColor}-600 text-white` :
                                        isCompleted ? `bg-${themeColor}-500 text-white` :
                                            'bg-gray-200 text-gray-500'
                                        }`}>
                                        {isCompleted ? '✓' : idx + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className={`font-bold text-sm ${isActive ? 'text-gray-900' : 'text-gray-600'}`}>
                                            {s.title}
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1">
                                            {s.fields.length} field{s.fields.length !== 1 ? 's' : ''}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Progress Summary */}
                    <div className="mt-8 p-4 bg-gray-50 rounded-xl">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Progress</span>
                            <span className="text-xs font-bold text-gray-900">{Math.round(((currentStep + 1) / config.steps.length) * 100)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                                className={`bg-${themeColor}-500 h-2 rounded-full transition-all duration-500`}
                                style={{ width: `${((currentStep + 1) / config.steps.length) * 100}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* Main Form Content */}
                <div className="flex-1 p-12">
                    <form onSubmit={handleNext} className="space-y-8">
                        {/* Step Title */}
                        <div className="pb-6 border-b border-gray-200">
                            <h2 className="text-2xl font-bold text-gray-900">{step.title}</h2>
                            <p className="text-gray-500 mt-2">Fill in the required information below</p>
                        </div>

                        {/* Form Fields */}
                        <div className="grid grid-cols-2 gap-8">
                            {step.fields.map((field) => (
                                <div key={field.name} className={`space-y-3 ${field.type === 'textarea' || field.isFileUpload ? 'col-span-2' : ''}`}>
                                    <label className="flex items-center gap-2 text-sm font-bold text-gray-900">
                                        {field.label}
                                        {field.required && <span className="text-red-500">*</span>}
                                    </label>

                                    {field.placeholder && !field.isFileUpload && (
                                        <p className="text-xs text-gray-500 -mt-1">{field.placeholder}</p>
                                    )}

                                    {field.isFileUpload ? (
                                        <FileUpload
                                            storagePath={getProductFilePath(
                                                formData.sku || 'temp',
                                                field.name === 'imageUrl' ? 'image' : 'flyer',
                                                generateUniqueFileName(field.name === 'imageUrl' ? 'product-image.jpg' : 'product-flyer.pdf')
                                            )}
                                            acceptedTypes={field.acceptedTypes || ['image/*']}
                                            maxSize={field.maxSize || 5 * 1024 * 1024}
                                            onUploadComplete={(url) => {
                                                setFormData({ ...formData, [field.name]: url });
                                            }}
                                            onUploadError={(error) => {
                                                console.error('Upload error:', error);
                                            }}
                                            currentFileUrl={formData[field.name]}
                                            label=""
                                            helperText={field.placeholder}
                                            showPreview={field.name === 'imageUrl'}
                                        />
                                    ) : field.type === 'select' ? (
                                        <select
                                            name={field.name}
                                            defaultValue={formData[field.name] || field.defaultValue}
                                            required={field.required}
                                            className="w-full px-4 py-3.5 bg-white border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-primary-100 focus:border-primary-500 outline-none transition-all text-gray-900 font-medium"
                                        >
                                            {field.options?.map(opt => (
                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                            ))}
                                        </select>
                                    ) : field.type === 'textarea' ? (
                                        <textarea
                                            name={field.name}
                                            defaultValue={formData[field.name] || field.defaultValue}
                                            required={field.required}
                                            rows={5}
                                            className="w-full px-4 py-3.5 bg-white border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-primary-100 focus:border-primary-500 outline-none resize-none transition-all text-gray-900"
                                            placeholder={field.placeholder}
                                        />
                                    ) : (
                                        <input
                                            name={field.name}
                                            type={field.type}
                                            step={field.step}
                                            defaultValue={formData[field.name] || field.defaultValue}
                                            required={field.required}
                                            className="w-full px-4 py-3.5 bg-white border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-primary-100 focus:border-primary-500 outline-none transition-all text-gray-900 font-medium"
                                            placeholder={field.placeholder}
                                        />
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Navigation Buttons */}
                        <div className="pt-8 border-t border-gray-200 flex justify-between items-center">
                            <button
                                type="button"
                                onClick={handleBack}
                                disabled={currentStep === 0}
                                className={`flex items-center gap-2 px-6 py-3.5 font-bold rounded-xl transition-all ${currentStep === 0
                                    ? 'text-gray-300 cursor-not-allowed'
                                    : 'text-gray-700 hover:bg-gray-100 active:scale-95'
                                    }`}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                                Previous
                            </button>

                            <button
                                type="submit"
                                disabled={submitting}
                                className={`flex items-center gap-3 px-8 py-3.5 rounded-xl font-bold text-white transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 ${type === 'savings' ? 'bg-success-600 hover:bg-success-700 shadow-success-200' :
                                    type === 'loan' ? 'bg-primary-600 hover:bg-primary-700 shadow-primary-200' :
                                        type === 'insurance' ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-200' :
                                            'bg-amber-600 hover:bg-amber-700 shadow-amber-200'
                                    }`}
                            >
                                {submitting ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        {currentStep === config.steps.length - 1 ? 'Activate Product' : 'Continue'}
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
