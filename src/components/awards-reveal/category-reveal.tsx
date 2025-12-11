'use client'

import { useState, useEffect } from 'react'
import { Fireworks } from '@/components/fireworks'
import { Trophy, Medal, Award } from 'lucide-react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import confetti from 'canvas-confetti'
import {
  type AwardsCategory,
  type AwardsCategoryOption,
  type Product,
} from '@/types'

type EnhancedOption = AwardsCategoryOption & {
  product: Product
}

type EnhancedCategory = AwardsCategory & {
  options: EnhancedOption[]
}

interface CategoryRevealProps {
  category: EnhancedCategory
  onRevealComplete: () => void
}

interface OptionWithResults extends EnhancedOption {
  percentage: number
  position: number
}

export function CategoryReveal({
  category,
  onRevealComplete,
}: CategoryRevealProps) {
  const [showFireworks, setShowFireworks] = useState(false)
  const [revealedPositions, setRevealedPositions] = useState<number[]>([])
  const [countdown, setCountdown] = useState<number | null>(null)
  const [isRevealing, setIsRevealing] = useState(false)

  // Calculate total votes and percentages
  const totalVotes = category.options.reduce(
    (sum, option) => sum + (option._count?.votes || 0),
    0,
  )

  // Sort options by votes and assign positions
  const sortedOptions = [...category.options]
    .sort((a, b) => (b._count?.votes || 0) - (a._count?.votes || 0))
    .map((option, index) => ({
      ...option,
      position: index + 1,
      percentage:
        totalVotes > 0 ? ((option._count?.votes || 0) / totalVotes) * 100 : 0,
    }))

  const optionsWithResults: OptionWithResults[] = sortedOptions

  // Countdown effect
  useEffect(() => {
    if (countdown !== null && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1)
      }, 1000)
      return () => clearTimeout(timer)
    } else if (countdown === 0) {
      setCountdown(null)
      setIsRevealing(false)
    }
  }, [countdown])

  const triggerConfetti = (position: number) => {
    if (position === 1) {
      // Winner - full fireworks
      setShowFireworks(true)
    } else {
      // Other positions - subtle confetti
      const particleCount = position === 2 ? 30 : 20
      confetti({
        particleCount,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#f59e0b', '#fbbf24', '#fcd34d'],
      })
    }
  }

  const handleRevealPosition = (position: number) => {
    setIsRevealing(true)
    setCountdown(3)

    setTimeout(() => {
      setRevealedPositions((prev) => [...prev, position])
      triggerConfetti(position)

      // Check if all revealed
      if (position === 1) {
        setTimeout(() => {
          onRevealComplete()
        }, 5000)
      }
    }, 3000)
  }

  const getPositionIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Trophy className="size-8 text-[#FFD700]" />
      case 2:
        return <Medal className="size-7 text-[#C0C0C0]" />
      case 3:
        return <Award className="size-6 text-[#CD7F32]" />
      default:
        return <Award className="size-5 text-muted-foreground" />
    }
  }

  const getNextPositionToReveal = () => {
    const totalOptions = optionsWithResults.length
    for (let i = totalOptions; i >= 1; i--) {
      if (!revealedPositions.includes(i)) {
        return i
      }
    }
    return null
  }

  const nextPosition = getNextPositionToReveal()
  const allRevealed = revealedPositions.includes(1)

  return (
    <div className="relative min-h-[600px]">
      {/* Fireworks */}
      {showFireworks && (
        <Fireworks duration={4000} onComplete={() => setShowFireworks(false)} />
      )}

      {/* Countdown Overlay */}
      {countdown !== null && countdown > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="relative">
            <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
            <div className="relative flex size-48 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-9xl font-bold text-primary-foreground shadow-2xl">
              {countdown}
            </div>
          </div>
        </div>
      )}

      {/* Category Header */}
      <div className="mb-8 text-center">
        <div className="mb-2 text-4xl">{category.icon || '🏆'}</div>
        <h2 className="text-3xl font-bold">{category.title}</h2>
        {category.description && (
          <p className="mt-2 text-muted-foreground">{category.description}</p>
        )}
      </div>

      {/* Control Buttons */}
      {!allRevealed && !isRevealing && nextPosition && (
        <div className="mb-8 flex justify-center gap-4">
          <Button
            onClick={() => handleRevealPosition(nextPosition)}
            size="lg"
            className={`gap-2 ${
              nextPosition === 1
                ? 'bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90'
                : ''
            }`}
            variant={nextPosition === 1 ? 'default' : 'outline'}
          >
            {nextPosition === 1 ? (
              <Trophy className="size-5" />
            ) : nextPosition === 2 ? (
              <Medal className="size-5" />
            ) : (
              <Award className="size-5" />
            )}
            Revelar {nextPosition === 1 ? 'Vencedor' : `${nextPosition}º Lugar`}
          </Button>
        </div>
      )}

      {/* Results Display */}
      <div className="space-y-8">
        {optionsWithResults.map((option) => {
          const isRevealed = revealedPositions.includes(option.position)
          const isWinner = option.position === 1

          if (!isRevealed) return null

          return (
            <div
              key={option.id}
              className="duration-1000 animate-in fade-in slide-in-from-bottom-4"
            >
              {isWinner ? (
                // Winner - Large Featured Card
                <div className="relative overflow-hidden rounded-3xl border-4 border-primary bg-gradient-to-br from-primary/10 via-background to-accent/10 p-8 shadow-2xl">
                  {/* Animated background */}
                  <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5" />

                  {/* Spotlight effect */}
                  <div className="absolute left-1/2 top-0 h-full w-96 -translate-x-1/2 bg-gradient-to-b from-yellow-500/20 to-transparent blur-3xl" />

                  <div className="relative z-10 mt-4">
                    {/* <div className="flex items-center justify-center gap-4">
                      <div className="flex items-center gap-2 rounded-full bg-gradient-to-r from-[#FFD700] to-[#FFA500] px-6 py-3 text-2xl font-bold text-black shadow-lg">
                        <Trophy className="size-8" />
                        VENCEDOR
                      </div>
                    </div> */}
                    <div className="flex flex-col items-center gap-12 md:flex-row ">
                      <div className="relative max-w-72">
                        <div className="flex justify-center">
                          <div className="relative animate-bounce">
                            <div className="text-6xl drop-shadow-2xl">👑</div>
                            <div className="absolute inset-0 animate-ping text-6xl opacity-30">
                              👑
                            </div>
                          </div>
                        </div>
                        <div className="absolute inset-0 animate-pulse rounded-2xl bg-gradient-to-r from-primary/30 to-accent/30 blur-2xl" />
                        <div className="relative overflow-hidden rounded-2xl border-4 border-primary bg-background/80 p-4">
                          <Image
                            src={option.product.imageUrl || '/placeholder.svg'}
                            alt={option.product.name}
                            width={600}
                            height={400}
                            className="h-auto w-full object-contain"
                          />
                        </div>
                      </div>

                      <div className="col-span-2 w-full space-y-4 text-center md:text-left">
                        <div>
                          {option.brand && (
                            <div className="text-sm font-medium text-primary">
                              {option.brand}
                            </div>
                          )}
                          <h3 className="text-balance text-4xl font-bold">
                            {option.title || option.product.name}
                          </h3>
                        </div>

                        {option.subtitle && (
                          <p className="text-lg text-muted-foreground">
                            {option.subtitle}
                          </p>
                        )}

                        <div className="flex items-center justify-center gap-4 md:justify-start">
                          <div className="relative">
                            <div className="absolute inset-0 animate-ping rounded-full bg-primary/50" />
                            <div className="relative flex size-32 items-center justify-center rounded-full bg-gradient-to-br from-[#FFD700] via-[#FFA500] to-[#FF8C00] text-4xl font-bold text-black shadow-2xl">
                              {option.percentage.toFixed(0)}%
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">
                              Total de Votos
                            </div>
                            <div className="text-3xl font-bold">
                              {option._count?.votes || 0}
                            </div>
                          </div>
                        </div>

                        {option.badge && (
                          <div className="inline-flex rounded-full border border-primary/50 bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
                            {option.badge}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Sparkles decoration - with proper z-index */}
                  <div className="absolute right-8 top-8 z-50 animate-pulse text-4xl drop-shadow-2xl">
                    ✨
                  </div>

                  <div className="absolute bottom-8 right-8 z-50 animate-pulse text-4xl drop-shadow-2xl delay-700">
                    💫
                  </div>
                </div>
              ) : (
                // Runner-ups - Compact Cards
                <div
                  className={`overflow-hidden rounded-2xl border-2 ${
                    option.position === 2
                      ? 'border-[#C0C0C0]'
                      : option.position === 3
                        ? 'border-[#CD7F32]'
                        : 'border-border'
                  } bg-card p-6 shadow-lg transition-transform hover:scale-[1.02]`}
                >
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-4">
                      <div
                        className={`flex size-20 items-center justify-center rounded-full ${
                          option.position === 2
                            ? 'bg-gradient-to-br from-[#C0C0C0]/20 to-[#A8A8A8]/20'
                            : option.position === 3
                              ? 'bg-gradient-to-br from-[#CD7F32]/20 to-[#B8860B]/20'
                              : 'bg-muted'
                        }`}
                      >
                        {getPositionIcon(option.position)}
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground">
                          {option.position}º Lugar
                        </div>
                        <div className="text-2xl font-bold">
                          {option.percentage.toFixed(0)}%
                        </div>
                      </div>
                    </div>

                    <div className="relative size-32 shrink-0 overflow-hidden rounded-lg border bg-background">
                      <Image
                        src={option.product.imageUrl || '/placeholder.svg'}
                        alt={option.product.name}
                        width={200}
                        height={150}
                        className="size-full object-contain p-2"
                      />
                    </div>

                    <div className="flex-1">
                      {option.brand && (
                        <div className="text-sm font-medium text-muted-foreground">
                          {option.brand}
                        </div>
                      )}
                      <h3 className="text-2xl font-bold">
                        {option.title || option.product.name}
                      </h3>
                      {option.subtitle && (
                        <p className="text-sm text-muted-foreground">
                          {option.subtitle}
                        </p>
                      )}
                      {option.badge && (
                        <div className="mt-2 inline-flex rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
                          {option.badge}
                        </div>
                      )}
                    </div>

                    <div className="shrink-0 text-right">
                      <div className="text-sm text-muted-foreground">Votos</div>
                      <div className="text-3xl font-bold">
                        {option._count?.votes || 0}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
