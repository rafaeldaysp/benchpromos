'use client'

import { type ApolloClient } from '@apollo/client'

import { getCurrentUserToken } from '@/app/_actions/user'
import { Toggle } from '@/components/ui/toggle'
import { emotes } from '@/constants'
import { useReactions } from '@/hooks/use-reactions'

interface ReactionsProps {
  saleId: string
  userId?: string
  reactions: { content: string; userId: string }[]
  apolloClient: ApolloClient<unknown>
  setOpenLoginPopup: React.Dispatch<React.SetStateAction<boolean>>
}

type GroupedReaction = {
  content: string
  userIds: string[]
}

export function Reactions({
  saleId,
  userId,
  reactions,
  apolloClient,
  setOpenLoginPopup,
}: ReactionsProps) {
  const { toggleReaction } = useReactions({ saleId, userId, apolloClient })

  async function handleToggleReaction(emote: string) {
    if (!userId) {
      setOpenLoginPopup(true)
      return
    }

    const token = await getCurrentUserToken()

    await toggleReaction({
      context: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      variables: {
        input: {
          saleId,
          content: emote,
        },
      },
    })
  }

  const groupedReactions: GroupedReaction[] = reactions.reduce(
    (acc, reaction) => {
      const { content, userId } = reaction

      const existingGroup = acc.find((group) => group.content === content)

      if (existingGroup) {
        existingGroup.userIds.push(userId)
      } else {
        acc.push({ content, userIds: [userId] })
      }

      return acc
    },
    [] as GroupedReaction[],
  )

  const emotesSorted = emotes.map((emoteObj) => ({
    ...emoteObj,
    count: groupedReactions
      .filter((reaction) => reaction.content === emoteObj.emote)
      .reduce((total, reaction) => total + reaction.userIds.length, 0),
  }))

  emotesSorted.sort((a, b) => b.count - a.count)

  return (
    <div className="flex flex-wrap gap-1">
      {emotesSorted.map((emote) => {
        const reaction = groupedReactions.find(
          (reaction) => reaction.content === emote.emote,
        )
        const userReacted =
          userId && reaction ? reaction.userIds.includes(userId) : false

        return (
          <Toggle
            key={emote.emote}
            pressed={userReacted}
            className="h-fit rounded-full p-0 px-1.5 text-center"
            variant="outline"
            onClick={() => handleToggleReaction(emote.emote)}
          >
            {emote.emote}
            {reaction?.userIds.length && (
              <span className="ml-0.5 text-xs">{reaction?.userIds.length}</span>
            )}
          </Toggle>
        )
      })}
    </div>
  )
}
