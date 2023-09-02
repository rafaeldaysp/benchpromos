'use client'

import dayjs from 'dayjs'
import 'dayjs/locale/pt-br'
import relativeTime from 'dayjs/plugin/relativeTime'
import { type Session } from 'next-auth'
import * as React from 'react'
import TextareaAutosize from 'react-textarea-autosize'

import { getCurrentUserToken } from '@/app/_actions/user'
import { Icons } from '@/components/icons'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { UserAvatar } from '@/components/user-avatar'
import { useComments } from '@/hooks/use-comments'
import { cn } from '@/lib/utils'

dayjs.extend(relativeTime)
dayjs.locale('pt-br')

interface CommentsProps {
  saleId: string
  user: Pick<Session['user'], 'image' | 'name'>
}

export function Comments({ saleId, user }: CommentsProps) {
  const [inViewInputCommentIds, setInViewInputCommentIds] = React.useState<
    string[]
  >([])
  const { comments } = useComments({ saleId, user })

  // fazer o loading skeleton
  if (!comments) {
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

      <CommentSubmit saleId={saleId} user={user} />

      <div className="space-y-4">
        {comments?.map((comment) => (
          <div key={comment.id}>
            <Comment
              saleId={saleId}
              user={user}
              comment={comment}
              onReply={() =>
                setInViewInputCommentIds((prev) => [...prev, comment.id])
              }
            />

            <div className="ml-14">
              {!!comment.replies.length && (
                <Accordion type="multiple">
                  <AccordionItem value="replies">
                    <AccordionTrigger>
                      {comment.replies.length} respostas
                    </AccordionTrigger>

                    <AccordionContent className="space-y-2">
                      {comment.replies.map((reply) => (
                        <Comment
                          key={reply.id}
                          saleId={saleId}
                          user={user}
                          comment={reply}
                          isReply
                          className="mt-4"
                          onReply={() =>
                            setInViewInputCommentIds((prev) => [
                              ...prev,
                              comment.id,
                            ])
                          }
                        />
                      ))}
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              )}

              {inViewInputCommentIds.includes(comment.id) && (
                <CommentSubmit
                  saleId={saleId}
                  commentId={comment.id}
                  user={user}
                  className="mb-8 mt-4"
                  onCancel={() =>
                    setInViewInputCommentIds((prev) =>
                      prev.filter((id) => id !== comment.id),
                    )
                  }
                />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

interface CommentSubmitProps extends React.HTMLAttributes<HTMLDivElement> {
  saleId: string
  user: Pick<Session['user'], 'image' | 'name'>
  commentId?: string
  onCancel?: () => void
}

function CommentSubmit({
  saleId,
  user,
  commentId,
  onCancel,
  className,
}: CommentSubmitProps) {
  const [commentInput, setCommentInput] = React.useState('')
  const inputRef = React.useRef<HTMLTextAreaElement | null>(null)
  const { createComment, createCommentLoading } = useComments({ saleId, user })

  const isReply = !!commentId

  async function handleCreateComment() {
    const token = await getCurrentUserToken()

    await createComment({
      context: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      variables: {
        input: {
          target: isReply ? 'comment' : 'sale',
          id: isReply ? commentId : saleId,
          text: commentInput,
        },
      },
    })

    setCommentInput('')
  }

  return (
    <div className={cn('flex gap-x-4', className)}>
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
            disabled={!commentInput || createCommentLoading}
            onClick={() => handleCreateComment()}
          >
            {createCommentLoading && (
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

interface CommentProps extends React.HTMLAttributes<HTMLDivElement> {
  saleId: string
  user: Pick<Session['user'], 'image' | 'name'>
  comment: {
    id: string
    text: string
    createdAt: string
    likes: {
      user: {
        id: string
      }
    }[]
    user: {
      name: string
      image: string
    }
  }
  isReply?: boolean
  onReply: () => void
}

function Comment({
  saleId,
  user,
  comment,
  isReply,
  onReply,
  className,
}: CommentProps) {
  const { deleteComment } = useComments({ saleId, user })
  async function handleDeleteComment() {
    const token = await getCurrentUserToken()

    await deleteComment({
      context: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      variables: {
        commentId: comment.id,
        target: isReply ? 'comment' : 'sale',
      },
    })
  }

  return (
    <div key={comment.id} className={cn('flex gap-x-4', className)}>
      <UserAvatar
        user={{
          name: comment.user.name || null,
          image: comment.user.image || null,
        }}
        className={cn({ 'h-6 w-6': isReply })}
      />

      <div className="flex-1 rounded-lg bg-muted p-2">
        <header className="flex gap-x-2 text-sm">
          <div>{comment.user.name}</div>
          <time className="text-muted-foreground">
            {dayjs(comment.createdAt).fromNow()}
          </time>
        </header>

        <p>{comment.text}</p>

        <div className="mt-2 flex gap-x-4">
          <div className="flex items-center">
            <Icons.Heart className="mr-1.5 h-5 w-5" /> {comment.likes.length}
          </div>

          <Button variant="ghost" onClick={() => onReply()}>
            Responder
          </Button>
        </div>
      </div>

      <DropdownMenu>
        <div className="h-8 w-8">
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-8 w-8 p-0 data-[state=open]:bg-muted"
            >
              <Icons.MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Abrir menu</span>
            </Button>
          </DropdownMenuTrigger>
        </div>

        <DropdownMenuContent align="end" className="w-[160px]">
          <DropdownMenuItem>
            <Icons.Edit className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
            Editar
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => handleDeleteComment()}>
            <Icons.Trash className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
            Deletar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
