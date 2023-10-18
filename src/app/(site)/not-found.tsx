import Link from 'next/link'

import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default function NotFound() {
  return (
    <div className="space-y-2 py-10 text-center">
      <h1 className="text-3xl">404</h1>
      <h2 className="text-sm text-muted-foreground">
        Esta página não foi encontrada.
      </h2>
      <Link href={'/'} className={cn(buttonVariants())}>
        Voltar ao início
      </Link>
    </div>
  )
}
