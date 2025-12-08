'use client'

import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Check } from 'lucide-react'
import Image from 'next/image'
import type { AwardsCategoryOption, Product } from '@/types'

type OptionWithProduct = AwardsCategoryOption & {
  product: Product
}

interface LaptopCardProps {
  option: OptionWithProduct
  isSelected: boolean
  onSelect: () => void
}

export function LaptopCard({ option, isSelected, onSelect }: LaptopCardProps) {
  return (
    <Card
      className={cn(
        'group relative cursor-pointer overflow-hidden transition-all duration-300 hover:scale-[1.02]',
        isSelected
          ? 'border-primary bg-primary/5 ring-2 ring-primary'
          : 'bg-card hover:border-primary/50',
      )}
      onClick={onSelect}
    >
      {/* Selection indicator */}
      <div
        className={cn(
          'absolute right-3 top-3 z-10 flex size-7 items-center justify-center rounded-full transition-all duration-300',
          isSelected
            ? 'scale-100 bg-primary text-primary-foreground'
            : 'scale-90 bg-muted text-muted-foreground opacity-0 group-hover:scale-100 group-hover:opacity-100',
        )}
      >
        <Check className="size-4" />
      </div>

      {/* Product image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-secondary/30">
        <Image
          src={option.product.imageUrl}
          alt={option.title || option.product.name}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-contain transition-transform duration-500 group-hover:scale-105"
        />
        {option.badge && (
          <Badge
            variant="secondary"
            className="absolute bottom-3 left-3 bg-background/90 backdrop-blur-sm"
          >
            {option.badge}
          </Badge>
        )}
      </div>

      <CardContent className="p-4">
        <div className="mb-2">
          {option.brand && (
            <p className="mb-1 text-xs uppercase tracking-wider text-muted-foreground">
              {option.brand}
            </p>
          )}
          <h3 className="line-clamp-1 text-lg font-semibold leading-tight">
            {option.title || option.product.name}
          </h3>
        </div>

        {option.subtitle && (
          <p className="mb-3 line-clamp-3 text-sm text-muted-foreground">
            {option.subtitle}
          </p>
        )}

        <div className="flex items-center justify-between">
          <span
            className={cn(
              'rounded-full px-2 py-1 text-xs font-medium transition-colors',
              isSelected
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground',
            )}
          >
            {isSelected ? 'Selecionado' : 'Clique para votar'}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
