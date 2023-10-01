'use client'

import dayjs from 'dayjs'
import 'dayjs/locale/pt-br'
import relativeTime from 'dayjs/plugin/relativeTime'
import { type Session } from 'next-auth'
import * as React from 'react'
import TextareaAutosize from 'react-textarea-autosize'

import { Icons } from '@/components/icons'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { Toggle } from '@/components/ui/toggle'
import { UserAvatar } from '@/components/user-avatar'
import { useComments } from '@/hooks/use-comments'
import { cn } from '@/lib/utils'

dayjs.extend(relativeTime)
dayjs.locale('pt-br')

interface CommentsProps {
  saleId: string
  count: number
  user?: Pick<Session['user'], 'id' | 'image' | 'name' | 'isAdmin'>
}

export function Comments({ saleId, user, count }: CommentsProps) {
  const { comments, previousComments, activeReplyCommentIds } = useComments({
    saleId,
  })

  return (
    <div className="space-y-8">
      <span className="font-semibold">
        {count} • comentário
        {(count > 1 || count === 0) && 's'}
      </span>
      <CommentSubmit saleId={saleId} user={user} />

      {comments ? (
        <ul className="space-y-2">
          {comments.map((comment) => {
            const previousComment = previousComments?.find(
              ({ id }) => id === comment.id,
            )

            const repliesAmountChanged = previousComment
              ? previousComment.repliesCount !== comment.repliesCount
              : false

            return (
              <li key={comment.id} className="space-y-0.5">
                {/* Commment */}
                <Comment saleId={saleId} comment={comment} user={user} />

                {/* Replies */}
                {comment.repliesCount > 0 && (
                  <Accordion
                    type="single"
                    value={repliesAmountChanged ? 'replies' : undefined}
                    className="ml-10"
                    collapsible
                  >
                    <AccordionItem value="replies" className="space-y-2 pb-2">
                      <AccordionTrigger
                        className={cn(
                          buttonVariants({
                            variant: 'ghost',
                            size: 'sm',
                          }),
                          'flex-none px-1 hover:no-underline',
                        )}
                      >
                        {comment.repliesCount} resposta
                        {comment.repliesCount > 1 && 's'}
                      </AccordionTrigger>
                      <AccordionContent>
                        <Replies
                          saleId={saleId}
                          replyToId={comment.id}
                          user={user}
                          count={comment.repliesCount}
                        />
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                )}

                {activeReplyCommentIds.includes(comment.id) && (
                  <CommentSubmit
                    saleId={saleId}
                    commentId={comment.id}
                    user={user}
                  />
                )}
              </li>
            )
          })}
        </ul>
      ) : (
        <div className="space-y-10">
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="flex space-x-2">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="space-y-1">
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-3 w-52 sm:w-80" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

interface RepliesProps {
  saleId: string
  replyToId: string
  count: number
  user?: Pick<Session['user'], 'id' | 'image' | 'name' | 'isAdmin'>
}

function Replies({ saleId, replyToId, user, count }: RepliesProps) {
  const { comments, isLoading } = useComments({
    saleId,
    replyToId,
  })

  return (
    <div>
      <ul>
        {isLoading && (
          <div className="space-y-10">
            {Array.from({ length: count }).map((_, i) => (
              <div key={i} className="flex space-x-2">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="space-y-1">
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-3 w-52 sm:w-80" />
                </div>
              </div>
            ))}
          </div>
        )}
        {comments?.map((comment) => (
          <li key={comment.id}>
            <Comment
              saleId={saleId}
              comment={comment}
              replyToId={replyToId}
              user={user}
            />

            {/* Replies */}
          </li>
        ))}
      </ul>
    </div>
  )
}

interface CommentProps {
  saleId: string
  comment: {
    id: string
    text: string
    user: {
      id: string
      isAdmin: boolean
      name: string
      image: string
    }
    likes: {
      user: {
        id: string
      }
    }[]
    createdAt: string
    updatedAt: string
    likesCount: number
  }
  replyToId?: string
  user?: Pick<Session['user'], 'id' | 'image' | 'name' | 'isAdmin'>
}

export function Comment({ saleId, comment, replyToId, user }: CommentProps) {
  const [input, setInput] = React.useState(comment.text)
  const [mode, setMode] = React.useState<'text' | 'input'>('text')
  const {
    deleteComment,
    updateComment,
    addActiveReplyCommentId,
    toggleCommentLike,
  } = useComments({
    saleId,
    replyToId,
  })

  async function handleDeleteComment() {
    await deleteComment(comment.id)
  }

  async function handleUpdateComment() {
    await updateComment(comment.id, input)

    setMode('text')
  }

  const currentUserLiked = comment.likes.some(
    (like) => like.user.id === user?.id,
  )

  return (
    <DropdownMenu>
      <div className="flex space-x-2">
        <div>
          <UserAvatar
            user={{
              name: comment.user.name || null,
              image: comment.user.image || null,
            }}
            className="h-8 w-8"
          />
        </div>
        <div className="flex-1 space-y-1 pb-1">
          <header className="flex flex-col items-start">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold sm:text-sm">
                {comment.user.name}
              </span>
              {comment.user.isAdmin && (
                <Badge className="px-1 py-0">
                  {' '}
                  <Icons.Crown className="mr-1 h-3 w-3 text-xs sm:text-sm" />{' '}
                  ADM
                </Badge>
              )}
            </div>

            <time className="text-xs text-muted-foreground">
              {comment.updatedAt === comment.createdAt
                ? dayjs(comment.createdAt).fromNow()
                : `Editado ${dayjs(comment.updatedAt).fromNow()}`}
            </time>
          </header>
          <div className="">
            {mode === 'text' ? (
              <p className="text-sm leading-tight">{comment.text}</p>
            ) : (
              <div>
                <div className="flex flex-1 border-b p-2">
                  <TextareaAutosize
                    value={input}
                    maxLength={1000}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key == 'Enter' && e.shiftKey == false) {
                        e.preventDefault()
                        handleUpdateComment()
                      }
                    }}
                    placeholder="Editar comentário..."
                    className="relative w-full resize-none appearance-none overflow-hidden bg-transparent text-sm leading-tight focus:outline-none"
                  />
                </div>

                <div className="space-x-0.5">
                  <Button
                    variant={'ghost'}
                    onClick={() => handleUpdateComment()}
                  >
                    <Icons.Check className="h-4 w-4" />
                  </Button>

                  <Button variant={'ghost'} onClick={() => setMode('text')}>
                    <Icons.X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
          <footer className="space-x-1">
            <Toggle
              className="group px-1"
              size="sm"
              pressed={currentUserLiked}
              onPressedChange={() => toggleCommentLike(comment.id)}
            >
              <Icons.Like className="mr-1.5 h-4 w-4 group-data-[state=on]:text-primary" />{' '}
              {comment.likesCount ? comment.likesCount : ''}
            </Toggle>
            <Button
              variant="ghost"
              size="sm"
              className="px-1"
              onClick={() =>
                addActiveReplyCommentId(replyToId ? replyToId : comment.id)
              }
            >
              <Icons.Reply className="mr-1.5 h-4 w-4" />
              Responder
            </Button>
          </footer>
        </div>
        <div className="h-8 w-8">
          {(user?.isAdmin || user?.id === comment.user.id) && (
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-8 w-8 p-0 data-[state=open]:bg-muted"
              >
                <Icons.MoreVertical className="h-4 w-4" />
                <span className="sr-only">Abrir menu</span>
              </Button>
            </DropdownMenuTrigger>
          )}
        </div>
      </div>

      <DropdownMenuContent align="end" className="max-w-fit">
        {user?.id === comment.user.id && (
          <DropdownMenuItem onClick={() => setMode('input')}>
            <Icons.Edit className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
            Editar
          </DropdownMenuItem>
        )}

        <DropdownMenuItem onClick={() => handleDeleteComment()}>
          <Icons.Trash className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
          Deletar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

interface CommentSubmitProps {
  saleId: string
  commentId?: string
  user?: Pick<Session['user'], 'id' | 'image' | 'name'>
}

function CommentSubmit({ saleId, commentId, user }: CommentSubmitProps) {
  const [commentInput, setCommentInput] = React.useState('')
  const inputRef = React.useRef<HTMLTextAreaElement | null>(null)
  const { createComment, createCommentLoading, removeActiveReplyCommentId } =
    useComments({
      saleId,
      replyToId: commentId,
    })

  async function handleCreateComment() {
    const { errors } = await createComment({ text: commentInput })

    if (!errors) {
      setCommentInput('')

      if (commentId) removeActiveReplyCommentId(commentId)
    }
  }

  return (
    <div className={cn('flex gap-x-1', { 'ml-10': commentId })}>
      <UserAvatar
        user={{ name: user?.name || null, image: user?.image || null }}
        className="h-8 w-8"
      />
      <div className="flex-1 items-end gap-x-2">
        <div className="flex flex-1 border-b p-2">
          <TextareaAutosize
            ref={inputRef}
            value={commentInput}
            autoFocus={commentId ? true : false}
            maxLength={1000}
            onChange={(e) => setCommentInput(e.target.value)}
            placeholder="Adicionar um comentário..."
            onKeyDown={(e) => {
              if (e.key == 'Enter' && e.shiftKey == false) {
                e.preventDefault()
                handleCreateComment()
              }
            }}
            className="w-full resize-none appearance-none overflow-hidden bg-transparent text-sm leading-tight focus:outline-none"
          />
        </div>

        <div className="space-x-1 text-end">
          {commentId && (
            <Button
              variant="ghost"
              onClick={() => removeActiveReplyCommentId(commentId)}
            >
              <Icons.X className="h-4 w-4" />
            </Button>
          )}

          <Button
            disabled={!commentInput || createCommentLoading}
            variant="ghost"
            onClick={() => handleCreateComment()}
          >
            {createCommentLoading ? (
              <Icons.Spinner
                className="h-4 w-4 animate-spin"
                aria-hidden="true"
              />
            ) : (
              <Icons.Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
