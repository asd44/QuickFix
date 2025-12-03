/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        unoptimized: true, // For Capacitor compatibility
    },
    typescript: {
        ignoreBuildErrors: true,
    },
    // Exclude Android app directory from Next.js processing
    webpack: (config) => {
        config.watchOptions = {
            ...config.watchOptions,
            ignored: ['**/app/**', '**/android/**', '**/node_modules/**'],
        };
        return config;
    },
};

export default nextConfig;
