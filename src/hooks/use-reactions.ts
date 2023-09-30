import { gql, useMutation, type ApolloClient } from '@apollo/client'
import { toast } from 'sonner'

const TOGGLE_REACTION = gql`
  mutation ToggleReaction($input: ToggleSaleReactionInput!) {
    response: toggleSaleReaction(toggleSaleReactionInput: $input) {
      reaction {
        id
      }
      state
    }
  }
`

export function useReactions({
  saleId,
  userId,
  apolloClient,
}: {
  saleId: string
  userId?: string
  apolloClient: ApolloClient<unknown>
}) {
  const [toggleReaction] = useMutation<{
    response: {
      reaction: { id: string }
      state: boolean
    }
  }>(TOGGLE_REACTION, {
    onError(error, _clientOptions) {
      toast.error(error.message)
    },
    update(_, { data }, { variables }) {
      if (!data) return

      const saleInCache = apolloClient.readFragment({
        id: `Sale:${saleId}`,
        fragment: gql`
          fragment ExistingSale on Sale {
            reactions {
              __typename
              id
              content
              userId
            }
          }
        `,
        variables: { saleId },
      })

      if (!saleInCache) {
        return
      }

      let updatedReactions = saleInCache.reactions || []

      if (data.response.state) {
        updatedReactions = [
          ...updatedReactions,
          {
            __typename: 'SaleReaction',
            id: data.response.reaction.id,
            content: variables?.input.content,
            userId: userId,
          },
        ]
      } else {
        updatedReactions = updatedReactions.filter(
          (reaction: { id: string }) =>
            reaction.id !== data.response.reaction.id,
        )
      }

      apolloClient.writeFragment({
        id: `Sale:${saleId}`,
        fragment: gql`
          fragment UpdatedSale on Sale {
            reactions
          }
        `,
        data: {
          __typename: 'Sale',
          id: saleId,
          reactions: updatedReactions,
        },
      })
    },
  })

  return { toggleReaction }
}
