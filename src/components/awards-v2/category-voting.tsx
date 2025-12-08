'use client'

import { Button } from '@/components/ui/button'
import { LaptopCard } from './laptop-card'
import type { AwardsCategory, AwardsCategoryOption, Product } from '@/types'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'

type CategoryWithOptions = AwardsCategory & {
  options: (AwardsCategoryOption & {
    product: Product
  })[]
}

interface CategoryVotingProps {
  category: CategoryWithOptions
  selectedOptionId: string | undefined
  onVote: (optionId: string) => void
  onNext: () => void
  onBack: () => void
  isFirstCategory: boolean
  isLastCategory: boolean
  isVoting?: boolean
}

export function CategoryVoting({
  category,
  selectedOptionId,
  onVote,
  onNext,
  onBack,
  isFirstCategory,
  isLastCategory,
  isVoting,
}: CategoryVotingProps) {
  const hasVoted = !!selectedOptionId

  return (
    <div className="pb-4 duration-500 animate-in fade-in slide-in-from-right-4">
      {/* Category header */}
      <div className="mb-8 text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-auxiliary/10 px-4 py-1.5 text-sm font-medium text-auxiliary">
          {category.icon && <span>{category.icon}</span>}
          <span>{category.shortTitle || category.title}</span>
        </div>
        <h2 className="mb-2 text-balance text-3xl font-bold tracking-tight">
          {category.title}
        </h2>
        {category.description && (
          <p className="mx-auto max-w-2xl text-muted-foreground">
            {category.description}
          </p>
        )}
      </div>

      {/* Laptop options */}
      <div className="mb-12 grid gap-4 md:grid-cols-3">
        {category.options?.map((option) => (
          <LaptopCard
            key={option.id}
            option={option}
            isSelected={selectedOptionId === option.id}
            onSelect={() => onVote(option.id)}
          />
        ))}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between border-t border-border pt-4">
        <Button
          variant="ghost"
          onClick={onBack}
          disabled={isFirstCategory}
          className="gap-2"
        >
          <ArrowLeft className="size-4" />
          Anterior
        </Button>

        <div className="text-sm text-muted-foreground">
          {hasVoted ? (
            <span className="flex items-center gap-1 text-auxiliary">
              <Check className="size-4" />
              Voto salvo
            </span>
          ) : (
            'Selecione um notebook para votar'
          )}
        </div>

        <Button
          onClick={onNext}
          disabled={!hasVoted || isVoting}
          className="gap-2"
        >
          {isLastCategory ? 'Revisar Votos' : 'Próxima Categoria'}
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </div>
  )
}
