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
  rewrites: async () => {
    return [
      {
        source: '/promocao/:slug/:id',
        destination: '/sale/:slug/:id',
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
