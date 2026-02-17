'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X, Loader2 } from 'lucide-react';

const userSchema = z.object({
    firstName: z.string().min(2, 'First name is required'),
    lastName: z.string().min(2, 'Last name is required'),
    email: z.string().email('Invalid email address'),
    role: z.enum(['loan_officer', 'accountant', 'member_service_rep', 'credit_committee'], {
        required_error: 'Please select a role',
    }),
    password: z.string().min(8, 'Password must be at least 8 characters').optional().or(z.literal('')),
});

type UserFormValues = z.infer<typeof userSchema>;

interface CreateUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function CreateUserModal({ isOpen, onClose, onSuccess }: CreateUserModalProps) {
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<UserFormValues>({
        resolver: zodResolver(userSchema),
        defaultValues: {
            firstName: '',
            lastName: '',
            email: '',
            role: 'loan_officer',
            password: '',
        },
    });

    if (!isOpen) return null;

    const onSubmit = async (data: UserFormValues) => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/admin/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to create user');
            }

            reset();
            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900">Add Staff Member</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
                    {error && (
                        <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-100">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-700">First Name</label>
                            <input
                                {...register('firstName')}
                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 transition-all ${errors.firstName ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                placeholder="John"
                            />
                            {errors.firstName && (
                                <p className="text-xs text-red-500">{errors.firstName.message}</p>
                            )}
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-700">Last Name</label>
                            <input
                                {...register('lastName')}
                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 transition-all ${errors.lastName ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                placeholder="Doe"
                            />
                            {errors.lastName && (
                                <p className="text-xs text-red-500">{errors.lastName.message}</p>
                            )}
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">Email Address</label>
                        <input
                            {...register('email')}
                            type="email"
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 transition-all ${errors.email ? 'border-red-500' : 'border-gray-300'
                                }`}
                            placeholder="john.doe@saccos.bw"
                        />
                        {errors.email && (
                            <p className="text-xs text-red-500">{errors.email.message}</p>
                        )}
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">Role</label>
                        <select
                            {...register('role')}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 transition-all ${errors.role ? 'border-red-500' : 'border-gray-300'
                                }`}
                        >
                            <option value="loan_officer">Loan Officer</option>
                            <option value="accountant">Accountant</option>
                            <option value="member_service_rep">Member Service Rep</option>
                            <option value="credit_committee">Credit Committee</option>
                        </select>
                        {errors.role && (
                            <p className="text-xs text-red-500">{errors.role.message}</p>
                        )}
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">
                            Password <span className="text-xs text-gray-400 font-normal">(Optional, defaults to Welcome123!)</span>
                        </label>
                        <input
                            {...register('password')}
                            type="password"
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 transition-all ${errors.password ? 'border-red-500' : 'border-gray-300'
                                }`}
                            placeholder="••••••••"
                        />
                        {errors.password && (
                            <p className="text-xs text-red-500">{errors.password.message}</p>
                        )}
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isLoading && <Loader2 size={16} className="animate-spin" />}
                            {isLoading ? 'Creating...' : 'Create Staff'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
