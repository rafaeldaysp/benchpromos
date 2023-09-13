import { gql, useMutation } from '@apollo/client'
import { useQuery } from '@apollo/experimental-nextjs-app-support/ssr'
import { toast } from 'sonner'
import { create } from 'zustand'

import { getCurrentUserToken } from '@/app/_actions/user'
import type { Comment } from '@/types'

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
      likesCount
      repliesCount
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
    likesCount: number
    repliesCount: number
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

const TOGGLE_COMMENT_LIKE = gql`
  mutation ToggleCommentLike($commentId: String!) {
    like: toggleCommentLike(commentId: $commentId) {
      commentId
      userId
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
              {
                ...newComment,
                likes: [],
                replies: [],
                likesCount: 0,
                repliesCount: 0,
              },
              ...existingComments,
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
              repliesCount(existingRepliesCount = 0) {
                return existingRepliesCount + 1
              },
            },
          })
        }
      },
    })

  async function createComment(data: { text: string }) {
    const token = await getCurrentUserToken()

    return createCommentMutation({
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
            repliesCount(existingRepliesCount = 0) {
              return existingRepliesCount - 1
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

  const [toggleCommentLikeMutation] = useMutation(TOGGLE_COMMENT_LIKE, {
    onError(error) {
      toast.error(error.message)
    },
    update(cache, { data }) {
      const like = data.like

      const commentId = cache.identify({
        __typename: 'Comment',
        id: like.commentId,
      })

      const userId = cache.identify({
        __typename: 'User',
        id: like.userId,
      })

      let liked = false

      cache.modify({
        id: commentId,
        fields: {
          likes(existingLikes = []) {
            const userLiked = existingLikes.some(
              (existingLike: { user: { __ref: string } }) =>
                existingLike.user.__ref === userId,
            )

            liked = userLiked

            const updatedLikes = userLiked
              ? existingLikes.filter(
                  (existingLike: { user: { __ref: string } }) =>
                    existingLike.user.__ref !== userId,
                )
              : [...existingLikes, { user: { __ref: userId } }]

            return updatedLikes
          },
          likesCount(existingLikesCount = 0) {
            return existingLikesCount + (liked ? -1 : 1)
          },
        },
      })
    },
  })

  async function toggleCommentLike(commentId: string) {
    const token = await getCurrentUserToken()

    toggleCommentLikeMutation({
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

  return {
    comments,
    createComment,
    previousComments,
    createCommentLoading,
    deleteComment,
    updateComment,
    toggleCommentLike,
    isLoading,
    ...commentSubmitStore,
  }
}
