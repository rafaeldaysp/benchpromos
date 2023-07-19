import { env } from '@/env.mjs'

import './globals.css'

import { type Metadata } from 'next'
import * as React from 'react'

import { ThemeProvider } from '@/components/theme-provider'
import { siteConfig } from '@/config/site'
import { ApolloWrapper } from '@/components/apollo-wrapper'
import { Toaster } from '@/components/ui/toaster'

export const metadata: Metadata = {
  metadataBase: new URL(env.NEXT_PUBLIC_APP_URL),
  title: {
    default: siteConfig.name,
    template: `%s - ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: [
    'Next.js',
    'React',
    'Tailwind CSS',
    'Server Components',
    'Server Actions',
  ],
  authors: [
    {
      name: 'mmpdrosa',
      url: 'https://github.com/mmpdrosa',
    },
    {
      name: 'rafaeldaysp',
      url: 'https://github.com/rafaeldaysp',
    },
  ],
  creator: 'rafaeldaysp',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: siteConfig.url,
    title: siteConfig.name,
    description: siteConfig.description,
    siteName: siteConfig.name,
  },
  icons: {
    icon: '/favicon.ico',
  },
}

interface RootLayoutProps {
  children: React.ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head />
      <body className="min-h-screen bg-background antialiased">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <ApolloWrapper>{children}</ApolloWrapper>
        </ThemeProvider>

        <Toaster />
      </body>
    </html>
  )
}
