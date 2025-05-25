'use client'

import { format, parseISO } from 'date-fns'
import { motion } from 'framer-motion'
import {
  CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Gift,
  Mail,
  Plus,
  RefreshCw,
  Search,
  Trophy,
  Users,
} from 'lucide-react'
import { useEffect, useState, useTransition } from 'react'

import { GiveawayForm } from '@/components/forms/giveaway-form'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
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
  DialogFooter,
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
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { env } from '@/env.mjs'
import { cn } from '@/lib/utils'
import { type Giveaway } from '@/types'
import { gql, useMutation } from '@apollo/client'
import { type User } from 'next-auth'
import { usePathname, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useQueryString } from '@/hooks/use-query-string'
import { useFormStore } from '@/hooks/use-form-store'

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
      winner {
        id
        name
        email
        image
      }
    }
  }
`
// Generate a larger mock dataset for subscribers
const generateMockUsers = (count: number) => {
  const firstNames = [
    'John',
    'Jane',
    'Robert',
    'Emily',
    'Michael',
    'Sarah',
    'David',
    'Lisa',
    'Thomas',
    'Jennifer',
    'William',
    'Elizabeth',
    'James',
    'Mary',
    'Charles',
    'Patricia',
    'Joseph',
    'Linda',
    'Richard',
    'Barbara',
  ]
  const lastNames = [
    'Smith',
    'Johnson',
    'Williams',
    'Jones',
    'Brown',
    'Davis',
    'Miller',
    'Wilson',
    'Moore',
    'Taylor',
    'Anderson',
    'Thomas',
    'Jackson',
    'White',
    'Harris',
    'Martin',
    'Thompson',
    'Garcia',
    'Martinez',
    'Robinson',
  ]

  const locations = [
    'New York, NY',
    'Los Angeles, CA',
    'Chicago, IL',
    'Houston, TX',
    'Phoenix, AZ',
    'Philadelphia, PA',
    'San Antonio, TX',
    'San Diego, CA',
    'Dallas, TX',
    'San Jose, CA',
  ]

  const phoneNumbers = [
    '(555) 123-4567',
    '(555) 234-5678',
    '(555) 345-6789',
    '(555) 456-7890',
    '(555) 567-8901',
    '(555) 678-9012',
    '(555) 789-0123',
    '(555) 890-1234',
    '(555) 901-2345',
    '(555) 012-3456',
  ]

  return Array.from({ length: count }, (_, i) => {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)]
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)]
    return {
      id: i + 1,
      name: `${firstName} ${lastName}`,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
      location: locations[Math.floor(Math.random() * locations.length)],
      phone: phoneNumbers[Math.floor(Math.random() * phoneNumbers.length)],
      joinDate: new Date(
        2024,
        Math.floor(Math.random() * 12),
        Math.floor(Math.random() * 28) + 1,
      )
        .toISOString()
        .split('T')[0],
      avatar: `${firstName.charAt(0)}${lastName.charAt(0)}`,
    }
  })
}

// Mock data with more subscribers
const mockSubscribedUsers = generateMockUsers(100)

type Prize = {
  id: string
  name: string
  description: string
  isOpen: boolean
  subscribers: number[]
  winner?: number
  drawDate: string // ISO string format
}

type UserDetailsProps = {
  userId: number
  prizes: Prize[]
  onClose: () => void
}

interface GiveawaysMainProps {
  giveaways: (Giveaway & {
    participants: User[]
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
}

export default function GiveawaysMain({
  giveaways,
  token,
  drawDate,
  distinctDates,
  statusCounts,
}: GiveawaysMainProps) {
  const router = useRouter()
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentPrizeId, setCurrentPrizeId] = useState<string | null>(null)
  const [showConfetti, setShowConfetti] = useState(false)
  const [drawingUsers, setDrawingUsers] = useState<User[]>([])
  const [winner, setWinner] = useState<User | null>(null)
  const { openDialogs, setOpenDialog } = useFormStore()
  // Date selection state
  const [selectedDate, setSelectedDate] = useState<string>(drawDate)

  // Pagination state for subscribers
  const [subscriberSearch, setSubscriberSearch] = useState('')
  const [currentPrizeIndex, setCurrentPrizeIndex] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const subscribersPerPage = 12

  // transition state for date selection
  const [_isPending, startTransition] = useTransition()
  const pathname = usePathname()
  const { createQueryString } = useQueryString()

  // Find all unique dates that have prizes
  const uniqueDates = distinctDates

  function onDateSelect(date: string) {
    startTransition(() => {
      router.push(
        `${pathname}?${createQueryString({
          drawDate: format(date, 'yyyy-MM-dd'),
        })}`,
      )
    })
  }

  // Get current prize for subscribers view
  // const currentPrize = filteredPrizes[currentPrizeIndex]

  // Filter and paginate subscribers
  const getFilteredSubscribers = (prize: Giveaway) => {
    if (!prize) return []

    // const filtered = prize.participants.filter((participant) => {
    //   const user = mockSubscribedUsers.find((u) => u.id === participant.id)
    //   if (!user) return false

    //   const searchLower = subscriberSearch.toLowerCase()
    //   return (
    //     user.name.toLowerCase().includes(searchLower) ||
    //     user.email.toLowerCase().includes(searchLower)
    //   )
    // })

    return []
  }

  const getPaginatedSubscribers = (subscribers: number[]) => {
    const startIndex = (currentPage - 1) * subscribersPerPage
    return subscribers.slice(startIndex, startIndex + subscribersPerPage)
  }

  // Calculate pagination values
  const getPageCount = (totalItems: number) =>
    Math.ceil(totalItems / subscribersPerPage)

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
            `Subscriptions for ${data?.updateGiveaway.name} are now closed.`,
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
        toast.success(
          `${data.setGiveawayWinnerByIndex.winner.name} has won the ${data.setGiveawayWinnerByIndex.giveaway.name}!`,
        )
      },
      onError: (error) => {
        toast.error(error.message)
      },
      context: {
        headers: {
          'api-key': env.NEXT_PUBLIC_API_KEY,
        },
      },
      refetchQueries: ['GetGiveaways'],
    },
  )

  const executeDraw = (prizeId: string) => {
    const prize = giveaways.find((p) => p.id === prizeId)
    if (!prize || prize.participants.length === 0) return

    setIsDrawing(true)
    setCurrentPrizeId(prizeId)

    // Animation for drawing
    const participants = [...prize.participants]
    const participantsCount = prize.participantsCount
    setDrawingUsers([])

    let count = 0
    const interval = setInterval(() => {
      count++
      const randomIndex = Math.floor(Math.random() * prize.participants.length)
      setDrawingUsers([prize.participants[randomIndex]])

      if (count > 20) {
        clearInterval(interval)
        const winnerIndex = Math.floor(Math.random() * participantsCount)
        const winnerId = participants[winnerIndex].id

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

        setIsDrawing(false)
        setShowConfetti(true)

        toast.custom((t) => (
          <div
            className={cn(
              'rounded-md bg-green-50 p-4 shadow',
              t && 'animate-in fade-in-0',
            )}
          >
            <div className="flex items-center">
              <Trophy className="size-6 text-green-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">
                  {winner?.name} has won the {prize.name}!
                </p>
              </div>
            </div>
          </div>
        ))

        setTimeout(() => {
          setShowConfetti(false)
          setCurrentPrizeId(null)
        }, 5000)
      }
    }, 100)
  }

  return (
    <div className="mx-auto">
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
        <div className="mt-6 flex items-center justify-between">
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
              onSelect={(date) => onDateSelect(format(date, 'yyyy-MM-dd'))}
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

          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              {giveaways.filter((g) => g.drawAt === selectedDate).length} prize
              {giveaways.filter((g) => g.drawAt === selectedDate).length !== 1
                ? 's'
                : ''}
              on this date
            </div>
            <Dialog
              open={openDialogs['giveawayCreateForm']}
              onOpenChange={(open) => setOpenDialog('giveawayCreateForm', open)}
            >
              <DialogTrigger asChild>
                <Button className="gap-2 bg-primary">
                  <Plus className="size-4" />
                  Novo sorteio
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Criar novo sorteio</DialogTitle>
                  <DialogDescription>
                    Adicione um novo sorteio para o seu sorteio. Os usuários
                    poderão se inscrever nesse sorteio.
                  </DialogDescription>
                </DialogHeader>
                <GiveawayForm />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="mt-6">
          <div className="flex-1">
            <Tabs defaultValue="prizes" className="w-full">
              <div className="flex items-center justify-between">
                <TabsList className="mb-4">
                  <TabsTrigger value="prizes" className="text-sm">
                    <Gift className="mr-2 size-4" />
                    Prizes
                  </TabsTrigger>
                  <TabsTrigger value="subscribers" className="text-sm">
                    <Users className="mr-2 size-4" />
                    Subscribers
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
                        <div className="absolute -right-12 top-7 rotate-45 bg-green-500 px-12 py-1 text-xs font-semibold text-white">
                          COMPLETED
                        </div>
                      ) : prize.status === 'OPEN' ? (
                        <div className="absolute -right-12 top-7 rotate-45 bg-blue-500 px-12 py-1 text-xs font-semibold text-white">
                          OPEN
                        </div>
                      ) : (
                        <div className="absolute -right-12 top-7 rotate-45 bg-amber-500 px-12 py-1 text-xs font-semibold text-white">
                          CLOSED
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
                        <div className="mb-4 mt-2">
                          <div className="mb-1 flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                              Subscribers
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
                        </div>

                        <div className="mb-4 flex flex-wrap gap-1">
                          {prize.participants.slice(0, 5).map((participant) => {
                            return (
                              <div
                                key={participant.id}
                                className="flex size-8 items-center justify-center rounded-full bg-muted text-xs font-medium"
                                title={participant?.name ?? ''}
                              >
                                {participant?.name?.charAt(0)}
                              </div>
                            )
                          })}
                          {prize.participantsCount > 5 && (
                            <div className="flex size-8 items-center justify-center rounded-full bg-muted text-xs font-medium">
                              +{prize.participantsCount - 5}
                            </div>
                          )}
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
                            <div className="relative h-16 overflow-hidden rounded-lg bg-background p-2">
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
                            </div>
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
                                  Winner!
                                </div>
                                {prize.winner && (
                                  <button
                                    // onClick={() =>
                                    //   handleOpenUserDetails(prize.winner.id)
                                    // }
                                    className="rounded-sm text-lg font-medium text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                                  >
                                    {prize.winner.name}
                                  </button>
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
                                  Winner
                                </div>
                                <button
                                  // onClick={() =>
                                  //   handleOpenUserDetails(prize.winner.id)
                                  // }
                                  className="rounded-sm font-semibold text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                                >
                                  {prize.winner.name}
                                </button>
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
                                ? 'Subscriptions Open'
                                : 'Subscriptions Closed'}
                            </Label>
                          </div>
                          <Button
                            onClick={() => executeDraw(prize.id)}
                            disabled={
                              isDrawing ||
                              prize.participantsCount === 0 ||
                              Boolean(prize.winner)
                            }
                            className={`${
                              prize.winner
                                ? 'bg-green-500 hover:bg-green-600'
                                : ''
                            }`}
                          >
                            {prize.winner ? (
                              <>
                                <Trophy className="mr-2 size-4" /> Drawn
                              </>
                            ) : (
                              'Execute Draw'
                            )}
                          </Button>
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
                      No prizes for this date
                    </h3>
                    <p className="mb-6 max-w-md text-muted-foreground">
                      There are no prizes scheduled for{' '}
                      {selectedDate
                        ? format(parseISO(selectedDate), 'MMMM d, yyyy')
                        : 'this date'}
                      . Create a new prize to get started.
                    </p>
                    {/* <NewPrizeDialog
                      onCreatePrize={handleCreatePrize}
                      initialDate={selectedDate}
                    /> */}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="subscribers">
                <Card>
                  <CardHeader>
                    <CardTitle>Subscribed Users</CardTitle>
                    <CardDescription>
                      All users who have subscribed to prizes on{' '}
                      {selectedDate
                        ? format(parseISO(selectedDate), 'MMMM d, yyyy')
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
                                setCurrentPrizeIndex(index)
                                setCurrentPage(1)
                                setSubscriberSearch('')
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

                        {giveaways[currentPrizeIndex] && (
                          <>
                            {/* Search and pagination controls */}
                            <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                              <div className="relative w-full sm:w-64">
                                <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                                <Input
                                  type="search"
                                  placeholder="Search subscribers..."
                                  className="pl-8"
                                  value={subscriberSearch}
                                  onChange={(e) => {
                                    setSubscriberSearch(e.target.value)
                                    setCurrentPage(1)
                                  }}
                                />
                              </div>

                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span>
                                  {
                                    giveaways[currentPrizeIndex]
                                      .participantsCount
                                  }
                                  total subscribers
                                </span>
                                {subscriberSearch && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSubscriberSearch('')}
                                    className="h-7 px-2 text-xs"
                                  >
                                    Clear
                                  </Button>
                                )}
                              </div>
                            </div>

                            {/* Subscribers list */}
                            <div>
                              {(() => {
                                const filteredSubscribers =
                                  getFilteredSubscribers(
                                    giveaways[currentPrizeIndex],
                                  )
                                const paginatedSubscribers =
                                  getPaginatedSubscribers(filteredSubscribers)
                                const pageCount = getPageCount(
                                  filteredSubscribers.length,
                                )

                                if (filteredSubscribers.length === 0) {
                                  return (
                                    <div className="flex flex-col items-center justify-center py-12 text-center">
                                      <p className="text-muted-foreground">
                                        {subscriberSearch
                                          ? 'No subscribers match your search.'
                                          : 'No subscribers for this prize yet.'}
                                      </p>
                                    </div>
                                  )
                                }

                                return (
                                  <>
                                    <div className="mb-4 grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
                                      {paginatedSubscribers.map(
                                        (subscriberId) => {
                                          const user = mockSubscribedUsers.find(
                                            (u) => u.id === subscriberId,
                                          )
                                          const isWinner = false

                                          return (
                                            <div
                                              key={subscriberId}
                                              className={`flex items-center gap-3 rounded-md p-3 ${
                                                isWinner
                                                  ? 'bg-green-50 dark:bg-green-900/20'
                                                  : 'bg-muted/50'
                                              }`}
                                            >
                                              <div className="flex size-8 items-center justify-center rounded-full bg-background text-xs font-medium">
                                                {user?.name.charAt(0)}
                                                {user?.name
                                                  .split(' ')[1]
                                                  ?.charAt(0)}
                                              </div>
                                              <div className="min-w-0 flex-1">
                                                <div className="truncate font-medium">
                                                  {isWinner ? (
                                                    <button
                                                      // onClick={() =>
                                                      //   handleOpenUserDetails(
                                                      //     subscriberId,
                                                      //   )
                                                      // }
                                                      className="rounded-sm text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                                                    >
                                                      {user?.name}
                                                    </button>
                                                  ) : (
                                                    <button
                                                      // onClick={() =>
                                                      //   handleOpenUserDetails(
                                                      //     subscriberId,
                                                      //   )
                                                      // }
                                                      className="rounded-sm hover:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                                                    >
                                                      {user?.name}
                                                    </button>
                                                  )}
                                                </div>
                                                <div className="truncate text-xs text-muted-foreground">
                                                  {user?.email}
                                                </div>
                                              </div>
                                              {isWinner && (
                                                <Trophy className="size-4 shrink-0 text-yellow-500" />
                                              )}
                                            </div>
                                          )
                                        },
                                      )}
                                    </div>

                                    {/* Pagination controls */}
                                    {pageCount > 1 && (
                                      <div className="flex items-center justify-between">
                                        <div className="text-sm text-muted-foreground">
                                          Showing{' '}
                                          {(currentPage - 1) *
                                            subscribersPerPage +
                                            1}
                                          -
                                          {Math.min(
                                            currentPage * subscribersPerPage,
                                            filteredSubscribers.length,
                                          )}{' '}
                                          of {filteredSubscribers.length}
                                        </div>
                                        <div className="flex gap-1">
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setCurrentPage(1)}
                                            disabled={currentPage === 1}
                                          >
                                            First
                                          </Button>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                              setCurrentPage((prev) =>
                                                Math.max(1, prev - 1),
                                              )
                                            }
                                            disabled={currentPage === 1}
                                          >
                                            Previous
                                          </Button>
                                          <div className="flex items-center gap-1 px-2">
                                            {Array.from(
                                              {
                                                length: Math.min(5, pageCount),
                                              },
                                              (_, i) => {
                                                // Show pages around current page
                                                let pageNum = currentPage
                                                if (pageCount <= 5) {
                                                  pageNum = i + 1
                                                } else if (currentPage <= 3) {
                                                  pageNum = i + 1
                                                } else if (
                                                  currentPage >=
                                                  pageCount - 2
                                                ) {
                                                  pageNum = pageCount - 4 + i
                                                } else {
                                                  pageNum = currentPage - 2 + i
                                                }

                                                return (
                                                  <Button
                                                    key={i}
                                                    variant={
                                                      currentPage === pageNum
                                                        ? 'default'
                                                        : 'outline'
                                                    }
                                                    size="sm"
                                                    className="size-8 p-0"
                                                    onClick={() =>
                                                      setCurrentPage(pageNum)
                                                    }
                                                  >
                                                    {pageNum}
                                                  </Button>
                                                )
                                              },
                                            )}
                                          </div>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                              setCurrentPage((prev) =>
                                                Math.min(pageCount, prev + 1),
                                              )
                                            }
                                            disabled={currentPage === pageCount}
                                          >
                                            Next
                                          </Button>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                              setCurrentPage(pageCount)
                                            }
                                            disabled={currentPage === pageCount}
                                          >
                                            Last
                                          </Button>
                                        </div>
                                      </div>
                                    )}
                                  </>
                                )
                              })()}
                            </div>
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <p className="text-muted-foreground">
                          No prizes available for this date.
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

      {/* User Details Dialog */}
      {/* {selectedUserId && (
        <Dialog open={userDetailsOpen} onOpenChange={setUserDetailsOpen}>
          <DialogContent className="sm:max-w-md md:max-w-lg">
            <UserDetails
              userId={selectedUserId}
              prizes={prizes}
              onClose={() => setUserDetailsOpen(false)}
            />
          </DialogContent>
        </Dialog>
      )} */}

      {showConfetti && <ConfettiEffect />}
    </div>
  )
}

function UserDetails({ userId, prizes, onClose }: UserDetailsProps) {
  const user = mockSubscribedUsers.find((u) => u.id === userId)

  if (!user) return <div>User not found</div>

  // Find prizes the user has subscribed to
  const subscribedPrizes = prizes.filter((prize) =>
    prize.subscribers.includes(userId),
  )

  // Find prizes the user has won
  const wonPrizes = prizes.filter((prize) => prize.winner === userId)

  return (
    <>
      <DialogHeader>
        <DialogTitle>User Details</DialogTitle>
        <DialogDescription>
          Detailed information about this user and their participation in draws
        </DialogDescription>
      </DialogHeader>

      <div className="py-4">
        <div className="mb-6 flex items-center gap-4">
          <Avatar className="size-16 border-2 border-primary/20">
            <AvatarFallback className="bg-primary/10 text-lg text-primary">
              {user.avatar}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-xl font-bold">{user.name}</h3>
            <div className="flex items-center text-sm text-muted-foreground">
              <Mail className="mr-1 size-3" />
              {user.email}
            </div>
            <div className="mt-1 flex items-center gap-2">
              {wonPrizes.length > 0 && (
                <Badge className="bg-yellow-500">
                  <Trophy className="mr-1 size-3" /> Winner
                </Badge>
              )}
              <Badge variant="outline" className="text-xs">
                ID: {user.id}
              </Badge>
            </div>
          </div>
        </div>

        <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-muted-foreground">
              Location
            </h4>
            <p>{user.location}</p>
          </div>
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-muted-foreground">
              Phone
            </h4>
            <p>{user.phone}</p>
          </div>
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-muted-foreground">
              Joined
            </h4>
            <p>{format(parseISO(user.joinDate), 'MMMM d, yyyy')}</p>
          </div>
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-muted-foreground">
              Subscribed to
            </h4>
            <p>
              {subscribedPrizes.length} prize
              {subscribedPrizes.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <Separator className="my-4" />

        <div className="space-y-4">
          <h4 className="font-medium">Prize Participation</h4>

          {subscribedPrizes.length > 0 ? (
            <div className="space-y-3">
              {subscribedPrizes.map((prize) => {
                const isWinner = prize.winner === userId

                return (
                  <div
                    key={prize.id}
                    className={`rounded-lg border p-3 ${
                      isWinner
                        ? 'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-900/20'
                        : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className={`rounded-full p-1.5 ${
                            isWinner ? 'bg-yellow-100' : 'bg-primary/10'
                          }`}
                        >
                          {isWinner ? (
                            <Trophy className="size-4 text-yellow-600" />
                          ) : (
                            <Gift className="size-4 text-primary" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium">{prize.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {format(parseISO(prize.drawDate), 'MMMM d, yyyy')}
                          </div>
                        </div>
                      </div>
                      {isWinner && (
                        <Badge className="bg-green-500">Winner</Badge>
                      )}
                    </div>
                    {isWinner && (
                      <div className="mt-2 text-sm text-green-600 dark:text-green-400">
                        This user won this prize!
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="py-4 text-center text-muted-foreground">
              This user hasnt subscribed to any prizes yet.
            </div>
          )}
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </DialogFooter>
    </>
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
          {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'Select date'}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
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
              <h4 className="text-sm font-medium">Go to date with prizes</h4>
              <div className="flex flex-wrap gap-1">
                {presetDates.map((date, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => {
                      onSelect(date)
                      setOpen(false)
                    }}
                  >
                    {format(date, 'MMM d')}
                  </Button>
                ))}
              </div>
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
