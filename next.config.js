/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/promocao/:slug/:id',
        destination: '/sale/:slug/:id',
      },
      {
        source: '/usuario',
        destination: '/user',
      },
      {
        source: '/usuario/perfil',
        destination: '/user/profile',
      },
      {
        source: '/usuario/alertas',
        destination: '/user/alerts',
      },
    ]
  },
  experimental: {
    serverActions: true,
  },
  output: 'standalone',
}

module.exports = nextConfig
