'use client'

import { GripVertical, MessageSquare, X } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import type { Product } from '@/types'
import { priceFormatter } from '@/utils/formatter'
import { priceCalculator } from '@/utils/price-calculator'

type TierListProduct = Pick<
  Product,
  'id' | 'name' | 'imageUrl' | 'slug' | 'categoryId'
> & {
  deals: {
    price: number
    availability: boolean
    retailer: { name: string }
    coupon: { code: string; discount: string; availability: boolean }
    cashback: { value: number; provider: string }
    discounts: { discount: string }[]
  }[]
  category: {
    slug: string
  }
}

interface TierProductCardProps {
  product: TierListProduct
  rank: number
  editMode: boolean
  onRemove?: () => void
  note?: string
  onNoteChange?: (note: string) => void
  categorySlugs: string[]
  dragHandle?: React.ReactNode
}

export function TierProductCard({
  product,
  rank,
  editMode,
  onRemove,
  note,
  onNoteChange,
  categorySlugs,
  dragHandle,
}: TierProductCardProps) {
  const content = (
    <div
      className={cn(
        'group relative flex w-full overflow-hidden rounded-xl border bg-card text-card-foreground transition-all',
        'shadow-sm hover:shadow-lg',
      )}
    >
      {/* Rank Badge */}
      <div className="absolute left-2 top-2 z-10 flex size-8 items-center justify-center rounded-full bg-foreground text-xs font-bold text-background shadow-lg md:size-10 md:text-sm">
        #{rank}
      </div>

      {/* Remove button */}
      {editMode && onRemove && (
        <div className="absolute right-2 top-2 z-10">
          <Button
            variant="ghost"
            size="icon"
            onClick={onRemove}
            className="size-7 rounded-full bg-background/90 text-muted-foreground backdrop-blur-sm hover:bg-destructive hover:text-white"
            aria-label={`Remover ${product.name}`}
          >
            <X className="size-3.5" />
          </Button>
        </div>
      )}

      {/* Drag Handle */}
      {editMode && dragHandle && (
        <div className="absolute left-0 top-1/2 z-10 flex h-14 w-5 -translate-y-1/2 items-center justify-center rounded-r-lg bg-muted/90 text-muted-foreground opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
          <GripVertical className="size-4" />
          <div className="absolute inset-0">{dragHandle}</div>
        </div>
      )}

      {/* Product Image */}
      <div className="relative aspect-square w-24 shrink-0 overflow-hidden bg-muted sm:w-32 md:w-36">
        <Image
          src={product.imageUrl}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 96px, (max-width: 768px) 128px, 144px"
          className="object-contain p-2 transition-transform group-hover:scale-105"
        />
      </div>

      {/* Product Info */}
      <div className="flex flex-1 flex-col justify-center gap-1 p-3 md:gap-1.5 md:p-4">
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-foreground md:text-base">
          {product.name}
        </h3>
        {product.deals?.length > 0 ? (
          product.deals[0].availability ? (
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-foreground md:text-base">
                {priceFormatter.format(
                  priceCalculator(
                    product.deals[0].price,
                    product.deals[0].coupon?.availability
                      ? product.deals[0].coupon.discount
                      : undefined,
                    product.deals[0].cashback?.value,
                    product.deals[0].discounts.map((d) => d.discount),
                  ) / 100,
                )}
              </span>
              <span className="text-xs text-muted-foreground">
                via {product.deals[0].retailer.name}
              </span>
            </div>
          ) : (
            <span className="text-sm font-bold text-destructive">
              Indisponível
            </span>
          )
        ) : (
          <span className="text-sm font-bold text-warning">Não listado</span>
        )}

        {/* Note */}
        {editMode && onNoteChange ? (
          <Textarea
            placeholder="Adicionar nota..."
            value={note ?? ''}
            onChange={(e) => onNoteChange(e.target.value)}
            className="mt-1 min-h-[48px] resize-none text-xs"
            rows={2}
          />
        ) : (
          note && (
            <div className="mt-1 flex items-start gap-1.5">
              <MessageSquare className="mt-0.5 size-3 shrink-0 text-muted-foreground" />
              <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                {note}
              </p>
            </div>
          )
        )}
      </div>
    </div>
  )

  if (editMode) {
    return content
  }

  return (
    <Link href={`/${product.category.slug}/${product.slug}`}>{content}</Link>
  )
}
