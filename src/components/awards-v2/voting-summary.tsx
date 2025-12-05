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
import { ArrowLeft, Check, Send, Trophy } from 'lucide-react'
import { cn } from '@/lib/utils'

type EnhancedAwards = Awards & {
  categories: (AwardsCategory & {
    options: (AwardsCategoryOption & {
      product: Product
    })[]
  })[]
}

interface VotingSummaryProps {
  awards: EnhancedAwards
  votes: Vote[]
  onBack: () => void
  onSubmit: () => void
  isSubmitting?: boolean
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
    <div className="duration-500 animate-in fade-in slide-in-from-right-4">
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

      <div className="mb-8 grid gap-4">
        {awards.categories.map((category) => {
          const votedOption = getVotedOption(category.id)

          return (
            <Card
              key={category.id}
              className={cn(
                'transition-all',
                votedOption ? 'bg-muted/50' : 'border-dashed bg-muted/30',
              )}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-2xl">
                    {category.icon}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-muted-foreground">
                      {category.title}
                    </p>
                    {votedOption ? (
                      <div className="flex items-center gap-3">
                        <p className="truncate font-semibold">
                          {votedOption.brand}{' '}
                          {votedOption.title || votedOption.product.name}
                        </p>
                      </div>
                    ) : (
                      <p className="italic text-muted-foreground">
                        No vote selected
                      </p>
                    )}
                  </div>

                  <div
                    className={cn(
                      'flex size-8 shrink-0 items-center justify-center rounded-full',
                      votedOption
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground',
                    )}
                  >
                    {votedOption ? (
                      <Check className="size-4" />
                    ) : (
                      <span className="text-xs">—</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
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
      <div className="flex items-center justify-between border-t border-border pt-4">
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ArrowLeft className="size-4" />
          Voltar para a votação
        </Button>

        <Button
          onClick={onSubmit}
          disabled={!allVotesComplete || isSubmitting}
          size="lg"
          className="gap-2"
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
