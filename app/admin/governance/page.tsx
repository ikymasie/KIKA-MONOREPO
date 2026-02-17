'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import AdminSidebar from '@/components/layout/AdminSidebar';

export default function GovernancePage() {
    const [activeTab, setActiveTab] = useState<'agm' | 'board'>('agm');
    const [agmResolutions, setAgmResolutions] = useState<any[]>([]);
    const [boardMinutes, setBoardMinutes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Form States
    const [agmFormData, setAgmFormData] = useState({ year: new Date().getFullYear(), date: '', title: '', description: '', status: 'pending' });
    const [boardFormData, setBoardFormData] = useState({ meetingDate: '', startTime: '', endTime: '', location: '', attendees: '', agenda: '', decisions: '', notes: '' });

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const endpoint = activeTab === 'agm' ? '/api/admin/governance/agm' : '/api/admin/governance/board-meetings';
            const res = await fetch(endpoint);
            const data = await res.json();
            if (activeTab === 'agm') setAgmResolutions(data);
            else setBoardMinutes(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleAgmSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await fetch('/api/admin/governance/agm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(agmFormData),
            });
            if (res.ok) {
                setShowModal(false);
                setAgmFormData({ year: new Date().getFullYear(), date: '', title: '', description: '', status: 'pending' });
                fetchData();
            }
        } catch (err) {
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };

    const handleBoardSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            // Processing JSON fields for Board Minutes
            const payload = {
                ...boardFormData,
                attendees: boardFormData.attendees.split(',').map(s => s.trim()).filter(Boolean),
                agenda: boardFormData.agenda.split('\n').map(s => s.trim()).filter(Boolean),
                decisions: boardFormData.decisions.split('\n').map(s => ({ title: s.trim() })).filter(d => d.title),
            };
            const res = await fetch('/api/admin/governance/board-meetings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (res.ok) {
                setShowModal(false);
                setBoardFormData({ meetingDate: '', startTime: '', endTime: '', location: '', attendees: '', agenda: '', decisions: '', notes: '' });
                fetchData();
            }
        } catch (err) {
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <DashboardLayout sidebar={<AdminSidebar />}>
            <div className="p-8">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Governance & Compliance</h1>
                        <p className="text-gray-500">Track AGM resolutions and board meeting minutes.</p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="btn btn-primary"
                    >
                        {activeTab === 'agm' ? 'Add AGM Resolution' : 'Log Board Minutes'}
                    </button>
                </div>

                <div className="flex gap-4 mb-6 border-b border-gray-100">
                    <button
                        onClick={() => setActiveTab('agm')}
                        className={`pb-4 px-2 font-semibold transition-all ${activeTab === 'agm' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        AGM Resolutions
                    </button>
                    <button
                        onClick={() => setActiveTab('board')}
                        className={`pb-4 px-2 font-semibold transition-all ${activeTab === 'board' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Board Meetings
                    </button>
                </div>

                {loading ? (
                    <div className="animate-pulse space-y-4">
                        {[1, 2, 3].map(i => <div key={i} className="h-24 bg-gray-100 rounded-xl"></div>)}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {activeTab === 'agm' ? (
                            agmResolutions.map(res => (
                                <div key={res.id} className="card p-6 flex justify-between items-start">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="px-2 py-0.5 bg-primary-50 text-primary-700 rounded text-xs font-bold">{res.year}</span>
                                            <h3 className="text-lg font-bold text-gray-900">{res.title}</h3>
                                        </div>
                                        <p className="text-gray-600 text-sm mb-3">{res.description}</p>
                                        <div className="text-xs text-gray-400">Adopted on {new Date(res.date).toLocaleDateString()}</div>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${res.status === 'implemented' ? 'bg-success-100 text-success-700' : 'bg-warning-100 text-warning-700'
                                        }`}>
                                        {res.status}
                                    </span>
                                </div>
                            ))
                        ) : (
                            boardMinutes.map(min => (
                                <div key={min.id} className="card p-6 flex justify-between items-center">
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900">Board Meeting - {new Date(min.meetingDate).toLocaleDateString()}</h3>
                                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                                            <span>📍 {min.location || 'HQ Office'}</span>
                                            <span>⏰ {min.startTime} - {min.endTime}</span>
                                        </div>
                                    </div>
                                    <button className="btn btn-secondary text-sm">View Minutes</button>
                                </div>
                            ))
                        )}
                        {((activeTab === 'agm' && agmResolutions.length === 0) || (activeTab === 'board' && boardMinutes.length === 0)) && (
                            <div className="text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                                <p className="text-gray-500 font-medium">No records found for this category.</p>
                            </div>
                        )}
                    </div>
                )}

                {showModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                        <div className="bg-white rounded-3xl p-8 max-w-2xl w-full shadow-2xl animate-fade-in-up">
                            <h2 className="text-2xl font-bold mb-6">{activeTab === 'agm' ? 'Add AGM Resolution' : 'Log Board Meeting Minutes'}</h2>

                            {activeTab === 'agm' ? (
                                <form onSubmit={handleAgmSubmit} className="grid grid-cols-2 gap-4">
                                    <div className="col-span-1">
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Financial Year</label>
                                        <input type="number" className="input w-full" value={agmFormData.year} onChange={e => setAgmFormData({ ...agmFormData, year: parseInt(e.target.value) })} required />
                                    </div>
                                    <div className="col-span-1">
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Meeting Date</label>
                                        <input type="date" className="input w-full" value={agmFormData.date} onChange={e => setAgmFormData({ ...agmFormData, date: e.target.value })} required />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Resolution Title</label>
                                        <input type="text" className="input w-full" value={agmFormData.title} onChange={e => setAgmFormData({ ...agmFormData, title: e.target.value })} required />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Description</label>
                                        <textarea className="input w-full" rows={4} value={agmFormData.description} onChange={e => setAgmFormData({ ...agmFormData, description: e.target.value })} required></textarea>
                                    </div>
                                    <div className="col-span-2 flex gap-4 mt-4">
                                        <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary flex-1">Cancel</button>
                                        <button type="submit" disabled={submitting} className="btn btn-primary flex-1">{submitting ? 'Saving...' : 'Add Resolution'}</button>
                                    </div>
                                </form>
                            ) : (
                                <form onSubmit={handleBoardSubmit} className="grid grid-cols-2 gap-4">
                                    <div className="col-span-1">
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Meeting Date</label>
                                        <input type="date" className="input w-full" value={boardFormData.meetingDate} onChange={e => setBoardFormData({ ...boardFormData, meetingDate: e.target.value })} required />
                                    </div>
                                    <div className="col-span-1">
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Location</label>
                                        <input type="text" className="input w-full" value={boardFormData.location} onChange={e => setBoardFormData({ ...boardFormData, location: e.target.value })} placeholder="e.g. Boardroom A" />
                                    </div>
                                    <div className="col-span-1">
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Start Time</label>
                                        <input type="time" className="input w-full" value={boardFormData.startTime} onChange={e => setBoardFormData({ ...boardFormData, startTime: e.target.value })} />
                                    </div>
                                    <div className="col-span-1">
                                        <label className="block text-sm font-bold text-gray-700 mb-1">End Time</label>
                                        <input type="time" className="input w-full" value={boardFormData.endTime} onChange={e => setBoardFormData({ ...boardFormData, endTime: e.target.value })} />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Attendees (Comma separated)</label>
                                        <input type="text" className="input w-full" value={boardFormData.attendees} onChange={e => setBoardFormData({ ...boardFormData, attendees: e.target.value })} />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Decisions (One per line)</label>
                                        <textarea className="input w-full" rows={3} value={boardFormData.decisions} onChange={e => setBoardFormData({ ...boardFormData, decisions: e.target.value })}></textarea>
                                    </div>
                                    <div className="col-span-2 flex gap-4 mt-4">
                                        <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary flex-1">Cancel</button>
                                        <button type="submit" disabled={submitting} className="btn btn-primary flex-1">{submitting ? 'Saving...' : 'Log Meeting'}</button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
