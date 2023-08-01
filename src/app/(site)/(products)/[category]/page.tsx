import { gql } from '@apollo/client'

import { Products } from '@/components/products'
import { getClient } from '@/lib/apollo'
import type { Category, Product } from '@/types'

const GET_PRODUCTS = gql`
  query GetProductsWithMinPrice($input: GetProductsInput) {
    products(getProductsInput: $input) {
      products {
        id
        name
        imageUrl
        slug
        category {
          slug
        }
      }
    }
  }
`

interface ProductsPageProps {
  params: {
    category: string
  }
  searchParams: {
    [key: string]: string | string[] | undefined
  }
}

export function generateMetadata({ params }: ProductsPageProps) {
  return {
    title: params.category,
    description: '',
  }
}

export default async function ProductsPage({
  params,
  searchParams,
}: ProductsPageProps) {
  const { category } = params
  const { page } = searchParams

  const { data } = await getClient().query<{
    products: {
      products: (Product & { category: Pick<Category, 'slug'> })[]
      pages: number
      _count: { products: number }
    }
  }>({
    query: GET_PRODUCTS,
  })
  const products = data.products.products

  console.log(category, page)

  return (
    <div className="px-4 py-10 sm:container">
      <div>
        <Products products={products} />
      </div>
    </div>
  )
}