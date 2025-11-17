import { type MetadataRoute } from 'next'

import { siteConfig } from '@/config/site'
import { gql } from '@apollo/client'
import { getClient } from '@/lib/apollo'

const GET_PRODUCTS_AND_CATEGORIES = gql`
  query GET_DATA(
    $getProductsInput: GetProductsInput
    $getBenchmarksInput: GetBenchmarksInput
  ) {
    productsList: products(getProductsInput: $getProductsInput) {
      products {
        slug
        category {
          slug
        }
      }
    }
    categories {
      slug
    }
    benchmarks(getBenchmarksInput: $getBenchmarksInput) {
      slug
    }
  }
`

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { data } = await getClient().query<{
    productsList: {
      products: {
        slug: string
        category: { slug: string }
      }[]
    }
    categories: { slug: string }[]
    benchmarks: { slug: string }[]
  }>({
    query: GET_PRODUCTS_AND_CATEGORIES,
    variables: {
      getProductsInput: {
        hasDeals: true,
      },
      getBenchmarksInput: {
        hasResults: true,
      },
    },
  })

  const products = data.productsList.products
  const categories = data.categories
  const benchmarks = data.benchmarks

  const productsUrls = products.map((product) => ({
    url: `${siteConfig.url}/${product.category.slug}/${product.slug}`,
    lastModified: new Date().toISOString(),
  }))

  const categoriesUrls = categories.map((category) => ({
    url: `${siteConfig.url}/${category.slug}`,
    lastModified: new Date().toISOString(),
  }))

  const benchmarksUrls = [
    ...benchmarks.map((benchmark) => ({
      url: `${siteConfig.url}/${benchmark.slug}`,
      lastModified: new Date().toISOString(),
    })),
    {
      url: `${siteConfig.url}/benchmarks`,
      lastModified: new Date().toISOString(),
    },
  ]

  return [...productsUrls, ...categoriesUrls, ...benchmarksUrls]
}
