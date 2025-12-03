/** @type {import('next').NextConfig} */
const nextConfig = {
    // Standard Next.js configuration for Vercel
    images: {
        domains: ['firebasestorage.googleapis.com'], // Allow Firebase images
    },
    typescript: {
        ignoreBuildErrors: true, // Ignore API route type errors
    },
};

export default nextConfig;
