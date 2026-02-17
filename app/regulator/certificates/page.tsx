'use client';

import { useState, useEffect } from 'react';
import { Award, Plus, Download } from 'lucide-react';

interface Certificate {
    id: string;
    certificateNumber: string;
    certificateType: string;
    issuedDate: string;
    expiryDate?: string;
    tenant: {
        name: string;
    };
    issuer: {
        firstName: string;
        lastName: string;
    };
}

export default function CertificatesPage() {
    const [certificates, setCertificates] = useState<Certificate[]>([]);
    const [loading, setLoading] = useState(true);
    const [showGenerateModal, setShowGenerateModal] = useState(false);
    const [tenants, setTenants] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        tenantId: '',
        certificateType: 'registration',
        expiryDate: '',
        registrationNumber: '',
    });

    useEffect(() => {
        fetchCertificates();
        fetchTenants();
    }, []);

    const fetchCertificates = async () => {
        try {
            const response = await fetch('/api/regulator/certificates');
            const data = await response.json();
            setCertificates(data.certificates || []);
        } catch (error) {
            console.error('Error fetching certificates:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchTenants = async () => {
        try {
            const response = await fetch('/api/regulator/saccos');
            const data = await response.json();
            setTenants(data.saccos || []);
        } catch (error) {
            console.error('Error fetching tenants:', error);
        }
    };

    const handleGenerate = async () => {
        try {
            const response = await fetch('/api/regulator/certificates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    metadata: {
                        registrationNumber: formData.registrationNumber,
                    },
                }),
            });

            if (response.ok) {
                setShowGenerateModal(false);
                setFormData({
                    tenantId: '',
                    certificateType: 'registration',
                    expiryDate: '',
                    registrationNumber: '',
                });
                fetchCertificates();
            }
        } catch (error) {
            console.error('Error generating certificate:', error);
        }
    };

    return (
        <div className="p-8">
            <div className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Certificates</h1>
                    <p className="text-gray-600 mt-2">Manage SACCOS registration certificates</p>
                </div>
                <button
                    onClick={() => setShowGenerateModal(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                >
                    <Plus className="w-5 h-5" />
                    <span>Generate Certificate</span>
                </button>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Certificate #
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                SACCOS
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Type
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Issued Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Expiry Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                                    Loading...
                                </td>
                            </tr>
                        ) : certificates.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                                    No certificates found
                                </td>
                            </tr>
                        ) : (
                            certificates.map((cert) => (
                                <tr key={cert.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {cert.certificateNumber}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {cert.tenant.name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {cert.certificateType}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(cert.issuedDate).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {cert.expiryDate
                                            ? new Date(cert.expiryDate).toLocaleDateString()
                                            : 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <button className="text-blue-600 hover:text-blue-900">
                                            <Download className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Generate Modal */}
            {showGenerateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full">
                        <h3 className="text-lg font-semibold mb-4">Generate Certificate</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    SACCOS *
                                </label>
                                <select
                                    value={formData.tenantId}
                                    onChange={(e) =>
                                        setFormData({ ...formData, tenantId: e.target.value })
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                    required
                                >
                                    <option value="">Select SACCOS</option>
                                    {tenants.map((tenant) => (
                                        <option key={tenant.id} value={tenant.id}>
                                            {tenant.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Certificate Type *
                                </label>
                                <select
                                    value={formData.certificateType}
                                    onChange={(e) =>
                                        setFormData({ ...formData, certificateType: e.target.value })
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                >
                                    <option value="registration">Registration</option>
                                    <option value="renewal">Renewal</option>
                                    <option value="amendment">Amendment</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Registration Number
                                </label>
                                <input
                                    type="text"
                                    value={formData.registrationNumber}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            registrationNumber: e.target.value,
                                        })
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Expiry Date
                                </label>
                                <input
                                    type="date"
                                    value={formData.expiryDate}
                                    onChange={(e) =>
                                        setFormData({ ...formData, expiryDate: e.target.value })
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end space-x-3 mt-6">
                            <button
                                onClick={() => setShowGenerateModal(false)}
                                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleGenerate}
                                disabled={!formData.tenantId}
                                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
                            >
                                Generate
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
