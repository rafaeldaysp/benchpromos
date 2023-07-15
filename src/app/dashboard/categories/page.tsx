import { gql } from '@apollo/client'

import { Separator } from '@/components/ui/separator'
import { getClient } from '@/lib/apollo'
import { Category, Filter } from '@/types'
import { CategoriesMain } from './main'

const GET_CATEGORIES = gql`
  query GetCategories {
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
        options {
          id
          value
        }
      }
    }
  }
`

export default async function CategoriesDashboardPage() {
  const response = await getClient().query<{
    categories: (Category & { filters: Omit<Filter, 'categoryId'>[] })[]
  }>({
    query: GET_CATEGORIES,
  })

  const categories = response.data.categories

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
