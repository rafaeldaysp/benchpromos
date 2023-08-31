import { gql, useMutation, type ApolloClient } from '@apollo/client'
import { toast } from 'sonner'

import { GET_SALES, type GetSalesQuery } from '@/queries'

const TOGGLE_REACTION = gql`
  mutation ToggleReaction($input: ToggleSaleReactionInput!) {
    reaction: toggleSaleReaction(toggleSaleReactionInput: $input) {
      content
    }
  }
`

interface ReactionHookProps {
  saleId: string
  userId: string
  apolloClient: ApolloClient<unknown>
}

export function useReactions({
  saleId,
  userId,
  apolloClient,
}: ReactionHookProps) {
  const [toggleReaction] = useMutation<{ reaction: { content: string } }>(
    TOGGLE_REACTION,
    {
      onError(error, _clientOptions) {
        toast.error(error.message)
      },
      onCompleted({ reaction: newReaction }, _clientOptions) {
        try {
          const cachedData = apolloClient.cache.readQuery<GetSalesQuery>({
            query: GET_SALES,
            variables: {
              paginationInput: {
                limit: 1,
                page: 1,
              },
            },
          })

          if (!cachedData) return

          const { sales } = cachedData
          const updatedSales = sales.map((sale) => {
            if (sale.id !== saleId) {
              return sale
            }

            const existingReaction = sale.reactions.find(
              (reaction) => reaction.content === newReaction.content,
            )

            if (!existingReaction) {
              return {
                ...sale,
                reactions: [
                  ...sale.reactions,
                  {
                    content: newReaction.content,
                    users: [{ id: userId }],
                  },
                ],
              }
            }

            const updatedReactions = sale.reactions.map((reaction) => {
              if (reaction.content !== newReaction.content) {
                return reaction
              }

              const userReacted = reaction.users.some(
                (user) => user.id === userId,
              )

              const updatedUsers = userReacted
                ? reaction.users.filter((user) => user.id !== userId)
                : [...reaction.users, { id: userId }]

              return {
                ...reaction,
                users: updatedUsers,
              }
            })

            return {
              ...sale,
              reactions: updatedReactions.filter(
                (reaction) => reaction.users.length > 0,
              ),
            }
          })

          apolloClient.cache.writeQuery<GetSalesQuery>({
            query: GET_SALES,
            variables: {
              paginationInput: {
                limit: 1,
                page: 1,
              },
            },
            data: { sales: updatedSales },
          })
        } catch (error) {
          console.error('Error updating cache:', error)
        }
      },
    },
  )

  return { toggleReaction }
}
