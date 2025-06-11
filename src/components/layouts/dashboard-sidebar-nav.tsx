'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import * as React from 'react'

import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Icons } from '../icons'

interface DashboardSidebarNavProps extends React.HTMLAttributes<HTMLElement> {
  items: {
    href: string
    title: string
  }[]
}

export function DashboardSidebarNav({
  className,
  items,
  ...props
}: DashboardSidebarNavProps) {
  const pathname = usePathname()

  return (
    <nav
      className={cn(
        'flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1',
        className,
      )}
      {...props}
    >
      <Link
        href="/"
        className={cn(
          buttonVariants({ variant: 'link' }),
          'justify-start text-foreground hover:text-primary',
        )}
      >
        <>
          <Icons.Home className="mr-2 size-4" />
          Início
        </>
      </Link>
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            buttonVariants({ variant: 'ghost' }),
            'justify-start hover:bg-muted/50',
            {
              'bg-muted hover:bg-muted': item.href === pathname,
            },
          )}
        >
          {item.title}
        </Link>
      ))}
    </nav>
  )
}
