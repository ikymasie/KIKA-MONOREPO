/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
    experimental: {
        serverComponentsExternalPackages: ['typeorm'],
    },
    webpack: (config) => {
        config.resolve.alias = {
            ...config.resolve.alias,
            'react-native-sqlite-storage': false,
            'react-native': false,
        };
        return config;
    },
};

module.exports = nextConfig;
