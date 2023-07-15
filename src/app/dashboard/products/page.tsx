import { gql } from '@apollo/client'

import { Separator } from '@/components/ui/separator'
import { getClient } from '@/lib/apollo'
import { Category, Filter, Product } from '@/types'
import { removeNullValues } from '@/utils'
import { ProductsMain } from './main'

// gostaria de renomear productFilterOptions para filters e
// filterOptionId para optionId
const GET_PRODUCTS_AND_FILTERS = gql`
  query GetProductsAndFilters {
    products {
      id
      name
      imageUrl
      specs
      reviewUrl
      description
      referencePrice
      categoryId
      slug
      subcategoryId
      recommended
      category {
        name
      }
      productFilterOptions {
        filterOptionId
      }
    }
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

export default async function ProductsDashboardPage() {
  const response = await getClient().query<{
    products: (Product & {
      category: Pick<Category, 'name'>
      productFilterOptions: { filterOptionId: string }[]
    })[]
    filters: Filter[]
  }>({
    query: GET_PRODUCTS_AND_FILTERS,
  })

  const products = response.data.products.map((product) =>
    removeNullValues(product),
  )
  const filters = response.data.filters

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Produtos</h3>
        <p className="text-sm text-muted-foreground">
          Realize a criação, edição ou remoção de um produto.
        </p>
      </div>
      <Separator />
      <ProductsMain products={products} filters={filters} />
    </div>
  )
}
