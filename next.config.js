/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'usiojyotlnulgqchjgks.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'source.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn.coverr.co',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    // Ignorar errores de optimización de imágenes para evitar 404s en consola
    unoptimized: false,
  },
}

module.exports = nextConfig
