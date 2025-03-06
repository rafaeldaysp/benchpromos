'use client'

import * as React from 'react'
import { gql, useMutation } from '@apollo/client'

import { Category } from '@/components/awards/category'
import {
  type AwardsCategory,
  type AwardsCategoryOption,
  type Product,
  type AwardsCategoryOptionVote,
} from '@/types'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { LoginPopup } from '@/components/login-popup'

const TOGGLE_VOTE = gql`
  mutation ToggleAwardsVote($awardsCategoryOptionId: ID!) {
    toggleAwardsCategoryOptionVote(
      awardsCategoryOptionId: $awardsCategoryOptionId
    ) {
      awardsCategoryOptionId
    }
  }
`

type EnhancedAwardsCategory = AwardsCategory & {
  options: (AwardsCategoryOption & {
    product: Product
    votes: AwardsCategoryOptionVote[]
  })[]
}

interface AwardsMainProps {
  awardsCategories: EnhancedAwardsCategory[]
  userId?: string
  token?: string
}

export function AwardsMain({
  awardsCategories,
  userId,
  token,
}: AwardsMainProps) {
  const router = useRouter()
  const [openLoginPopup, setOpenLoginPopup] = React.useState(false)

  const [toggleVote, { loading: isVoting }] = useMutation(TOGGLE_VOTE, {
    onCompleted: () => {
      router.refresh()
    },
    onError: (error) => {
      toast.error(error.message)
    },
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    refetchQueries: ['GetPublicAwardsCategories'],
  })

  function handleToggleVote(optionId: string) {
    if (!userId) {
      setOpenLoginPopup(true)
      return
    }

    toggleVote({ variables: { awardsCategoryOptionId: optionId } })
  }

  const getWinner = (category: EnhancedAwardsCategory) => {
    const winningOption = category.options.reduce((prev, current) =>
      prev.votes.length > current.votes.length ? prev : current,
    )
    return winningOption.votes.length > 0 ? winningOption : null
  }
  return (
    <div className="space-y-8">
      <LoginPopup open={openLoginPopup} setOpen={setOpenLoginPopup} />
      {awardsCategories.map((category) => (
        <Category
          key={category.id}
          category={category}
          onVote={handleToggleVote}
          currentUserId={userId}
          getWinner={getWinner}
          isVoting={isVoting}
        />
      ))}
    </div>
  )
}
