'use client'

import { useTheme } from 'next-themes'
import type { ExtendedRecordMap } from 'notion-types'
import * as React from 'react'
import { NotionRenderer } from 'react-notion-x'

export function NotionWrapper({ recordMap }: { recordMap: ExtendedRecordMap }) {
  const { theme, systemTheme } = useTheme()
  const [isDarkMode, setIsDarkMode] = React.useState(true)

  React.useEffect(() => {
    setIsDarkMode(
      theme === 'dark' || (theme === 'system' && systemTheme === 'dark'),
    )
  }, [theme, systemTheme])

  return (
    <NotionRenderer
      recordMap={recordMap}
      darkMode={isDarkMode}
      className="min-w-full"
      bodyClassName="p-0"
    />
  )
}
