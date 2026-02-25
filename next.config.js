const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',


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
