import Image from 'next/image'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { VoteOption } from '@/components/awards/vote-option'
import {
  type AwardsCategory,
  type AwardsCategoryOption,
  type Product,
  type AwardsCategoryOptionVote,
} from '@/types'

import dayjs from 'dayjs'
import 'dayjs/locale/pt-br'
import relativeTime from 'dayjs/plugin/relativeTime'
import { Icons } from '../icons'
import { Trophy } from 'lucide-react'

dayjs.extend(relativeTime)
dayjs.locale('pt-br')

type EnhancedAwardsCategory = AwardsCategory & {
  options: (AwardsCategoryOption & {
    product: Product
    votes: AwardsCategoryOptionVote[]
  })[]
}

interface CategoryProps {
  category: EnhancedAwardsCategory
  onVote: (optionId: string) => void
  currentUserId?: string
  getWinner: (
    category: EnhancedAwardsCategory,
  ) => EnhancedAwardsCategory['options'][0] | null
}

export function Category({
  category,
  onVote,
  currentUserId,
  getWinner,
}: CategoryProps) {
  const isExpired = new Date(category.expiredAt) <= new Date()

  const winner = getWinner(category)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">{category.title}</CardTitle>
        {category.description && <p className="text-sm text-muted-foreground">{category.description}</p>}
        {!isExpired && (
          <div className="text-sm font-medium text-auxiliary">
            Expira em: {dayjs(category.expiredAt).format('HH:mm')}
          </div>
        )}
      </CardHeader>
      <CardContent>
        {isExpired ? (
          winner ? (
            <Card className="bg-gradient-to-r from-yellow-100 to-yellow-200 dark:from-yellow-700 dark:to-yellow-800">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center text-xl">
                  <Trophy className="mr-2 h-6 w-6 text-yellow-500" />
                  Winner
                </CardTitle>
              </CardHeader>
              <CardContent className="flex items-center space-x-4">
                <Image
                  src={winner.product.imageUrl}
                  alt={winner.product.name}
                  width={100}
                  height={100}
                  className="rounded-md"
                />
                <div>
                  <h3 className="text-lg font-semibold">{winner.product.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Votes: {winner.votes.length}</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="text-xl font-bold text-center py-8">No votes were cast</div>
          )
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {category.options.map((option) => (
              <VoteOption
                key={option.id}
                option={option}
                isSelected={option.votes.some(vote => vote.userId === currentUserId)}
                onVote={() => onVote(option.id)}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
