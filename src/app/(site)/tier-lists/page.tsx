import { gql } from '@apollo/client'
import { Crown } from 'lucide-react'

import { getClient } from '@/lib/apollo'
import type { Category, TierList } from '@/types'
import { getCurrentUser } from '@/app/_actions/user'
import { TierListsMain } from './main'

const GET_TIER_LISTS = gql`
  query GetTierLists {
    tierLists {
      id
      title
      slug
      description
      categoryId
      createdAt
      updatedAt
      category {
        id
        name
        slug
      }
      tiers {
        id
        name
        color
        products {
          id
        }
      }
    }
  }
`

const GET_CATEGORIES = gql`
  query GetCategories {
    categories {
      id
      name
    }
  }
`

export default async function TierListsPage() {
  const [{ data }, { data: categoriesData }, user] = await Promise.all([
    getClient().query<{
      tierLists: (TierList & {
        category: Pick<Category, 'id' | 'name' | 'slug'>
        tiers: {
          id: string
          name: string
          color: string
          products: { id: string }[]
        }[]
      })[]
    }>({
      query: GET_TIER_LISTS,
    }),
    getClient().query<{
      categories: Pick<Category, 'id' | 'name'>[]
    }>({
      query: GET_CATEGORIES,
    }),
    getCurrentUser(),
  ])

  const isAdmin = user?.role === 'ADMIN'

  return (
    <div>
      {/* Hero Section */}
      <div className="relative overflow-hidden border-b bg-gradient-to-b from-primary/5 via-background to-background">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
        <div className="relative mx-auto px-4 py-16 sm:container md:py-24">
          <div className="flex flex-col items-center text-center">
            <div className="mb-6 flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20">
              <Crown className="size-8" />
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground md:text-5xl lg:text-6xl">
              Recomendações
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-muted-foreground md:text-xl">
              Produtos recomendados pela nossa equipe, organizados por categoria
              e faixa de preço
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-10 sm:container">
        <TierListsMain
          tierLists={data.tierLists}
          isAdmin={isAdmin}
          categories={categoriesData.categories}
        />
      </div>
    </div>
  )
}
