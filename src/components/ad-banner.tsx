'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'

import { env } from '@/env.mjs'

/* eslint-disable  @typescript-eslint/no-explicit-any */

interface AdBannerProps {
  dataAdSlot: string
  dataAdFormat: string
  dataFullWidthResponsive: boolean
}

export function AdBanner({
  dataAdFormat,
  dataAdSlot,
  dataFullWidthResponsive,
}: AdBannerProps) {
  const pathname = usePathname()
  const adsLoaded = useRef(false)
  useEffect(() => {
    const loadAd = () => {
      if (typeof window !== 'undefined' && 'adsbygoogle' in window) {
        window.adsbygoogle = window.adsbygoogle || []
        // @ts-expect-error ...
        window.adsbygoogle.push({})
        adsLoaded.current = true
      }
    }

    if (pathname && !adsLoaded.current) {
      setTimeout(loadAd, 0)
    }
  }, [pathname])

  return (
    <ins
      className="adsbygoogle"
      style={{
        display: 'block',
        overflow: 'hidden',
      }}
      data-ad-client={env.NEXT_PUBLIC_GOOGLE_ADSENSE_CLIENT}
      data-ad-slot={dataAdSlot}
      data-ad-format={dataAdFormat}
      data-full-width-responsive={dataFullWidthResponsive}
    />
  )
}
