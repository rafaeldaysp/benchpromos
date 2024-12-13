import Image from 'next/image'
import { Button } from '@/components/ui/button'
import {
  type AwardsCategory,
  type AwardsCategoryOption,
  type Product,
  type AwardsCategoryOptionVote,
} from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Check } from 'lucide-react'

type EnhancedAwardsCategory = AwardsCategory & {
  options: (AwardsCategoryOption & {
    product: Product
    votes: AwardsCategoryOptionVote[]
  })[]
}

interface VoteOptionProps {
  option: EnhancedAwardsCategory['options'][0]
  isSelected: boolean
  onVote: () => void
}

export function VoteOption({ option, isSelected, onVote }: VoteOptionProps) {
  return (
    <Card
      className={`overflow-hidden transition-all duration-200 ${
        isSelected ? 'ring-2 ring-primary' : ''
      }`}
    >
      <CardHeader className="p-0 pt-2 ">
        <div className="flex w-full items-center justify-center">
          <div className="relative aspect-square w-[70%] max-w-xs">
            <Image
              src={option.product.imageUrl}
              alt={option.product.name}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              fill
              className="object-contain"
            />
          </div>
        </div>
        {isSelected && (
          <div className="absolute right-2 top-2 rounded-full bg-primary p-1 text-primary-foreground">
            <Check className="h-4 w-4" />
          </div>
        )}
      </CardHeader>
      <CardContent className="p-4">
        <CardTitle className="mb-2 text-lg">{option.product.name}</CardTitle>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">
            Votes: {option._count.votes}
          </span>
          <Button
            variant={isSelected ? 'secondary' : 'default'}
            size="sm"
            disabled={isSelected}
            onClick={onVote}
          >
            {isSelected ? 'Voted' : 'Vote'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
