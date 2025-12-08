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
import { ArrowLeft, Send, Trophy, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import Image from 'next/image'

type EnhancedOption = AwardsCategoryOption & {
  product: Product
}

type EnhancedCategory = AwardsCategory & {
  options: EnhancedOption[]
}

type EnhancedAwards = Awards & {
  categories: EnhancedCategory[]
}

interface VotingSummaryProps {
  awards: EnhancedAwards
  votes: Vote[]
  onBack: () => void
  onSubmit: () => void
  isSubmitting?: boolean
}

function SummaryVoteCard({
  category,
  option,
  index,
}: {
  category: EnhancedCategory
  option: EnhancedOption | null
  index: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card
        className={cn(
          'overflow-hidden transition-all',
          option
            ? 'border-primary/20 bg-gradient-to-br from-primary/5 via-card to-transparent'
            : 'border-dashed bg-muted/30',
        )}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            {/* Category Icon */}
            <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-2xl">
              {category.icon}
            </div>

            {option ? (
              <>
                {/* Product Image */}
                <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-lg">
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
              </>
            ) : (
              <div className="min-w-0 flex-1">
                <p className="text-sm text-muted-foreground">
                  {category.title}
                </p>
                <p className="italic text-muted-foreground">Nenhum voto</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export function VotingSummary({
  awards,
  votes,
  onBack,
  onSubmit,
  isSubmitting,
}: VotingSummaryProps) {
  const allVotesComplete = votes.length === awards.categories.length

  const getVotedOption = (categoryId: string) => {
    const vote = votes.find((v) => v.categoryId === categoryId)
    if (!vote) return null

    const category = awards.categories.find((c) => c.id === categoryId)
    return category?.options.find((o) => o.id === vote.optionId)
  }

  return (
    <div className="pb-4 duration-500 animate-in fade-in slide-in-from-right-4">
      <div className="mb-8 text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-auxiliary/10 px-4 py-1.5 text-sm font-medium text-auxiliary">
          <Trophy className="size-4" />
          <span>Revisar e Enviar</span>
        </div>
        <h2 className="mb-2 text-3xl font-bold tracking-tight">
          Resumo de Votações
        </h2>
        <p className="mx-auto max-w-2xl text-muted-foreground">
          Revise suas seleções antes de enviar. Você pode voltar para alterar
          qualquer voto.
        </p>
      </div>

      <div className="mb-8 space-y-3">
        {awards.categories.map((category, index) => {
          const votedOption = getVotedOption(category.id)

          return (
            <SummaryVoteCard
              key={category.id}
              category={category}
              option={votedOption || null}
              index={index}
            />
          )
        })}
      </div>

      {/* Vote count */}
      <div className="mb-8 text-center">
        <p className="text-lg">
          <span className="font-bold text-primary">{votes.length}</span>
          <span className="text-muted-foreground"> de </span>
          <span className="font-bold">{awards.categories.length}</span>
          <span className="text-muted-foreground"> categorias votadas</span>
        </p>
      </div>

      {/* Navigation */}
      <div className="flex flex-col-reverse items-center justify-between gap-y-2 border-t border-border pt-4 sm:flex-row">
        <Button
          variant="ghost"
          onClick={onBack}
          className="gap-2 max-sm:w-full"
        >
          <ArrowLeft className="size-4" />
          Voltar para a votação
        </Button>

        <Button
          onClick={onSubmit}
          disabled={!allVotesComplete || isSubmitting}
          size="lg"
          className="gap-2 max-sm:w-full"
        >
          {isSubmitting ? (
            <>
              <div className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Enviando...
            </>
          ) : (
            <>
              <Send className="size-4" />
              Enviar
            </>
          )}
        </Button>
      </div>

      {!allVotesComplete && (
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Please vote in all categories before submitting
        </p>
      )}
    </div>
  )
}
