import { redirect } from 'next/navigation'
import * as React from 'react'

import { AppSidebar } from '@/components/app-sidebar'
import { AuthTokenProvider } from '@/components/auth-token-provider'
import { DashboardBreadcrumb } from '@/components/dashboard-breadcrumb'
import { Separator } from '@/components/ui/separator'
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { getCurrentUser, getCurrentUserToken } from '../_actions/user'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default async function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const user = await getCurrentUser()

  // The middleware only sees the role cached in the session cookie; the
  // session here is refreshed from the API, so a demoted admin is turned away.
  if (user?.role !== 'ADMIN') redirect('/')

  const token = await getCurrentUserToken()

  return (
    <SidebarProvider>
      <AppSidebar
        user={{
          avatar: user?.image ?? '',
          name: user?.name ?? '',
          email: user?.email ?? '',
        }}
      />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <DashboardBreadcrumb />
          </div>
        </header>
        <div className="h-full space-y-6 px-4 py-10">
          <div className="flex-1">
            <AuthTokenProvider token={token}>{children}</AuthTokenProvider>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
