'use client'

import * as React from 'react'
import { gql } from '@apollo/client'
import { useSuspenseQuery } from '@apollo/experimental-nextjs-app-support/ssr'

import { Button } from '@/components/ui/button'
import { type Product } from '@/types'

const GET_PRODUCTS = gql`
  query GetProductsWithMinPrice {
    products: productsWithMinPrice {
      id
    }
  }
`

interface ProductsPageProps {
  params: {
    category: string
  }
}

export default function ProductsPage({ params }: ProductsPageProps) {
  const { category } = params

  const { data, fetchMore } = useSuspenseQuery<{ products: Product[] }>(
    GET_PRODUCTS,
  )
  const products = data.products

  async function fetchMoreProducts() {
    await fetchMore({
      updateQuery(previousQueryResult, { fetchMoreResult }) {
        const products = previousQueryResult.products
        const newProducts = fetchMoreResult.products
        return {
          products: [...products, ...newProducts],
        }
      },
    })
  }

  return (
    <div>
      <h1>{category}</h1>

      <div>
        {products.map((product, index) => (
          <p key={index}>
            {product.id} {index}
          </p>
        ))}

        <Button onClick={() => fetchMoreProducts()}>Fetch</Button>
      </div>
    </div>
  )
}
