import Link from 'next/link'
import * as React from 'react'

import { Icons } from '@/components/icons'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface AuthLayoutProps {
  children: React.ReactNode
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen">
      <Link
        href="/"
        className={cn(
          buttonVariants({ variant: 'ghost' }),
          'absolute left-4 top-4 md:left-8 md:top-8',
        )}
      >
        <>
          <Icons.ChevronLeft className="mr-2 h-4 w-4" />
          Home
        </>
      </Link>
      <main className="absolute left-[50%] top-[50%] w-full max-w-lg translate-x-[-50%] translate-y-[-50%]">
        {children}
      </main>
    </div>
  )
}
