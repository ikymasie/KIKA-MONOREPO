'use client';

import { useState, useEffect } from 'react';
import { Megaphone, Plus, Send } from 'lucide-react';

interface Broadcast {
    id: string;
    title: string;
    content: string;
    broadcastType: string;
    priority: string;
    publishedAt: string;
    deliveryStatus?: {
        email?: { sent: number; total: number };
        sms?: { sent: number; total: number };
        inApp?: { created: number; total: number };
    };
}

export default function BroadcastsPage() {
    const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        broadcastType: 'circular',
        priority: 'medium',
        targetAudience: 'all_tenants',
        deliveryChannels: ['in_app'],
        expiresAt: '',
    });

    useEffect(() => {
        fetchBroadcasts();
    }, []);

    const fetchBroadcasts = async () => {
        try {
            const response = await fetch('/api/regulator/broadcasts');
            const data = await response.json();
            setBroadcasts(data.broadcasts || []);
        } catch (error) {
            console.error('Error fetching broadcasts:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        try {
            const response = await fetch('/api/regulator/broadcasts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                setShowCreateModal(false);
                setFormData({
                    title: '',
                    content: '',
                    broadcastType: 'circular',
                    priority: 'medium',
                    targetAudience: 'all_tenants',
                    deliveryChannels: ['in_app'],
                    expiresAt: '',
                });
                fetchBroadcasts();
            }
        } catch (error) {
            console.error('Error creating broadcast:', error);
        }
    };

    const toggleChannel = (channel: string) => {
        setFormData((prev) => ({
            ...prev,
            deliveryChannels: prev.deliveryChannels.includes(channel)
                ? prev.deliveryChannels.filter((c) => c !== channel)
                : [...prev.deliveryChannels, channel],
        }));
    };

    const getPriorityBadge = (priority: string) => {
        const styles = {
            low: 'bg-gray-100 text-gray-800',
            medium: 'bg-blue-100 text-blue-800',
            high: 'bg-orange-100 text-orange-800',
            urgent: 'bg-red-100 text-red-800',
        };
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[priority as keyof typeof styles]}`}>
                {priority.toUpperCase()}
            </span>
        );
    };

    return (
        <div className="p-8">
            <div className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Broadcasts</h1>
                    <p className="text-gray-600 mt-2">Send circulars and notifications to all SACCOS</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                >
                    <Plus className="w-5 h-5" />
                    <span>Create Broadcast</span>
                </button>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Title
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Type
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Priority
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Published
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Delivery Status
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                                    Loading...
                                </td>
                            </tr>
                        ) : broadcasts.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                                    No broadcasts found
                                </td>
                            </tr>
                        ) : (
                            broadcasts.map((broadcast) => (
                                <tr key={broadcast.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-medium text-gray-900">
                                            {broadcast.title}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {broadcast.broadcastType.replace(/_/g, ' ')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {getPriorityBadge(broadcast.priority)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(broadcast.publishedAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {broadcast.deliveryStatus && (
                                            <div className="flex space-x-2">
                                                {broadcast.deliveryStatus.email && (
                                                    <span>
                                                        📧 {broadcast.deliveryStatus.email.sent}/
                                                        {broadcast.deliveryStatus.email.total}
                                                    </span>
                                                )}
                                                {broadcast.deliveryStatus.sms && (
                                                    <span>
                                                        📱 {broadcast.deliveryStatus.sms.sent}/
                                                        {broadcast.deliveryStatus.sms.total}
                                                    </span>
                                                )}
                                                {broadcast.deliveryStatus.inApp && (
                                                    <span>
                                                        🔔 {broadcast.deliveryStatus.inApp.created}/
                                                        {broadcast.deliveryStatus.inApp.total}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
                    <div className="bg-white rounded-lg p-6 max-w-2xl w-full m-4">
                        <h3 className="text-lg font-semibold mb-4">Create Broadcast</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Title *
                                </label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) =>
                                        setFormData({ ...formData, title: e.target.value })
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Content *
                                </label>
                                <textarea
                                    value={formData.content}
                                    onChange={(e) =>
                                        setFormData({ ...formData, content: e.target.value })
                                    }
                                    rows={6}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Broadcast Type *
                                    </label>
                                    <select
                                        value={formData.broadcastType}
                                        onChange={(e) =>
                                            setFormData({ ...formData, broadcastType: e.target.value })
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                    >
                                        <option value="circular">Circular</option>
                                        <option value="policy_update">Policy Update</option>
                                        <option value="alert">Alert</option>
                                        <option value="announcement">Announcement</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Priority *
                                    </label>
                                    <select
                                        value={formData.priority}
                                        onChange={(e) =>
                                            setFormData({ ...formData, priority: e.target.value })
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                    >
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                        <option value="urgent">Urgent</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Delivery Channels *
                                </label>
                                <div className="flex space-x-4">
                                    <label className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={formData.deliveryChannels.includes('email')}
                                            onChange={() => toggleChannel('email')}
                                            className="mr-2"
                                        />
                                        Email
                                    </label>
                                    <label className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={formData.deliveryChannels.includes('sms')}
                                            onChange={() => toggleChannel('sms')}
                                            className="mr-2"
                                        />
                                        SMS
                                    </label>
                                    <label className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={formData.deliveryChannels.includes('in_app')}
                                            onChange={() => toggleChannel('in_app')}
                                            className="mr-2"
                                        />
                                        In-App
                                    </label>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Expiry Date (Optional)
                                </label>
                                <input
                                    type="date"
                                    value={formData.expiresAt}
                                    onChange={(e) =>
                                        setFormData({ ...formData, expiresAt: e.target.value })
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end space-x-3 mt-6">
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreate}
                                disabled={!formData.title || !formData.content || formData.deliveryChannels.length === 0}
                                className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
                            >
                                <Send className="w-4 h-4" />
                                <span>Send Broadcast</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
