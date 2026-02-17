'use client';

import FileUpload from '@/components/common/FileUpload';
import { getTenantFilePath, generateUniqueFileName } from '@/lib/firebase-storage';

interface ProfileSettingsProps {
    settings: any;
    onChange: (e: any) => void;
}

export default function ProfileSettings({ settings, onChange }: ProfileSettingsProps) {
    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Logo Upload Section */}
                <div className="col-span-full space-y-4">
                    <label className="block text-sm font-bold text-gray-700 uppercase tracking-wider">Organization Logo</label>
                    <div className="p-6 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                        <FileUpload
                            storagePath={getTenantFilePath(
                                settings?.id || 'temp',
                                'logo',
                                generateUniqueFileName('logo.png')
                            )}
                            acceptedTypes={['image/*']}
                            maxSize={2 * 1024 * 1024} // 2MB
                            onUploadComplete={(url) => {
                                onChange({ target: { name: 'logoUrl', value: url } });
                            }}
                            onUploadError={(error) => {
                                console.error('Logo upload failed:', error);
                            }}
                            currentFileUrl={settings?.logoUrl}
                            label=""
                            helperText="Recommended: SVG or PNG with transparent background. Maximum file size: 2MB"
                            showPreview={true}
                        />
                    </div>
                </div>

                {/* Color Palette Section */}
                <div className="col-span-full grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-white rounded-2xl border border-gray-100 shadow-sm">
                    <div className="space-y-4">
                        <label className="block text-sm font-bold text-gray-700 uppercase tracking-wider">Primary Brand Color</label>
                        <div className="flex items-center gap-4">
                            <input
                                type="color"
                                name="primaryColor"
                                value={settings?.primaryColor || '#0ea5e9'}
                                onChange={onChange}
                                className="w-16 h-16 rounded-xl border-none p-1 cursor-pointer bg-gray-50 shadow-inner"
                            />
                            <div className="flex-1">
                                <input
                                    type="text"
                                    name="primaryColor"
                                    value={settings?.primaryColor || '#0ea5e9'}
                                    onChange={onChange}
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg font-mono text-sm"
                                />
                            </div>
                        </div>
                        <p className="text-xs text-gray-500">This color will be used for primary buttons, active states, and logos.</p>
                    </div>

                    <div className="space-y-4">
                        <label className="block text-sm font-bold text-gray-700 uppercase tracking-wider">Secondary Accent Color</label>
                        <div className="flex items-center gap-4">
                            <input
                                type="color"
                                name="secondaryColor"
                                value={settings?.secondaryColor || '#d946ef'}
                                onChange={onChange}
                                className="w-16 h-16 rounded-xl border-none p-1 cursor-pointer bg-gray-50 shadow-inner"
                            />
                            <div className="flex-1">
                                <input
                                    type="text"
                                    name="secondaryColor"
                                    value={settings?.secondaryColor || '#d946ef'}
                                    onChange={onChange}
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg font-mono text-sm"
                                />
                            </div>
                        </div>
                        <p className="text-xs text-gray-500">Used for secondary highlights and accent elements.</p>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">SACCOS Name</label>
                    <input
                        type="text"
                        name="name"
                        value={settings?.name || ''}
                        onChange={onChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                        placeholder="Enter SACCOS name"
                        required
                    />
                </div>
                <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">Organization Code</label>
                    <input
                        type="text"
                        value={settings?.code || ''}
                        disabled
                        className="w-full px-4 py-2 bg-gray-100 border border-gray-200 rounded-lg text-gray-500 cursor-not-allowed"
                    />
                    <p className="text-xs text-gray-500 italic">Code is assigned during setup and cannot be changed.</p>
                </div>
                <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">Registration Number</label>
                    <input
                        type="text"
                        name="registrationNumber"
                        value={settings?.registrationNumber || ''}
                        onChange={onChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                        placeholder="Reg-XXXXXX"
                    />
                </div>
                <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">Official Email</label>
                    <input
                        type="email"
                        name="email"
                        value={settings?.email || ''}
                        onChange={onChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                        placeholder="saccos@example.com"
                    />
                </div>
                <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">Contact Phone</label>
                    <input
                        type="tel"
                        name="phone"
                        value={settings?.phone || ''}
                        onChange={onChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                        placeholder="+267 123 4567"
                    />
                </div>
            </div>
            <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Physical Address</label>
                <textarea
                    name="address"
                    value={settings?.address || ''}
                    onChange={onChange}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-all resize-none"
                    placeholder="Enter full physical address"
                />
            </div>
        </div>
    );
}
