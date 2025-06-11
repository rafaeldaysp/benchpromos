'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { type Giveaway } from '@/types'
import { gql, useQuery } from '@apollo/client'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Eye, EyeOff, Gift, Mail, Trophy } from 'lucide-react'
import { type User } from 'next-auth'
import { Button } from '../ui/button'
import { ScrollArea } from '../ui/scroll-area'
import { Separator } from '../ui/separator'
import { useState } from 'react'

const GET_USER_DETAILS = gql`
  query GetUserDetails($getUserId: String!) {
    user: getUser(id: $getUserId) {
      id
      name
      email
      image
      role
      giveaways {
        id
        name
        description
        drawAt
        status
        participantsCount
        winnerId
        winner {
          id
          name
          email
          image
        }
      }
      wonGiveaways {
        id
        name
        description
        drawAt
        status
        participantsCount
        winner {
          id
          name
          email
          image
        }
      }
    }
  }
`

interface UserDetailsDialogProps {
  userId: string
}

export function UserDetailsDialog({ userId }: UserDetailsDialogProps) {
  const { data, loading } = useQuery<{
    user: User & {
      createdAt: string
      giveaways: Giveaway[]
      wonGiveaways: Giveaway[]
    }
  }>(GET_USER_DETAILS, {
    variables: {
      getUserId: userId,
    },
  })

  const [showEmail, setShowEmail] = useState(false)

  if (loading) return <div>Loading...</div>

  if (!data?.user) return <div>User not found</div>

  console.log('data', data)

  const user = data?.user

  const subscribedPrizes = data?.user.giveaways
  const wonPrizes = data?.user.wonGiveaways

  return (
    <div className="py-4">
      <div className="mb-6 flex items-center gap-4">
        <Avatar>
          <AvatarImage src={user.image ?? ''} alt="Avatar" />
          <AvatarFallback>{user?.name?.charAt(0)}</AvatarFallback>
        </Avatar>
        <div>
          <h3 className="text-xl font-bold">{user.name}</h3>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mail className="mr-1 size-3" />
            {showEmail ? user.email : user.email?.replace(/./g, '*')}
            <div>
              {showEmail ? (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowEmail(!showEmail)}
                >
                  <EyeOff className="size-3" />
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowEmail(!showEmail)}
                >
                  <Eye className="size-3" />
                </Button>
              )}
            </div>
          </div>
          <div className="mt-1 flex items-center gap-2">
            {wonPrizes.length > 0 && (
              <Badge variant="auxiliary">
                <Trophy className="mr-1 size-3" /> Ganhador de{' '}
                {wonPrizes.length} prêmios
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* <div className="space-y-2">
          <h4 className="text-sm font-semibold text-muted-foreground">
            Localização
          </h4>
          <p>{user.location}</p>
        </div>
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-muted-foreground">
            Telefone
          </h4>
          <p>{user.phone}</p>
        </div> */}

        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-muted-foreground">
            Inscrito em
          </h4>
          <p>
            {subscribedPrizes.length} prêmio
            {subscribedPrizes.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <Separator className="my-4" />

      <div className="space-y-4">
        <h4 className="font-medium">Participação em prêmios</h4>

        {subscribedPrizes.length > 0 ? (
          <ScrollArea className="h-[300px]">
            <div className="space-y-2">
              {subscribedPrizes.map((prize) => {
                const isWinner = prize.winnerId === userId

                return (
                  <div
                    key={prize.id}
                    className={`rounded-lg border p-3 ${
                      isWinner ? 'border-success/20 bg-success/10' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className={`rounded-full p-1.5 ${
                            isWinner ? 'bg-auxiliary/10' : 'bg-primary/10'
                          }`}
                        >
                          {isWinner ? (
                            <Trophy className="size-4 text-auxiliary" />
                          ) : (
                            <Gift className="size-4 text-primary" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium">{prize.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {format(
                              parseISO(prize.drawAt),
                              "d 'de' MMMM 'de' yyyy",
                              {
                                locale: ptBR,
                              },
                            )}
                          </div>
                        </div>
                      </div>
                      {isWinner && <Badge variant="auxiliary">Ganhador</Badge>}
                    </div>
                    {isWinner && (
                      <div className="mt-2 text-sm text-success">
                        Este usuário ganhou este prêmio!
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </ScrollArea>
        ) : (
          <div className="py-4 text-center text-muted-foreground">
            Este usuário ainda não se inscreveu em nenhum prêmio.
          </div>
        )}
      </div>
    </div>
  )
}
