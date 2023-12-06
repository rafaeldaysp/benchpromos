import { gql } from '@apollo/client'

import { Separator } from '@/components/ui/separator'
import { getClient } from '@/lib/apollo'
import type { Category, Filter } from '@/types'
import { CategoriesMain } from './main'

const GET_CATEGORIES = gql`
  query GetCategoriesWithSubcategoriesAndFilters {
    categories {
      id
      name
      subcategories {
        id
        name
      }
      filters {
        id
        name
        applyToBenchmarks
        options {
          id
          value
        }
      }
    }
  }
`

export default async function CategoriesDashboardPage() {
  const { data } = await getClient().query<{
    categories: (Category & { filters: Omit<Filter, 'categoryId'>[] })[]
  }>({
    query: GET_CATEGORIES,
  })

  const categories = data.categories

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Categorias</h3>
        <p className="text-sm text-muted-foreground">
          Realize a criação, edição ou remoção de uma categoria ou subcategoria.
        </p>
      </div>
      <Separator />
      <CategoriesMain categories={categories} />
    </div>
  )
}
