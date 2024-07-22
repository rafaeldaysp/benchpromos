import Link from 'next/link'
import * as React from 'react'

import { Icons } from '@/components/icons'
import { DashboardNav } from '@/components/layouts/dashboard-nav'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen space-y-6 px-4 py-10 sm:container">
      <Link href="/" className={cn(buttonVariants({ variant: 'ghost' }), '')}>
        <>
          <Icons.ChevronLeft className="mr-2 h-4 w-4" />
          Início
        </>
      </Link>
      <div className="flex flex-col gap-6">
        <aside className="overflow-x-auto">
          <DashboardNav />
        </aside>
        <div className="flex-1">{children}</div>
      </div>
    </div>
  )
}
