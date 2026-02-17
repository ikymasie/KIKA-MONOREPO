'use client';

export default function StrategicReview() {
    return (
        <div className="space-y-8 animate-fade-in-up">
            <header>
                <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary-700 to-indigo-800 tracking-tight">
                    Strategic Review
                </h1>
                <p className="text-gray-500 mt-2 text-lg">Macro-level analysis and growth monitoring.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 glass-panel p-8">
                    <h2 className="text-2xl font-bold mb-6">Growth Projections</h2>
                    <div className="aspect-[16/9] bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200 flex items-center justify-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-indigo-500/5"></div>
                        <div className="text-center z-10">
                            <div className="text-5xl mb-4">📈</div>
                            <p className="text-gray-400 font-medium">Strategic Visualization Engine</p>
                            <p className="text-xs text-gray-300 mt-1">Data updated 5 minutes ago</p>
                        </div>
                        {/* Mock Graph Lines */}
                        <svg className="absolute bottom-0 left-0 w-full h-1/2 text-primary-200" preserveAspectRatio="none">
                            <path d="M0,100 Q100,20 200,80 T400,10 T600,60 T800,20 T1000,90" fill="none" stroke="currentColor" strokeWidth="4" />
                        </svg>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="glass-panel p-6 bg-primary-900 text-white">
                        <h3 className="text-lg font-bold mb-2 text-primary-300">Target Achievement</h3>
                        <div className="text-4xl font-black mb-4">84%</div>
                        <div className="w-full bg-white/10 rounded-full h-3 mb-6">
                            <div className="bg-primary-500 h-full rounded-full" style={{ width: '84%' }}></div>
                        </div>
                        <p className="text-xs text-primary-400 leading-relaxed uppercase tracking-tighter font-bold">
                            Annual registration target: 1,500 societies. Currently at 1,260.
                        </p>
                    </div>

                    <div className="glass-panel p-6">
                        <h3 className="text-lg font-bold mb-4 text-gray-900">Regional Distribution</h3>
                        <div className="space-y-4">
                            {[
                                { region: 'Gaborone', val: '45%' },
                                { region: 'Francistown', val: '22%' },
                                { region: 'Maun', val: '15%' },
                                { region: 'Others', val: '18%' }
                            ].map(r => (
                                <div key={r.region}>
                                    <div className="flex justify-between text-xs font-bold mb-1 uppercase tracking-widest text-gray-500">
                                        <span>{r.region}</span>
                                        <span>{r.val}</span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                                        <div className="bg-gray-800 h-full rounded-full" style={{ width: r.val }}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="glass-panel p-8">
                <h2 className="text-2xl font-bold mb-6">Strategic Indicators</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div className="text-center group">
                        <div className="text-4xl mb-4 group-hover:scale-125 transition-transform duration-500">⚖️</div>
                        <div className="text-2xl font-black text-gray-900">92%</div>
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Compliance Rate</div>
                    </div>
                    <div className="text-center group">
                        <div className="text-4xl mb-4 group-hover:scale-125 transition-transform duration-500">💰</div>
                        <div className="text-2xl font-black text-gray-900">BWP 1.4M</div>
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Revenue Collected</div>
                    </div>
                    <div className="text-center group">
                        <div className="text-4xl mb-4 group-hover:scale-125 transition-transform duration-500">👥</div>
                        <div className="text-2xl font-black text-gray-900">12,450</div>
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Total Members</div>
                    </div>
                    <div className="text-center group">
                        <div className="text-4xl mb-4 group-hover:scale-125 transition-transform duration-500">⚡</div>
                        <div className="text-2xl font-black text-gray-900">4.2 Days</div>
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Avg Process Time</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
