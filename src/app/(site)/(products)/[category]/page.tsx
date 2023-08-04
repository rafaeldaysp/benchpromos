import { gql } from '@apollo/client'

import { Products } from '@/components/products'
import { getClient } from '@/lib/apollo'
import type { Category, Product } from '@/types'

const GET_PRODUCTS = gql`
  query GetProductsWithMinPrice($input: GetProductsInput) {
    productsList: products(getProductsInput: $input) {
      pages
      _count {
        products
      }
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
    productsList: {
      pages: number
      products: (Product & { category: Pick<Category, 'slug'> })[]
    }
  }>({
    query: GET_PRODUCTS,
    variables: {
      input: {
        pagination: {
          limit: 1,
          page: page ? Number(page) : 1,
        },
        category,
        hasDeals: false,
      },
    },
  })
  const products = data.productsList.products
  const pageCount = data.productsList.pages

  return (
    <div className="px-4 py-10 sm:container">
      <div>
        <Products products={products} pageCount={pageCount} />
      </div>
    </div>
  )
}
