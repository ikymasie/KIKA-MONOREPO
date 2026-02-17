'use client';

import { useAuth } from '@/lib/auth-hooks';

export default function MinisterSettings() {
    const { user } = useAuth();

    return (
        <div className="space-y-8 animate-fade-in-up">
            <header>
                <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-800 to-purple-900 tracking-tight">
                    Cabinet Settings
                </h1>
                <p className="text-gray-500 mt-2 text-lg font-medium">Personalize your ministerial workspace and security preferences.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="glass-panel p-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <span className="p-2 bg-indigo-50 text-indigo-600 rounded-lg text-sm">👤</span>
                        Ministerial Profile
                    </h2>

                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">First Name</label>
                                <div className="p-4 bg-gray-50 rounded-2xl font-bold text-gray-700">{user?.firstName || 'Minister'}</div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Last Name</label>
                                <div className="p-4 bg-gray-50 rounded-2xl font-bold text-gray-700">{user?.lastName || 'Delegate'}</div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Official Email</label>
                            <div className="p-4 bg-gray-50 rounded-2xl font-bold text-gray-700">{user?.email}</div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Role Assignment</label>
                            <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl font-black text-indigo-700 flex items-center gap-2">
                                <span className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse"></span>
                                Minister Delegate (Cabinet Level)
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="glass-panel p-8">
                        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <span className="p-2 bg-purple-50 text-purple-600 rounded-lg text-sm">🔒</span>
                            Security & Access
                        </h2>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-2xl transition-colors cursor-pointer group">
                                <div>
                                    <div className="font-bold text-gray-900">Multi-Factor Authentication</div>
                                    <div className="text-xs text-gray-400">Add an extra layer of security to your cabinet account.</div>
                                </div>
                                <div className="w-12 h-6 bg-emerald-500 rounded-full flex items-center px-1 shadow-inner">
                                    <div className="w-4 h-4 bg-white rounded-full ml-auto shadow-sm"></div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-2xl transition-colors cursor-pointer group">
                                <div>
                                    <div className="font-bold text-gray-900">Change Security Credentials</div>
                                    <div className="text-xs text-gray-400">Update your password or PIN for signing approvals.</div>
                                </div>
                                <span className="text-indigo-600 font-black text-xs hover:underline">Update</span>
                            </div>

                            <div className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-2xl transition-colors cursor-pointer group">
                                <div>
                                    <div className="font-bold text-gray-900">Login Sessions</div>
                                    <div className="text-xs text-gray-400">Monitor active sessions and secure your cabinet access.</div>
                                </div>
                                <span className="text-indigo-600 font-black text-xs hover:underline">View</span>
                            </div>
                        </div>
                    </div>

                    <div className="glass-panel p-8 border-dashed border-2 bg-indigo-50/20 text-center">
                        <div className="text-4xl mb-3">🛠️</div>
                        <h3 className="font-bold text-gray-900">Cabinet Customization</h3>
                        <p className="text-xs text-gray-400 mt-1">Advanced workspace customizations are coming soon to the Ministerial portal.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
