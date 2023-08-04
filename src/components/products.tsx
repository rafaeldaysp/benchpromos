'use client'

import { type Category, type Product } from '@/types'
import { useSearchParams } from 'next/navigation'

import { Pagination } from '@/components/pagination'
import { ProductCard } from '@/components/product-card'

interface ProductsProps {
  products: (Product & { category: Pick<Category, 'slug'> })[]
  pageCount: number
}

export function Products({ products, pageCount }: ProductsProps) {
  const searchParams = useSearchParams()

  const page = searchParams.get('page') ?? '1'

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
      {products.length && (
        <Pagination page={Number(page)} pageCount={pageCount} />
      )}
    </div>
  )
}
