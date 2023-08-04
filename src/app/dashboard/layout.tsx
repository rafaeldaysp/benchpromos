import * as React from 'react'

import { DashboardSidebarNav } from '@/components/dashboard-sidebar-nav'

const sidebarNavItems = [
  {
    title: 'Promoções',
    href: '/dashboard/sales',
  },
  {
    title: 'Produtos',
    href: '/dashboard/products',
  },
  {
    title: 'Ofertas',
    href: '/dashboard/deals',
  },
  {
    title: 'Varejistas',
    href: '/dashboard/retailers',
  },
  {
    title: 'Categorias',
    href: '/dashboard/categories',
  },
  {
    title: 'Cupons',
    href: '/dashboard/coupons',
  },
  {
    title: 'Cashbacks',
    href: '/dashboard/cashbacks',
  },
  {
    title: 'Benchmarks',
    href: '/dashboard/benchmarks',
  },
]

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col space-y-8 px-4 py-10 sm:container lg:flex-row lg:space-x-12 lg:space-y-0">
      <aside className="overflow-x-auto lg:w-1/5">
        <DashboardSidebarNav items={sidebarNavItems} />
      </aside>
      <div className="flex-1">{children}</div>
    </div>
  )
}
