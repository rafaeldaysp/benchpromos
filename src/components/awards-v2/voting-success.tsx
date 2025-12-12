'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Vote } from '@/app/(site)/awards/main'
import type {
  Awards,
  AwardsCategory,
  AwardsCategoryOption,
  Product,
} from '@/types'
import { PartyPopper, RotateCcw, Trophy, CheckCircle2 } from 'lucide-react'
import confetti from 'canvas-confetti'
import { useEffect } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { GiveawayBanner } from './giveaway-banner'

type EnhancedOption = AwardsCategoryOption & {
  product: Product
}

type EnhancedCategory = AwardsCategory & {
  options: EnhancedOption[]
}

type EnhancedAwards = Awards & {
  categories: EnhancedCategory[]
}

interface VotingSuccessProps {
  awards: EnhancedAwards
  votes: Vote[]
  onRestart: () => void
}

function UserVoteCard({
  category,
  option,
  index,
}: {
  category: EnhancedCategory
  option: EnhancedOption
  index: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 via-card to-transparent">
        <CardContent className="p-4">
          <div className="flex flex-col items-center gap-4 md:flex-row md:items-center">
            {/* Category Icon */}
            <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-2xl">
              {category.icon}
            </div>

            {/* Product Image */}
            <div className="relative h-32 w-48 shrink-0 overflow-hidden rounded-lg border border-border bg-muted md:h-20 md:w-28">
              <Image
                src={option.product.imageUrl || '/placeholder.svg'}
                alt={option.product.name}
                fill
                className="object-cover"
              />
            </div>

            {/* Vote Info */}
            <div className="min-w-0 flex-1 text-center md:text-left">
              <div className="mb-1 flex flex-wrap items-center justify-center gap-2 md:justify-start">
                <p className="break-words text-xs font-medium text-muted-foreground">
                  {category.title}
                </p>
                <Badge
                  variant="outline"
                  className="shrink-0 gap-1 border-primary text-xs text-primary"
                >
                  <CheckCircle2 className="size-3" />
                  Seu voto
                </Badge>
              </div>
              <h4 className="break-words font-semibold leading-tight">
                {option.title || option.product.name}
              </h4>
              <p className="break-words text-xs text-muted-foreground">
                {option.brand || option.product.name.split(' ')[0]}
              </p>
              {option.subtitle && (
                <p className="mt-1 break-words text-xs leading-relaxed text-muted-foreground">
                  {option.subtitle}
                </p>
              )}
            </div>

            {/* Check Icon */}
            <div className="shrink-0">
              <div className="flex size-10 items-center justify-center rounded-full bg-primary/10">
                <CheckCircle2 className="size-5 text-primary" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
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

  // Get user's voted options
  const userVotedOptions = votes
    .map((vote) => {
      const category = awards.categories.find((c) => c.id === vote.categoryId)
      const option = category?.options.find((o) => o.id === vote.optionId)
      return category && option ? { category, option } : null
    })
    .filter(
      (item): item is { category: EnhancedCategory; option: EnhancedOption } =>
        item !== null,
    )

  return (
    <div className="flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="">
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

      <div className="py-8">
        {/* Giveaway Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <GiveawayBanner hasVoted={true} />
        </motion.div>

        {/* Success Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 text-center"
        >
          <div className="mb-6 inline-flex size-24 items-center justify-center rounded-full bg-auxiliary/20">
            <PartyPopper className="size-12 text-auxiliary" />
          </div>
          <h1 className="mb-4 text-xl font-bold tracking-tight sm:text-4xl">
            Obrigado por Votar!
          </h1>
          <p className="text-muted-foreground sm:text-xl">
            Seus votos foram computados com sucesso para o Bench Awards{' '}
            {awards.year}
          </p>
        </motion.div>

        {/* User Votes Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <div className="mb-6 flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
              <Trophy className="size-5 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Seus Votos</h2>
              <p className="text-sm text-muted-foreground">
                Você votou em {userVotedOptions.length}{' '}
                {userVotedOptions.length === 1 ? 'categoria' : 'categorias'}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {userVotedOptions.map(({ category, option }, index) => (
              <UserVoteCard
                key={`${category.id}-${option.id}`}
                category={category}
                option={option}
                index={index}
              />
            ))}
          </div>
        </motion.div>

        {/* Action Buttons */}
        {/* <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex flex-col items-center justify-center gap-4 sm:flex-row"
        >
          <Button onClick={onRestart} className="gap-2">
            <RotateCcw className="size-4" />
            Votar Novamente (ADMIN)
          </Button>
        </motion.div> */}
      </div>
    </div>
  )
}
