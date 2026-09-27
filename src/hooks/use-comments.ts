import { useEffect, useRef, useState } from 'react'
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
        role
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
    user: {
      id: string
      role: 'ADMIN' | 'MOD' | 'USER'
      name: string
      image: string
    }
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
        role
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

export const COMMENTS_PER_PAGE = 20

export function useComments({
  saleId,
  replyToId,
  fetchComments = true,
}: {
  saleId: string
  replyToId?: string
  fetchComments?: boolean
}) {
  const commentSubmitStore = useCommentSubmitStore()
  const variables = {
    input: {
      saleId,
      replyToId,
      paginationInput: { page: 1, limit: COMMENTS_PER_PAGE },
    },
  }
  const [lastPageSize, setLastPageSize] = useState(COMMENTS_PER_PAGE)
  const [loadingMore, setLoadingMore] = useState(false)
  const nextPage = useRef(2)
  const loadingMoreRef = useRef(false)
  useEffect(() => {
    nextPage.current = 2
    setLastPageSize(COMMENTS_PER_PAGE)
  }, [saleId, replyToId])

  const {
    data,
    client,
    previousData,
    loading: isLoading,
    error,
    refetch,
    fetchMore,
  } = useQuery<GetCommentsQuery>(GET_COMMENTS, {
    variables,
    skip: !fetchComments,
  })

  async function loadMore() {
    if (loadingMoreRef.current || isLoading || !data) return
    loadingMoreRef.current = true
    setLoadingMore(true)
    try {
      const result = await fetchMore({
        variables: {
          input: {
            ...variables.input,
            paginationInput: {
              page: nextPage.current,
              limit: COMMENTS_PER_PAGE,
            },
          },
        },
        updateQuery(previous, { fetchMoreResult }) {
          if (!fetchMoreResult) return previous
          const seen = new Set(previous.comments.map(({ id }) => id))
          return {
            ...previous,
            comments: [
              ...previous.comments,
              ...fetchMoreResult.comments.filter(({ id }) => !seen.has(id)),
            ],
          }
        },
      })
      setLastPageSize(result.data.comments.length)
      nextPage.current += 1
    } catch {
      toast.error(
        'Não foi possível carregar mais comentários. Tente novamente.',
      )
    } finally {
      loadingMoreRef.current = false
      setLoadingMore(false)
    }
  }

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
          variables,
        })

        const existingComments = existingData?.comments

        if (existingComments)
          cache.writeQuery({
            query: GET_COMMENTS,
            variables,
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
    error,
    retry: () => refetch(),
    loadMore,
    loadingMore,
    hasMore: Boolean(
      comments &&
        comments.length >= COMMENTS_PER_PAGE &&
        lastPageSize === COMMENTS_PER_PAGE,
    ),
    ...commentSubmitStore,
  }
}
