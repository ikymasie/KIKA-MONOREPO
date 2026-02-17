'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import RegulatorSidebar from '@/components/layout/RegulatorSidebar';

interface RegulatorUser {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    status: string;
    phone?: string;
}

interface EditFormData {
    firstName: string;
    lastName: string;
    role: string;
    phone: string;
}

const ROLE_LABELS: Record<string, string> = {
    dcd_director: 'DCD Director',
    dcd_field_officer: 'DCD Field Officer',
    dcd_compliance_officer: 'DCD Compliance Officer',
    bob_prudential_supervisor: 'BoB Prudential Supervisor',
    bob_financial_auditor: 'BoB Financial Auditor',
    bob_compliance_officer: 'BoB Compliance Officer',
    deduction_officer: 'Deduction Officer',
    registry_clerk: 'Registry Clerk',
    intelligence_liaison: 'Intelligence Liaison',
    legal_officer: 'Legal Officer',
    registrar: 'Registrar',
    director_cooperatives: 'Director of Cooperatives',
    minister_delegate: 'Minister Delegate',
};

export default function RegulatorUsersPage() {
    const [users, setUsers] = useState<RegulatorUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingUser, setEditingUser] = useState<RegulatorUser | null>(null);
    const [formData, setFormData] = useState({
        email: '',
        firstName: '',
        lastName: '',
        role: 'dcd_field_officer',
        phone: ''
    });
    const [editFormData, setEditFormData] = useState<EditFormData>({
        firstName: '',
        lastName: '',
        role: '',
        phone: ''
    });

    useEffect(() => {
        fetchUsers();
    }, []);

    async function fetchUsers() {
        try {
            const res = await fetch('/api/regulator/users');
            if (res.ok) {
                const data = await res.json();
                setUsers(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        try {
            const res = await fetch('/api/regulator/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                alert('User created successfully');
                setShowModal(false);
                setFormData({ email: '', firstName: '', lastName: '', role: 'dcd_field_officer', phone: '' });
                fetchUsers();
            } else {
                const error = await res.json();
                alert(error.error || 'Failed to create user');
            }
        } catch (e) {
            console.error(e);
            alert('Error creating user');
        }
    }

    async function handleEdit(user: RegulatorUser) {
        setEditingUser(user);
        setEditFormData({
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            phone: user.phone || ''
        });
        setShowEditModal(true);
    }

    async function handleEditSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!editingUser) return;

        try {
            const res = await fetch(`/api/regulator/users/${editingUser.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editFormData)
            });

            if (res.ok) {
                alert('User updated successfully');
                setShowEditModal(false);
                setEditingUser(null);
                fetchUsers();
            } else {
                const error = await res.json();
                alert(error.error || 'Failed to update user');
            }
        } catch (e) {
            console.error(e);
            alert('Error updating user');
        }
    }

    async function handleToggleStatus(userId: string, currentStatus: string) {
        const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
        if (!confirm(`Are you sure you want to ${newStatus === 'active' ? 'activate' : 'deactivate'} this user?`)) return;

        try {
            const res = await fetch(`/api/regulator/users/${userId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });

            if (res.ok) {
                alert('User status updated successfully');
                fetchUsers();
            } else {
                const error = await res.json();
                alert(error.error || 'Failed to update status');
            }
        } catch (e) {
            console.error(e);
            alert('Error updating status');
        }
    }

    async function handleResetPassword(userId: string, userEmail: string) {
        if (!confirm(`Send password reset email to ${userEmail}?`)) return;

        try {
            const res = await fetch(`/api/regulator/users/${userId}/reset-password`, {
                method: 'POST'
            });

            if (res.ok) {
                alert('Password reset email sent successfully');
            } else {
                const error = await res.json();
                alert(error.error || 'Failed to reset password');
            }
        } catch (e) {
            console.error(e);
            alert('Error resetting password');
        }
    }

    return (
        <DashboardLayout sidebar={<RegulatorSidebar />}>
            <div className="p-8">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Regulator User Management</h1>
                        <p className="text-gray-600">Manage regulator and government staff</p>
                    </div>
                    <button onClick={() => setShowModal(true)} className="btn btn-primary">
                        + Invite User
                    </button>
                </div>

                <div className="card overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Name</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Email</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Role</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Phone</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan={6} className="px-6 py-4 text-center">Loading...</td></tr>
                            ) : users.length === 0 ? (
                                <tr><td colSpan={6} className="px-6 py-4 text-center">No users found</td></tr>
                            ) : (
                                users.map((user) => (
                                    <tr key={user.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 font-medium">{user.firstName} {user.lastName}</td>
                                        <td className="px-6 py-4">{user.email}</td>
                                        <td className="px-6 py-4 text-sm">{ROLE_LABELS[user.role] || user.role}</td>
                                        <td className="px-6 py-4 text-sm">{user.phone || '-'}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.status === 'active' ? 'bg-success-100 text-success-800' : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                {user.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleEdit(user)}
                                                    className="text-primary-600 hover:text-primary-800 text-sm font-medium"
                                                    title="Edit user"
                                                >
                                                    ✏️ Edit
                                                </button>
                                                <button
                                                    onClick={() => handleToggleStatus(user.id, user.status)}
                                                    className={`text-sm font-medium ${user.status === 'active' ? 'text-warning-600 hover:text-warning-800' : 'text-success-600 hover:text-success-800'}`}
                                                    title={user.status === 'active' ? 'Deactivate' : 'Activate'}
                                                >
                                                    {user.status === 'active' ? '⏸️ Deactivate' : '▶️ Activate'}
                                                </button>
                                                <button
                                                    onClick={() => handleResetPassword(user.id, user.email)}
                                                    className="text-gray-600 hover:text-gray-800 text-sm font-medium"
                                                    title="Reset password"
                                                >
                                                    🔑 Reset
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Create User Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
                        <div className="card max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
                            <h2 className="text-xl font-bold mb-4">Invite Regulator User</h2>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="label">First Name</label>
                                    <input
                                        type="text"
                                        className="input w-full"
                                        value={formData.firstName}
                                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="label">Last Name</label>
                                    <input
                                        type="text"
                                        className="input w-full"
                                        value={formData.lastName}
                                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="label">Email</label>
                                    <input
                                        type="email"
                                        className="input w-full"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="label">Phone (Optional)</label>
                                    <input
                                        type="tel"
                                        className="input w-full"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="label">Role</label>
                                    <select
                                        className="input w-full"
                                        value={formData.role}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    >
                                        {Object.entries(ROLE_LABELS).map(([value, label]) => (
                                            <option key={value} value={value}>{label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex gap-3 pt-4">
                                    <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary flex-1">
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn btn-primary flex-1">
                                        Create User
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Edit User Modal */}
                {showEditModal && editingUser && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowEditModal(false)}>
                        <div className="card max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
                            <h2 className="text-xl font-bold mb-4">Edit User</h2>
                            <form onSubmit={handleEditSubmit} className="space-y-4">
                                <div>
                                    <label className="label">First Name</label>
                                    <input
                                        type="text"
                                        className="input w-full"
                                        value={editFormData.firstName}
                                        onChange={(e) => setEditFormData({ ...editFormData, firstName: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="label">Last Name</label>
                                    <input
                                        type="text"
                                        className="input w-full"
                                        value={editFormData.lastName}
                                        onChange={(e) => setEditFormData({ ...editFormData, lastName: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="label">Email (Read-only)</label>
                                    <input
                                        type="email"
                                        className="input w-full bg-gray-100"
                                        value={editingUser.email}
                                        disabled
                                    />
                                </div>
                                <div>
                                    <label className="label">Phone (Optional)</label>
                                    <input
                                        type="tel"
                                        className="input w-full"
                                        value={editFormData.phone}
                                        onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="label">Role</label>
                                    <select
                                        className="input w-full"
                                        value={editFormData.role}
                                        onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                                    >
                                        {Object.entries(ROLE_LABELS).map(([value, label]) => (
                                            <option key={value} value={value}>{label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex gap-3 pt-4">
                                    <button type="button" onClick={() => setShowEditModal(false)} className="btn btn-secondary flex-1">
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn btn-primary flex-1">
                                        Update User
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
