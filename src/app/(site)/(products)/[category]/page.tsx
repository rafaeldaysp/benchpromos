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
  const [isPending, startTransition] = React.useTransition()
  const { category } = params

  const { data, fetchMore } = useSuspenseQuery<{ products: Product[] }>(
    GET_PRODUCTS,
  )
  const initialProducts = data.products
  const [products, setProducts] = React.useState<Product[]>(initialProducts)

  async function fetchMoreProducts() {
    startTransition(async () => {
      const { data } = await fetchMore({})

      if (data.products.length === 0) null

      setProducts([...products, ...data.products])
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
