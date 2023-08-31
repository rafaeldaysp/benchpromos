'use client'

import { type ApolloClient, gql, useMutation } from '@apollo/client'
import { useQuery } from '@apollo/experimental-nextjs-app-support/ssr'
import dayjs from 'dayjs'
import 'dayjs/locale/pt-br'
import relativeTime from 'dayjs/plugin/relativeTime'
import { type Session } from 'next-auth'
import * as React from 'react'
import TextareaAutosize from 'react-textarea-autosize'
import { toast } from 'sonner'

import { getCurrentUserToken } from '@/app/_actions/user'
import { Icons } from '@/components/icons'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { UserAvatar } from '@/components/user-avatar'
import { cn } from '@/lib/utils'
import type { Comment } from '@/types'

dayjs.extend(relativeTime)
dayjs.locale('pt-br')

interface CommentsProps {
  saleId: string
  user?: Session['user']
}

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
  mutation CreateSaleComment($input: CreateSaleCommentInput!) {
    createSaleComment(createSaleCommentInput: $input) {
      id
      text
      createdAt
      user {
        name
        image
      }
    }
  }
`

const CREATE_REPLY = gql`
  mutation CreateSaleCommentReply($input: CreateSaleCommentReplyInput!) {
    createSaleCommentReply(createSaleCommentReplyInput: $input) {
      id
    }
  }
`

const DELETE_COMMENT = gql`
  mutation RemoveSaleComment($commentId: ID!) {
    removeSaleComment(id: $commentId) {
      id
    }
  }
`

export function Comments({ saleId, user }: CommentsProps) {
  const [inViewInputCommentIds, setInViewInputCommentIds] = React.useState<
    string[]
  >([])

  const { data, client } = useQuery<GetCommentsQuery>(GET_COMMENTS, {
    variables: { saleId },
  })

  const [deleteComment] = useMutation(DELETE_COMMENT)

  const comments = data?.comments

  async function handleDeleteComment(commentId: string) {
    const token = await getCurrentUserToken()
    await deleteComment({
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

  if (!data) {
    return (
      <div className="flex justify-center">
        <Icons.Spinner
          className="mr-2 h-4 w-4 animate-spin"
          aria-hidden="true"
        />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <span className="text-lg">{comments?.length}</span> comentários
      </div>

      <CommentSubmit saleId={saleId} user={user} apolloClient={client} />

      <div className="space-y-4">
        {comments?.map((comment) => (
          <div key={comment.id} className="flex gap-x-4">
            <UserAvatar
              user={{
                name: comment.user.name || null,
                image: comment.user.image || null,
              }}
            />

            <div className="flex-1">
              <header className="flex justify-between">
                <div className="flex gap-x-2 text-sm">
                  <div>{comment.user.name}</div>
                  <time className="text-muted-foreground">
                    {dayjs(comment.createdAt).fromNow()}
                  </time>
                </div>

                <Button onClick={() => handleDeleteComment(comment.id)}>
                  Deletar
                </Button>
              </header>

              <p>{comment.text}</p>

              <div className="mt-2 flex gap-x-4">
                <div className="flex items-center">
                  <Icons.Heart className="mr-1.5 h-5 w-5" />{' '}
                  {comment.likes.length}
                </div>

                <Button
                  variant="ghost"
                  onClick={() =>
                    setInViewInputCommentIds((prev) => [...prev, comment.id])
                  }
                >
                  Responder
                </Button>
              </div>

              {!!comment.replies.length && (
                <Accordion type="multiple">
                  <AccordionItem value="item-1">
                    <AccordionTrigger>
                      {comment.replies.length} respostas
                    </AccordionTrigger>
                    <AccordionContent>
                      {comment.replies.map((reply) => (
                        <div key={reply.id} className="flex gap-x-4">
                          <UserAvatar
                            user={{
                              name: reply.user.name || null,
                              image: reply.user.image || null,
                            }}
                            className="h-6 w-6"
                          />

                          <div className="flex-1">
                            <header className="flex gap-x-2 text-sm">
                              <div>{reply.user.name}</div>
                              <time className="text-muted-foreground">
                                {dayjs(reply.createdAt).fromNow()}
                              </time>
                            </header>

                            <p>{reply.text}</p>

                            <div className="mt-2 flex gap-x-4">
                              <div className="flex items-center">
                                <Icons.Heart className="mr-1.5 h-5 w-5" />{' '}
                                {reply.likes.length}
                              </div>

                              <Button
                                variant="ghost"
                                onClick={() =>
                                  setInViewInputCommentIds((prev) => [
                                    ...prev,
                                    comment.id,
                                  ])
                                }
                              >
                                Responder
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              )}

              {inViewInputCommentIds.includes(comment.id) && (
                <div className="mt-2">
                  <CommentSubmit
                    saleId={saleId}
                    user={user}
                    commentId={comment.id}
                    apolloClient={client}
                    onCancel={() =>
                      setInViewInputCommentIds((prev) =>
                        prev.filter((id) => id !== comment.id),
                      )
                    }
                  />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

interface CommentSubmitProps {
  saleId: string
  user?: Session['user']
  commentId?: string
  apolloClient: ApolloClient<unknown>
  onCancel?: () => void
}

function CommentSubmit({
  saleId,
  user,
  commentId,
  apolloClient,
  onCancel,
}: CommentSubmitProps) {
  const [commentInput, setCommentInput] = React.useState('')
  const inputRef = React.useRef<HTMLTextAreaElement | null>(null)

  const [createComment, { loading: isLoading1 }] = useMutation(CREATE_COMMENT, {
    onError(error, _clientOptions) {
      toast.error(error.message)
    },
    onCompleted(_data, _clientOptions) {
      setCommentInput('')
    },
  })

  const [createCommentReply, { loading: isLoading2 }] = useMutation(
    CREATE_REPLY,
    {
      onError(error, _clientOptions) {
        toast.error(error.message)
      },
      onCompleted(_data, _clientOptions) {
        setCommentInput('')
      },
    },
  )

  async function handleCreateComment(text: string) {
    const token = await getCurrentUserToken()

    commentId
      ? await createCommentReply({
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
      : await createComment({
          context: {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
          variables: {
            input: {
              saleId,
              text,
            },
          },
        })
  }

  return (
    <div className="flex gap-x-4">
      <UserAvatar
        user={{ name: user?.name || null, image: user?.image || null }}
        className={cn({ 'h-6 w-6': commentId })}
      />
      <div className="flex-1 space-y-2.5">
        <div>
          <TextareaAutosize
            ref={inputRef}
            value={commentInput}
            onChange={(e) => setCommentInput(e.target.value)}
            placeholder="Adicionar um comentário..."
            className="w-full resize-none appearance-none overflow-hidden bg-transparent focus:outline-none"
          />
          <div className="w-full border"></div>
        </div>

        <div className="space-x-2 text-right">
          <Button
            variant="ghost"
            onClick={() => {
              setCommentInput('')
              if (inputRef.current) inputRef.current.blur()
              if (onCancel) onCancel()
            }}
          >
            Cancelar
          </Button>
          <Button
            disabled={!commentInput || isLoading1 || isLoading2}
            onClick={() => handleCreateComment(commentInput)}
          >
            {(isLoading1 || isLoading2) && (
              <Icons.Spinner
                className="mr-2 h-4 w-4 animate-spin"
                aria-hidden="true"
              />
            )}
            Comentar
          </Button>
        </div>
      </div>
    </div>
  )
}
