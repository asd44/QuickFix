/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'export', // Required for Capacitor
    images: {
        unoptimized: true, // For Capacitor compatibility
    },
    typescript: {
        ignoreBuildErrors: true,
    },
    eslint: {
        ignoreDuringBuilds: true,
    },
    // Exclude Android app directory from Next.js processing
    // webpack: (config) => {
    //     config.watchOptions = {
    //         ...config.watchOptions,
    //         ignored: ['**/android/**', '**/node_modules/**'],
    //     };
    //     return config;
    // },
};

export default nextConfig;
