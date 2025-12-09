'use client'

import { useState, useTransition } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import {
  CalendarIcon,
  Clock,
  Gift,
  Heart,
  Trophy,
  Users,
  CheckCircle,
  XCircle,
} from 'lucide-react'
import { differenceInDays, format } from 'date-fns'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Pagination } from '@/components/pagination'

import { cn } from '@/lib/utils'
import { type Giveaway, type GiveawayRuleConfig } from '@/types'
import { type Session, type User } from 'next-auth'
import { Icons } from '@/components/icons'
import { ptBR } from 'date-fns/locale'
import { gql, useMutation } from '@apollo/client'
import { toast } from 'sonner'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useQueryString } from '@/hooks/use-query-string'
import Link from 'next/link'

const SUBSCRIBE_TO_GIVEAWAY = gql`
  mutation SubscribeToGiveaway($giveawayId: ID!) {
    addUserToGiveaway(giveawayId: $giveawayId) {
      id
    }
  }
`

const LEAVE_GIVEAWAY = gql`
  mutation LeaveGiveaway($giveawayId: ID!) {
    removeUserFromGiveaway(giveawayId: $giveawayId) {
      id
    }
  }
`

interface GiveawaysMainProps {
  activeGiveaways: (Giveaway & {
    participantsCount: number
    winner: User | null
  })[]
  endedGiveaways: (Giveaway & {
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
  page: number
  pageCount: number
  rulesConfigData?: GiveawayRuleConfig[]
}

export default function GiveawaysMain({
  activeGiveaways,
  endedGiveaways,
  currentUser: _currentUser,
  token,
  userSubscribedIds,
  statusCounts,
  page,
  pageCount,
  rulesConfigData,
}: GiveawaysMainProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const defaultTab =
    searchParams.get('status') === 'COMPLETED' ? 'ended' : 'active'
  const [activeTab, setActiveTab] = useState<'active' | 'ended'>(defaultTab)
  const [isPending, startTransition] = useTransition()
  const pathname = usePathname()
  const { createQueryString } = useQueryString()

  const rulesConfig = rulesConfigData || []

  // Helper function to get rule label
  const getRuleLabel = (ruleType: string) => {
    const config = rulesConfig.find((rc) => rc.type === ruleType)
    return config?.label || ruleType
  }

  // Helper function to get config field label
  const getConfigFieldLabel = (ruleType: string, configKey: string) => {
    const config = rulesConfig.find((rc) => rc.type === ruleType)
    const field = config?.configSchema.find((f) => f.key === configKey)
    return field?.label || configKey
  }

  // Helper function to get option label for SELECT fields
  const getOptionLabel = (
    ruleType: string,
    configKey: string,
    value: string,
  ) => {
    const config = rulesConfig.find((rc) => rc.type === ruleType)
    const field = config?.configSchema.find((f) => f.key === configKey)
    if (field?.type === 'SELECT') {
      const option = field.options?.find((o) => o.value === value)
      return option?.label || value
    }
    return value
  }

  function handleTabChange(value: string) {
    const tab = value === 'active' ? 'active' : 'ended'
    setActiveTab(tab)
    startTransition(() => {
      router.push(
        `${pathname}?${createQueryString({
          status: tab === 'ended' ? 'COMPLETED' : null,
          page: null, // Reset to first page when changing tabs
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

  const [leaveGiveaway, { loading: isLoadingLeave }] = useMutation(
    LEAVE_GIVEAWAY,
    {
      onCompleted: () => {
        toast.success('Você saiu do sorteio!')
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
            Sorteios Bench
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
          <TabsTrigger
            disabled={isPending}
            value="active"
            className="flex items-center gap-2"
          >
            <Gift className="size-4" />
            Abertos (
            {statusCounts.find((count) => count.status === 'OPEN')?.count ?? 0})
          </TabsTrigger>
          <TabsTrigger
            disabled={isPending}
            value="ended"
            className="flex items-center gap-2"
          >
            <Trophy className="size-4" />
            Encerrados (
            {statusCounts.find((count) => count.status === 'COMPLETED')
              ?.count ?? 0}
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
                      {/* Giveaway Image */}
                      {giveaway.imageUrl ? (
                        <div className="relative mb-4 aspect-video w-full overflow-hidden rounded-lg">
                          <Image
                            src={giveaway.imageUrl}
                            alt={giveaway.name}
                            fill
                            className="object-contain"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          />
                        </div>
                      ) : (
                        <div className="relative mb-4 flex aspect-video w-full items-center justify-center overflow-hidden rounded-lg bg-muted">
                          <Gift className="size-16 text-muted-foreground" />
                        </div>
                      )}

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
                      <CardDescription className="text-sm">
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

                      {/* Rules */}
                      {giveaway.rules && giveaway.rules.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-semibold">
                            Regras de Participação
                          </h4>
                          {giveaway.rules.map((rule, i) => (
                            <div
                              key={i}
                              className="rounded-lg border bg-muted/30 p-2.5"
                            >
                              <Badge
                                variant="secondary"
                                className="mb-1.5 text-xs"
                              >
                                {getRuleLabel(rule.type)}
                              </Badge>
                              {rule.config &&
                                Object.keys(rule.config).length > 0 && (
                                  <div className="space-y-1">
                                    {Object.entries(rule.config).map(
                                      ([key, value]) => (
                                        <div
                                          key={key}
                                          className="text-xs text-muted-foreground"
                                        >
                                          <span className="font-medium">
                                            {getConfigFieldLabel(
                                              rule.type,
                                              key,
                                            )}
                                            :{' '}
                                          </span>
                                          <span>
                                            {typeof value === 'object'
                                              ? JSON.stringify(value)
                                              : getOptionLabel(
                                                  rule.type,
                                                  key,
                                                  String(value),
                                                )}
                                          </span>
                                        </div>
                                      ),
                                    )}
                                  </div>
                                )}
                              {rule.type === 'AWARDS_VOTED' && (
                                <Link href="/awards">
                                  <Button
                                    variant="link"
                                    className="mt-1 h-auto p-0 text-xs"
                                  >
                                    Ir para votação →
                                  </Button>
                                </Link>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Subscribe/Leave Button */}
                      <Button
                        onClick={() =>
                          subscribed
                            ? leaveGiveaway({
                                variables: { giveawayId: giveaway.id },
                              })
                            : subscribeToGiveaway({
                                variables: { giveawayId: giveaway.id },
                              })
                        }
                        disabled={isLoadingSubscribe || isLoadingLeave}
                        className={cn(
                          'w-full transition-all duration-300',
                          subscribed
                            ? 'bg-destructive hover:bg-destructive/90'
                            : 'bg-primary hover:bg-primary/90',
                        )}
                      >
                        {subscribed ? (
                          <>
                            <XCircle className="mr-2 size-4" />
                            Sair do sorteio
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

          {/* Pagination */}
          {activeGiveaways.length > 0 && pageCount > 1 && (
            <div className="mt-8 flex justify-center">
              <Pagination page={page} pageCount={pageCount} />
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
                      {/* Giveaway Image */}
                      {giveaway.imageUrl ? (
                        <div className="relative mb-4 aspect-video w-full overflow-hidden rounded-lg grayscale">
                          <Image
                            src={giveaway.imageUrl}
                            alt={giveaway.name}
                            fill
                            className="object-contain"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          />
                        </div>
                      ) : (
                        <div className="relative mb-4 flex aspect-video w-full items-center justify-center overflow-hidden rounded-lg bg-muted">
                          <Gift className="size-16 text-muted-foreground grayscale" />
                        </div>
                      )}

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
                      <CardDescription className="text-sm">
                        {giveaway.description}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      {/* Draw Date */}
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CalendarIcon className="size-4" />
                        <span>
                          Sorteado:{' '}
                          {format(giveaway.drawAt, "dd 'de' MMMM 'de' yyyy", {
                            locale: ptBR,
                          })}
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

                      {/* Rules */}
                      {giveaway.rules && giveaway.rules.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-semibold text-muted-foreground">
                            Regras de Participação
                          </h4>
                          {giveaway.rules.map((rule, i) => (
                            <div
                              key={i}
                              className="rounded-lg border bg-muted/30 p-2.5"
                            >
                              <Badge
                                variant="secondary"
                                className="mb-1.5 text-xs"
                              >
                                {getRuleLabel(rule.type)}
                              </Badge>
                              {rule.config &&
                                Object.keys(rule.config).length > 0 && (
                                  <div className="space-y-1">
                                    {Object.entries(rule.config).map(
                                      ([key, value]) => (
                                        <div
                                          key={key}
                                          className="text-xs text-muted-foreground"
                                        >
                                          <span className="font-medium">
                                            {getConfigFieldLabel(
                                              rule.type,
                                              key,
                                            )}
                                            :{' '}
                                          </span>
                                          <span>
                                            {typeof value === 'object'
                                              ? JSON.stringify(value)
                                              : getOptionLabel(
                                                  rule.type,
                                                  key,
                                                  String(value),
                                                )}
                                          </span>
                                        </div>
                                      ),
                                    )}
                                  </div>
                                )}
                              {rule.type === 'AWARDS_VOTED' && (
                                <Link href="/awards">
                                  <Button
                                    variant="link"
                                    className="mt-1 h-auto p-0 text-xs"
                                  >
                                    Ver votação →
                                  </Button>
                                </Link>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

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

          {/* Pagination */}
          {endedGiveaways.length > 0 && pageCount > 1 && (
            <div className="mt-8 flex justify-center">
              <Pagination page={page} pageCount={pageCount} />
            </div>
          )}
        </TabsContent>
      </Tabs>
    </main>
  )
}
