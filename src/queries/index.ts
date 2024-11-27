import { gql } from '@apollo/client'

import type { Cashback, Category, Sale } from '@/types'

export const GET_SALES = gql`
  query GetSales(
    $productSlug: ID
    $paginationInput: PaginationInput
    $showExpired: Boolean
    $categories: [String]
  ) {
    sales(
      productSlug: $productSlug
      paginationInput: $paginationInput
      showExpired: $showExpired
      categories: $categories
    ) {
      pages
      count
      list {
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
        commentsCount
        reactions {
          id
          content
          userId
        }
        couponId
        retailerId
        cashbackId
      }
    }
  }
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
    })[]
  }
}

export const SEND_EMAIL = gql`
  query SendConfirmationLink($input: SendTokenToEmailInput!) {
    sendTokenToEmail(sendTokenToEmailInput: $input) {
      lastSent
      message
    }
  }
`
