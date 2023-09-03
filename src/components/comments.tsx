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
import { Toggle } from './ui/toggle'
import { Badge } from './ui/badge'

dayjs.extend(relativeTime)
dayjs.locale('pt-br')

interface CommentsProps {
  saleId: string
  user?: Pick<Session['user'], 'id' | 'image' | 'name' | 'isAdmin'>
}

export function Comments({ saleId, user }: CommentsProps) {
  const { comments, previousComments, activeReplyCommentIds } = useComments({
    saleId,
  })

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
    <div className="max-w-4xl space-y-8 rounded-lg">
      {/* Comment Submit */}
      <CommentSubmit saleId={saleId} user={user} />

      {/* Comments */}
      <ul className="space-y-2">
        {comments.map((comment) => {
          const previousComment = previousComments?.find(
            ({ id }) => id === comment.id,
          )

          const repliesAmountChanged = previousComment
            ? previousComment?.replies.length !== comment.replies.length
            : false

          return (
            <li key={comment.id} className="space-y-0.5">
              {/* Commment */}
              <Comment saleId={saleId} comment={comment} user={user} />

              {/* Replies */}
              {comment.replies.length > 0 && (
                <Accordion
                  type="single"
                  value={repliesAmountChanged ? 'replies' : undefined}
                  className="ml-10"
                  collapsible
                >
                  <AccordionItem value="replies" className="space-y-2">
                    <Button variant={'ghost'}>
                      <AccordionTrigger className="hover:no-underline">
                        {comment.replies.length} resposta
                        {comment.replies.length > 1 && 's'}
                      </AccordionTrigger>
                    </Button>
                    <AccordionContent>
                      <Replies
                        saleId={saleId}
                        replyToId={comment.id}
                        user={user}
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
    </div>
  )
}

interface RepliesProps {
  saleId: string
  replyToId: string
  user?: Pick<Session['user'], 'id' | 'image' | 'name' | 'isAdmin'>
}

function Replies({ saleId, replyToId, user }: RepliesProps) {
  const { comments, isLoading } = useComments({
    saleId,
    replyToId,
  })

  return (
    <div>
      <ul className="py-1">
        {isLoading && (
          <div className="flex w-full items-center justify-center">
            <Icons.Spinner className="h-4 w-4 animate-spin text-center" />
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
    createdAt: string
    updatedAt: string
  }
  replyToId?: string
  user?: Pick<Session['user'], 'id' | 'image' | 'name' | 'isAdmin'>
}

export function Comment({ saleId, comment, replyToId, user }: CommentProps) {
  const [input, setInput] = React.useState(comment.text)
  const [mode, setMode] = React.useState<'text' | 'input'>('text')
  const { deleteComment, updateComment, addActiveReplyCommentId } = useComments(
    {
      saleId,
      replyToId,
    },
  )

  async function handleDeleteComment() {
    await deleteComment(comment.id)
  }

  async function handleUpdateComment() {
    await updateComment(comment.id, input)

    setMode('text')
  }

  return (
    <DropdownMenu>
      <div className="flex space-x-4 space-y-1">
        <div>
          <UserAvatar
            user={{
              name: comment.user.name || null,
              image: comment.user.image || null,
            }}
            className="h-8 w-8"
          />
        </div>
        <div className="flex-1">
          <header className="flex items-center space-x-2">
            <span className="font-semibold">{comment.user.name}</span>
            {comment.user.isAdmin && (
              <Badge>
                {' '}
                <Icons.Crown className="mr-1 h-4 w-4" /> ADM
              </Badge>
            )}

            <time className="text-xs text-muted-foreground">
              {comment.updatedAt === comment.createdAt
                ? dayjs(comment.createdAt).fromNow()
                : `Editado ${dayjs(comment.updatedAt).fromNow()}`}
            </time>
          </header>
          <div>
            {mode === 'text' ? (
              <p className="leading-tight">{comment.text}</p>
            ) : (
              <div>
                <div className="flex flex-1 border-b p-2">
                  <TextareaAutosize
                    value={input}
                    maxLength={1000}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Editar comentário..."
                    className="relative w-full resize-none appearance-none overflow-hidden bg-transparent leading-tight focus:outline-none"
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
          <footer className="space-x-1 py-1">
            <Toggle size="sm">
              <Icons.Like className="mr-1.5 h-4 w-4" /> 1
            </Toggle>
            <Button
              variant="ghost"
              size="sm"
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
    await createComment({ text: commentInput })
  }

  return (
    <div className={cn('flex gap-x-2', { 'ml-10': commentId })}>
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
            // onBlur={() => commentId && removeActiveReplyCommentId(commentId)}
            maxLength={1000}
            onChange={(e) => setCommentInput(e.target.value)}
            placeholder="Adicionar um comentário..."
            className={cn(
              'w-full resize-none appearance-none overflow-hidden bg-transparent leading-tight focus:outline-none',
              { 'text-sm': commentId },
            )}
          />
        </div>

        <div className="space-x-1 text-end">
          {commentId && (
            <Button
              variant={'ghost'}
              onClick={() => removeActiveReplyCommentId(commentId)}
            >
              <Icons.X className="h-4 w-4" />
            </Button>
          )}

          <Button
            disabled={!commentInput || createCommentLoading}
            variant={'ghost'}
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
