import { gql } from '@apollo/client'

import { Separator } from '@/components/ui/separator'
import { getClient } from '@/lib/apollo'
import { Category, Product } from '@/types'
import { ProductsMain } from './main'

const GET_PRODUCTS = gql`
  query Products {
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
    }
  }
`

export default async function ProductsDashboardPage() {
  const response = await getClient().query<{
    products: (Product & { category: Pick<Category, 'name'> })[]
  }>({
    query: GET_PRODUCTS,
  })

  const products = response.data.products

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Produtos</h3>
        <p className="text-sm text-muted-foreground">
          Realize a criação, edição ou remoção de um produto.
        </p>
      </div>
      <Separator />
      <ProductsMain products={products} />
    </div>
  )
}
