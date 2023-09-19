'use client'

import { type LucideIcon } from 'lucide-react'
import Link from 'next/link'

import { cn } from '@/lib/utils'
import { buttonVariants } from './ui/button'
import { ScrollArea, ScrollBar } from './ui/scroll-area'

const options: {
  label: string
  value: string
  icon?: LucideIcon
}[] = [
  {
    label: 'Preços',
    value: 'precos',
  },
  {
    label: 'Histórico',
    value: 'historico',
  },
  {
    label: 'Ficha técnica',
    value: 'ficha-tecnica',
  },
  {
    label: 'Análise',
    value: 'analise',
  },
  {
    label: 'Promoções',
    value: 'promocoes',
  },
  {
    label: 'Review',
    value: 'review',
  },
]

export function ProductNavbar() {
  // React.useEffect(() => {
  //   window.addEventListener('scroll', changeBackground, true);
  //   return () => window.removeEventListener('scroll', changeBackground);
  // }, []);

  return (
    <ScrollArea className="w-full">
      <div className="w-max space-x-8 px-4 font-medium">
        {options.map((option) => (
          <Link
            key={option.value}
            className={cn(
              buttonVariants({ variant: 'link' }),
              'text-foreground',
            )}
            href={`#${option.value}`}
          >
            {option.label}
          </Link>
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  )
}
