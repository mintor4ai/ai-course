/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['nodemailer', 'googleapis'],
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'www.humanaix.mx' },
    ],
  },
}

module.exports = nextConfig
