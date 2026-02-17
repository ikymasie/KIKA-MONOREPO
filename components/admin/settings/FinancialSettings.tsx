'use client';

interface FinancialSettingsProps {
    settings: any;
    onChange: (e: any) => void;
}

export default function FinancialSettings({ settings, onChange }: FinancialSettingsProps) {
    return (
        <div className="space-y-6">
            <div className="p-4 bg-primary-50 border border-primary-100 rounded-xl flex items-start gap-4 mb-6">
                <span className="text-2xl text-primary-600">📊</span>
                <p className="text-sm text-primary-900 font-medium">
                    Industry standards and regulatory benchmarks. These values trigger alerts on your dashboard when thresholds are breached.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Liquidity Ratio */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
                    <div className="flex justify-between items-center mb-2">
                        <label className="text-sm font-bold text-gray-700">Liquidity Ratio Target</label>
                        <span className="text-xs font-bold text-primary-600 px-2 py-1 bg-primary-50 rounded">REC: 15%</span>
                    </div>
                    <div className="relative group">
                        <input
                            type="number"
                            name="liquidityRatioTarget"
                            value={settings?.liquidityRatioTarget || ''}
                            onChange={onChange}
                            className="w-full pl-5 pr-12 py-3 bg-gray-50 border-2 border-transparent focus:border-primary-500 focus:bg-white rounded-xl outline-none transition-all font-bold text-gray-900"
                            step="0.1"
                            min="0"
                            max="100"
                        />
                        <span className="absolute right-5 top-3.5 text-gray-400 font-bold">%</span>
                    </div>
                    <p className="text-xs text-gray-500">
                        Target ratio of cash and liquid assets vs total demand deposits.
                    </p>
                </div>

                {/* Max Borrowing Limit */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
                    <div className="flex justify-between items-center mb-2">
                        <label className="text-sm font-bold text-gray-700">Max Borrowing Limit</label>
                        <span className="text-xs font-bold text-gray-400">PER MEMBER</span>
                    </div>
                    <div className="relative group">
                        <span className="absolute left-5 top-3.5 text-gray-400 font-bold">P</span>
                        <input
                            type="number"
                            name="maxBorrowingLimit"
                            value={settings?.maxBorrowingLimit || ''}
                            onChange={onChange}
                            className="w-full pl-10 pr-5 py-3 bg-gray-50 border-2 border-transparent focus:border-primary-500 focus:bg-white rounded-xl outline-none transition-all font-bold text-gray-900"
                            min="0"
                        />
                    </div>
                    <p className="text-xs text-gray-500">
                        The maximum allowable outstanding loan balance for any single member.
                    </p>
                </div>
            </div>

            {/* Risk Thresholds (Future Expansion) */}
            <div className="pt-8 border-t border-gray-100">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">Monitoring Thresholds</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 opacity-50 cursor-not-allowed">
                        <p className="text-[10px] font-bold text-gray-400 uppercase">PAR Target</p>
                        <p className="text-lg font-bold text-gray-300">{'< 5%'}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 opacity-50 cursor-not-allowed">
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Capital Adequacy</p>
                        <p className="text-lg font-bold text-gray-300">10%</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 opacity-50 cursor-not-allowed">
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Operating Ratio</p>
                        <p className="text-lg font-bold text-gray-300">65%</p>
                    </div>
                </div>
                <p className="text-[10px] text-gray-400 mt-2 italic text-center">* Advanced risk thresholds available in Enterprise license.</p>
            </div>
        </div>
    );
}
