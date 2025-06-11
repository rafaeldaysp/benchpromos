'use client'

import { useState, useTransition } from 'react'
import { motion } from 'framer-motion'
import {
  CalendarIcon,
  Clock,
  Gift,
  Heart,
  Search,
  Trophy,
  Users,
  CheckCircle,
  XCircle,
} from 'lucide-react'
import { differenceInDays, format, parseISO } from 'date-fns'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { type Giveaway } from '@/types'
import { type Session, type User } from 'next-auth'
import { Icons } from '@/components/icons'
import { ptBR } from 'date-fns/locale'
import { gql, useMutation } from '@apollo/client'
import { toast } from 'sonner'
import { usePathname, useRouter } from 'next/navigation'
import { useQueryString } from '@/hooks/use-query-string'

const SUBSCRIBE_TO_GIVEAWAY = gql`
  mutation SubscribeToGiveaway($giveawayId: ID!) {
    addUserToGiveaway(giveawayId: $giveawayId) {
      id
    }
  }
`

interface GiveawaysMainProps {
  activeGiveaways: (Giveaway & {
    participants: User[]
    participantsCount: number
    winner: User | null
  })[]
  endedGiveaways: (Giveaway & {
    participants: User[]
    participantsCount: number
    winner: User | null
  })[]
  userSubscribedIds: string[]
  statusCounts: {
    status: string
    count: number
  }[]
  currentUser?: Session['user']
  token?: string
}

export default function GiveawaysMain({
  activeGiveaways,
  endedGiveaways,
  currentUser,
  token,
  userSubscribedIds,
  statusCounts,
}: GiveawaysMainProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'active' | 'ended'>('active')
  const [isPending, startTransition] = useTransition()
  const pathname = usePathname()
  const { createQueryString } = useQueryString()

  function handleTabChange(value: string) {
    const tab = value === 'active' ? 'active' : 'ended'
    setActiveTab(tab)
    startTransition(() => {
      router.push(
        `${pathname}?${createQueryString({
          status: tab === 'ended' ? 'CLOSED' : null,
        })}`,
      )
    })
  }

  const [subscribeToGiveaway, { loading: isLoadingSubscribe }] = useMutation(
    SUBSCRIBE_TO_GIVEAWAY,
    {
      onCompleted: () => {
        toast.success('Inscrição realizada com sucesso!')
        router.refresh()
      },
      onError: (error) => {
        toast.error(error.message)
      },
      context: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    },
  )
  return (
    <main className="relative mx-auto space-y-8 px-4 py-10 sm:container">
      {/* Hero Section */}
      <div className="mb-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-4xl font-bold text-transparent">
            Ganhe prêmios incríveis!
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Participe dos nossos sorteios e concorra a notebooks, gift cards e
            muito mais!
          </p>
        </motion.div>
      </div>

      {/* Giveaways Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="w-full"
      >
        <TabsList className="mx-auto mb-8 grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="active" className="flex items-center gap-2">
            <Gift className="size-4" />
            Abertos (
            {statusCounts.find((count) => count.status === 'OPEN')?.count ?? 0})
          </TabsTrigger>
          <TabsTrigger value="ended" className="flex items-center gap-2">
            <Trophy className="size-4" />
            Encerrados (
            {statusCounts.find((count) => count.status === 'CLOSED')?.count ??
              0}
            )
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {activeGiveaways.map((giveaway, index) => {
              const subscribed = userSubscribedIds.includes(giveaway.id)
              const daysUntil = differenceInDays(
                new Date(giveaway.drawAt),
                new Date(),
              )

              return (
                <motion.div
                  key={giveaway.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className="h-full border-2 backdrop-blur-sm transition-all duration-300 hover:border-primary/50 hover:shadow-lg">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">
                            {/* {getCategoryIcon(giveaway.category)} */}
                            {/* <Icons.Gift className="size-4" /> */}
                          </span>
                          {/* <Badge variant="outline" className="text-xs">
                            {giveaway.category.replace('-', ' ')}{' '}
                          </Badge> */}
                        </div>
                        {/* <Badge variant="success">{giveaway.name}</Badge> */}
                      </div>
                      <CardTitle className="text-xl">{giveaway.name}</CardTitle>
                      <CardDescription className="line-clamp-3 text-sm">
                        {giveaway.description}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      {/* Draw Date */}
                      <div className="flex items-center gap-2 text-sm">
                        <CalendarIcon className="size-4 text-muted-foreground" />
                        <span>
                          Sorteio:{' '}
                          {format(giveaway.drawAt, "d 'de' MMMM 'de' yyyy", {
                            locale: ptBR,
                          })}
                        </span>
                      </div>

                      {/* Time Remaining */}
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="size-4 text-muted-foreground" />
                        <span
                          className={cn(
                            daysUntil <= 3
                              ? 'font-medium text-destructive'
                              : 'text-muted-foreground',
                          )}
                        >
                          {daysUntil > 0
                            ? `${daysUntil} dias restantes`
                            : 'Sorteio hoje!'}
                        </span>
                      </div>

                      {/* Participants */}
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="size-4 text-muted-foreground" />
                        <span>
                          {giveaway.participantsCount} participante(s)
                        </span>
                      </div>

                      {/* Recent Participants */}
                      <div className="flex items-center gap-1">
                        <span className="mr-2 text-xs text-muted-foreground">
                          Recentes:
                        </span>
                        {giveaway.participants.slice(-5).map((participant) => (
                          <Avatar key={participant.id}>
                            <AvatarImage
                              src={participant.image ?? ''}
                              alt="Avatar"
                              className="cursor-pointer"
                            />
                            <AvatarFallback>
                              {participant?.name?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                        {giveaway.participantsCount > 5 && (
                          <span className="ml-1 text-xs text-muted-foreground">
                            +{giveaway.participantsCount - 5}
                          </span>
                        )}
                      </div>

                      {/* Subscribe Button */}
                      <Button
                        onClick={() =>
                          subscribeToGiveaway({
                            variables: { giveawayId: giveaway.id },
                          })
                        }
                        disabled={isLoadingSubscribe || subscribed}
                        className={cn(
                          'w-full transition-all duration-300',
                          subscribed ? 'bg-success' : 'bg-primary',
                        )}
                      >
                        {subscribed ? (
                          <>
                            <CheckCircle className="mr-2 size-4" />
                            Inscrito!
                          </>
                        ) : (
                          <>
                            <Heart className="mr-2 size-4" />
                            Inscrever-se
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>

          {activeGiveaways.length === 0 && (
            <div className="py-12 text-center">
              <div className="mb-4 text-6xl">🎁</div>
              <h3 className="mb-2 text-xl font-semibold">
                Nenhum sorteio ativo encontrado
              </h3>
              <p className="text-muted-foreground">
                Verifique novamente em breve para novos sorteios incríveis!
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="ended">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {endedGiveaways.map((giveaway, index) => {
              const subscribed = userSubscribedIds.includes(giveaway.id)
              const winner = giveaway.winner

              return (
                <motion.div
                  key={giveaway.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className="h-full border bg-muted/50 backdrop-blur-sm">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl grayscale">
                            {/* {getCategoryIcon(giveaway.category)} */}
                            <Icons.Gift className="size-4" />
                          </span>
                          <Badge variant="secondary" className="text-xs">
                            Encerrado
                          </Badge>
                        </div>
                        <Badge variant="outline">{giveaway.name}</Badge>
                      </div>
                      <CardTitle className="text-xl text-muted-foreground">
                        {giveaway.name}
                      </CardTitle>
                      <CardDescription className="line-clamp-3 text-sm">
                        {giveaway.description}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      {/* Draw Date */}
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CalendarIcon className="size-4" />
                        <span>
                          Sorteado:{' '}
                          {format(
                            format(giveaway.drawAt, 'yyyy-MM-dd', {
                              locale: ptBR,
                            }),
                            "dd 'de' MMMM 'de' yyyy",
                          )}
                        </span>
                      </div>

                      {/* Winner */}
                      {winner && (
                        <div className="flex items-center gap-2 rounded-lg bg-yellow-50 p-3 dark:bg-yellow-900/20">
                          <Trophy className="size-4 text-yellow-500" />
                          <span className="text-sm font-medium">
                            Ganhador: {winner?.name ?? 'N/A'}
                          </span>
                        </div>
                      )}

                      {/* Participants */}
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="size-4" />
                        <span>{giveaway.participantsCount} participantes</span>
                      </div>

                      {/* User's participation status */}
                      <div className="flex items-center gap-2 text-sm">
                        {subscribed ? (
                          <>
                            <CheckCircle className="size-4 text-success" />
                            <span className="text-success">
                              Você se inscreveu
                            </span>
                          </>
                        ) : (
                          <>
                            <XCircle className="size-4 text-muted-foreground" />
                            <span className="text-muted-foreground">
                              Você não se inscreveu
                            </span>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </TabsContent>
      </Tabs>
    </main>
  )
}
