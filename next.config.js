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
  experimental: {
    serverActions: {
      allowedOrigins: ['benchpromos.com.br'],
    },
  },
  async rewrites() {
    return [
      {
        source: '/promocao/:slug/:id',
        destination: '/sale/:slug/:id',
      },
      {
        source: '/promocao/:slug',
        destination: '/sale/:slug',
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
      {
        source: '/usuario/favoritos',
        destination: '/user/favorites',
      },
      {
        source: '/politica-de-privacidade',
        destination: '/privacy-policy',
      },
      {
        source: '/recomendacoes',
        destination: '/recommendation',
      },
      {
        source: '/sorteios',
        destination: '/giveaways',
      },
    ]
  },
  output: 'standalone',
}

module.exports = nextConfig
