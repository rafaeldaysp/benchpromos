'use client'

import { motion } from 'framer-motion'
import { Clock, CheckCircle2, Calendar, Trophy } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type {
  Awards,
  AwardsCategory,
  AwardsCategoryOption,
  Product,
} from '@/types'
import type { Vote } from '@/app/(site)/awards/main'
import Image from 'next/image'

type EnhancedOption = AwardsCategoryOption & {
  product: Product
  _count: { votes: number }
}

type EnhancedCategory = AwardsCategory & {
  options: EnhancedOption[]
}

interface VotingClosedProps {
  awards: Awards & { categories: EnhancedCategory[] }
  votes: Vote[]
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
          <div className="flex items-center gap-4">
            {/* Category Icon */}
            <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-2xl">
              {category.icon}
            </div>

            {/* Product Image */}
            <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
              <Image
                src={option.product.imageUrl || '/placeholder.svg'}
                alt={option.product.name}
                fill
                className="object-cover"
              />
            </div>

            {/* Vote Info */}
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-center gap-2">
                <p className="text-xs font-medium text-muted-foreground">
                  {category.title}
                </p>
                <Badge
                  variant="outline"
                  className="gap-1 border-primary text-xs text-primary"
                >
                  <CheckCircle2 className="size-3" />
                  Seu voto
                </Badge>
              </div>
              <h4 className="truncate font-semibold">
                {option.title || option.product.name}
              </h4>
              <p className="text-xs text-muted-foreground">
                {option.brand || option.product.name.split(' ')[0]}
              </p>
              {option.subtitle && (
                <p className="mt-1 truncate text-xs text-muted-foreground">
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

export function VotingClosed({ awards, votes }: VotingClosedProps) {
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
    <div className="pb-12">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="mx-auto px-4 py-16 sm:container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            {/* Icon */}
            <motion.div
              className="mb-6 inline-flex size-20 items-center justify-center rounded-full bg-muted"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
            >
              <Clock className="size-10 text-muted-foreground" />
            </motion.div>

            {/* Title */}
            <h1 className="mb-3 text-4xl font-bold tracking-tight">
              Votação Encerrada
            </h1>

            {/* Description */}
            <p className="mb-6 text-lg text-muted-foreground">
              A votação para os prêmios de {awards.year} foi encerrada.
            </p>

            {/* Year Badge */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-4 py-2"
            >
              <Calendar className="size-4 text-muted-foreground" />
              <span className="font-mono text-sm font-medium">
                Bench Awards {awards.year}
              </span>
            </motion.div>
          </motion.div>
        </div>
      </div>

      <div className="mx-auto px-4 py-12 sm:container">
        {userVotedOptions.length > 0 ? (
          <>
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

            {/* Thank You Message */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-card to-primary/10">
                <CardContent className="py-8 text-center">
                  <CheckCircle2 className="mx-auto mb-3 size-12 text-primary" />
                  <h3 className="mb-2 text-xl font-bold">
                    Obrigado por participar!
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Seus votos foram registrados com sucesso. Aguarde a
                    divulgação dos resultados!
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </>
        ) : (
          <>
            {/* No Votes Message */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="border-dashed">
                <CardContent className="py-12 text-center">
                  <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-muted">
                    <Trophy className="size-8 text-muted-foreground" />
                  </div>
                  <h3 className="mb-2 text-xl font-bold">
                    Você não votou nesta edição
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    A votação foi encerrada. Fique atento para a próxima edição
                    do Bench Awards!
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </>
        )}

        {/* Results Coming Soon Section */}
        {!awards.showResults && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-8"
          >
            <Card className="overflow-hidden border-yellow-500/20 bg-gradient-to-br from-yellow-500/5 via-card to-amber-500/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="size-5 text-yellow-500" />
                  Resultados em Breve
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Os resultados oficiais do Bench Awards {awards.year} serão
                  divulgados em breve. Continue acompanhando!
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  )
}
