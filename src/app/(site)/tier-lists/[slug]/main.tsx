'use client'

import { gql, useMutation } from '@apollo/client'
import {
  Crown,
  Layers,
  Package,
  Pencil,
  Plus,
  Save,
  Trash2,
  X,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import * as React from 'react'
import { toast } from 'sonner'

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
import { env } from '@/env.mjs'
import type { Category, Product, Tier, TierList, TierProduct } from '@/types'
import { TierForm } from '@/components/forms/tier-form'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { TierSection } from './tier-section'
import { ProductPickerSheet } from './product-picker-sheet'

const REMOVE_TIER_LIST = gql`
  mutation RemoveTierList($id: ID!) {
    removeTierList(id: $id) {
      id
    }
  }
`

const UPDATE_TIER_LIST = gql`
  mutation UpdateTierList($updateTierListInput: UpdateTierListInput!) {
    updateTierList(updateTierListInput: $updateTierListInput) {
      id
      slug
    }
  }
`

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

type TierWithProducts = Tier & {
  products: (TierProduct & {
    product: TierListProduct
  })[]
}

type TierListData = TierList & {
  category: Pick<Category, 'id' | 'name' | 'slug'>
  tiers: TierWithProducts[]
}

interface TierListMainProps {
  tierList: TierListData
  isAdmin: boolean
}

export function TierListMain({ tierList, isAdmin }: TierListMainProps) {
  const [editMode, setEditMode] = React.useState(false)
  const [tiers, setTiers] = React.useState<TierWithProducts[]>(() =>
    [...tierList.tiers]
      .sort((a, b) => a.position - b.position)
      .map((tier) => ({
        ...tier,
        products: [...tier.products].sort((a, b) => a.position - b.position),
      })),
  )

  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editingTier, setEditingTier] = React.useState<TierWithProducts | null>(
    null,
  )

  const [sheetOpen, setSheetOpen] = React.useState(false)
  const [activeTierId, setActiveTierId] = React.useState<string | null>(null)

  const router = useRouter()

  const [updateTierList, { loading: isSaving }] = useMutation(
    UPDATE_TIER_LIST,
    {
      context: {
        headers: {
          'api-key': env.NEXT_PUBLIC_API_KEY,
        },
      },
      onError(error) {
        toast.error(error.message)
      },
      onCompleted() {
        toast.success('Tier list atualizada com sucesso.')
        router.refresh()
      },
    },
  )

  const [removeTierList, { loading: isDeleting }] = useMutation(
    REMOVE_TIER_LIST,
    {
      context: {
        headers: {
          'api-key': env.NEXT_PUBLIC_API_KEY,
        },
      },
      onError(error) {
        toast.error(error.message)
      },
      onCompleted() {
        toast.success('Recomendação removida com sucesso.')
        router.push('/tier-lists')
      },
    },
  )

  const assignedProductIds = React.useMemo(() => {
    const ids = new Set<string>()
    for (const tier of tiers) {
      for (const tp of tier.products) {
        ids.add(tp.product.id)
      }
    }
    return ids
  }, [tiers])

  function handleSave() {
    updateTierList({
      variables: {
        updateTierListInput: {
          id: tierList.id,
          tiers: tiers.map((tier, tierIndex) => ({
            id: tier.id.startsWith('new-') ? undefined : tier.id,
            name: tier.name,
            color: tier.color,
            priceLimit: tier.priceLimit ?? undefined,
            position: tierIndex,
            products: tier.products.map((tp, productIndex) => ({
              productId: tp.product.id,
              position: productIndex,
            })),
          })),
        },
      },
    })
  }

  function handleReorderProducts(
    tierId: string,
    reorderedProducts: TierWithProducts['products'],
  ) {
    setTiers((prev) =>
      prev.map((t) =>
        t.id === tierId ? { ...t, products: reorderedProducts } : t,
      ),
    )
  }

  function handleRemoveProduct(tierId: string, productId: string) {
    setTiers((prev) =>
      prev.map((t) =>
        t.id === tierId
          ? {
              ...t,
              products: t.products.filter((tp) => tp.product.id !== productId),
            }
          : t,
      ),
    )
  }

  function handleOpenDrawer(tierId: string) {
    setActiveTierId(tierId)
    setSheetOpen(true)
  }

  function handleAddProduct(product: TierListProduct) {
    if (!activeTierId) return
    setTiers((prev) =>
      prev.map((t) =>
        t.id === activeTierId
          ? {
              ...t,
              products: [
                ...t.products,
                {
                  id: `new-${Date.now()}-${product.id}`,
                  position: t.products.length,
                  productId: product.id,
                  product,
                },
              ],
            }
          : t,
      ),
    )
  }

  function handleOpenCreateDialog() {
    setEditingTier(null)
    setDialogOpen(true)
  }

  function handleOpenEditDialog(tier: TierWithProducts) {
    setEditingTier(tier)
    setDialogOpen(true)
  }

  function handleSaveTier(data: {
    name: string
    priceLimit: number | null
    color: string
  }) {
    if (editingTier) {
      setTiers((prev) =>
        prev.map((t) =>
          t.id === editingTier.id
            ? {
                ...t,
                name: data.name,
                priceLimit: data.priceLimit,
                color: data.color,
              }
            : t,
        ),
      )
    } else {
      const newTier: TierWithProducts = {
        id: `new-${Date.now()}`,
        name: data.name,
        priceLimit: data.priceLimit,
        color: data.color,
        position: tiers.length,
        products: [],
      }
      setTiers((prev) => [...prev, newTier])
    }
  }

  function handleDeleteTier(tierId: string) {
    setTiers((prev) => prev.filter((t) => t.id !== tierId))
  }

  const activeTier = tiers.find((t) => t.id === activeTierId)

  const totalProducts = tiers.reduce(
    (acc, tier) => acc + tier.products.length,
    0,
  )

  const tierColors = tiers.map((t) => t.color)
  const heroGradient =
    tierColors.length >= 2
      ? `linear-gradient(135deg, ${tierColors.map((c) => `${c}18`).join(', ')})`
      : tierColors.length === 1
        ? `${tierColors[0]}18`
        : undefined

  return (
    <main className="space-y-8">
      {/* Hero Header */}
      <header
        className="relative overflow-hidden border-b"
        style={{ background: heroGradient }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background" />
        <div className="relative px-4 pb-8 pt-16 sm:container md:pb-10 md:pt-20">
          <div className="flex flex-col gap-4">
            {/* Category + icon */}
            <div className="flex items-center gap-2">
              <div
                className="flex size-8 items-center justify-center rounded-lg"
                style={{
                  backgroundColor: `${tierColors[0] ?? 'hsl(var(--primary))'}20`,
                  color: tierColors[0] ?? 'hsl(var(--primary))',
                }}
              >
                <Crown className="size-4" />
              </div>
              <Badge
                variant="secondary"
                className="text-[11px] font-semibold uppercase tracking-wider"
              >
                {tierList.category.name}
              </Badge>
            </div>

            {/* Title */}
            <h1 className="text-balance text-3xl font-extrabold tracking-tight text-foreground md:text-4xl lg:text-5xl">
              {tierList.title}
            </h1>

            {/* Description */}
            {tierList.description && (
              <p className="max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground md:text-lg">
                {tierList.description}
              </p>
            )}

            {/* Stats row */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <div className="flex items-center gap-1.5 rounded-full bg-background/80 px-3 py-1.5 text-sm text-muted-foreground ring-1 ring-border backdrop-blur-sm">
                <Layers className="size-3.5" />
                <span className="font-medium">
                  {tiers.length} {tiers.length === 1 ? 'faixa' : 'faixas'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-background/80 px-3 py-1.5 text-sm text-muted-foreground ring-1 ring-border backdrop-blur-sm">
                <Package className="size-3.5" />
                <span className="font-medium">
                  {totalProducts} {totalProducts === 1 ? 'produto' : 'produtos'}
                </span>
              </div>
              {/* Tier color dots */}
              <div className="flex items-center gap-1 pl-1">
                {tiers.map((tier) => (
                  <div
                    key={tier.id}
                    className="size-2.5 rounded-full ring-1 ring-black/10"
                    style={{ backgroundColor: tier.color }}
                    title={tier.name}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Tiers */}
      <div className="px-4 py-10 sm:container">
        <div className="flex flex-col gap-5">
          {tiers.map((tier) => (
            <TierSection
              key={tier.id}
              tier={tier}
              editMode={editMode}
              onEditTier={() => handleOpenEditDialog(tier)}
              onDeleteTier={() => handleDeleteTier(tier.id)}
              onOpenDrawer={() => handleOpenDrawer(tier.id)}
              onRemoveProduct={(productId) =>
                handleRemoveProduct(tier.id, productId)
              }
              onReorderProducts={(products) =>
                handleReorderProducts(tier.id, products)
              }
              categorySlug={tierList.category.slug}
            />
          ))}
        </div>
      </div>

      {/* Floating Admin Toolbar */}
      {isAdmin && (
        <div className="fixed bottom-6 right-6 z-50">
          {editMode ? (
            <div className="flex items-center gap-2 rounded-full border bg-background/95 p-1.5 shadow-lg ring-1 ring-black/5 backdrop-blur-sm">
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenCreateDialog}
                className="gap-1.5 rounded-full border-dashed"
              >
                <Plus className="size-3.5" />
                Adicionar Tier
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
                className="gap-1.5 rounded-full"
              >
                <Save className="size-3.5" />
                {isSaving ? 'Salvando...' : 'Salvar'}
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={isDeleting}
                    className="size-8 rounded-full text-muted-foreground hover:text-destructive"
                    aria-label="Excluir recomendação"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Excluir &quot;{tierList.title}&quot;?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      Essa ação é irreversível. Todos os tiers e produtos
                      vinculados serão removidos.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() =>
                        removeTierList({ variables: { id: tierList.id } })
                      }
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Excluir
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setEditMode(false)}
                className="size-8 rounded-full"
                aria-label="Sair do modo de edição"
              >
                <X className="size-4" />
              </Button>
            </div>
          ) : (
            <Button
              size="icon"
              onClick={() => setEditMode(true)}
              className="size-12 rounded-full shadow-lg"
              aria-label="Editar tier list"
            >
              <Pencil className="size-5" />
            </Button>
          )}
        </div>
      )}

      {/* Product Picker Sheet */}
      <ProductPickerSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        targetTierName={activeTier?.name ?? ''}
        onAddProduct={handleAddProduct}
        assignedProductIds={assignedProductIds}
        categorySlug={tierList.category.slug}
        priceLimit={activeTier?.priceLimit ?? null}
      />

      {/* Tier Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="w-full space-y-4 overflow-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {editingTier ? 'Editar Tier' : 'Criar Tier'}
            </DialogTitle>
            <DialogDescription>
              {editingTier
                ? 'Atualize o nome, limite de preço e cor do tier.'
                : 'Adicione um novo tier para organizar produtos por faixa de preço.'}
            </DialogDescription>
          </DialogHeader>
          <TierForm
            key={editingTier?.id ?? 'new'}
            onSave={(data) => {
              handleSaveTier(data)
              setDialogOpen(false)
            }}
            editingTier={editingTier}
          />
        </DialogContent>
      </Dialog>
    </main>
  )
}
