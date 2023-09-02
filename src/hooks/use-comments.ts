import { gql, useMutation } from '@apollo/client'
import { useQuery } from '@apollo/experimental-nextjs-app-support/ssr'
import { type Session } from 'next-auth'
import { toast } from 'sonner'

import { type Comment } from '@/types'

const GET_COMMENTS = gql`
  query GetComments($saleId: ID!, $paginationInput: PaginationInput) {
    comments(saleId: $saleId, paginationInput: $paginationInput) {
      id
      text
      createdAt
      user {
        name
        image
      }
      likes {
        user {
          id
        }
      }
      replies {
        id
        text
        createdAt
        user {
          name
          image
        }
        likes {
          user {
            id
          }
        }
      }
    }
  }
`

type GetCommentsQuery = {
  comments: (Pick<Comment, 'id' | 'text' | 'createdAt'> & {
    user: { name: string; image: string }
    likes: {
      user: {
        id: string
      }
    }[]
    replies: Omit<GetCommentsQuery['comments'][number], 'replies'>[]
  })[]
}

const CREATE_COMMENT = gql`
  mutation CreateComment($input: CreateCommentByTargetInput!) {
    comment: createCommentByTarget(createCommentInput: $input) {
      id
      text
      createdAt
    }
  }
`

type CreateCommentVariables = {
  input: {
    target: 'sale' | 'comment'
    id: string
    text: string
  }
}

type CreateCommentResponse = {
  comment: Pick<Comment, 'id' | 'text' | 'createdAt'>
}

const DELETE_COMMENT = gql`
  mutation DeleteComment($commentId: ID!, $target: CommentTarget!) {
    removeCommentByTarget(id: $commentId, target: $target) {
      id
    }
  }
`

type DeleteCommentVariables = {
  target: 'sale' | 'comment'
  commentId: string
}

export function useComments({
  saleId,
  user,
}: {
  saleId: string
  user: Pick<Session['user'], 'image' | 'name'>
}) {
  const { data, client } = useQuery<GetCommentsQuery>(GET_COMMENTS, {
    variables: { saleId },
  })

  const comments = data?.comments

  const [createComment, { loading: createCommentLoading }] = useMutation<
    CreateCommentResponse,
    CreateCommentVariables
  >(CREATE_COMMENT, {
    onError(error) {
      toast.error(error.message)
    },
    onCompleted({ comment }, clientOptions) {
      try {
        const cachedData = client.cache.readQuery<GetCommentsQuery>({
          query: GET_COMMENTS,
          variables: { saleId },
        })

        if (!cachedData) return

        const {
          input: { id, target },
        } = clientOptions?.variables as CreateCommentVariables

        const comments = cachedData.comments

        const newComment = {
          id: comment.id,
          text: comment.text,
          createdAt: comment.createdAt,
          user,
          likes: [],
          replies: [],
        } as GetCommentsQuery['comments'][number]

        const updatedComments =
          target === 'sale'
            ? [...comments, { ...newComment, replies: [] }]
            : comments.map((comment) => {
                if (comment.id !== id) {
                  return comment
                }

                const existingReplies = comment.replies

                return {
                  ...comment,
                  replies: [...existingReplies, newComment],
                }
              })

        client.cache.writeQuery<GetCommentsQuery>({
          query: GET_COMMENTS,
          variables: { saleId },
          data: {
            comments: updatedComments,
          },
        })
      } catch (err) {}
    },
  })

  const [deleteComment] = useMutation<null, DeleteCommentVariables>(
    DELETE_COMMENT,
    {
      onError(error) {
        toast.error(error.message)
      },
      onCompleted(_, clientOptions) {
        const cachedData = client.cache.readQuery<GetCommentsQuery>({
          query: GET_COMMENTS,
          variables: { saleId },
        })

        if (!cachedData) return

        const comments = cachedData.comments

        const { commentId, target } =
          clientOptions?.variables as DeleteCommentVariables

        const updatedComments =
          target === 'sale'
            ? comments.filter((comment) => comment.id !== commentId)
            : comments.map((comment) => {
                const replies = comment.replies.filter(
                  (reply) => reply.id !== commentId,
                )

                return {
                  ...comment,
                  replies,
                }
              })

        client.cache.writeQuery<GetCommentsQuery>({
          query: GET_COMMENTS,
          variables: { saleId },
          data: {
            comments: updatedComments,
          },
        })
      },
    },
  )

  return { comments, createComment, createCommentLoading, deleteComment }
}
