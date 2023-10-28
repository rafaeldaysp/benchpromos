'use client'

import { type LucideIcon } from 'lucide-react'
import * as React from 'react'

import { cn } from '@/lib/utils'
import { Icons } from './icons'
import { Button } from './ui/button'
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
    label: 'Preços',
    value: 'precos',
    icon: Icons.DollarSign,
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
  const [activeSection, setActiveSection] = React.useState('')

  React.useEffect(() => {
    window.addEventListener('scroll', () => {
      const sections = Array.from(document.querySelectorAll('section[id]'))

      const current = sections.reduce((res, obj) => {
        return Math.abs(obj.getBoundingClientRect().top) <
          Math.abs(res.getBoundingClientRect().top)
          ? obj
          : res
      })

      setActiveSection(current.id)
    })
  }, [])

  return (
    <ScrollArea className="w-full bg-background">
      <div className="w-max space-x-2 p-1 font-medium">
        {options.map((option) => (
          <Button
            key={option.value}
            variant={'ghost'}
            className={cn('h-fit font-medium text-muted-foreground', {
              'bg-background text-foreground shadow':
                option.value === activeSection,
            })}
            onClick={() =>
              window.scrollTo({
                top:
                  (document.getElementById(option.value)?.offsetTop ?? 70) - 70,
                behavior: 'smooth',
              })
            }
          >
            {option.icon && <option.icon className="mr-1.5 h-3.5 w-3.5" />}
            {option.label}
          </Button>
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  )
}
