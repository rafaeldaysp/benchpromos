import { gql, useMutation } from '@apollo/client'
import { useQuery } from '@apollo/experimental-nextjs-app-support/ssr'
import { toast } from 'sonner'
import { create } from 'zustand'

import { getCurrentUserToken } from '@/app/_actions/user'
import { type Comment } from '@/types'

const GET_COMMENTS = gql`
  query GetComments($input: CommentsInput!) {
    comments(commentsInput: $input) {
      id
      text
      createdAt
      updatedAt
      saleId
      replyToId
      user {
        id
        isAdmin
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
      }
    }
  }
`

type GetCommentsQuery = {
  comments: (Pick<Comment, 'id' | 'text' | 'createdAt' | 'updatedAt'> & {
    user: { id: string; isAdmin: boolean; name: string; image: string }
    likes: {
      user: {
        id: string
      }
    }[]
    replies: Omit<GetCommentsQuery['comments'][number], 'replies'>[]
  })[]
}

const CREATE_COMMENT = gql`
  mutation CreateComment($input: CreateCommentInput!) {
    comment: createComment(createCommentInput: $input) {
      id
      text
      createdAt
      updatedAt
      saleId
      replyToId
      user {
        id
        isAdmin
        name
        image
      }
    }
  }
`

const UPDATE_COMMENT = gql`
  mutation UpdateComment($input: UpdateCommentInput!) {
    comment: updateComment(updateCommentInput: $input) {
      id
      text
      updatedAt
    }
  }
`

const DELETE_COMMENT = gql`
  mutation RemoveComment($commentId: ID!) {
    comment: removeComment(id: $commentId) {
      id
    }
  }
`

interface CommentSubmitStore {
  activeReplyCommentIds: string[]
  addActiveReplyCommentId: (id: string) => void
  removeActiveReplyCommentId: (id: string) => void
}

const useCommentSubmitStore = create<CommentSubmitStore>((set) => ({
  activeReplyCommentIds: [],
  addActiveReplyCommentId: (id) =>
    set((state) => ({
      activeReplyCommentIds: [...state.activeReplyCommentIds, id],
    })),
  removeActiveReplyCommentId: (id) =>
    set((state) => ({
      activeReplyCommentIds: state.activeReplyCommentIds.filter(
        (existingId) => existingId !== id,
      ),
    })),
}))

export function useComments({
  saleId,
  replyToId,
}: {
  saleId: string
  replyToId?: string
}) {
  const commentSubmitStore = useCommentSubmitStore()

  const {
    data,
    client,
    previousData,
    loading: isLoading,
  } = useQuery<GetCommentsQuery>(GET_COMMENTS, {
    variables: {
      input: {
        saleId,
        replyToId,
      },
    },
  })

  const cache = client.cache
  const comments = data?.comments
  const previousComments = previousData?.comments

  const [createCommentMutation, { loading: createCommentLoading }] =
    useMutation(CREATE_COMMENT, {
      onError(error) {
        toast.error(error.message)
      },
      update(_, { data }) {
        const newComment = data.comment

        const existingData = cache.readQuery<GetCommentsQuery>({
          query: GET_COMMENTS,
          variables: {
            input: {
              saleId,
              replyToId,
            },
          },
        })

        const existingComments = existingData?.comments

        if (!existingComments) return

        cache.writeQuery({
          query: GET_COMMENTS,
          variables: {
            input: {
              saleId,
              replyToId,
            },
          },
          data: {
            comments: [
              ...existingComments,
              { ...newComment, likes: [], replies: [] },
            ],
          },
        })

        if (replyToId) {
          cache.modify({
            id: cache.identify({ __typename: 'Comment', id: replyToId }),
            fields: {
              replies(existingReplies = []) {
                return [...existingReplies, { id: newComment.id }]
              },
            },
          })
        }
      },
    })

  async function createComment(data: { text: string }) {
    const token = await getCurrentUserToken()

    createCommentMutation({
      context: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      variables: {
        input: {
          saleId,
          replyToId,
          ...data,
        },
      },
    })
  }

  const [deleteCommentMutation] = useMutation(DELETE_COMMENT, {
    onError(error) {
      toast.error(error.message)
    },
    update(_, { data }) {
      const deletedCommentId = data.comment.id

      cache.evict({
        id: cache.identify({ __typename: 'Comment', id: deletedCommentId }),
      })

      if (replyToId) {
        cache.modify({
          id: cache.identify({ __typename: 'Comment', id: replyToId }),
          fields: {
            replies(existingReplies = []) {
              return existingReplies.filter(
                (existingReply: GetCommentsQuery['comments'][number]) =>
                  existingReply.id !== deletedCommentId,
              )
            },
          },
        })
      }
    },
  })

  async function deleteComment(commentId: string) {
    const token = await getCurrentUserToken()

    deleteCommentMutation({
      context: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      variables: {
        commentId,
      },
    })
  }

  const [updateCommentMutation] = useMutation(UPDATE_COMMENT, {
    onError(error) {
      toast.error(error.message)
    },
    update(_, { data }) {
      const updatedComment = data.comment

      cache.modify({
        id: cache.identify({ __typename: 'Comment', id: updatedComment.id }),
        fields: {
          text() {
            return updatedComment.text
          },
        },
      })
    },
  })

  async function updateComment(commentId: string, text: string) {
    const token = await getCurrentUserToken()

    updateCommentMutation({
      context: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      variables: {
        input: {
          commentId,
          text,
        },
      },
    })
  }

  return {
    comments,
    createComment,
    previousComments,
    createCommentLoading,
    deleteComment,
    updateComment,
    isLoading,
    ...commentSubmitStore,
  }
}
