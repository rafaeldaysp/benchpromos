import { gql } from '@apollo/client'

import type { Category, Sale } from '@/types'

export const GET_SALES = gql`
  query GetSales($productSlug: ID, $paginationInput: PaginationInput) {
    sales(productSlug: $productSlug, paginationInput: $paginationInput) {
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
          content
          users {
            id
          }
        }
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
      reactions: { content: string; users: { id: string }[] }[]
      cashback: {
        provider: string
        value: number
        affiliatedUrl: string
        video?: string
      }
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
