'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

const sidebarNavItems = [
  {
    title: 'Dashboard',
    href: '/dashboard',
  },
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
    title: 'Usuários',
    href: '/dashboard/users',
  },
  {
    title: 'Benchmarks',
    href: '/dashboard/benchmarks',
  },
  {
    title: 'Recomendações',
    href: '/dashboard/recommendation',
  },
]

interface DashboardNavProps extends React.HTMLAttributes<HTMLDivElement> {}

export function DashboardNav({ className, ...props }: DashboardNavProps) {
  const pathname = usePathname()

  return (
    <div className="relative">
      <ScrollArea className="max-w-[600px] lg:max-w-none">
        <div className={cn('mb-4 flex items-center', className)} {...props}>
          {sidebarNavItems.map((item, index) => (
            <Link
              href={item.href}
              key={item.href}
              className={cn(
                'flex h-7 items-center justify-center rounded-full px-4 text-center text-sm transition-colors hover:text-primary',
                pathname === item.href || (index === 0 && pathname === '/')
                  ? 'bg-muted font-medium text-primary'
                  : 'text-muted-foreground',
              )}
            >
              {item.title}
            </Link>
          ))}
        </div>
        <ScrollBar orientation="horizontal" className="invisible" />
      </ScrollArea>
    </div>
  )
}
