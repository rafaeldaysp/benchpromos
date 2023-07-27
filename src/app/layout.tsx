import { env } from '@/env.mjs'

import './globals.css'

import dayjs from 'dayjs'
import 'dayjs/locale/pt-br'
import relativeTime from 'dayjs/plugin/relativeTime'
import { type Metadata } from 'next'
import * as React from 'react'

import { ApolloWrapper } from '@/components/apollo-wrapper'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/toaster'
import { siteConfig } from '@/config/site'

dayjs.extend(relativeTime)
dayjs.locale('pt-br')

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
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <ApolloWrapper>{children}</ApolloWrapper>
        </ThemeProvider>

        <Toaster />
      </body>
    </html>
  )
}
