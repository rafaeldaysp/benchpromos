import { gql } from '@apollo/client'
import { notFound } from 'next/navigation'

import { Products } from '@/components/products'
import { getClient } from '@/lib/apollo'
import type {
  Cashback,
  Category,
  Coupon,
  Deal,
  Filter,
  Product,
  Retailer,
} from '@/types'

const GET_PRODUCTS = gql`
  query GetProducts($input: GetProductsInput) {
    productsList: products(getProductsInput: $input) {
      pages
      _count {
        products
      }
      minPrice
      maxPrice
      products {
        id
        name
        imageUrl
        slug
        reviewUrl
        category {
          slug
        }
        deals {
          price
          totalInstallmentPrice
          installments
          availability
          retailer {
            name
          }
          coupon {
            code
            discount
            availability
          }
          cashback {
            value
            provider
          }
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
          id
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
  const { page, limit, subcategory, price, sort, search, ...filters } =
    searchParams

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

  const [min, max] = price?.split('-') ?? []

  const { data } = await getClient().query<{
    productsList: {
      pages: number
      _count: {
        products: number
      }
      minPrice: number
      maxPrice: number
      products: (Product & {
        category: Pick<Category, 'slug'>
        deals: (Pick<
          Deal,
          'price' | 'availability' | 'installments' | 'totalInstallmentPrice'
        > & { retailer: Pick<Retailer, 'name'> } & {
          coupon: Pick<Coupon, 'code' | 'discount' | 'availability'>
        } & { cashback: Pick<Cashback, 'value' | 'provider'> })[]
      })[]
    }
  }>({
    query: GET_PRODUCTS,
    variables: {
      input: {
        category,
        subcategory,
        search,
        hasDeals: true,
        pagination: {
          limit: limit ? Number(limit) : 20,
          page: page ? Number(page) : 1,
        },
        filters: filtersInput,
        priceRange: {
          min: Number(min),
          max: Number(max),
        },
        sortBy: sort ?? 'relevance',
      },
    },
    errorPolicy: 'ignore',
  })

  const products = data?.productsList.products
  const pageCount = data?.productsList.pages
  const productCount = data?.productsList._count.products
  const serverPriceRange = [
    data?.productsList.minPrice / 100,
    data?.productsList.maxPrice / 100,
  ] as [number, number]

  return (
    <div className="px-4 py-10 sm:container">
      <div>
        <Products
          products={products}
          pageCount={pageCount}
          productCount={productCount}
          categoryFilters={categoryFilters}
          filters={filtersInput}
          serverPriceRange={serverPriceRange}
          sort={sort}
          limit={limit}
        />
      </div>
    </div>
  )
}
