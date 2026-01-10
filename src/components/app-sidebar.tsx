'use client'

import Image from 'next/image'
import Link from 'next/link'
import * as React from 'react'

import Logo from '@/assets/logo-benchpromos.svg'
// import LogoXmas from '@/assets/logo-natalina.svg'
import { NavMain } from '@/components/nav-main'
import { NavUser } from '@/components/nav-user'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { siteConfig } from '@/config/site'
import { dashboardSidebarItems } from '@/constants/dashboard-sidebar-nav'

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar className="border-r" variant="inset" {...props}>
      <SidebarHeader className="bg-background">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/">
                <div className="relative aspect-square h-[30px] select-none">
                  <Image
                    src={Logo}
                    alt="Logo"
                    className="object-contain"
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                    {siteConfig.name}
                  </span>
                  <span className="truncate text-xs">Dashboard</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="bg-background">
        <NavMain items={dashboardSidebarItems} />
      </SidebarContent>
      <SidebarFooter className="bg-background">
        <NavUser user={props.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
