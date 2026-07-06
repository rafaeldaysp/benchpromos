'use client'

import { gql } from '@apollo/client'
import { useQuery } from '@apollo/experimental-nextjs-app-support/ssr'
import { Check, ChevronsUpDown, X } from 'lucide-react'
import * as React from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { env } from '@/env.mjs'
import { cn } from '@/lib/utils'
import type { DiscordRole } from '@/types'
import { ScrollArea } from './ui/scroll-area'

const GET_DISCORD_ROLES = gql`
  query GetDiscordRolesForShare {
    discordRoles {
      id
      name
      value
    }
  }
`

interface DiscordRolesSelectorProps {
  /** Selected role values (the marks inserted into the message). */
  value: string[]
  onChange: (values: string[]) => void
  className?: string
  placeholder?: string
  disabled?: boolean
}

export function DiscordRolesSelector({
  value,
  onChange,
  className,
  placeholder = 'Selecione cargos...',
  disabled = false,
}: DiscordRolesSelectorProps) {
  const [open, setOpen] = React.useState(false)

  const { data, loading } = useQuery<{
    discordRoles: Pick<DiscordRole, 'id' | 'name' | 'value'>[]
  }>(GET_DISCORD_ROLES, {
    fetchPolicy: 'network-only',
    context: {
      headers: {
        'api-key': env.NEXT_PUBLIC_API_KEY,
      },
    },
  })

  const roles = data?.discordRoles ?? []

  function toggle(roleValue: string) {
    onChange(
      value.includes(roleValue)
        ? value.filter((item) => item !== roleValue)
        : [...value, roleValue],
    )
  }

  function labelFor(roleValue: string) {
    return roles.find((role) => role.value === roleValue)?.name ?? roleValue
  }

  return (
    <div className={cn('space-y-2', className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={disabled || loading}
          >
            {value.length > 0
              ? `${value.length} cargo${value.length > 1 ? 's' : ''} selecionado${
                  value.length > 1 ? 's' : ''
                }`
              : placeholder}
            <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput placeholder="Pesquisar cargos..." />
            <CommandList>
              <CommandEmpty>Nenhum cargo encontrado.</CommandEmpty>
              <CommandGroup>
                <ScrollArea className="h-60">
                  {roles.map((role) => {
                    const isSelected = value.includes(role.value)

                    return (
                      <CommandItem
                        key={role.id}
                        value={role.name}
                        onSelect={() => toggle(role.value)}
                        className="mr-1 cursor-pointer"
                      >
                        <Check
                          className={cn(
                            'mr-2 size-4',
                            isSelected ? 'opacity-100' : 'opacity-0',
                          )}
                        />
                        <span className="flex-1">{role.name}</span>
                        <span className="text-sm text-muted-foreground">
                          {role.value}
                        </span>
                      </CommandItem>
                    )
                  })}
                </ScrollArea>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {value.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {value.map((roleValue) => (
            <Badge
              key={roleValue}
              variant="secondary"
              className="flex items-center gap-1"
            >
              {labelFor(roleValue)}
              <Button
                variant="ghost"
                size="sm"
                className="size-4 p-0 hover:bg-transparent"
                onClick={() => toggle(roleValue)}
              >
                <X className="size-3" />
                <span className="sr-only">Remover {labelFor(roleValue)}</span>
              </Button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
