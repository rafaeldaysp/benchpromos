'use client'

import { useSearchParams } from 'next/navigation'
import * as React from 'react'

import { SidebarProvider } from '@/components/ui/sidebar'

// Links can open the dashboard with the sidebar collapsed by adding
// `?sidebar=closed`; it only sets the initial state, the user can still toggle.
export function DashboardSidebarProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const searchParams = useSearchParams()

  return (
    <SidebarProvider defaultOpen={searchParams.get('sidebar') !== 'closed'}>
      {children}
    </SidebarProvider>
  )
}
