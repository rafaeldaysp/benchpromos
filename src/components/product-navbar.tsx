'use client'

import { type LucideIcon } from 'lucide-react'
import Link from 'next/link'

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
    label: 'Histórico',
    value: 'historico',
    icon: Icons.LineChart,
  },
  {
    label: 'Preços',
    value: 'precos',
    icon: Icons.DollarSign,
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
  // {
  //   label: 'Promoções',
  //   value: 'promocoes',
  //   icon: Icons.Receipt,
  // },
  {
    label: 'Benchmarks',
    value: 'benchmarks',
    icon: Icons.BarChart4,
  },
  {
    label: 'Review',
    value: 'review',
    icon: Icons.YoutubeIcon,
  },
]

export function ProductNavbar() {
  return (
    <ScrollArea className="w-full bg-background">
      <div className="w-max space-x-2 p-1 font-medium">
        {options.map((option) => (
          <Link
            scroll={false}
            key={option.value}
            className={cn(
              buttonVariants({ variant: 'ghost' }),
              'h-fit font-medium text-muted-foreground',
              {
                'bg-background text-foreground shadow':
                  option.value === 'precos',
              },
            )}
            href={`#${option.value}`}
          >
            {option.icon && <option.icon className="mr-1.5 h-3.5 w-3.5" />}
            {option.label}
          </Link>
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  )
}
