import { cn } from '@/lib/utils'
import { Check, Trophy } from 'lucide-react'
import type { AwardsCategory } from '@/types'
import type { Vote } from '@/app/(site)/awards/main'

interface VotingProgressProps {
  currentStep: number
  totalSteps: number
  categories: AwardsCategory[]
  votes: Vote[]
}

export function VotingProgress({
  currentStep,
  totalSteps,
  categories,
  votes,
}: VotingProgressProps) {
  const isSummaryStep = currentStep === totalSteps

  return (
    <div className="mb-8">
      {/* Progress bar */}
      <div className="mb-6">
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

      {/* Step indicators */}
      <div className="flex items-center justify-between gap-2 py-2">
        {categories.map((category, index) => {
          const hasVoted = votes.some((v) => v.categoryId === category.id)
          const isCurrent = index === currentStep

          return (
            <div
              key={category.id}
              className={cn(
                'flex min-w-[80px] flex-col items-center gap-2',
                isCurrent && 'scale-105',
              )}
            >
              <div
                className={cn(
                  'flex size-10 items-center justify-center rounded-full border-2 transition-all duration-300',
                  hasVoted
                    ? 'border-primary bg-primary text-primary-foreground'
                    : isCurrent
                      ? 'border-primary bg-primary/20 text-primary'
                      : 'border-muted bg-muted/50 text-muted-foreground',
                )}
              >
                {hasVoted ? (
                  <Check className="size-5" />
                ) : (
                  <span className="text-sm font-semibold">{index + 1}</span>
                )}
              </div>
              <span
                className={cn(
                  'line-clamp-1 text-center text-xs font-medium transition-colors',
                  isCurrent ? 'text-foreground' : 'text-muted-foreground',
                )}
              >
                {category.shortTitle || category.title}
              </span>
            </div>
          )
        })}

        {/* Summary step indicator */}
        <div
          className={cn(
            'flex min-w-[80px] flex-col items-center gap-2',
            isSummaryStep && 'scale-105',
          )}
        >
          <div
            className={cn(
              'flex size-10 items-center justify-center rounded-full border-2 transition-all duration-300',
              votes.length === totalSteps
                ? 'border-primary bg-primary text-primary-foreground'
                : isSummaryStep
                  ? 'border-primary bg-primary/20 text-primary'
                  : 'border-muted bg-muted/50 text-muted-foreground',
            )}
          >
            <Trophy className="size-5" />
          </div>
          <span
            className={cn(
              'text-center text-xs font-medium transition-colors',
              isSummaryStep ? 'text-foreground' : 'text-muted-foreground',
            )}
          >
            Enviar
          </span>
        </div>
      </div>
    </div>
  )
}
