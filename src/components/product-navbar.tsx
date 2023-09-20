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
      <div className="w-max space-x-4 rounded-lg border-none bg-muted p-1 font-medium sm:space-x-4">
        {options.map((option) => (
          <Link
            key={option.value}
            className={cn(
              buttonVariants({ variant: 'ghost' }),
              'h-fit px-2 py-1 font-medium text-muted-foreground',
              {
                'bg-background text-foreground shadow':
                  option.value === 'precos',
              },
            )}
            href={`#${option.value}`}
          >
            {/* {option.icon && (
              <option.icon className="mr-1 h-3.5 w-3.5 text-auxiliary" />
            )} */}
            {option.label}
          </Link>
        ))}
      </div>
      <ScrollBar orientation="horizontal" className="fill-primary" />
    </ScrollArea>
  )
}
