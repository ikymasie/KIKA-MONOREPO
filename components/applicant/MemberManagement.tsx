'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Users } from 'lucide-react';

interface MemberManagementProps {
    applicationId: string;
    onUpdate?: () => void;
}

export default function MemberManagement({ applicationId, onUpdate }: MemberManagementProps) {
    const [members, setMembers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMembers();
    }, [applicationId]);

    const fetchMembers = async () => {
        try {
            const res = await fetch(`/api/applications/members?applicationId=${applicationId}`);
            if (res.ok) setMembers(await res.json());
        } finally {
            setLoading(false);
        }
    };

    const handleAddMember = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const data = Object.fromEntries(formData.entries());

        try {
            const res = await fetch('/api/applications/members', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...data, applicationId }),
            });
            if (res.ok) {
                await fetchMembers();
                (e.target as HTMLFormElement).reset();
                onUpdate?.();
            }
        } catch (error) {
            console.error('Error adding member:', error);
        }
    };

    const handleRemoveMember = async (id: string) => {
        try {
            const res = await fetch(`/api/applications/members?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                await fetchMembers();
                onUpdate?.();
            }
        } catch (error) {
            console.error('Error removing member:', error);
        }
    };

    if (loading) return <div>Loading members...</div>;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
                <h4 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <Plus size={20} className="text-primary-600" />
                    Add New Member
                </h4>
                <form onSubmit={handleAddMember} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Full Name</label>
                        <input name="fullName" required className="w-full px-5 py-3.5 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-primary-500 focus:bg-white outline-none transition-all font-bold" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">ID Number / Omang</label>
                            <input name="idNumber" required className="w-full px-5 py-3.5 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-primary-500 focus:bg-white outline-none transition-all font-bold" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Citizenship</label>
                            <select name="citizenship" required className="w-full px-5 py-3.5 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-primary-500 focus:bg-white outline-none transition-all font-bold">
                                <option>Botswana Citizen</option>
                                <option>Resident</option>
                                <option>Non-Resident</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                        <input type="checkbox" name="isOfficeBearer" id="isOfficeBearer_standalone" className="w-5 h-5 rounded-md border-gray-300 text-primary-600 focus:ring-primary-500" />
                        <label htmlFor="isOfficeBearer_standalone" className="text-sm font-bold text-gray-700 cursor-pointer">This member is an Office Bearer</label>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Position (if applicable)</label>
                        <input name="officeBearerPosition" className="w-full px-5 py-3.5 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-primary-500 focus:bg-white outline-none transition-all font-bold" placeholder="e.g., Chairperson" />
                    </div>
                    <button
                        type="submit"
                        className="w-full py-4 bg-white border-2 border-primary-100 text-primary-600 font-black rounded-xl hover:bg-primary-50 transition-all flex items-center justify-center gap-2"
                    >
                        <Plus size={20} />
                        Add Member to List
                    </button>
                </form>
            </div>

            <div className="space-y-4">
                <h4 className="text-lg font-bold text-gray-900 mb-6 flex items-center justify-between">
                    Current List
                    <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-black">{members.length} Members</span>
                </h4>
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                    {members.map((member) => (
                        <div key={member.id} className="flex items-center gap-4 p-5 bg-white border border-gray-100 rounded-2xl shadow-sm group hover:border-red-200 transition-all">
                            <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600 font-black text-lg">
                                {member.fullName.charAt(0)}
                            </div>
                            <div className="flex-1">
                                <p className="font-bold text-gray-900">{member.fullName}</p>
                                <p className="text-xs text-gray-500 font-medium">{member.isOfficeBearer ? member.officeBearerPosition : 'Member'} • {member.idNumber}</p>
                            </div>
                            <button
                                onClick={() => handleRemoveMember(member.id)}
                                className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    ))}
                    {members.length === 0 && (
                        <div className="text-center py-12 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-100">
                            <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No members added yet</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
