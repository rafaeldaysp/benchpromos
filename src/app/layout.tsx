import { env } from '@/env.mjs'

import './globals.css'

import dayjs from 'dayjs'
import 'dayjs/locale/pt-br'
import relativeTime from 'dayjs/plugin/relativeTime'
import { type Metadata } from 'next'
import { Montserrat as FontSans } from 'next/font/google'
import Script from 'next/script'
import * as React from 'react'

import { ApolloWrapper } from '@/components/apollo-wrapper'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/toaster'
import { siteConfig } from '@/config/site'
import { cn } from '@/lib/utils'

const fontSans = FontSans({
  subsets: ['latin'],
  variable: '--font-sans',
})

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
      <head>
        <Script id="google-tag-manager">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer', '${env.NEXT_PUBLIC_GTM}');`}
        </Script>
        <Script
          async
          src={`https://www.googletagmanager.com/gtag/js?id=${env.NEXT_PUBLIC_GTAG}`}
        />
        <Script id="google-analytics">
          {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
 
          gtag('config', '${env.NEXT_PUBLIC_GTAG}');
        `}
        </Script>
      </head>
      <body
        className={cn(
          'min-h-screen bg-background antialiased',
          fontSans.className,
        )}
      >
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-N6NMJ8XR"
            height="0"
            width="0"
            className="invisible hidden"
          />
        </noscript>

        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <ApolloWrapper>{children}</ApolloWrapper>
        </ThemeProvider>

        <Toaster />
      </body>
    </html>
  )
}
