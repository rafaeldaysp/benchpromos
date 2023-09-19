'use client'

import { type LucideIcon } from 'lucide-react'
import Link from 'next/link'

import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { Icons } from './icons'
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
    icon: Icons.DollarSign,
  },
  {
    label: 'Histórico',
    value: 'historico',
    icon: Icons.LineChart,
  },
  {
    label: 'Ficha técnica',
    value: 'ficha-tecnica',
    icon: Icons.GanttChartSquare,
  },
  {
    label: 'Análise',
    value: 'analise',
    icon: Icons.ScrollText,
  },
  {
    label: 'Promoções',
    value: 'promocoes',
    icon: Icons.Receipt,
  },
  {
    label: 'Review',
    value: 'review',
    icon: Icons.YoutubeIcon,
  },
]

export function ProductNavbar() {
  return (
    <ScrollArea className="w-full">
      <div className="w-max space-x-12 font-medium">
        {options.map((option) => (
          <Link
            key={option.value}
            className={cn(
              buttonVariants({ variant: 'link' }),
              'px-0 text-foreground',
            )}
            href={`#${option.value}`}
          >
            {option.icon && (
              <option.icon className="mr-2 h-4 w-4 text-auxiliary" />
            )}
            {option.label}
          </Link>
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
      <Separator className="" />
    </ScrollArea>
  )
}
