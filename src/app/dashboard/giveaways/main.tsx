'use client'

import { format, parseISO } from 'date-fns'
import { motion } from 'framer-motion'
import {
  CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Gift,
  Plus,
  RefreshCw,
  Search,
  Trophy,
  Users,
} from 'lucide-react'
import { useState, useTransition } from 'react'

import { GiveawayForm } from '@/components/forms/giveaway-form'
import { Pagination } from '@/components/pagination'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { UserDetailsDialog } from '@/components/user/user-details-dialog'
import { env } from '@/env.mjs'
import { useFormStore } from '@/hooks/use-form-store'
import { useQueryString } from '@/hooks/use-query-string'
import { cn } from '@/lib/utils'
import { type Giveaway } from '@/types'
import { gql, useMutation } from '@apollo/client'
import { ptBR } from 'date-fns/locale'
import { type User } from 'next-auth'
import { usePathname, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Icons } from '@/components/icons'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

const UPDATE_GIVEAWAY = gql`
  mutation UpdateGiveaway($input: UpdateGiveawayInput!) {
    updateGiveaway(updateGiveawayInput: $input) {
      id
      name
      status
    }
  }
`

const SET_GIVEAWAY_WINNER = gql`
  mutation SetGiveawayWinner($giveawayId: ID!, $index: Int!) {
    setGiveawayWinnerByIndex(giveawayId: $giveawayId, index: $index) {
      id
      name
      winner {
        id
        name
        email
        image
      }
    }
  }
`

const DELETE_GIVEAWAY = gql`
  mutation DeleteGiveaway($id: ID!) {
    removeGiveaway(id: $id) {
      id
    }
  }
`

interface GiveawaysMainProps {
  giveaways: (Giveaway & {
    participantsCount: number
    winner: User | null
  })[]
  drawDate: string
  token?: string
  distinctDates: string[]
  statusCounts: {
    status: string
    count: number
  }[]
  subscribersToShow: User[]
  subscribersPageCount: number
  subscribersPage: number
}

export default function GiveawaysMain({
  giveaways,
  token,
  drawDate,
  distinctDates,
  statusCounts,
  subscribersToShow,
  subscribersPageCount,
  subscribersPage,
}: GiveawaysMainProps) {
  const router = useRouter()
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentPrizeId, setCurrentPrizeId] = useState<string | null>(null)
  const [showConfetti, setShowConfetti] = useState(false)
  const [winner, setWinner] = useState<User | null>(null)
  const { openDialogs, setOpenDialog } = useFormStore()
  // Date selection state
  const [selectedDate, setSelectedDate] = useState<string>(drawDate)
  const [selectedUserId, setSelectedUserId] = useState<
    string | null | undefined
  >(null)
  // Pagination state for subscribers
  const [subscriberSearch, setSubscriberSearch] = useState('')
  const [currentPrizeIndex, setCurrentPrizeIndex] = useState<number | null>(
    null,
  )

  const handleSearch = () => {
    startTransition(() => {
      router.push(
        `${pathname}?${createQueryString({
          subscribersSearch: subscriberSearch,
          subscribersPage: 1,
        })}`,
      )
    })
  }

  // transition state for date selection
  const [_isPending, startTransition] = useTransition()
  const pathname = usePathname()
  const { createQueryString } = useQueryString()

  // Find all unique dates that have prizes
  const uniqueDates = distinctDates

  function onDateSelect(date: string) {
    setSelectedDate(date)
    setCurrentPrizeIndex(null)
    startTransition(() => {
      router.push(
        `${pathname}?${createQueryString({
          drawDate: date,
          subscribersPage: null,
          subscribersSearch: null,
          selectedGiveaway: 'null',
        })}`,
      )
    })
  }

  function onPrizeSelect(prizeIndex: number) {
    setCurrentPrizeIndex(prizeIndex)
    startTransition(() => {
      router.push(
        `${pathname}?${createQueryString({
          selectedGiveaway: giveaways[prizeIndex].id,
          subscribersPage: null,
          subscribersSearch: null,
        })}`,
      )
    })
  }

  // Navigate to previous date
  const goToPreviousDate = () => {
    const currentIndex = uniqueDates.indexOf(selectedDate)
    if (currentIndex > 0) {
      onDateSelect(uniqueDates[currentIndex - 1])
    }
  }

  // Navigate to next date
  const goToNextDate = () => {
    const currentIndex = uniqueDates.indexOf(selectedDate)
    if (currentIndex < uniqueDates.length - 1) {
      onDateSelect(uniqueDates[currentIndex + 1])
    }
  }

  const [updateGiveaway, { loading: isLoading }] = useMutation(
    UPDATE_GIVEAWAY,
    {
      onCompleted: (data) => {
        if (data.updateGiveaway.status === 'OPEN') {
          toast.success(
            `Inscrições para ${data?.updateGiveaway.name} estão abertas agora.`,
          )
        } else {
          toast.error(
            `Inscrições para ${data?.updateGiveaway.name} estão fechadas.`,
          )
        }
        router.refresh()
      },
      onError: (error) => {
        toast.error(error.message)
      },
      context: {
        headers: {
          'api-key': env.NEXT_PUBLIC_API_KEY,
        },
      },
    },
  )

  const [setGiveawayWinner, { loading: isLoadingWinner }] = useMutation(
    SET_GIVEAWAY_WINNER,
    {
      onCompleted: (data) => {
        setWinner(data.setGiveawayWinnerByIndex.winner)
        setIsDrawing(false)
        setShowConfetti(true)

        toast.success(
          `${data.setGiveawayWinnerByIndex.winner.name} ganhou o prêmio ${data.setGiveawayWinnerByIndex.name}!`,
        )

        setTimeout(() => {
          setShowConfetti(false)
          setCurrentPrizeId(null)
        }, 5000)

        router.refresh()
      },
      onError: (error) => {
        setIsDrawing(false)
        // toast.error(error.message)
      },
      context: {
        headers: {
          'api-key': env.NEXT_PUBLIC_API_KEY,
        },
      },
      refetchQueries: ['GetGiveaways'],
    },
  )

  const [deleteGiveaway, { loading: isLoadingDelete }] = useMutation(
    DELETE_GIVEAWAY,
    {
      onCompleted: () => {
        toast.success('Sorteio deletado com sucesso!')
        router.refresh()
      },
      onError: (error) => {
        toast.error(error.message)
      },
      context: {
        headers: {
          'api-key': env.NEXT_PUBLIC_API_KEY,
        },
      },
    },
  )
  const executeDraw = (prizeId: string) => {
    const prize = giveaways.find((p) => p.id === prizeId)
    if (!prize || prize.participantsCount === 0) return

    setIsDrawing(true)
    setCurrentPrizeId(prizeId)

    // Animation for drawing

    let count = 0
    let drawingInterval: NodeJS.Timeout | null = null

    drawingInterval = setInterval(() => {
      count++
      if (count > 20 && drawingInterval) {
        clearInterval(drawingInterval)
        const winnerIndex = Math.floor(Math.random() * prize.participantsCount)

        // Update prize with winner
        setGiveawayWinner({
          variables: {
            giveawayId: prizeId,
            index: winnerIndex,
          },
          context: {
            headers: {
              'api-key': env.NEXT_PUBLIC_API_KEY,
            },
          },
        })
      }
    }, 100)
  }

  return (
    <div className="mx-auto">
      <Dialog
        open={openDialogs['giveawayCreateForm']}
        onOpenChange={(open) => setOpenDialog('giveawayCreateForm', open)}
      >
        <div className="mb-8">
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-primary/90 to-primary p-8 text-white shadow-lg">
            <div className="absolute -right-10 -top-10 size-40 rounded-full bg-white/10"></div>
            <div className="absolute -bottom-10 -left-10 size-32 rounded-full bg-white/10"></div>
            <div className="relative z-10">
              <h1 className="text-3xl font-bold">Sorteios Bench</h1>
              <p className="mt-2 max-w-2xl opacity-90">
                Gerencie prêmios e realize sorteios empolgantes para seus
                assinantes. Crie novos prêmios, controle inscrições e sorteie
                vencedores com animações envolventes.
              </p>
              <div className="mt-4 flex gap-4">
                <div className="rounded-lg bg-white/20 px-4 py-2 backdrop-blur-sm">
                  <div className="text-sm opacity-80">Prêmios Totais</div>
                  <div className="text-2xl font-bold">{giveaways.length}</div>
                </div>
                <div className="rounded-lg bg-white/20 px-4 py-2 backdrop-blur-sm">
                  <div className="text-sm opacity-80">Sorteios Ativos</div>
                  <div className="text-2xl font-bold">
                    {giveaways.filter((g) => g.status === 'OPEN').length}
                  </div>
                </div>
                <div className="rounded-lg bg-white/20 px-4 py-2 backdrop-blur-sm">
                  <div className="text-sm opacity-80">Concluídos</div>
                  <div className="text-2xl font-bold">
                    {giveaways.filter((g) => g.status === 'COMPLETED').length}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Date selector and navigation */}
          <div className="mt-6 flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={goToPreviousDate}
                disabled={uniqueDates.indexOf(selectedDate) <= 0}
              >
                <ChevronLeft className="size-4" />
              </Button>

              <DatePickerWithPresets
                selectedDate={selectedDate ? parseISO(selectedDate) : undefined}
                onSelect={(date) =>
                  onDateSelect(format(date, 'yyyy-MM-dd', { locale: ptBR }))
                }
                presetDates={uniqueDates.map((date) => parseISO(date))}
              />

              <Button
                variant="outline"
                size="icon"
                onClick={goToNextDate}
                disabled={
                  uniqueDates.indexOf(selectedDate) >= uniqueDates.length - 1
                }
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>

            <div className="flex flex-col items-center gap-4 sm:flex-row">
              <div className="text-sm text-muted-foreground">
                {giveaways.filter((g) => g.drawAt === selectedDate).length}{' '}
                prêmio
                {giveaways.filter((g) => g.drawAt === selectedDate).length !== 1
                  ? 's'
                  : ''}{' '}
                nesse dia
              </div>

              <DialogTrigger asChild>
                <Button className="gap-2 bg-primary">
                  <Plus className="size-4" />
                  Novo sorteio
                </Button>
              </DialogTrigger>
            </div>
          </div>

          <div className="mt-6">
            <div className="flex-1">
              <Tabs defaultValue="prizes" className="w-full">
                <div className="flex items-center justify-between">
                  <TabsList className="mb-4">
                    <TabsTrigger value="prizes" className="text-sm">
                      <Gift className="mr-2 size-4" />
                      Prêmios
                    </TabsTrigger>
                    <TabsTrigger value="subscribers" className="text-sm">
                      <Users className="mr-2 size-4" />
                      Inscritos
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="prizes" className="space-y-4">
                  {giveaways.length > 0 ? (
                    giveaways.map((prize) => (
                      <Card
                        key={prize.id}
                        className="relative overflow-hidden border-2 transition-all hover:shadow-md"
                      >
                        {/* Prize status ribbon */}
                        {prize.winnerId ? (
                          <div className="absolute -right-12 top-7 rotate-45 bg-auxiliary px-12 py-1 text-xs font-semibold text-foreground">
                            CONCLUIDO
                          </div>
                        ) : prize.status === 'OPEN' ? (
                          <div className="absolute -right-12 top-7 rotate-45 bg-success px-12 py-1 text-xs font-semibold text-foreground">
                            ABERTO
                          </div>
                        ) : (
                          <div className="absolute -right-12 top-7 rotate-45 bg-destructive px-12 py-1 text-xs font-semibold text-foreground">
                            FECHADO
                          </div>
                        )}

                        <div className="absolute left-0 top-0 h-full w-1.5 bg-gradient-to-b from-primary to-primary/50"></div>

                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-xl font-bold">
                                {prize.name}
                              </CardTitle>
                              <CardDescription className="mt-1">
                                {prize.description}
                              </CardDescription>
                            </div>
                            <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
                              <Gift className="size-6 text-primary" />
                            </div>
                          </div>
                        </CardHeader>

                        <CardContent>
                          {/* <div className="mb-4 mt-2">
                          <div className="mb-1 flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                              Inscritos
                            </span>
                            <span className="font-medium">
                              {prize.participantsCount}
                            </span>
                          </div>
                          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-primary transition-all"
                              style={{
                                width: `${Math.min(
                                  100,
                                  (prize.participantsCount / 100) * 100,
                                )}%`,
                              }}
                            ></div>
                          </div>
                        </div> */}

                          <div className="mb-4 flex items-center gap-2 text-sm">
                            <Users className="size-4 text-muted-foreground" />
                            <span>
                              {prize.participantsCount} participante(s)
                            </span>
                          </div>

                          {currentPrizeId === prize.id && isDrawing && (
                            <div className="mt-4 rounded-lg border border-primary/20 bg-primary/5 p-6">
                              <div className="flex items-center justify-center">
                                <motion.div
                                  animate={{ rotate: 360 }}
                                  transition={{
                                    duration: 2,
                                    repeat: Number.POSITIVE_INFINITY,
                                    ease: 'linear',
                                  }}
                                  className="mb-4"
                                >
                                  <RefreshCw className="size-10 text-primary" />
                                </motion.div>
                              </div>
                              <div className="mb-3 text-center text-lg font-bold">
                                Drawing winner...
                              </div>
                              {/* <div className="relative h-16 overflow-hidden rounded-lg bg-background p-2">
                                {drawingUsers.map((participant) => {
                                  return (
                                    <motion.div
                                      key={participant.id}
                                      initial={{ opacity: 0, y: 20 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      exit={{ opacity: 0, y: -20 }}
                                      className="absolute inset-0 flex items-center justify-center text-center text-lg font-semibold"
                                    >
                                      {participant?.name}
                                    </motion.div>
                                  )
                                })}
                              </div> */}
                            </div>
                          )}

                          {currentPrizeId === prize.id &&
                            !isDrawing &&
                            showConfetti && (
                              <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-6 dark:border-green-900 dark:bg-green-900/20">
                                <div className="text-center">
                                  <div className="mb-3 inline-block rounded-full bg-yellow-100 p-3">
                                    <Trophy className="size-8 text-yellow-600" />
                                  </div>
                                  <div className="mb-2 text-xl font-bold">
                                    Ganhador!
                                  </div>
                                  {prize.winner && (
                                    <Button
                                      variant="link"
                                      className="h-4 p-0"
                                      onClick={() => {
                                        setSelectedUserId(prize.winner?.id)
                                        setOpenDialog('userDetails', true)
                                      }}
                                    >
                                      {prize.winner.name}
                                    </Button>
                                  )}
                                </div>
                              </div>
                            )}

                          {prize.winner && currentPrizeId !== prize.id && (
                            <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-900/20">
                              <div className="flex items-center gap-3">
                                <div className="shrink-0 rounded-full bg-yellow-100 p-2">
                                  <Trophy className="size-5 text-yellow-600" />
                                </div>
                                <div>
                                  <div className="text-sm text-muted-foreground">
                                    Ganhador
                                  </div>
                                  <Button
                                    variant="link"
                                    className="h-4 p-0"
                                    onClick={() => {
                                      setSelectedUserId(prize.winner?.id)
                                      setOpenDialog('userDetails', true)
                                    }}
                                  >
                                    {prize.winner.name}
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )}
                        </CardContent>

                        <CardFooter className="border-t bg-muted/30 pt-4">
                          <div className="flex w-full items-center justify-between gap-2">
                            <div className="flex items-center space-x-2">
                              <Switch
                                id={`subscription-${prize.id}`}
                                disabled={
                                  prize.status === 'COMPLETED' ||
                                  prize.winnerId !== null
                                }
                                checked={prize.status === 'OPEN'}
                                onCheckedChange={() =>
                                  updateGiveaway({
                                    variables: {
                                      input: {
                                        id: prize.id,
                                        status:
                                          prize.status === 'OPEN'
                                            ? 'CLOSED'
                                            : 'OPEN',
                                      },
                                    },
                                  })
                                }
                                className="data-[state=checked]:bg-green-500"
                              />
                              <Label
                                htmlFor={`subscription-${prize.id}`}
                                className="text-sm font-medium"
                              >
                                {prize.status === 'OPEN'
                                  ? 'Inscrições abertas'
                                  : 'Inscrições fechadas'}
                              </Label>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                onClick={() => executeDraw(prize.id)}
                                disabled={
                                  isDrawing || prize.participantsCount === 0
                                }
                                className={`${
                                  prize.winner
                                    ? 'bg-green-500 hover:bg-green-600'
                                    : ''
                                }`}
                              >
                                {prize.winner ? (
                                  <>
                                    <RefreshCw className="mr-2 size-4" />{' '}
                                    Sortear novamente
                                  </>
                                ) : (
                                  'Sortear'
                                )}
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant={'destructive'}>
                                    <Icons.Trash className="size-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      Você tem certeza?
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Essa ação não pode ser desfeita.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>
                                      Cancelar
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() =>
                                        deleteGiveaway({
                                          variables: { id: prize.id },
                                        })
                                      }
                                    >
                                      Continuar
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                            {/* <Button
                            onClick={() =>
                              subscribeToGiveaway({
                                variables: {
                                  giveawayId: prize.id,
                                },
                              })
                            }
                          >
                            Inscrever-se
                          </Button> */}
                          </div>
                        </CardFooter>
                      </Card>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="mb-4 rounded-full bg-muted p-6">
                        <Gift className="size-10 text-muted-foreground" />
                      </div>
                      <h3 className="mb-2 text-lg font-medium">
                        Sem prêmios para esta data
                      </h3>
                      <p className="mb-6 max-w-md text-muted-foreground">
                        Não há prêmios agendados para{' '}
                        {selectedDate
                          ? format(parseISO(selectedDate), 'MMMM d, yyyy', {
                              locale: ptBR,
                            })
                          : 'this date'}
                        . Crie um novo prêmio para começar.
                      </p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="subscribers">
                  <Card>
                    <CardHeader>
                      <CardTitle>Inscritos</CardTitle>
                      <CardDescription>
                        Todos os usuários que se inscreveram em prêmios em{' '}
                        {selectedDate
                          ? format(
                              parseISO(selectedDate),
                              "d 'de' MMMM 'de' yyyy",
                              {
                                locale: ptBR,
                              },
                            )
                          : 'this date'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {giveaways.length > 0 ? (
                        <div className="space-y-6">
                          {/* Prize selector tabs */}
                          <div className="-mx-1 flex overflow-x-auto pb-2">
                            {giveaways.map((prize, index) => (
                              <Button
                                key={prize.id}
                                variant={
                                  currentPrizeIndex === index
                                    ? 'default'
                                    : 'outline'
                                }
                                className="mx-1 whitespace-nowrap"
                                onClick={() => {
                                  onPrizeSelect(index)
                                }}
                              >
                                <span className="max-w-[150px] truncate">
                                  {prize.name}
                                </span>
                                <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs">
                                  {prize.participantsCount}
                                </span>
                              </Button>
                            ))}
                          </div>

                          {currentPrizeIndex !== null &&
                            giveaways[currentPrizeIndex] && (
                              <>
                                {/* Search and pagination controls */}
                                <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                                  <div className="relative flex w-full items-center gap-1 sm:w-80">
                                    <div>
                                      <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                                      <Input
                                        type="search"
                                        placeholder="Procurar inscritos..."
                                        className="pl-8"
                                        value={subscriberSearch}
                                        onChange={(e) => {
                                          setSubscriberSearch(e.target.value)
                                        }}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') {
                                            handleSearch()
                                          }
                                        }}
                                      />
                                    </div>
                                    <Button
                                      onClick={() => {
                                        handleSearch()
                                      }}
                                      size="sm"
                                      variant="secondary"
                                    >
                                      Pesquisar
                                    </Button>
                                  </div>

                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <span>
                                      Total de inscritos:{' '}
                                      {subscribersToShow.length}
                                    </span>
                                    {subscriberSearch && (
                                      <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => {
                                          setSubscriberSearch('')
                                          startTransition(() => {
                                            router.push(
                                              `${pathname}?${createQueryString({
                                                subscribersSearch: null,
                                                subscribersPage: 1,
                                              })}`,
                                            )
                                          })
                                        }}
                                        className="h-7 px-2 text-xs"
                                      >
                                        Limpar
                                      </Button>
                                    )}
                                  </div>
                                </div>

                                {/* Subscribers list */}

                                <>
                                  <div className="mb-4 grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
                                    {subscribersToShow.map((user) => (
                                      <div
                                        key={user.id}
                                        className={`flex items-center gap-3 rounded-md p-3 ${
                                          user.id ===
                                          giveaways[currentPrizeIndex].winnerId
                                            ? 'bg-success/10'
                                            : 'bg-muted/50'
                                        }`}
                                      >
                                        <Avatar>
                                          <AvatarImage
                                            src={user.image ?? ''}
                                            alt="Avatar"
                                          />
                                          <AvatarFallback>
                                            {user?.name?.charAt(0)}
                                          </AvatarFallback>
                                        </Avatar>
                                        <div className="min-w-0 flex-1">
                                          <div className="truncate font-medium">
                                            {user.id ===
                                            giveaways[currentPrizeIndex]
                                              .winnerId ? (
                                              <Button
                                                onClick={() => {
                                                  setSelectedUserId(user.id)
                                                  setOpenDialog(
                                                    'userDetails',
                                                    true,
                                                  )
                                                }}
                                                variant="link"
                                                className="p-0"
                                              >
                                                {user?.name}
                                              </Button>
                                            ) : (
                                              <Button
                                                onClick={() => {
                                                  setSelectedUserId(user.id)
                                                  setOpenDialog(
                                                    'userDetails',
                                                    true,
                                                  )
                                                }}
                                                variant="link"
                                                className="p-0"
                                              >
                                                {user?.name}
                                              </Button>
                                            )}
                                          </div>
                                        </div>
                                        {user.id ===
                                          giveaways[currentPrizeIndex]
                                            .winnerId && (
                                          <Trophy className="size-4 shrink-0 text-yellow-500" />
                                        )}
                                      </div>
                                    ))}
                                  </div>

                                  {/* Paginatzion controls */}
                                  {subscribersToShow.length > 0 && (
                                    <Pagination
                                      page={subscribersPage}
                                      pageCount={subscribersPageCount}
                                      pageString="subscribersPage"
                                    />
                                  )}
                                </>
                              </>
                            )}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                          <p className="text-muted-foreground">
                            Não há prêmios agendados para esta data.
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Criar novo sorteio</DialogTitle>
            <DialogDescription>
              Adicione um novo sorteio para o seu sorteio. Os usuários poderão
              se inscrever nesse sorteio.
            </DialogDescription>
          </DialogHeader>
          <GiveawayForm />
        </DialogContent>
      </Dialog>

      {/* User Details Dialog */}
      {selectedUserId && (
        <Dialog
          open={openDialogs['userDetails']}
          onOpenChange={(open) => setOpenDialog('userDetails', open)}
        >
          <DialogContent className="sm:max-w-md md:max-w-lg">
            <DialogHeader>
              <DialogTitle>Detalhes do usuário</DialogTitle>
              <DialogDescription>
                Informações detalhadas sobre este usuário e sua participação em
                prêmios
              </DialogDescription>
            </DialogHeader>
            <UserDetailsDialog userId={selectedUserId} />
          </DialogContent>
        </Dialog>
      )}

      {showConfetti && <ConfettiEffect />}
    </div>
  )
}

function DatePickerWithPresets({
  selectedDate,
  onSelect,
  presetDates = [],
}: {
  selectedDate?: Date
  onSelect: (date: Date) => void
  presetDates?: Date[]
}) {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'w-[240px] justify-start text-left font-normal',
            !selectedDate && 'text-muted-foreground',
          )}
        >
          <CalendarIcon className="mr-2 size-4" />
          {selectedDate
            ? format(selectedDate, "d 'de' MMMM 'de' yyyy", { locale: ptBR })
            : 'Selecionar data'}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0" align="start">
        <Calendar
          locale={ptBR}
          mode="single"
          selected={selectedDate}
          onSelect={(date) => {
            if (date) {
              onSelect(date)
              setOpen(false)
            }
          }}
          initialFocus
        />
        {presetDates.length > 0 && (
          <>
            <Separator />
            <div className="space-y-1 p-3">
              <h4 className="text-sm font-medium">Ir para data com prêmios</h4>
              <ScrollArea className="flex h-24 flex-wrap gap-1">
                <div className="flex flex-wrap gap-1">
                  {presetDates.map((date, i) => (
                    <Button
                      key={i}
                      variant="outline"
                      size="sm"
                      className={cn(
                        'text-xs',
                        selectedDate?.toDateString() === date.toDateString()
                          ? 'bg-primary text-primary-foreground'
                          : '',
                      )}
                      onClick={() => {
                        onSelect(date)
                        setOpen(false)
                      }}
                    >
                      {format(date, 'dd/MM', { locale: ptBR })}
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  )
}

function ConfettiEffect() {
  return (
    <div className="pointer-events-none fixed inset-0 z-50">
      <div className="absolute inset-0 flex items-center justify-center">
        {Array.from({ length: 150 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute"
            initial={{
              x: 0,
              y: 0,
              scale: 0,
              opacity: 1,
            }}
            animate={{
              x: Math.random() * 800 - 400,
              y: Math.random() * 800 - 400,
              scale: Math.random() * 2 + 0.5,
              opacity: 0,
            }}
            transition={{
              duration: Math.random() * 3 + 1,
              ease: 'easeOut',
            }}
            style={{
              width: Math.random() * 15 + 5,
              height: Math.random() * 15 + 5,
              backgroundColor: [
                '#FF5252',
                '#FF4081',
                '#E040FB',
                '#7C4DFF',
                '#536DFE',
                '#448AFF',
                '#40C4FF',
                '#18FFFF',
                '#64FFDA',
                '#69F0AE',
                '#B2FF59',
                '#EEFF41',
                '#FFFF00',
                '#FFD740',
                '#FFAB40',
                '#FF6E40',
              ][Math.floor(Math.random() * 16)],
              borderRadius:
                Math.random() > 0.5 ? '50%' : Math.random() > 0.5 ? '0' : '30%',
              transform: `rotate(${Math.random() * 360}deg)`,
            }}
          />
        ))}
      </div>
    </div>
  )
}
