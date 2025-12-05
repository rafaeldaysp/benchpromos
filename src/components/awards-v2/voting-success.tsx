'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { Vote } from '@/app/(site)/awards/main'
import type {
  Awards,
  AwardsCategory,
  AwardsCategoryOption,
  Product,
} from '@/types'
import { Check, PartyPopper, RotateCcw, Share2, Trophy } from 'lucide-react'
import confetti from 'canvas-confetti'
import { useEffect } from 'react'

type EnhancedAwards = Awards & {
  categories: (AwardsCategory & {
    options: (AwardsCategoryOption & {
      product: Product
    })[]
  })[]
}

interface VotingSuccessProps {
  awards: EnhancedAwards
  votes: Vote[]
  onRestart: () => void
}

export function VotingSuccess({
  awards,
  votes,
  onRestart,
}: VotingSuccessProps) {
  useEffect(() => {
    // Fire confetti on mount
    const duration = 3000
    const end = Date.now() + duration

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors: ['#f59e0b', '#fbbf24', '#fcd34d'],
      })
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors: ['#f59e0b', '#fbbf24', '#fcd34d'],
      })

      if (Date.now() < end) {
        requestAnimationFrame(frame)
      }
    }

    frame()
  }, [])

  const getVotedOption = (categoryId: string) => {
    const vote = votes.find((v) => v.categoryId === categoryId)
    if (!vote) return null

    const category = awards.categories.find((c) => c.id === categoryId)
    return category?.options.find((o) => o.id === vote.optionId)
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="mx-auto px-4 sm:container">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary">
                <Trophy className="size-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight">
                  Bench Awards
                </h1>
                <p className="font-mono text-xs text-muted-foreground">
                  {awards.year}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 items-center justify-center p-4">
        <div className="w-full max-w-2xl text-center duration-500 animate-in fade-in zoom-in-95">
          <div className="mb-8">
            <div className="mb-6 inline-flex size-24 items-center justify-center rounded-full bg-auxiliary/20">
              <PartyPopper className="size-12 text-auxiliary" />
            </div>
            <h1 className="mb-4 text-4xl font-bold tracking-tight">
              Obrigado por Votar!
            </h1>
            <p className="text-xl text-muted-foreground">
              Seus votos foram computados com sucesso para o Bench Awards{' '}
              {awards.year}
            </p>
          </div>

          {/* Summary card */}
          <Card className="mb-8 bg-muted/50 text-left">
            <CardContent className="p-6">
              <h3 className="mb-4 flex items-center gap-2 font-semibold">
                <Check className="size-5 text-primary" />
                Suas seleções:
              </h3>
              <div className="space-y-3">
                {awards.categories.map((category) => {
                  const votedOption = getVotedOption(category.id)
                  if (!votedOption) return null

                  return (
                    <div
                      key={category.id}
                      className="flex items-center gap-3 text-sm"
                    >
                      <span className="text-lg">{category.icon}</span>
                      <span className="text-muted-foreground">
                        {category.shortTitle || category.title}:
                      </span>
                      <span className="font-medium">
                        {votedOption.brand}{' '}
                        {votedOption.title || votedOption.product.name}
                      </span>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button onClick={onRestart} className="gap-2">
              <RotateCcw className="size-4" />
              Votar Novamente (ADMIN)
            </Button>
          </div>

          {/* <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button className="gap-2">
              <Share2 className="size-4" />
              Share Results
            </Button>
          </div> */}
        </div>
      </div>
    </div>
  )
}
