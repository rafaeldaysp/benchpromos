import { gql } from '@apollo/client'

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
export const SEND_EMAIL = gql`
  query SendConfirmationLink($input: SendTokenToEmailInput!) {
    sendTokenToEmail(sendTokenToEmailInput: $input) {
      lastSent
      message
    }
  }
`
