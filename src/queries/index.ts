import { gql } from '@apollo/client'

import type { Cashback, Category, Coupon, Discount, Sale } from '@/types'

const SALE_CARD_FIELDS = gql`
  fragment PublicSaleCard on Sale {
    id
    title
    slug
    imageUrl
    url
    price
    installments
    totalInstallmentPrice
    caption
    review
    label
    tag
    coupon
    createdAt
    categoryId
    productSlug
    highlight
    sponsored
    expired
    category {
      name
      slug
    }
    cashback {
      provider
      value
      video
      affiliatedUrl
    }
    discounts {
      id
      discount
      label
      description
    }
    commentsCount
    reactions {
      id
      content
      userId
    }
    couponId
    retailerId
    cashbackId
    couponSchema {
      availability
      discount
      code
      description
    }
    retailer {
      name
    }
  }
`

export const GET_SALES = gql`
  query GetSales(
    $productSlug: ID
    $paginationInput: PaginationInput
    $showExpired: Boolean
    $categories: [String]
    $recentDays: Int
  ) {
    sales(
      productSlug: $productSlug
      paginationInput: $paginationInput
      showExpired: $showExpired
      categories: $categories
      recentDays: $recentDays
    ) {
      pages
      count
      list {
        ...PublicSaleCard
      }
    }
  }
  ${SALE_CARD_FIELDS}
`

export const GET_SALES_FEED = gql`
  query GetSalesFeed(
    $productSlug: ID
    $paginationInput: PaginationInput
    $showExpired: Boolean
    $categories: [String]
    $recentDays: Int
  ) {
    sales(
      productSlug: $productSlug
      paginationInput: $paginationInput
      showExpired: $showExpired
      categories: $categories
      recentDays: $recentDays
    ) {
      pages
      count
      list {
        ...PublicSaleCard
      }
    }
    salesCategoryRank(recentDays: $recentDays) {
      name
      slug
    }
  }
  ${SALE_CARD_FIELDS}
`

export type GetSalesQuery = {
  sales: {
    pages: number
    count: number
    list: (Sale & {
      category: Pick<Category, 'name' | 'slug'>
      commentsCount: number
      reactions: { content: string; userId: string }[]
      cashback?: Cashback
      couponSchema?: Coupon
      discounts: Discount[]
    })[]
  }
}

export type GetSalesFeedQuery = GetSalesQuery & {
  salesCategoryRank: Pick<Category, 'name' | 'slug'>[]
}

export const SEND_EMAIL = gql`
  query SendConfirmationLink($input: SendTokenToEmailInput!) {
    sendTokenToEmail(sendTokenToEmailInput: $input) {
      lastSent
      message
    }
  }
`
