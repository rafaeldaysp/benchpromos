'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { CategoryReveal } from './category-reveal'
import { Trophy, Sparkles } from 'lucide-react'
import {
  type Awards,
  type AwardsCategory,
  type AwardsCategoryOption,
  type Product,
} from '@/types'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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

interface RevealCeremonyProps {
  allAwards: EnhancedAwards[]
}

export function RevealCeremony({ allAwards }: RevealCeremonyProps) {
  const sortedAwards = [...allAwards].sort((a, b) => b.year - a.year)
  const [selectedAwardsId, setSelectedAwardsId] = useState<string>(
    sortedAwards[0]?.id || '',
  )
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(-1)
  const [revealPhase, setRevealPhase] = useState<
    'intro' | 'options' | 'revealing'
  >('intro')

  const selectedAwards = sortedAwards.find((a) => a.id === selectedAwardsId)
  const categories = selectedAwards?.categories || []
  const currentCategory =
    currentCategoryIndex >= 0 ? categories[currentCategoryIndex] : null

  // Load state from localStorage on mount
  useEffect(() => {
    if (!selectedAwardsId) return

    const storageKey = `awards-reveal-${selectedAwardsId}`
    const savedState = localStorage.getItem(storageKey)

    if (savedState) {
      try {
        const { categoryIndex, phase } = JSON.parse(savedState)
        setCurrentCategoryIndex(categoryIndex)
        setRevealPhase(phase)
      } catch (error) {
        console.error('Failed to parse saved reveal state:', error)
      }
    }
  }, [selectedAwardsId])

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (!selectedAwardsId) return

    const storageKey = `awards-reveal-${selectedAwardsId}`
    const stateToSave = {
      categoryIndex: currentCategoryIndex,
      phase: revealPhase,
    }

    localStorage.setItem(storageKey, JSON.stringify(stateToSave))
  }, [selectedAwardsId, currentCategoryIndex, revealPhase])

  const handleStartReveal = () => {
    if (categories.length > 0) {
      setCurrentCategoryIndex(0)
      setRevealPhase('intro')
    }
  }

  const handleNextCategory = () => {
    if (currentCategoryIndex < categories.length - 1) {
      const nextIndex = currentCategoryIndex + 1
      const nextCategory = categories[nextIndex]

      // Check if next category has revealed positions in localStorage
      const storageKey = `awards-reveal-${selectedAwardsId}-${nextCategory.id}`
      const savedPositions = localStorage.getItem(storageKey)

      setCurrentCategoryIndex(nextIndex)

      // Skip intro if category already has revealed positions
      if (savedPositions && JSON.parse(savedPositions).length > 0) {
        setRevealPhase('revealing')
      } else {
        setRevealPhase('intro')
      }
    }
  }

  const handlePreviousCategory = () => {
    if (currentCategoryIndex > 0) {
      setCurrentCategoryIndex(currentCategoryIndex - 1)
      setRevealPhase('revealing')
    }
  }

  const handleShowOptions = () => {
    setRevealPhase('options')
  }

  const handleStartCategoryReveal = () => {
    setRevealPhase('revealing')
  }

  const handleReset = () => {
    setCurrentCategoryIndex(-1)
    setRevealPhase('intro')

    // Clear localStorage for this awards
    if (selectedAwardsId) {
      const storageKey = `awards-reveal-${selectedAwardsId}`
      localStorage.removeItem(storageKey)

      // Clear all category-level storage for this awards
      categories.forEach((category) => {
        localStorage.removeItem(
          `awards-reveal-${selectedAwardsId}-${category.id}`,
        )
      })
    }
  }

  const allRevealed = currentCategoryIndex === categories.length - 1

  // Check if current category has any revealed positions
  const hasCurrentCategoryRevealed = () => {
    if (!currentCategory) return false
    const storageKey = `awards-reveal-${selectedAwardsId}-${currentCategory.id}`
    const savedPositions = localStorage.getItem(storageKey)
    if (!savedPositions) return false
    try {
      const positions = JSON.parse(savedPositions)
      return positions.length > 0
    } catch {
      return false
    }
  }

  if (!selectedAwards) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">
            Nenhum prêmio encontrado para revelação.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative flex flex-col bg-gradient-to-b from-background via-background to-background/80">
      {/* Header */}
      <div className="px-4 py-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary via-accent to-primary/80">
              <Trophy className="size-8 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-balance bg-gradient-to-r from-foreground via-foreground to-muted-foreground bg-clip-text text-3xl font-bold text-transparent md:text-4xl">
                Bench Awards {selectedAwards.year}
              </h1>
              <p className="text-sm text-muted-foreground">
                Cerimônia de Revelação • Admin Panel
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            {sortedAwards.length > 1 && (
              <Select
                value={selectedAwardsId}
                onValueChange={setSelectedAwardsId}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Ano" />
                </SelectTrigger>
                <SelectContent>
                  {sortedAwards.map((award) => (
                    <SelectItem key={award.id} value={award.id}>
                      {award.year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={currentCategoryIndex === -1}
            >
              Reiniciar
            </Button>
            {currentCategoryIndex === -1 && (
              <Button
                onClick={handleStartReveal}
                size="lg"
                className="gap-2 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
                disabled={categories.length === 0}
              >
                <Sparkles className="size-5" />
                Iniciar Revelação
              </Button>
            )}
          </div>
        </div>

        {/* Progress */}
        {currentCategoryIndex >= 0 && (
          <div className="mt-8 flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Progresso:</span>
            <div className="flex flex-1 gap-1">
              {categories.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 flex-1 rounded-full transition-all ${
                    index <= currentCategoryIndex
                      ? 'bg-gradient-to-r from-primary to-accent'
                      : 'bg-muted'
                  }`}
                />
              ))}
            </div>
            <span className="text-sm font-medium">
              {currentCategoryIndex + 1} / {categories.length}
            </span>
          </div>
        )}
      </div>

      {/* Reveal Area */}
      <div className="flex-1 px-4 py-8">
        {currentCategoryIndex === -1 ? (
          <div className="flex min-h-full items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-6 flex size-32 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-accent/20">
                <Trophy className="size-16 text-primary" />
              </div>
              <h2 className="mb-4 text-2xl font-bold">
                Pronto para Revelar os Vencedores?
              </h2>
              <p className="mb-8 text-muted-foreground">
                Clique no botão acima para iniciar a cerimônia de revelação dos
                resultados.
              </p>
              {categories.length === 0 && (
                <p className="text-sm text-destructive">
                  Nenhuma categoria encontrada para este prêmio.
                </p>
              )}
            </div>
          </div>
        ) : currentCategory ? (
          <div className="flex h-full flex-col">
            {/* Category Intro Phase */}
            {revealPhase === 'intro' && (
              <div className="flex h-full min-h-full items-center justify-center">
                <div className="max-w-2xl text-center">
                  <div className="mb-6 animate-bounce text-6xl">
                    {currentCategory.icon || '🏆'}
                  </div>
                  <h2 className="mb-4 text-4xl font-bold">
                    {currentCategory.title}
                  </h2>
                  {currentCategory.description && (
                    <p className="mb-8 text-xl text-muted-foreground">
                      {currentCategory.description}
                    </p>
                  )}
                  <Button
                    onClick={handleShowOptions}
                    size="lg"
                    className="gap-2 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
                  >
                    <Sparkles className="size-5" />
                    Ver Candidatos
                  </Button>
                </div>
              </div>
            )}

            {/* Show Options Phase */}
            {revealPhase === 'options' && (
              <div className="space-y-8">
                <div className="flex flex-col items-center justify-center">
                  <span className="flex items-center gap-2">
                    <div className="mb-4 text-4xl">
                      {currentCategory.icon || '🏆'}
                    </div>
                    <h2 className="mb-2 text-3xl font-bold">
                      {currentCategory.title}
                    </h2>
                  </span>
                  <p className="mb-8 text-muted-foreground">
                    Candidatos desta categoria
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {currentCategory.options.map((option, index) => (
                    <Card
                      key={option.id}
                      className="overflow-hidden animate-in fade-in slide-in-from-bottom-4"
                      style={{
                        animationDelay: `${index * 150}ms`,
                        animationFillMode: 'backwards',
                      }}
                    >
                      <CardHeader className="p-0 pt-2">
                        <div className="flex w-full items-center justify-center">
                          <div className="relative aspect-square w-[70%] max-w-xs">
                            <Image
                              src={
                                option.product.imageUrl || '/placeholder.svg'
                              }
                              alt={option.product.name}
                              fill
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                              className="object-contain"
                            />
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4">
                        <div className="mb-2">
                          {option.brand && (
                            <p className="text-xs font-medium text-muted-foreground">
                              {option.brand}
                            </p>
                          )}
                          <CardTitle className="text-lg">
                            {option.title || option.product.name}
                          </CardTitle>
                        </div>
                        {option.subtitle && (
                          <p className="mb-2 text-xs text-muted-foreground">
                            {option.subtitle}
                          </p>
                        )}
                        {option.badge && (
                          <div className="inline-flex rounded-full border border-primary/30 bg-primary/5 px-2 py-0.5 text-xs font-medium text-primary">
                            {option.badge}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="flex justify-center pt-4">
                  <Button
                    onClick={handleStartCategoryReveal}
                    size="lg"
                    className="gap-2 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
                  >
                    <Trophy className="size-5" />
                    Revelar Resultados
                  </Button>
                </div>
              </div>
            )}

            {/* Revealing Phase */}
            {revealPhase === 'revealing' && (
              <CategoryReveal
                category={currentCategory}
                awardsId={selectedAwardsId}
                onRevealComplete={() => {
                  if (!allRevealed) {
                    // Show next button after reveal complete
                  }
                }}
              />
            )}
            {/* Category Navigation Buttons */}
            {revealPhase === 'revealing' && (
              <div className="mt-8 flex justify-center gap-4 pb-8">
                <Button
                  onClick={handlePreviousCategory}
                  size="lg"
                  variant="outline"
                  disabled={currentCategoryIndex === 0}
                >
                  Categoria Anterior
                </Button>
                {!allRevealed && (
                  <Button
                    onClick={handleNextCategory}
                    size="lg"
                    className="gap-2 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
                    // disabled={!hasCurrentCategoryRevealed()}
                  >
                    <Sparkles className="size-5" />
                    Próxima Categoria
                  </Button>
                )}
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  )
}
