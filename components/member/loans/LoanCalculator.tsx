'use client';

import { useState } from 'react';

export default function LoanCalculator() {
    const [amount, setAmount] = useState(10000);
    const [rate, setRate] = useState(12);
    const [term, setTerm] = useState(12);

    const monthlyRate = rate / 100 / 12;
    const installment = (amount * monthlyRate * Math.pow(1 + monthlyRate, term)) / (Math.pow(1 + monthlyRate, term) - 1);
    const totalRepayable = installment * term;
    const totalInterest = totalRepayable - amount;

    return (
        <div className="glass-panel p-10 bg-white border border-gray-100 shadow-2xl shadow-gray-200/50">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                {/* Inputs */}
                <div className="space-y-10">
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Loan Amount</label>
                            <span className="text-2xl font-black text-gray-900">P {amount.toLocaleString()}</span>
                        </div>
                        <input
                            type="range"
                            min="1000"
                            max="500000"
                            step="1000"
                            value={amount}
                            onChange={(e) => setAmount(Number(e.target.value))}
                            className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-primary-600"
                        />
                        <div className="flex justify-between text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2">
                            <span>P 1,000</span>
                            <span>P 500,000</span>
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Interest Rate (p.a.)</label>
                            <span className="text-2xl font-black text-gray-900">{rate}%</span>
                        </div>
                        <input
                            type="range"
                            min="1"
                            max="30"
                            step="0.5"
                            value={rate}
                            onChange={(e) => setRate(Number(e.target.value))}
                            className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-primary-600"
                        />
                        <div className="flex justify-between text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2">
                            <span>1%</span>
                            <span>30%</span>
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Loan Term (Months)</label>
                            <span className="text-2xl font-black text-gray-900">{term} mo</span>
                        </div>
                        <input
                            type="range"
                            min="1"
                            max="84"
                            step="1"
                            value={term}
                            onChange={(e) => setTerm(Number(e.target.value))}
                            className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-primary-600"
                        />
                        <div className="flex justify-between text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2">
                            <span>1 Month</span>
                            <span>7 Years</span>
                        </div>
                    </div>
                </div>

                {/* Results */}
                <div className="bg-primary-600 rounded-[2rem] p-10 text-white flex flex-col justify-center shadow-lg shadow-primary-200">
                    <div className="space-y-8">
                        <div>
                            <p className="text-xs font-black text-primary-200 uppercase tracking-widest mb-2">Estimated Monthly Installment</p>
                            <p className="text-6xl font-black">P {installment.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-8 pt-8 border-t border-primary-500/30">
                            <div>
                                <p className="text-[10px] font-black text-primary-200 uppercase tracking-widest mb-1">Total Repayable</p>
                                <p className="text-xl font-bold">P {totalRepayable.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-primary-200 uppercase tracking-widest mb-1">Total Interest</p>
                                <p className="text-xl font-bold">P {totalInterest.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                            </div>
                        </div>

                        <button className="w-full py-5 bg-white text-primary-600 font-black rounded-2xl hover:bg-primary-50 transition-all shadow-xl shadow-black/10 active:scale-95 mt-4">
                            Apply for this Loan
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
