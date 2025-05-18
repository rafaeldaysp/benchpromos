'use client'

import React from 'react'

import { useState, useEffect } from 'react'
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
import { format, parseISO } from 'date-fns'

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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'

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

export default function GiveawaysMain() {
  const [prizes, setPrizes] = useState<Prize[]>([
    {
      id: '1',
      name: 'Premium Subscription',
      description: '1 year of premium subscription',
      isOpen: true,
      subscribers: Array.from({ length: 35 }, (_, i) => i + 1), // 35 subscribers
      drawDate: '2025-05-15', // Yesterday
    },
    {
      id: '2',
      name: 'Gift Card',
      description: '$50 Amazon gift card',
      isOpen: true,
      subscribers: Array.from({ length: 42 }, (_, i) => i + 20), // 42 subscribers
      drawDate: '2025-05-16', // Today
      winner: 25, // Set a winner for this prize
    },
    {
      id: '3',
      name: 'Wireless Headphones',
      description: 'Premium noise-cancelling headphones',
      isOpen: true,
      subscribers: Array.from({ length: 28 }, (_, i) => i + 15), // 28 subscribers
      drawDate: '2025-05-16', // Today
    },
    {
      id: '4',
      name: 'Smart Watch',
      description: 'Latest model smart watch',
      isOpen: true,
      subscribers: Array.from({ length: 50 }, (_, i) => i + 10), // 50 subscribers
      drawDate: '2025-05-20', // Future date
    },
  ])

  const [isDrawing, setIsDrawing] = useState(false)
  const [currentPrizeId, setCurrentPrizeId] = useState<string | null>(null)
  const [showConfetti, setShowConfetti] = useState(false)
  const [drawingUsers, setDrawingUsers] = useState<number[]>([])

  // User details dialog state
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null)
  const [userDetailsOpen, setUserDetailsOpen] = useState(false)

  // Date selection state
  const [selectedDate, setSelectedDate] = useState<string>('')

  // Pagination state for subscribers
  const [subscriberSearch, setSubscriberSearch] = useState('')
  const [currentPrizeIndex, setCurrentPrizeIndex] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const subscribersPerPage = 12

  // Find all unique dates that have prizes
  const uniqueDates = Array.from(
    new Set(prizes.map((prize) => prize.drawDate)),
  ).sort()

  // Initialize with the most recent date that has prizes
  useEffect(() => {
    if (uniqueDates.length > 0 && !selectedDate) {
      setSelectedDate(uniqueDates[uniqueDates.length - 1])
    }
  }, [uniqueDates, selectedDate])

  // Filter prizes by the selected date
  const filteredPrizes = prizes.filter(
    (prize) => prize.drawDate === selectedDate,
  )

  // Reset pagination when changing date or prize
  useEffect(() => {
    setCurrentPage(1)
    if (filteredPrizes.length > 0) {
      setCurrentPrizeIndex(0)
    }
  }, [selectedDate, filteredPrizes.length])

  // Get current prize for subscribers view
  const currentPrize = filteredPrizes[currentPrizeIndex]

  // Open user details dialog
  const handleOpenUserDetails = (userId: number) => {
    setSelectedUserId(userId)
    setUserDetailsOpen(true)
  }

  // Filter and paginate subscribers
  const getFilteredSubscribers = (prize: Prize) => {
    if (!prize) return []

    const filtered = prize.subscribers.filter((subscriberId) => {
      const user = mockSubscribedUsers.find((u) => u.id === subscriberId)
      if (!user) return false

      const searchLower = subscriberSearch.toLowerCase()
      return (
        user.name.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower)
      )
    })

    return filtered
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
      setSelectedDate(uniqueDates[currentIndex - 1])
    }
  }

  // Navigate to next date
  const goToNextDate = () => {
    const currentIndex = uniqueDates.indexOf(selectedDate)
    if (currentIndex < uniqueDates.length - 1) {
      setSelectedDate(uniqueDates[currentIndex + 1])
    }
  }

  const handleCreatePrize = (
    name: string,
    description: string,
    drawDate: string,
  ) => {
    const newPrize: Prize = {
      id: Date.now().toString(),
      name,
      description,
      isOpen: true,
      subscribers: [],
      drawDate,
    }
    setPrizes([...prizes, newPrize])

    // If this is a new date, select it
    if (!uniqueDates.includes(drawDate)) {
      setSelectedDate(drawDate)
    }

    toast.success(
      `${name} has been added to the prize list for ${format(
        parseISO(drawDate),
        'MMMM d, yyyy',
      )}.`,
    )
  }

  const toggleSubscription = (prizeId: string) => {
    setPrizes(
      prizes.map((prize) =>
        prize.id === prizeId ? { ...prize, isOpen: !prize.isOpen } : prize,
      ),
    )
    const prize = prizes.find((p) => p.id === prizeId)

    if (prize?.isOpen) {
      toast.success(`Subscriptions for ${prize.name} are now open.`)
    } else {
      toast.error(`Subscriptions for ${prize?.name} are now closed.`)
    }
  }

  const executeDraw = (prizeId: string) => {
    const prize = prizes.find((p) => p.id === prizeId)
    if (!prize || prize.subscribers.length === 0) return

    setIsDrawing(true)
    setCurrentPrizeId(prizeId)

    // Animation for drawing
    const subscribers = [...prize.subscribers]
    setDrawingUsers([])

    let count = 0
    const interval = setInterval(() => {
      count++
      const randomIndex = Math.floor(Math.random() * subscribers.length)
      setDrawingUsers([subscribers[randomIndex]])

      if (count > 20) {
        clearInterval(interval)
        const winnerIndex = Math.floor(Math.random() * subscribers.length)
        const winnerId = subscribers[winnerIndex]

        // Update prize with winner
        setPrizes(
          prizes.map((p) =>
            p.id === prizeId ? { ...p, winner: winnerId } : p,
          ),
        )

        setIsDrawing(false)
        setShowConfetti(true)

        const winner = mockSubscribedUsers.find((user) => user.id === winnerId)

        toast.custom((t) => (
          <div
            className={cn(
              'rounded-md bg-green-50 p-4 shadow',
              t && 'animate-in fade-in-0',
            )}
          >
            <div className="flex items-center">
              <Trophy className="h-6 w-6 text-green-500" />
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
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10"></div>
          <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-white/10"></div>
          <div className="relative z-10">
            <h1 className="text-3xl font-bold">Lucky Draw System</h1>
            <p className="mt-2 max-w-2xl opacity-90">
              Manage prizes and conduct exciting draws for your subscribers.
              Create new prizes, control subscriptions, and draw winners with
              engaging animations.
            </p>
            <div className="mt-4 flex gap-4">
              <div className="rounded-lg bg-white/20 px-4 py-2 backdrop-blur-sm">
                <div className="text-sm opacity-80">Total Prizes</div>
                <div className="text-2xl font-bold">{prizes.length}</div>
              </div>
              <div className="rounded-lg bg-white/20 px-4 py-2 backdrop-blur-sm">
                <div className="text-sm opacity-80">Active Draws</div>
                <div className="text-2xl font-bold">
                  {prizes.filter((p) => p.isOpen && !p.winner).length}
                </div>
              </div>
              <div className="rounded-lg bg-white/20 px-4 py-2 backdrop-blur-sm">
                <div className="text-sm opacity-80">Completed</div>
                <div className="text-2xl font-bold">
                  {prizes.filter((p) => p.winner).length}
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
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <DatePickerWithPresets
              selectedDate={selectedDate ? parseISO(selectedDate) : undefined}
              onSelect={(date) => setSelectedDate(format(date, 'yyyy-MM-dd'))}
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
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              {filteredPrizes.length} prize
              {filteredPrizes.length !== 1 ? 's' : ''} on this date
            </div>
            <NewPrizeDialog
              onCreatePrize={handleCreatePrize}
              initialDate={selectedDate}
            />
          </div>
        </div>

        <div className="mt-6">
          <div className="flex-1">
            <Tabs defaultValue="prizes" className="w-full">
              <div className="flex items-center justify-between">
                <TabsList className="mb-4">
                  <TabsTrigger value="prizes" className="text-sm">
                    <Gift className="mr-2 h-4 w-4" />
                    Prizes
                  </TabsTrigger>
                  <TabsTrigger value="subscribers" className="text-sm">
                    <Users className="mr-2 h-4 w-4" />
                    Subscribers
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="prizes" className="space-y-4">
                {filteredPrizes.length > 0 ? (
                  filteredPrizes.map((prize) => (
                    <Card
                      key={prize.id}
                      className="relative overflow-hidden border-2 transition-all hover:shadow-md"
                    >
                      {/* Prize status ribbon */}
                      {prize.winner ? (
                        <div className="absolute -right-12 top-7 rotate-45 bg-green-500 px-12 py-1 text-xs font-semibold text-white">
                          COMPLETED
                        </div>
                      ) : prize.isOpen ? (
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
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                            <Gift className="h-6 w-6 text-primary" />
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
                              {prize.subscribers.length}
                            </span>
                          </div>
                          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-primary transition-all"
                              style={{
                                width: `${Math.min(
                                  100,
                                  (prize.subscribers.length / 100) * 100,
                                )}%`,
                              }}
                            ></div>
                          </div>
                        </div>

                        <div className="mb-4 flex flex-wrap gap-1">
                          {prize.subscribers.slice(0, 5).map((subscriberId) => {
                            const user = mockSubscribedUsers.find(
                              (u) => u.id === subscriberId,
                            )
                            return (
                              <div
                                key={subscriberId}
                                className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-medium"
                                title={user?.name}
                              >
                                {user?.name.charAt(0)}
                                {user?.name.split(' ')[1]?.charAt(0)}
                              </div>
                            )
                          })}
                          {prize.subscribers.length > 5 && (
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-medium">
                              +{prize.subscribers.length - 5}
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
                                <RefreshCw className="h-10 w-10 text-primary" />
                              </motion.div>
                            </div>
                            <div className="mb-3 text-center text-lg font-bold">
                              Drawing winner...
                            </div>
                            <div className="relative h-16 overflow-hidden rounded-lg bg-background p-2">
                              {drawingUsers.map((userId) => {
                                const user = mockSubscribedUsers.find(
                                  (u) => u.id === userId,
                                )
                                return (
                                  <motion.div
                                    key={userId}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className="absolute inset-0 flex items-center justify-center text-center text-lg font-semibold"
                                  >
                                    {user?.name}
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
                                  <Trophy className="h-8 w-8 text-yellow-600" />
                                </div>
                                <div className="mb-2 text-xl font-bold">
                                  Winner!
                                </div>
                                {prize.winner && (
                                  <button
                                    onClick={() =>
                                      handleOpenUserDetails(prize.winner!)
                                    }
                                    className="rounded-sm text-lg font-medium text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                                  >
                                    {
                                      mockSubscribedUsers.find(
                                        (u) => u.id === prize.winner,
                                      )?.name
                                    }
                                  </button>
                                )}
                              </div>
                            </div>
                          )}

                        {prize.winner && currentPrizeId !== prize.id && (
                          <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-900/20">
                            <div className="flex items-center gap-3">
                              <div className="shrink-0 rounded-full bg-yellow-100 p-2">
                                <Trophy className="h-5 w-5 text-yellow-600" />
                              </div>
                              <div>
                                <div className="text-sm text-muted-foreground">
                                  Winner
                                </div>
                                <button
                                  onClick={() =>
                                    handleOpenUserDetails(prize.winner!)
                                  }
                                  className="rounded-sm font-semibold text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                                >
                                  {
                                    mockSubscribedUsers.find(
                                      (u) => u.id === prize.winner,
                                    )?.name
                                  }
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
                              checked={prize.isOpen}
                              onCheckedChange={() =>
                                toggleSubscription(prize.id)
                              }
                              className="data-[state=checked]:bg-green-500"
                            />
                            <Label
                              htmlFor={`subscription-${prize.id}`}
                              className="text-sm font-medium"
                            >
                              {prize.isOpen
                                ? 'Subscriptions Open'
                                : 'Subscriptions Closed'}
                            </Label>
                          </div>
                          <Button
                            onClick={() => executeDraw(prize.id)}
                            disabled={
                              isDrawing ||
                              prize.subscribers.length === 0 ||
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
                                <Trophy className="mr-2 h-4 w-4" /> Drawn
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
                      <Gift className="h-10 w-10 text-muted-foreground" />
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
                    <NewPrizeDialog
                      onCreatePrize={handleCreatePrize}
                      initialDate={selectedDate}
                    />
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
                    {filteredPrizes.length > 0 ? (
                      <div className="space-y-6">
                        {/* Prize selector tabs */}
                        <div className="-mx-1 flex overflow-x-auto pb-2">
                          {filteredPrizes.map((prize, index) => (
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
                                {prize.subscribers.length}
                              </span>
                            </Button>
                          ))}
                        </div>

                        {currentPrize && (
                          <>
                            {/* Search and pagination controls */}
                            <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                              <div className="relative w-full sm:w-64">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
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
                                  {currentPrize.subscribers.length} total
                                  subscribers
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
                                  getFilteredSubscribers(currentPrize)
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
                                          const isWinner =
                                            currentPrize.winner === subscriberId

                                          return (
                                            <div
                                              key={subscriberId}
                                              className={`flex items-center gap-3 rounded-md p-3 ${
                                                isWinner
                                                  ? 'bg-green-50 dark:bg-green-900/20'
                                                  : 'bg-muted/50'
                                              }`}
                                            >
                                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-background text-xs font-medium">
                                                {user?.name.charAt(0)}
                                                {user?.name
                                                  .split(' ')[1]
                                                  ?.charAt(0)}
                                              </div>
                                              <div className="min-w-0 flex-1">
                                                <div className="truncate font-medium">
                                                  {isWinner ? (
                                                    <button
                                                      onClick={() =>
                                                        handleOpenUserDetails(
                                                          subscriberId,
                                                        )
                                                      }
                                                      className="rounded-sm text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                                                    >
                                                      {user?.name}
                                                    </button>
                                                  ) : (
                                                    <button
                                                      onClick={() =>
                                                        handleOpenUserDetails(
                                                          subscriberId,
                                                        )
                                                      }
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
                                                <Trophy className="h-4 w-4 shrink-0 text-yellow-500" />
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
                                                    className="h-8 w-8 p-0"
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
      {selectedUserId && (
        <Dialog open={userDetailsOpen} onOpenChange={setUserDetailsOpen}>
          <DialogContent className="sm:max-w-md md:max-w-lg">
            <UserDetails
              userId={selectedUserId}
              prizes={prizes}
              onClose={() => setUserDetailsOpen(false)}
            />
          </DialogContent>
        </Dialog>
      )}

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
          <Avatar className="h-16 w-16 border-2 border-primary/20">
            <AvatarFallback className="bg-primary/10 text-lg text-primary">
              {user.avatar}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-xl font-bold">{user.name}</h3>
            <div className="flex items-center text-sm text-muted-foreground">
              <Mail className="mr-1 h-3 w-3" />
              {user.email}
            </div>
            <div className="mt-1 flex items-center gap-2">
              {wonPrizes.length > 0 && (
                <Badge className="bg-yellow-500">
                  <Trophy className="mr-1 h-3 w-3" /> Winner
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
                            <Trophy className="h-4 w-4 text-yellow-600" />
                          ) : (
                            <Gift className="h-4 w-4 text-primary" />
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
          <CalendarIcon className="mr-2 h-4 w-4" />
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

function NewPrizeDialog({
  onCreatePrize,
  initialDate = '',
}: {
  onCreatePrize: (name: string, description: string, drawDate: string) => void
  initialDate?: string
}) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [drawDate, setDrawDate] = useState<Date | undefined>(
    initialDate ? parseISO(initialDate) : new Date(),
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim() && drawDate) {
      onCreatePrize(name, description, format(drawDate, 'yyyy-MM-dd'))
      setName('')
      setDescription('')
      setDrawDate(new Date())
      setOpen(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(open) => setOpen(open)}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-primary">
          <Plus className="h-4 w-4" />
          New Prize
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Prize</DialogTitle>
            <DialogDescription>
              Add a new prize for your lucky draw. Users will be able to
              subscribe to this prize.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="prize-name">Prize Name</Label>
              <Input
                id="prize-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter prize name"
                className="border-primary/20 focus-visible:ring-primary"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="prize-description">Description</Label>
              <Textarea
                id="prize-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the prize"
                className="border-primary/20 focus-visible:ring-primary"
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <Label>Draw Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !drawDate && 'text-muted-foreground',
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {drawDate
                      ? format(drawDate, 'MMMM d, yyyy')
                      : 'Select date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={drawDate}
                    onSelect={setDrawDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim() || !drawDate}>
              Create Prize
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
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
