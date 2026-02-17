'use client';

export default function AuthErrorPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center px-4">
            <div className="w-full max-w-md">
                <div className="card p-8">
                    <div className="text-center mb-8">
                        <div className="text-6xl mb-4">⚠️</div>
                        <h1 className="text-3xl font-bold text-red-600 mb-2">
                            Authentication Error
                        </h1>
                        <p className="text-gray-600">
                            There was a problem signing you in
                        </p>
                    </div>

                    <div className="space-y-4">
                        <a
                            href="/auth/signin"
                            className="block w-full bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 focus:ring-4 focus:ring-primary-200 transition-colors font-medium text-center"
                        >
                            Try Again
                        </a>

                        <a
                            href="/"
                            className="block w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium text-center"
                        >
                            Back to Home
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
