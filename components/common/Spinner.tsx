import React from 'react';

export type SpinnerSize = 'sm' | 'md' | 'lg';
export type SpinnerColor = 'primary' | 'white' | 'gray';

interface SpinnerProps {
    size?: SpinnerSize;
    color?: SpinnerColor;
    className?: string;
}

const sizeClasses: Record<SpinnerSize, string> = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
};

const colorClasses: Record<SpinnerColor, string> = {
    primary: 'border-primary-600 border-t-transparent',
    white: 'border-white border-t-transparent',
    gray: 'border-gray-400 border-t-transparent',
};

export default function Spinner({ size = 'md', color = 'primary', className = '' }: SpinnerProps) {
    return (
        <div
            className={`inline-block rounded-full animate-spin ${sizeClasses[size]} ${colorClasses[color]} ${className}`}
            role="status"
            aria-label="Loading"
        >
            <span className="sr-only">Loading...</span>
        </div>
    );
}

// Centered spinner variant for full-page loading
export function SpinnerCentered({ size = 'lg', color = 'primary' }: Omit<SpinnerProps, 'className'>) {
    return (
        <div className="flex items-center justify-center w-full h-full min-h-[200px]">
            <Spinner size={size} color={color} />
        </div>
    );
}
