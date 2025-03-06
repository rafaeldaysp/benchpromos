import { gql } from '@apollo/client'

import { Separator } from '@/components/ui/separator'
import { getClient } from '@/lib/apollo'
import type { Category, Filter } from '@/types'
import { ProductsMain } from './main'

const GET_FILTERS = gql`
  query GetFilters {
    filters {
      id
      name
      categoryId
      options {
        id
        value
      }
    }
  }
`

const GET_CATEGORIES = gql`
  query GetCategories {
    categories {
      id
      name
      slug
    }
  }
`

export default async function ProductsDashboardPage() {
  const { data } = await getClient().query<{
    filters: Filter[]
  }>({
    query: GET_FILTERS,
  })

  const filters = data.filters

  const { data: categoriesData } = await getClient().query<{
    categories: Category[]
  }>({
    query: GET_CATEGORIES,
  })

  const categories = categoriesData.categories

  console.log(categories)

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Produtos</h3>
        <p className="text-sm text-muted-foreground">
          Realize a criação, edição ou remoção de um produto.
        </p>
      </div>
      <Separator />
      <ProductsMain filters={filters} categories={categories} />
    </div>
  )
}
