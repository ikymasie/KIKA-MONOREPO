'use client';

import { useState } from 'react';

interface KYCSettingsProps {
    config?: {
        documentChecklist: string[];
        customFields: Array<{ name: string; type: string; required: boolean }>;
    };
    onUpdate: (config: any) => void;
}

export default function KYCSettings({ config, onUpdate }: KYCSettingsProps) {
    const [checklist, setChecklist] = useState<string[]>(config?.documentChecklist || []);
    const [newDoc, setNewDoc] = useState('');

    const addDoc = () => {
        if (!newDoc) return;
        const updated = [...checklist, newDoc];
        setChecklist(updated);
        setNewDoc('');
        onUpdate({ ...config, documentChecklist: updated });
    };

    const removeDoc = (index: number) => {
        const updated = checklist.filter((_, i) => i !== index);
        setChecklist(updated);
        onUpdate({ ...config, documentChecklist: updated });
    };

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Document Checklist */}
                <div className="space-y-4">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Document Checklist</h3>
                        <p className="text-sm text-gray-500">Mandatory uploads required during member registration.</p>
                    </div>

                    <div className="space-y-3">
                        {checklist.map((doc, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 group">
                                <span className="text-sm font-medium text-gray-700">{doc}</span>
                                <button
                                    onClick={() => removeDoc(idx)}
                                    className="text-danger-500 hover:text-danger-700 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    Remove
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newDoc}
                            onChange={(e) => setNewDoc(e.target.value)}
                            placeholder="e.g., Passport Photo"
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-500"
                        />
                        <button
                            onClick={addDoc}
                            className="px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700"
                        >
                            Add
                        </button>
                    </div>
                </div>

                {/* Workflow Configuration */}
                <div className="space-y-4">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Approval Workflow</h3>
                        <p className="text-sm text-gray-500">Configure how new member applications are approved.</p>
                    </div>

                    <div className="p-6 bg-white border border-primary-100 rounded-xl space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h4 className="font-semibold text-gray-800">Maker-Checker Rule</h4>
                                <p className="text-xs text-gray-500">Requires a secondary approval for all registrations.</p>
                            </div>
                            <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out bg-gray-200 rounded-full cursor-pointer">
                                <input type="checkbox" className="absolute w-6 h-6 bg-white border-2 border-gray-200 rounded-full appearance-none cursor-pointer checked:right-0 checked:border-primary-600 transition-all duration-200" />
                            </div>
                        </div>

                        <div className="pt-4 border-t border-gray-100">
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Approval Hierarchy</h4>
                            <div className="space-y-2">
                                <div className="flex items-center gap-3 text-sm text-gray-600">
                                    <div className="w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-bold text-[10px]">1</div>
                                    <span>Branch Officer (Data Entry)</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-gray-600">
                                    <div className="w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-bold text-[10px]">2</div>
                                    <span>SACCOS Manager (Final Approval)</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
