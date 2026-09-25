'use client'

import {
  gql,
  useApolloClient,
  useMutation,
  useQuery,
  type Reference,
} from '@apollo/client'
import { useRef, useState } from 'react'
import { toast } from 'sonner'

const GET_PARTICIPATION = gql`
  query GetMyGiveawayParticipation($userId: String!) {
    user: getUser(id: $userId) {
      id
      giveaways {
        id
      }
    }
  }
`
const JOIN = gql`
  mutation SubscribeToGiveaway($giveawayId: ID!) {
    addUserToGiveaway(giveawayId: $giveawayId) {
      id
    }
  }
`
const LEAVE = gql`
  mutation LeaveGiveaway($giveawayId: ID!) {
    removeUserFromGiveaway(giveawayId: $giveawayId) {
      id
    }
  }
`

type ParticipationData = {
  user: { id: string; giveaways: { id: string; __typename?: string }[] } | null
}
type PendingAction = 'joining' | 'leaving' | 'checking'

export function useGiveawayParticipation(userId?: string, token?: string) {
  const client = useApolloClient()
  const enabled = Boolean(userId && token)
  const context = { headers: { Authorization: `Bearer ${token}` } }
  const { data, loading, error, refetch } = useQuery<ParticipationData>(
    GET_PARTICIPATION,
    {
      variables: { userId },
      skip: !enabled,
      context,
      fetchPolicy: 'cache-first',
      notifyOnNetworkStatusChange: true,
    },
  )
  const [join] = useMutation(JOIN, { context })
  const [leave] = useMutation(LEAVE, { context })
  const inFlight = useRef(new Set<string>())
  const [pending, setPending] = useState<
    Record<string, PendingAction | undefined>
  >({})
  const [uncertain, setUncertain] = useState<Record<string, boolean>>({})
  const [retrying, setRetrying] = useState(false)
  const retryLock = useRef(false)

  function setMembership(giveawayId: string, subscribed: boolean) {
    const previous = client.readQuery<ParticipationData>({
      query: GET_PARTICIPATION,
      variables: { userId },
    })
    if (!previous?.user) return
    client.cache.modify({
      id: client.cache.identify(previous.user),
      fields: {
        giveaways(
          existing: readonly Reference[] = [],
          { readField, toReference },
        ) {
          const next = existing.filter(
            (item) => readField('id', item) !== giveawayId,
          )
          if (subscribed) {
            const giveaway = toReference(
              { __typename: 'Giveaway', id: giveawayId },
              true,
            )
            if (giveaway) next.push(giveaway)
          }
          return next
        },
      },
    })
    setUncertain((current) => ({ ...current, [giveawayId]: false }))
  }

  async function readMembership(giveawayId: string) {
    // Don't replace the whole cache: another giveaway's mutation may have
    // completed while this request was in flight.
    const result = await client.query<ParticipationData>({
      query: GET_PARTICIPATION,
      variables: { userId },
      context,
      fetchPolicy: 'no-cache',
    })
    if (!result.data.user)
      throw new Error('Não foi possível verificar sua inscrição.')
    const subscribed = result.data.user.giveaways.some(
      (item) => item.id === giveawayId,
    )
    setMembership(giveawayId, subscribed)
    return subscribed
  }

  async function changeParticipation(giveawayId: string, subscribed: boolean) {
    if (
      !enabled ||
      !data?.user ||
      loading ||
      error ||
      inFlight.current.has(giveawayId) ||
      uncertain[giveawayId]
    )
      return
    inFlight.current.add(giveawayId)
    setPending((current) => ({
      ...current,
      [giveawayId]: subscribed ? 'joining' : 'leaving',
    }))
    try {
      const result = await (subscribed ? join : leave)({
        variables: { giveawayId },
      })
      const confirmed = subscribed
        ? result.data?.addUserToGiveaway
        : result.data?.removeUserFromGiveaway
      if (confirmed?.id !== giveawayId)
        throw new Error('Não foi possível confirmar sua inscrição.')
      setMembership(giveawayId, subscribed)
      toast.success(
        subscribed
          ? 'Inscrição realizada com sucesso!'
          : 'Você saiu do sorteio!',
      )
    } catch (failure) {
      setPending((current) => ({ ...current, [giveawayId]: 'checking' }))
      try {
        const actual = await readMembership(giveawayId)
        if (actual === subscribed) {
          toast.success(
            actual
              ? 'Sua participação está confirmada!'
              : 'Você não está inscrito neste sorteio.',
          )
        } else {
          toast.error(
            failure instanceof Error
              ? failure.message
              : 'Não foi possível alterar sua inscrição.',
          )
        }
      } catch {
        setUncertain((current) => ({ ...current, [giveawayId]: true }))
        toast.error(
          'Não foi possível confirmar sua inscrição. Verifique o status antes de tentar novamente.',
        )
      }
    } finally {
      inFlight.current.delete(giveawayId)
      setPending((current) => ({ ...current, [giveawayId]: undefined }))
    }
  }

  async function verify(giveawayId: string) {
    if (!enabled || inFlight.current.has(giveawayId)) return
    inFlight.current.add(giveawayId)
    setPending((current) => ({ ...current, [giveawayId]: 'checking' }))
    try {
      await readMembership(giveawayId)
    } catch {
      toast.error(
        'Não foi possível verificar sua inscrição. Tente novamente em instantes.',
      )
    } finally {
      inFlight.current.delete(giveawayId)
      setPending((current) => ({ ...current, [giveawayId]: undefined }))
    }
  }

  async function retry() {
    if (retryLock.current) return
    retryLock.current = true
    setRetrying(true)
    try {
      await refetch()
    } catch {
      toast.error('Não foi possível carregar suas inscrições.')
    } finally {
      retryLock.current = false
      setRetrying(false)
    }
  }

  return {
    enabled,
    loading: enabled && (loading || retrying),
    unavailable: enabled && Boolean(error || (!loading && !data?.user)),
    subscribedIds: new Set(
      enabled ? (data?.user?.giveaways.map((item) => item.id) ?? []) : [],
    ),
    pending,
    uncertain,
    changeParticipation,
    verify,
    retry,
  }
}
