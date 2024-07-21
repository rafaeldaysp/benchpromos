import * as React from 'react'

import { DashboardNav } from '@/components/layouts/dashboard-nav'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col space-y-8 px-4 py-10 sm:container lg:space-y-0">
      <aside className="overflow-x-auto">
        <DashboardNav />
      </aside>
      <div className="flex-1">{children}</div>
    </div>
  )
}
