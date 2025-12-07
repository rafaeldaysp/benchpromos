'use client'

import { motion } from 'framer-motion'
import { Trophy, Crown, CheckCircle2, Sparkles, Star } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Vote } from '@/app/(site)/awards/main'
import type {
  Awards,
  AwardsCategory,
  AwardsCategoryOption,
  Product,
} from '@/types'
import { cn } from '@/lib/utils'
import Image from 'next/image'

type EnhancedOption = AwardsCategoryOption & {
  product: Product
  _count: { votes: number }
}

type EnhancedCategory = AwardsCategory & {
  options: EnhancedOption[]
}

interface VotingResultsProps {
  awards: Awards & { categories: EnhancedCategory[] }
  votes: Vote[]
}

function WinnerCard({
  option,
  percentage,
  isUserVote,
  categoryIndex,
}: {
  option: EnhancedOption
  percentage: number
  isUserVote: boolean
  categoryIndex: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        delay: categoryIndex * 0.15 + 0.2,
        duration: 0.5,
        ease: 'easeOut',
      }}
      className="relative"
    >
      {/* Glow effect behind winner */}
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-yellow-500/20 via-amber-500/30 to-yellow-500/20 blur-xl" />

      <Card
        className={cn(
          'relative overflow-hidden border-2 border-yellow-500/50 bg-gradient-to-br from-yellow-500/10 via-card to-amber-500/10',
          isUserVote &&
            'ring-2 ring-primary ring-offset-2 ring-offset-background',
        )}
      >
        {/* Sparkle decorations */}
        <div className="absolute right-4 top-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{
              duration: 20,
              repeat: Number.POSITIVE_INFINITY,
              ease: 'linear',
            }}
          >
            <Sparkles className="size-6 text-yellow-500/50" />
          </motion.div>
        </div>
        <div className="absolute bottom-4 left-4">
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
          >
            <Star className="size-4 fill-yellow-500/30 text-yellow-500/30" />
          </motion.div>
        </div>

        <CardContent className="p-6">
          <div className="flex flex-col items-center gap-6 md:flex-row">
            {/* Winner image with crown */}
            <div className="relative shrink-0">
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: categoryIndex * 0.15 + 0.4 }}
                className="absolute -top-4 left-1/2 z-10 -translate-x-1/2"
              >
                <Crown className="size-8 fill-yellow-500 text-yellow-500 drop-shadow-lg" />
              </motion.div>
              <div className="relative h-32 w-48 overflow-hidden rounded-xl border-2 border-yellow-500/30 bg-gradient-to-br from-yellow-500/5 to-amber-500/5">
                <Image
                  src={option.product.imageUrl || '/placeholder.svg'}
                  alt={option.product.name}
                  fill
                  className="object-cover"
                />
              </div>
              {/* Winner badge */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  delay: categoryIndex * 0.15 + 0.5,
                  type: 'spring',
                }}
                className="absolute -bottom-2 left-1/2 -translate-x-1/2"
              >
                <Badge className="bg-gradient-to-r from-yellow-500 to-amber-500 font-bold text-black shadow-lg">
                  <Trophy className="mr-1 size-3" />
                  VENCEDOR
                </Badge>
              </motion.div>
            </div>

            {/* Winner info */}
            <div className="flex-1 text-center md:text-left">
              <div className="mb-1 flex items-center justify-center gap-2 md:justify-start">
                <p className="text-sm font-medium text-muted-foreground">
                  {option.brand || option.product.name.split(' ')[0]}
                </p>
                {isUserVote && (
                  <Badge
                    variant="outline"
                    className="gap-1 border-primary text-xs text-primary"
                  >
                    <CheckCircle2 className="size-3" />
                    Seu voto
                  </Badge>
                )}
              </div>
              <h3 className="mb-1 text-2xl font-bold">
                {option.title || option.product.name}
              </h3>
              <p className="mb-3 text-sm text-muted-foreground">
                {option.subtitle || ''}
              </p>
              {option.badge && (
                <Badge variant="secondary" className="text-xs">
                  {option.badge}
                </Badge>
              )}
            </div>

            {/* Winner percentage */}
            <div className="shrink-0 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  delay: categoryIndex * 0.15 + 0.3,
                  type: 'spring',
                }}
                className="relative"
              >
                <div className="flex size-24 items-center justify-center rounded-full bg-gradient-to-br from-yellow-500 to-amber-600 shadow-lg shadow-yellow-500/30">
                  <div className="text-center">
                    <span className="text-3xl font-bold text-black">
                      {percentage}%
                    </span>
                  </div>
                </div>
              </motion.div>
              <p className="mt-2 text-xs text-muted-foreground">de votos</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-6 h-3 w-full overflow-hidden rounded-full bg-muted/50">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-yellow-500 to-amber-500"
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{
                delay: categoryIndex * 0.15 + 0.5,
                duration: 1,
                ease: 'easeOut',
              }}
            />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function RunnerUpCard({
  option,
  percentage,
  position,
  isUserVote,
  index,
}: {
  option: EnhancedOption
  percentage: number
  position: number
  isUserVote: boolean
  index: number
}) {
  const positionColors = {
    2: {
      bg: 'from-gray-400/10 to-gray-400/5',
      border: 'border-gray-400/30',
      bar: 'bg-gray-400',
      text: 'text-gray-400',
    },
    3: {
      bg: 'from-amber-700/10 to-amber-700/5',
      border: 'border-amber-700/30',
      bar: 'bg-amber-700',
      text: 'text-amber-700',
    },
  }
  const colors = positionColors[position as 2 | 3] || positionColors[3]

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 + 0.3 }}
    >
      <Card
        className={cn(
          'relative overflow-hidden bg-gradient-to-r transition-all',
          colors.bg,
          colors.border,
          isUserVote && 'ring-2 ring-primary',
        )}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            {/* Position badge */}
            <div
              className={cn(
                'flex size-10 shrink-0 items-center justify-center rounded-full text-lg font-bold',
                position === 2
                  ? 'bg-gray-400/20 text-gray-400'
                  : 'bg-amber-700/20 text-amber-700',
              )}
            >
              {position}
            </div>

            {/* Product image */}
            <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-muted/50">
              <Image
                src={option.product.imageUrl || '/placeholder.svg'}
                alt={option.product.name}
                fill
                className="object-cover"
              />
            </div>

            {/* Product info */}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-xs text-muted-foreground">
                  {option.brand || option.product.name.split(' ')[0]}
                </p>
                {isUserVote && (
                  <Badge
                    variant="outline"
                    className="gap-1 border-primary text-xs text-primary"
                  >
                    <CheckCircle2 className="size-3" />
                    Seu voto
                  </Badge>
                )}
              </div>
              <h4 className="truncate font-semibold">
                {option.title || option.product.name}
              </h4>
              <p className="truncate text-xs text-muted-foreground">
                {option.subtitle || ''}
              </p>
            </div>

            {/* Percentage */}
            <div className="shrink-0 text-right">
              <p className={cn('text-2xl font-bold', colors.text)}>
                {percentage}%
              </p>
              <p className="text-xs text-muted-foreground">de votos</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted/50">
            <motion.div
              className={cn('h-full rounded-full', colors.bar)}
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{
                delay: index * 0.1 + 0.5,
                duration: 0.8,
                ease: 'easeOut',
              }}
            />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export function VotingResults({ awards, votes }: VotingResultsProps) {
  // Calculate total votes across all categories
  const totalVotes = awards.categories.reduce(
    (sum, category) =>
      sum +
      category.options.reduce(
        (catSum, option) => catSum + option._count.votes,
        0,
      ),
    0,
  )

  return (
    <div className="min-h-screen pb-12">
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

      <div className="mx-auto px-4 py-8 sm:container">
        {/* Hero section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 text-center"
        >
          <motion.div
            className="mb-6 inline-flex size-20 items-center justify-center rounded-full bg-gradient-to-br from-yellow-500/20 to-amber-500/20"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
          >
            <Trophy className="size-10 text-yellow-500" />
          </motion.div>
          <h2 className="mb-3 bg-gradient-to-r from-yellow-500 via-amber-500 to-yellow-500 bg-clip-text text-4xl font-bold text-transparent">
            Resultado Final
          </h2>
          <p className="text-lg text-muted-foreground">
            Veja como a comunidade votou para os melhores notebooks do Bench
            Awards {awards.year}
          </p>
        </motion.div>

        {/* Results by category */}
        <div className="space-y-10">
          {awards.categories.map((category, categoryIndex) => {
            const userVote = votes.find(
              (v) => v.categoryId === category.id,
            )?.optionId

            // Calculate total votes in this category
            const categoryTotalVotes = category.options.reduce(
              (sum, option) => sum + option._count.votes,
              0,
            )

            // Sort options by vote count
            const sortedOptions = [...category.options].sort((a, b) => {
              return b._count.votes - a._count.votes
            })

            const winner = sortedOptions[0]
            const runnerUps = sortedOptions.slice(1)

            const calculatePercentage = (votes: number) => {
              if (categoryTotalVotes === 0) return 0
              return Math.round((votes / categoryTotalVotes) * 100)
            }

            return (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: categoryIndex * 0.15 }}
              >
                <Card className="overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-muted/50 to-transparent pb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{category.icon}</span>
                      <div>
                        <CardTitle className="text-2xl">
                          {category.title}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {category.description}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-6">
                    {/* Winner - Featured prominently */}
                    <WinnerCard
                      option={winner}
                      percentage={calculatePercentage(winner._count.votes)}
                      isUserVote={winner.id === userVote}
                      categoryIndex={categoryIndex}
                    />

                    {/* Runner ups */}
                    <div className="space-y-3 pt-2">
                      {runnerUps.map((option, index) => (
                        <RunnerUpCard
                          key={option.id}
                          option={option}
                          percentage={calculatePercentage(option._count.votes)}
                          position={index + 2}
                          isUserVote={option.id === userVote}
                          index={index}
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>

        {/* Footer stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="mt-12 text-center"
        >
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-card to-primary/5">
            <CardContent className="py-8">
              <div className="mb-3 flex items-center justify-center gap-2">
                <Sparkles className="size-5 text-primary" />
                <p className="text-sm font-medium text-muted-foreground">
                  Total de Votos Computados
                </p>
                <Sparkles className="size-5 text-primary" />
              </div>
              <motion.p
                className="bg-gradient-to-r from-primary to-yellow-500 bg-clip-text text-5xl font-bold text-transparent"
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                transition={{ delay: 1.4, type: 'spring' }}
              >
                {totalVotes.toLocaleString()}
              </motion.p>
              <p className="mt-3 text-sm text-muted-foreground">
                Obrigado por participar do Bench Awards {awards.year}!
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
