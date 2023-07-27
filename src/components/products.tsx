'use client'

import * as React from 'react'
import { type Category, type Product } from '@/types'
import { usePathname, useSearchParams } from 'next/navigation'

import { Pagination } from '@/components/pagination'
import { ProductCard } from '@/components/product-card'

interface ProductsProps {
  products: (Product & { category: Pick<Category, 'slug'> })[]
}

export function Products({ products }: ProductsProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const page = searchParams.get('page') ?? '1'

  console.log(page)

  const createQueryString = React.useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set(name, value)

      return params.toString()
    },
    [searchParams],
  )

  return (
    <div className="space-y-6">
      <div className="grid justify-center gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            className="max-w-xs"
          />
        ))}
      </div>
      {products.length && <Pagination page={1} pageCount={33} />}
    </div>
  )
}
