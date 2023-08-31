import { gql } from '@apollo/client'

import type { Category, Comment, Sale } from '@/types'

export const GET_SALES = gql`
  query GetSales($paginationInput: PaginationInput) {
    sales(paginationInput: $paginationInput) {
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
      cashback
      createdAt
      categoryId
      productSlug
      highlight
      category {
        name
        slug
      }
      comments {
        id
      }
      reactions {
        content
        users {
          id
        }
      }
    }
  }
`

export type GetSalesQuery = {
  sales: (Sale & {
    category: Pick<Category, 'name' | 'slug'>
    comments: Pick<Comment, 'id'>[]
    reactions: { content: string; users: { id: string }[] }[]
  })[]
}

export const SEND_EMAIL = gql`
  query SendConfirmationLink($input: SendTokenToEmailInput!) {
    sendTokenToEmail(sendTokenToEmailInput: $input) {
      lastSent
      message
    }
  }
`
