/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    typescript: {
        ignoreBuildErrors: true, 
    },
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '**',
            },
        ],
    },
    output: 'standalone',
    // Increase body size limit for large file uploads
    experimental: {
        serverComponentsExternalPackages: ['@prisma/client'],
    },
    // Configure body parsing limits
    api: {
        bodyParser: {
            sizeLimit: '50mb', // Increase from default 1mb to 50mb
        },
        responseLimit: '50mb',
    },
    // Configure middleware body size limit
    middlewareClientMaxBodySize: '50mb',
};

export default nextConfig;
