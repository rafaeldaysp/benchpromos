'use client'

import * as React from 'react'
import { Check, ChevronsUpDown, X } from 'lucide-react'

import { cn } from '@/lib/utils'
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
import { Badge } from '@/components/ui/badge'
import { type Discount } from '@/types'
import { couponFormatter } from '@/utils/formatter'
import { ScrollArea } from './ui/scroll-area'

interface DiscountSelectorProps {
  discounts: Discount[]
  onSelectionChange: (selectedIds: string[]) => void
  selectedDiscounts: Discount[]
  setSelectedDiscounts: (selectedDiscounts: Discount[]) => void
  className?: string
  placeholder?: string
  disabled?: boolean
}

export function DiscountSelector({
  discounts,
  onSelectionChange,
  selectedDiscounts,
  setSelectedDiscounts,
  className,
  placeholder = 'Selecione descontos...',
  disabled = false,
}: DiscountSelectorProps) {
  const [open, setOpen] = React.useState(false)

  // Handle selection change
  const handleSelect = (discount: Discount) => {
    const isSelected = selectedDiscounts.some((item) => item.id === discount.id)

    let updated: Discount[]
    if (isSelected) {
      updated = selectedDiscounts.filter((item) => item.id !== discount.id)
    } else {
      updated = [...selectedDiscounts, discount]
    }

    setSelectedDiscounts(updated)
    onSelectionChange(updated.map((item) => item.id))
  }

  // Remove a selected discount
  const removeDiscount = (id: string) => {
    const updated = selectedDiscounts.filter((item) => item.id !== id)
    setSelectedDiscounts(updated)
    onSelectionChange(updated.map((item) => item.id))
  }

  // Clear all selections
  const clearSelections = () => {
    setSelectedDiscounts([])
    onSelectionChange([])
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
            disabled={disabled}
          >
            {selectedDiscounts.length > 0
              ? `${selectedDiscounts.length} desconto${
                  selectedDiscounts.length > 1 ? 's' : ''
                } selecionado${selectedDiscounts.length > 1 ? 's' : ''}`
              : placeholder}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput placeholder="Pesquisar descontos..." />
            <CommandList>
              <CommandEmpty>Nenhum desconto encontrado.</CommandEmpty>
              <CommandGroup>
                <ScrollArea className="h-80">
                  {discounts.map((discount) => {
                    const isSelected = selectedDiscounts.some(
                      (item) => item.id === discount.id,
                    )
                    return (
                      <CommandItem
                        key={discount.id}
                        value={discount.id}
                        onSelect={() => handleSelect(discount)}
                        className="mr-1 cursor-pointer"
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            isSelected ? 'opacity-100' : 'opacity-0',
                          )}
                        />
                        <span className="flex-1">{discount.label}</span>
                        <span className="text-sm text-muted-foreground">
                          {couponFormatter(discount.discount)}
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

      {selectedDiscounts.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {selectedDiscounts.map((discount) => (
            <Badge
              key={discount.id}
              variant="secondary"
              className="flex items-center gap-1"
            >
              {discount.label} ({couponFormatter(discount.discount)})
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => removeDiscount(discount.id)}
              >
                <X className="h-3 w-3" />
                <span className="sr-only">Remove {discount.label}</span>
              </Button>
            </Badge>
          ))}
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-xs text-muted-foreground"
            onClick={clearSelections}
          >
            Limpar seleção
          </Button>
        </div>
      )}
    </div>
  )
}
