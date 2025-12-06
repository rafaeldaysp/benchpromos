'use client'

import { useState } from 'react'
import { gql, useMutation } from '@apollo/client'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { VotingProgress } from '@/components/awards-v2/voting-progress'
import { CategoryVoting } from '@/components/awards-v2/category-voting'
import { VotingSummary } from '@/components/awards-v2/voting-summary'
import { VotingSuccess } from '@/components/awards-v2/voting-success'
import { VotingHeader } from '@/components/awards-v2/voting-header'
import { VotingResults } from '@/components/awards-v2/voting-results'
import { VotingClosed } from '@/components/awards-v2/voting-closed'
import {
  type Awards,
  type AwardsCategory,
  type AwardsCategoryOption,
  type AwardsCategoryOptionVote,
  type Product,
} from '@/types'
import { LoginPopup } from '@/components/login-popup'

const VOTE_ON_AWARDS_CATEGORIES = gql`
  mutation VoteOnAwardsCategories($votes: [VoteOnAwardsCategoryInput!]!) {
    voteOnAwardsCategories(votes: $votes) {
      votes {
        id
        userId
        awardsCategoryOptionId
      }
    }
  }
`

export type Vote = {
  categoryId: string
  optionId: string
}

type EnhancedAwards = Awards & {
  categories: (AwardsCategory & {
    options: (AwardsCategoryOption & {
      product: Product
      _count: { votes: number }
    })[]
  })[]
}

interface BenchAwardsProps {
  awards: EnhancedAwards
  myVotes: (AwardsCategoryOptionVote & {
    awardsCategoryOption: AwardsCategoryOption
  })[]
  token?: string
}

export function BenchAwards({ awards, myVotes, token }: BenchAwardsProps) {
  const router = useRouter()

  // Initialize votes from existing user votes
  const initialVotes: Vote[] = awards.categories
    .map((category) => {
      const userVote = category.options?.find((option) =>
        myVotes.some((vote) => option.id === vote.awardsCategoryOptionId),
      )
      return userVote
        ? { categoryId: category.id, optionId: userVote.id }
        : null
    })
    .filter((vote): vote is Vote => vote !== null)

  const [currentStep, setCurrentStep] = useState(0)
  const [votes, setVotes] = useState<Vote[]>(initialVotes)
  const [isSubmitted, setIsSubmitted] = useState(myVotes.length > 0)
  const [openLoginPopup, setOpenLoginPopup] = useState(false)

  const [submitVotes, { loading: isSubmitting }] = useMutation(
    VOTE_ON_AWARDS_CATEGORIES,
    {
      onError(error) {
        toast.error(error.message)
      },
      onCompleted() {
        setIsSubmitted(true)
        toast.success('Votos enviados com sucesso!')
        router.refresh()
      },
      context: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      refetchQueries: ['GetMyAwardsVotes'],
    },
  )

  const totalCategories = awards.categories.length
  const isLastCategory = currentStep === totalCategories - 1
  const isSummaryStep = currentStep === totalCategories
  const currentCategory = awards.categories[currentStep]

  const handleVote = (categoryId: string, optionId: string) => {
    // Check if user is logged in
    if (!token) {
      setOpenLoginPopup(true)
      return
    }

    // Update local state only - no API call yet
    setVotes((prev) => {
      const existingVoteIndex = prev.findIndex(
        (v) => v.categoryId === categoryId,
      )
      if (existingVoteIndex >= 0) {
        const newVotes = [...prev]
        newVotes[existingVoteIndex] = { categoryId, optionId }
        return newVotes
      }
      return [...prev, { categoryId, optionId }]
    })
  }

  const getCurrentVote = (categoryId: string) => {
    return votes.find((v) => v.categoryId === categoryId)?.optionId
  }

  const handleNext = () => {
    if (currentStep < totalCategories) {
      setCurrentStep((prev) => prev + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1)
    }
  }

  const handleSubmit = async () => {
    if (!token) {
      toast.error('Você precisa estar logado para enviar seus votos')
      return
    }

    if (votes.length === 0) {
      toast.error('Você precisa votar em pelo menos uma categoria')
      return
    }

    // Submit all votes at once
    await submitVotes({
      variables: {
        votes: votes.map((vote) => ({
          awardsCategoryOptionId: vote.optionId,
        })),
      },
    })
  }

  const handleRestart = () => {
    setCurrentStep(0)
    setIsSubmitted(false)
  }

  // Show results if showResults is true
  if (awards.showResults) {
    return <VotingResults awards={awards} votes={votes} />
  }

  // Check if awards is active
  if (!awards.isActive) {
    return <VotingClosed awards={awards} votes={votes} />
  }

  if (isSubmitted) {
    return (
      <VotingSuccess awards={awards} votes={votes} onRestart={handleRestart} />
    )
  }

  return (
    <main className="space-y-8">
      {openLoginPopup && (
        <LoginPopup open={openLoginPopup} setOpen={setOpenLoginPopup} />
      )}

      <VotingHeader year={awards.year} />
      <div className="relative mx-auto space-y-8 sm:container">
        <VotingProgress
          currentStep={currentStep}
          totalSteps={totalCategories}
          categories={awards.categories}
          votes={votes}
        />

        {isSummaryStep ? (
          <VotingSummary
            awards={awards}
            votes={votes}
            onBack={handleBack}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        ) : (
          <CategoryVoting
            category={currentCategory}
            selectedOptionId={getCurrentVote(currentCategory.id)}
            onVote={(optionId) => handleVote(currentCategory.id, optionId)}
            onNext={handleNext}
            onBack={handleBack}
            isFirstCategory={currentStep === 0}
            isLastCategory={isLastCategory}
          />
        )}
      </div>
    </main>
  )
}
