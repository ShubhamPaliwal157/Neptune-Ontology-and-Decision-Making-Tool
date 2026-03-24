/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow external image domains if needed in future
  images: {
    remotePatterns: [],
  },
  // Increase body size limit for source uploads
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
}

export default nextConfig
