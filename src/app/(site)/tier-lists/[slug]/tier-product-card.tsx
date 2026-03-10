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
}

interface TierProductCardProps {
  product: TierListProduct
  rank: number
  editMode: boolean
  onRemove?: () => void
  note?: string
  onNoteChange?: (note: string) => void
  categorySlug: string
  dragHandle?: React.ReactNode
}

export function TierProductCard({
  product,
  rank,
  editMode,
  onRemove,
  note,
  onNoteChange,
  categorySlug,
  dragHandle,
}: TierProductCardProps) {
  const content = (
    <div
      className={cn(
        'group relative flex h-full flex-col overflow-hidden rounded-lg border bg-card text-card-foreground transition-all',
        'shadow-sm hover:shadow-md',
      )}
    >
      {/* Rank Badge */}
      <div className="absolute left-2 top-2 z-10 flex size-7 items-center justify-center rounded-full bg-foreground text-xs font-bold text-background shadow-md">
        {rank}
      </div>

      {/* Remove button */}
      {editMode && onRemove && (
        <div className="absolute right-1.5 top-1.5 z-10">
          <Button
            variant="ghost"
            size="icon"
            onClick={onRemove}
            className="size-6 rounded-full bg-background/80 text-muted-foreground backdrop-blur-sm hover:bg-destructive hover:text-white"
            aria-label={`Remover ${product.name}`}
          >
            <X className="size-3.5" />
          </Button>
        </div>
      )}

      {/* Drag Handle */}
      {editMode && dragHandle && (
        <div className="absolute left-0 top-1/2 z-10 flex h-10 w-5 -translate-y-1/2 items-center justify-center rounded-r-md bg-muted/80 text-muted-foreground opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
          <GripVertical className="size-3.5" />
          <div className="absolute inset-0">{dragHandle}</div>
        </div>
      )}

      {/* Product Image */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
        <Image
          src={product.imageUrl}
          alt={product.name}
          fill
          sizes="(max-width: 768px) 200px, 220px"
          className="object-contain p-2 transition-transform group-hover:scale-105"
        />
      </div>

      {/* Product Info */}
      <div className="flex flex-1 flex-col gap-1 p-3">
        <h3 className="line-clamp-3 text-sm font-semibold leading-tight text-foreground">
          {product.name}
        </h3>
        {product.deals?.length > 0 ? (
          product.deals[0].availability ? (
            <div className="mt-auto flex flex-col">
              <span className="text-sm font-bold text-foreground">
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
            <span className="mt-auto text-sm font-bold text-destructive">
              Indisponível
            </span>
          )
        ) : (
          <span className="mt-auto text-sm font-bold text-warning">
            Não listado
          </span>
        )}
      </div>

      {/* Note */}
      {editMode && onNoteChange ? (
        <div className="border-t px-3 py-2">
          <Textarea
            placeholder="Adicionar nota..."
            value={note ?? ''}
            onChange={(e) => onNoteChange(e.target.value)}
            className="min-h-[60px] resize-none text-xs"
            rows={2}
          />
        </div>
      ) : (
        note && (
          <div className="flex items-start gap-1.5 border-t px-3 py-2">
            <MessageSquare className="mt-0.5 size-3 shrink-0 text-muted-foreground" />
            <p className="line-clamp-3 text-xs leading-relaxed text-muted-foreground">
              {note}
            </p>
          </div>
        )
      )}
    </div>
  )

  if (editMode) {
    return content
  }

  return <Link href={`/${categorySlug}/${product.slug}`}>{content}</Link>
}
