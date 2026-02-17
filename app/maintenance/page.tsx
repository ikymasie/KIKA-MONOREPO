'use client';

import Link from 'next/link';

export default function MaintenancePage() {
    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
            <div className="max-w-md w-full text-center space-y-8">
                <div className="relative">
                    <div className="text-9xl font-black text-gray-50 opacity-20 absolute inset-0 -top-8 select-none">
                        503
                    </div>
                    <div className="text-6xl mb-4">🚧</div>
                    <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
                        Under Maintenance
                    </h1>
                </div>

                <p className="text-gray-500 text-lg leading-relaxed">
                    We're currently performing some scheduled maintenance to improve your experience.
                    We'll be back online shortly.
                </p>

                <div className="pt-8 border-t border-gray-100">
                    <div className="p-6 bg-primary-50 rounded-2xl">
                        <p className="text-primary-800 font-medium">
                            If you're a SACCOS administrator, you can still sign in to manage the platform.
                        </p>
                        <div className="mt-4">
                            <Link
                                href="/auth/signin"
                                className="btn btn-primary px-8 py-3 rounded-xl shadow-lg shadow-primary-100 transition-all hover:-translate-y-0.5"
                            >
                                Administrator Login
                            </Link>
                        </div>
                    </div>
                </div>

                <p className="text-gray-400 text-sm">
                    Thank you for your patience.
                </p>
            </div>
        </div>
    );
}
