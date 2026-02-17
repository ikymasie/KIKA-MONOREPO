'use client';

import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import AdminSidebar from '@/components/layout/AdminSidebar';
import ProductCreationWizard, { ProductType } from '@/components/admin/products/ProductCreationWizard';

export default function NewProductPage() {
    const params = useParams();
    const router = useRouter();
    const type = params.type as ProductType;

    const handleSuccess = () => {
        router.push('/admin/settings');
    };

    const handleCancel = () => {
        router.push('/admin/settings');
    };

    return (
        <DashboardLayout sidebar={<AdminSidebar />}>
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center p-8">
                <div className="w-full flex flex-col items-center gap-8">
                    {/* Breadcrumb */}
                    <div className="w-full max-w-7xl">
                        <button
                            onClick={handleCancel}
                            className="group flex items-center gap-2 text-gray-600 hover:text-gray-900 font-semibold transition-all"
                        >
                            <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            Back to Settings
                        </button>
                    </div>

                    {/* Wizard */}
                    <ProductCreationWizard
                        type={type}
                        onSuccess={handleSuccess}
                        onCancel={handleCancel}
                    />
                </div>
            </div>
        </DashboardLayout>
    );
}
