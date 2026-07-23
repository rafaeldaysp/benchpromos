'use client'

import { useTheme } from 'next-themes'

import { Icons } from '@/components/icons'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function ModeToggle() {
  const { setTheme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="size-10 transition-[background-color,color,transform] active:scale-[0.96]"
        >
          <Icons.Sun className="size-[1.2rem] rotate-0 scale-100 blur-0 transition-[filter,opacity,transform] duration-200 dark:-rotate-90 dark:scale-[0.25] dark:opacity-0 dark:blur-sm" />
          <Icons.Moon className="absolute size-[1.2rem] rotate-90 scale-[0.25] opacity-0 blur-sm transition-[filter,opacity,transform] duration-200 dark:rotate-0 dark:scale-100 dark:opacity-100 dark:blur-0" />
          <span className="sr-only">Mudar tema</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme('light')}>
          <Icons.Sun className="mr-2 size-4" />
          <span>Claro</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('dark')}>
          <Icons.Moon className="mr-2 size-4" />
          <span>Escuro</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('system')}>
          <Icons.Laptop className="mr-2 size-4" />
          <span>Sistema</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
