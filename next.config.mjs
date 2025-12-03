/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        domains: ['firebasestorage.googleapis.com'],
    },
    typescript: {
        ignoreBuildErrors: true,
    },
};

export default nextConfig;
