import type { Config } from 'tailwindcss'

const config: Config = {
    content: [
        './pages/**/*.{js,ts,jsx,tsx,mdx}',
        './components/**/*.{js,ts,jsx,tsx,mdx}',
        './app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                // Warm Tan Brown Primary
                primary: {
                    50: 'var(--primary-50, #fdf8f0)',
                    100: 'var(--primary-100, #faefd9)',
                    200: 'var(--primary-200, #f3ddb0)',
                    300: 'var(--primary-300, #e8c47e)',
                    400: 'var(--primary-400, #d9a54e)',
                    500: 'var(--primary-500, #c4882a)',
                    600: 'var(--primary-600, #a86e1e)',
                    700: 'var(--primary-700, #8a5518)',
                    800: 'var(--primary-800, #6e4116)',
                    900: 'var(--primary-900, #5a3412)',
                    950: 'var(--primary-950, #321c08)',
                },
                // Warm Terracotta/Copper Secondary
                secondary: {
                    50: 'var(--secondary-50, #fdf4ee)',
                    100: 'var(--secondary-100, #fae4d0)',
                    200: 'var(--secondary-200, #f4c49e)',
                    300: 'var(--secondary-300, #ec9d6a)',
                    400: 'var(--secondary-400, #e07840)',
                    500: 'var(--secondary-500, #c95d28)',
                    600: 'var(--secondary-600, #a8461d)',
                    700: 'var(--secondary-700, #87361a)',
                    800: 'var(--secondary-800, #6d2c18)',
                    900: 'var(--secondary-900, #5a2516)',
                    950: 'var(--secondary-950, #311009)',
                },
                // Modern Surface Colors for backgrounds
                surface: {
                    50: '#f8fafc',
                    100: '#f1f5f9',
                    200: '#e2e8f0',
                    300: '#cbd5e1',
                    400: '#94a3b8',
                    500: '#64748b',
                    600: '#475569',
                    700: '#334155',
                    800: '#1e293b',
                    900: '#0f172a',
                    950: '#020617',
                },
                success: {
                    50: '#f0fdf4',
                    100: '#dcfce7',
                    200: '#bbf7d0',
                    300: '#86efac',
                    400: '#4ade80',
                    500: '#22c55e',
                    600: '#16a34a',
                    700: '#15803d',
                    800: '#166534',
                    900: '#14532d',
                },
                warning: {
                    50: '#fffbeb',
                    100: '#fef3c7',
                    200: '#fde68a',
                    300: '#fcd34d',
                    400: '#fbbf24',
                    500: '#f59e0b',
                    600: '#d97706',
                    700: '#b45309',
                    800: '#92400e',
                    900: '#78350f',
                },
                danger: {
                    50: '#fef2f2',
                    100: '#fee2e2',
                    200: '#fecaca',
                    300: '#fca5a5',
                    400: '#f87171',
                    500: '#ef4444',
                    600: '#dc2626',
                    700: '#b91c1c',
                    800: '#991b1b',
                    900: '#7f1d1d',
                },
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
            boxShadow: {
                'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
                'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
                'glass-inset': 'inset 0 0 0 1px rgba(255, 255, 255, 0.1)',
                'glow': '0 0 20px rgba(168, 110, 30, 0.5)',
            },
            animation: {
                'fade-in': 'fade-in 0.6s ease-out',
                'fade-in-up': 'fade-in-up 0.8s ease-out',
                'slide-down': 'slide-down 0.3s ease-out',
                'scale-in': 'scale-in 0.3s ease-out',
                'wave': 'wave 20s infinite ease-in-out',
                'float': 'float 15s infinite ease-in-out',
                'pulse-glow': 'pulse-glow 3s infinite ease-in-out',
            },
            keyframes: {
                'fade-in': {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                'fade-in-up': {
                    '0%': { opacity: '0', transform: 'translateY(20px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                'slide-down': {
                    '0%': { opacity: '0', transform: 'translateY(-10px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                'scale-in': {
                    '0%': { opacity: '0', transform: 'scale(0.95)' },
                    '100%': { opacity: '1', transform: 'scale(1)' },
                },
                'wave': {
                    '0%, 100%': { transform: 'translateY(0) translateX(0)' },
                    '50%': { transform: 'translateY(-20px) translateX(10px)' },
                },
                'float': {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-20px)' },
                },
                'pulse-glow': {
                    '0%, 100%': { opacity: '0.5', transform: 'scale(1)' },
                    '50%': { opacity: '0.8', transform: 'scale(1.05)' },
                },
            },
        },
    },
    plugins: [],
}

export default config
