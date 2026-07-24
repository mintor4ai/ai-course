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
  async headers() {
    return [
      {
        source: '/s/:token*',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate' },
          { key: 'Pragma', value: 'no-cache' },
        ],
      },
    ]
  },
}

module.exports = nextConfig
