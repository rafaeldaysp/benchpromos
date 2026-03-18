'use client'

import { Pencil, Plus, Trash2, Package } from 'lucide-react'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Sortable,
  SortableContent,
  SortableItem,
  SortableItemHandle,
  SortableOverlay,
} from '@/components/ui/sortable'
import { cn } from '@/lib/utils'
import type { Product, Tier, TierProduct } from '@/types'
import { priceFormatter } from '@/utils/formatter'
import { TierProductCard } from './tier-product-card'

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

type TierWithProducts = Tier & {
  products: (TierProduct & {
    product: TierListProduct
  })[]
}

interface TierSectionProps {
  tier: TierWithProducts
  editMode: boolean
  onEditTier: () => void
  onDeleteTier: () => void
  onOpenDrawer: () => void
  onRemoveProduct: (productId: string) => void
  onReorderProducts: (products: TierWithProducts['products']) => void
  onUpdateNote: (productId: string, note: string) => void
  categorySlugs: string[]
}

export function TierSection({
  tier,
  editMode,
  onEditTier,
  onDeleteTier,
  onOpenDrawer,
  onRemoveProduct,
  onReorderProducts,
  onUpdateNote,
  categorySlugs,
}: TierSectionProps) {
  return (
    <section
      className="relative overflow-hidden rounded-xl border border-l-4 transition-colors"
      style={{
        borderLeftColor: tier.color,
        backgroundColor: `${tier.color}08`,
      }}
    >
      {/* Tier Header */}
      <div className="flex  items-center justify-between gap-4 px-5 py-4 sm:flex-row">
        <div className="flex items-center gap-3">
          <div
            className="size-3 rounded-full"
            style={{ backgroundColor: tier.color }}
          />
          {/*<h2 className="text-lg font-semibold text-foreground">{tier.name}</h2>*/}
          {tier.priceLimit != null && (
            <Badge
              variant="outline"
              className="text-sm font-semibold sm:text-lg"
              style={{
                borderColor: `${tier.color}33`,
                color: tier.color,
                backgroundColor: `${tier.color}15`,
              }}
            >
              {tier.name}
            </Badge>
          )}
          <span className="hidden text-xs text-muted-foreground sm:block">
            {tier.products.length}{' '}
            {tier.products.length === 1 ? 'produto' : 'produtos'}
          </span>
        </div>

        {editMode && (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={onOpenDrawer}
              aria-label="Adicionar produtos"
              className="size-8 text-muted-foreground"
            >
              <Plus className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onEditTier}
              aria-label="Editar tier"
              className="size-8 text-muted-foreground"
            >
              <Pencil className="size-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Deletar tier"
                  className="size-8 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="size-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Remover tier &quot;{tier.name}&quot;?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    Todos os produtos deste tier serão desvinculados. Essa ação
                    será aplicada ao salvar.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={onDeleteTier}>
                    Remover
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>

      {/* Product List */}
      <div className="px-5 pb-5">
        {tier.products.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-10 text-muted-foreground">
            <Package className="mb-2 size-8 opacity-40" />
            <p className="text-sm">Nenhum produto neste tier</p>
            {editMode && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onOpenDrawer}
                className="mt-2"
                style={{ color: tier.color }}
              >
                <Plus className="size-3.5" />
                Adicionar produtos
              </Button>
            )}
          </div>
        ) : editMode ? (
          <Sortable
            value={tier.products}
            onValueChange={onReorderProducts}
            getItemValue={(item) => item.id}
            orientation="vertical"
          >
            <SortableContent className="grid grid-cols-1 gap-3">
              {tier.products.map((tp, index) => (
                <SortableItem key={tp.id} value={tp.id}>
                  <TierProductCard
                    product={tp.product}
                    rank={index + 1}
                    editMode
                    onRemove={() => onRemoveProduct(tp.product.id)}
                    note={tp.note}
                    onNoteChange={(note) => onUpdateNote(tp.product.id, note)}
                    categorySlugs={categorySlugs}
                    dragHandle={<SortableItemHandle className="size-full" />}
                  />
                </SortableItem>
              ))}
            </SortableContent>
            <SortableOverlay>
              {({ value }) => {
                const tp = tier.products.find((p) => p.id === value)
                if (!tp) return null
                const index = tier.products.indexOf(tp)
                return (
                  <TierProductCard
                    product={tp.product}
                    rank={index + 1}
                    editMode={false}
                    note={tp.note}
                    categorySlugs={categorySlugs}
                  />
                )
              }}
            </SortableOverlay>
          </Sortable>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {tier.products.map((tp, index) => (
              <TierProductCard
                key={tp.id}
                product={tp.product}
                rank={index + 1}
                editMode={false}
                note={tp.note}
                categorySlugs={categorySlugs}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
