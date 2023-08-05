import { gql } from '@apollo/client'
import { notFound } from 'next/navigation'

import { Products } from '@/components/products'
import { getClient } from '@/lib/apollo'
import type { Category, Filter, Product } from '@/types'

const GET_PRODUCTS = gql`
  query GetProducts($input: GetProductsInput) {
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

const GET_CATEGORY = gql`
  query GetCategory($categoryId: ID!) {
    category(id: $categoryId) {
      filters {
        id
        name
        slug
        options {
          value
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
    [key: string]: string | undefined
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
  const { page, subcategory, ...filters } = searchParams

  const { data: categoryData } = await getClient().query<{
    category: {
      filters: Filter[]
    }
  }>({
    query: GET_CATEGORY,
    variables: {
      categoryId: category,
    },
    errorPolicy: 'all',
  })

  if (!categoryData) {
    return notFound()
  }

  const categoryFilters = categoryData.category.filters

  // const validFilterSlugs = categoryFilters.map((filter) => filter.slug)

  // for (const slug in filters) {
  //   if (!validFilterSlugs.includes(slug)) {
  //     delete filters[slug]
  //   }
  // }

  const filtersInput = Object.entries(filters)
    .filter(([, value]) => value)
    .map(([key, value]) => {
      return {
        slug: key,
        options: value!.split('.'),
      }
    })

  const { data } = await getClient().query<{
    productsList: {
      pages: number
      products: (Product & { category: Pick<Category, 'slug'> })[]
    }
  }>({
    query: GET_PRODUCTS,
    variables: {
      input: {
        category,
        hasDeals: false,
        pagination: {
          limit: 1,
          page: page ? Number(page) : 1,
        },
        // filters: filtersInput,
      },
    },
  })
  const products = data.productsList.products
  const pageCount = data.productsList.pages

  return (
    <div className="px-4 py-10 sm:container">
      <div>
        <Products
          products={products}
          pageCount={pageCount}
          categoryFilters={categoryFilters}
          filters={filtersInput}
        />
      </div>
    </div>
  )
}
