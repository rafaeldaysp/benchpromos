'use client'

import { gql, useMutation } from '@apollo/client'
import { useEffect } from 'react'

const INCREMENT_PRODUCT_VIEWS = gql`
  mutation IncrementProductViews($productId: String!) {
    incrementProductViews(productId: $productId)
  }
`

export function ProductViewTracker({ productId }: { productId: string }) {
  const [incrementViews] = useMutation(INCREMENT_PRODUCT_VIEWS, {
    errorPolicy: 'ignore',
  })

  useEffect(() => {
    incrementViews({
      variables: {
        productId,
      },
    })
  }, [productId, incrementViews])

  return null
}
