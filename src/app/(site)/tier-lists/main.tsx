'use client'

import { ArrowRight, Crown, Layers, Package, Plus } from 'lucide-react'
import Link from 'next/link'
import * as React from 'react'

import { TierListForm } from '@/components/forms/tier-list-form'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { Category, TierList } from '@/types'

type TierListItem = TierList & {
  category: Pick<Category, 'id' | 'name' | 'slug'>
  categories: Pick<Category, 'id' | 'name' | 'slug'>[]
  tiers: {
    id: string
    name: string
    color: string
    products: { id: string }[]
  }[]
}

interface TierListsMainProps {
  tierLists: TierListItem[]
  isAdmin: boolean
  categories: Pick<Category, 'id' | 'name'>[]
}

export function TierListsMain({
  tierLists,
  isAdmin,
  categories,
}: TierListsMainProps) {
  const [dialogOpen, setDialogOpen] = React.useState(false)

  return (
    <>
      {tierLists.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
          <Crown className="mb-4 size-12 opacity-30" />
          <p className="text-lg font-medium">Nenhuma recomendação ainda</p>
          <p className="mt-1 text-sm">
            Em breve teremos recomendações dos melhores produtos.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {tierLists.map((tierList) => {
            const totalProducts = tierList.tiers.reduce(
              (acc, tier) => acc + tier.products.length,
              0,
            )
            const tierColors = tierList.tiers.map((t) => t.color)
            const gradientBg =
              tierColors.length >= 2
                ? `linear-gradient(135deg, ${tierColors.join(', ')})`
                : tierColors.length === 1
                  ? tierColors[0]
                  : 'hsl(var(--primary))'

            return (
              <Link key={tierList.id} href={`/tier-lists/${tierList.slug}`}>
                <div className="group relative flex h-full flex-col overflow-hidden rounded-xl border bg-card transition-all hover:shadow-lg hover:ring-1 hover:ring-primary/20">
                  {/* Color gradient bar */}
                  <div
                    className="h-1.5 w-full"
                    style={{ background: gradientBg }}
                  />

                  <div className="flex flex-1 flex-col gap-4 p-5">
                    {/* Category badges */}
                    <div className="flex flex-wrap gap-1.5">
                      {(tierList.categories.length > 0
                        ? tierList.categories
                        : [tierList.category]
                      ).map((cat) => (
                        <Badge
                          key={cat.id}
                          variant="secondary"
                          className="w-fit text-[11px] font-semibold uppercase tracking-wider"
                        >
                          {cat.name}
                        </Badge>
                      ))}
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-bold leading-tight text-foreground group-hover:text-primary transition-colors">
                      {tierList.title}
                    </h3>

                    {/* Description */}
                    {tierList.description && (
                      <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                        {tierList.description}
                      </p>
                    )}

                    {/* Stats */}
                    <div className="mt-auto flex items-center gap-4 pt-2">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Layers className="size-3.5" />
                        <span className="text-xs font-medium">
                          {tierList.tiers.length}{' '}
                          {tierList.tiers.length === 1 ? 'faixa' : 'faixas'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Package className="size-3.5" />
                        <span className="text-xs font-medium">
                          {totalProducts}{' '}
                          {totalProducts === 1 ? 'produto' : 'produtos'}
                        </span>
                      </div>

                      <div className="ml-auto flex size-7 items-center justify-center rounded-full bg-muted text-muted-foreground transition-all group-hover:bg-primary group-hover:text-primary-foreground">
                        <ArrowRight className="size-3.5" />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {/* Floating Admin FAB */}
      {isAdmin && (
        <Button
          size="icon"
          onClick={() => setDialogOpen(true)}
          className="fixed bottom-6 right-6 z-50 size-12 rounded-full shadow-lg"
          aria-label="Criar Tier List"
        >
          <Plus className="size-5" />
        </Button>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="w-full space-y-4 overflow-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Criar Tier List</DialogTitle>
            <DialogDescription>
              Crie uma nova tier list para organizar produtos por ranking.
            </DialogDescription>
          </DialogHeader>
          <TierListForm
            categories={categories}
            onSuccess={() => setDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}
