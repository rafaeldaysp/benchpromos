import { cn } from '@/lib/utils'
import { Check, Trophy, MoreHorizontal } from 'lucide-react'
import type { AwardsCategory } from '@/types'
import type { Vote } from '@/app/(site)/awards/main'

interface VotingProgressProps {
  currentStep: number
  totalSteps: number
  categories: AwardsCategory[]
  votes: Vote[]
}

function getVisibleSteps(
  currentStep: number,
  totalSteps: number,
): (number | 'ellipsis-start' | 'ellipsis-end')[] {
  const total = totalSteps + 1 // Include summary step
  const maxVisible = 5 // Max number of step pills to show (excluding ellipsis)

  if (total <= maxVisible + 2) {
    // Show all if small enough
    return Array.from({ length: total }, (_, i) => i)
  }

  const steps: (number | 'ellipsis-start' | 'ellipsis-end')[] = []

  // Always show first
  steps.push(0)

  // Calculate range around current step
  const rangeStart = Math.max(1, currentStep - 1)
  const rangeEnd = Math.min(total - 2, currentStep + 1)

  // Add ellipsis if gap between first and range start
  if (rangeStart > 1) {
    steps.push('ellipsis-start')
  }

  // Add range around current
  for (let i = rangeStart; i <= rangeEnd; i++) {
    steps.push(i)
  }

  // Add ellipsis if gap between range end and last
  if (rangeEnd < total - 2) {
    steps.push('ellipsis-end')
  }

  // Always show last (summary)
  steps.push(total - 1)

  return steps
}

export function VotingProgress({
  currentStep,
  totalSteps,
  categories,
  votes,
}: VotingProgressProps) {
  const isSummaryStep = currentStep === totalSteps
  const visibleSteps = getVisibleSteps(currentStep, totalSteps)

  const renderStep = (index: number, isFirst: boolean) => {
    const isCategory = index < totalSteps
    const isCurrent = index === currentStep
    const hasVoted = isCategory
      ? votes.some((v) => v.categoryId === categories[index]?.id)
      : votes.length === totalSteps

    return (
      <div
        key={index}
        className={cn(
          'flex items-center gap-2 transition-all duration-300',
          !isFirst &&
            "before:h-0.5 before:w-6 before:rounded-full before:bg-muted before:content-[''] before:lg:w-8",
          !isFirst &&
            (index <= currentStep || hasVoted) &&
            'before:bg-primary/50',
        )}
      >
        <div
          className={cn(
            'flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-1.5 transition-all duration-300 lg:px-3',
            hasVoted && !isCurrent
              ? 'border-primary bg-primary/20 text-primary'
              : isCurrent
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-muted bg-muted/30 text-muted-foreground',
          )}
        >
          <div
            className={cn(
              'flex size-5 items-center justify-center rounded-full text-xs font-semibold lg:size-6',
              hasVoted && !isCurrent
                ? 'bg-primary text-primary-foreground'
                : isCurrent
                  ? 'bg-primary-foreground text-primary'
                  : 'bg-muted text-muted-foreground',
            )}
          >
            {hasVoted && !isCurrent ? (
              <Check className="size-3" />
            ) : isCategory ? (
              index + 1
            ) : (
              <Trophy className="size-3" />
            )}
          </div>
          <span className="whitespace-nowrap text-xs font-medium lg:text-sm">
            {isCategory
              ? categories[index]?.shortTitle || categories[index]?.title
              : 'Enviar'}
          </span>
        </div>
      </div>
    )
  }

  const renderEllipsis = (key: string, isFirst: boolean) => (
    <div
      key={key}
      className={cn(
        'flex items-center gap-2',
        !isFirst &&
          "before:h-0.5 before:w-6 before:rounded-full before:bg-muted before:content-[''] before:lg:w-8",
      )}
    >
      <div className="flex size-8 items-center justify-center text-muted-foreground">
        <MoreHorizontal className="size-4" />
      </div>
    </div>
  )

  return (
    <div className="mb-8">
      {/* Progress bar */}
      <div className="mb-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">
            {isSummaryStep
              ? 'Revisar e Enviar'
              : `Categoria ${currentStep + 1} de ${totalSteps}`}
          </span>
          <span className="font-mono text-sm text-primary">
            {Math.round((votes.length / totalSteps) * 100)}% Completo
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${(votes.length / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* Mobile: Compact pill indicator */}
      <div className="flex items-center justify-center gap-1.5 py-2 md:hidden">
        <div className="flex items-center gap-1.5">
          {categories.map((category, index) => {
            const hasVoted = votes.some((v) => v.categoryId === category.id)
            const isCurrent = index === currentStep

            return (
              <div
                key={category.id}
                className={cn(
                  'h-2 rounded-full transition-all duration-300',
                  isCurrent
                    ? 'w-8 bg-primary'
                    : hasVoted
                      ? 'w-2 bg-primary'
                      : 'w-2 bg-muted',
                )}
              />
            )
          })}
          {/* Summary dot */}
          <div
            className={cn(
              'h-2 rounded-full transition-all duration-300',
              isSummaryStep
                ? 'w-8 bg-primary'
                : votes.length === totalSteps
                  ? 'w-2 bg-primary'
                  : 'w-2 bg-muted',
            )}
          />
        </div>
      </div>

      {/* Mobile: Current category name */}
      <div className="flex items-center justify-center md:hidden">
        <span className="text-sm font-medium text-foreground">
          {isSummaryStep ? 'Revisar e Enviar' : categories[currentStep]?.title}
        </span>
      </div>

      {/* Desktop: Pagination-style step indicators */}
      <div className="hidden md:block">
        <div className="flex items-center justify-center gap-0 py-2">
          {visibleSteps.map((step, idx) => {
            const isFirst = idx === 0

            if (step === 'ellipsis-start' || step === 'ellipsis-end') {
              return renderEllipsis(step, isFirst)
            }

            return renderStep(step, isFirst)
          })}
        </div>
      </div>
    </div>
  )
}
