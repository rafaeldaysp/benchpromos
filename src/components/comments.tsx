'use client'

import dayjs from 'dayjs'
import 'dayjs/locale/pt-br'
import relativeTime from 'dayjs/plugin/relativeTime'
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
import { Toggle } from './ui/toggle'

dayjs.extend(relativeTime)
dayjs.locale('pt-br')

interface CommentsProps {
  saleId: string
}

export function Comments({ saleId }: CommentsProps) {
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
    <div className="space-y-8">
      {/* Comment Submit */}
      <CommentSubmit saleId={saleId} />

      {/* Comments */}
      <ul>
        {comments.map((comment) => {
          const previousComment = previousComments?.find(
            ({ id }) => id === comment.id,
          )

          const repliesAmountChanged = previousComment
            ? previousComment?.replies.length !== comment.replies.length
            : false

          return (
            <li key={comment.id}>
              {/* Commment */}
              <Comment saleId={saleId} comment={comment} />

              {/* Replies */}
              {comment.replies.length > 0 && (
                <Accordion
                  type="single"
                  value={repliesAmountChanged ? 'replies' : undefined}
                  className="ml-10"
                >
                  <AccordionItem value="replies">
                    <AccordionTrigger>
                      {comment.replies.length} resposta
                      {comment.replies.length > 1 && 's'}
                    </AccordionTrigger>
                    <AccordionContent>
                      <Replies saleId={saleId} replyToId={comment.id} />
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              )}

              {activeReplyCommentIds.includes(comment.id) && (
                <CommentSubmit saleId={saleId} commentId={comment.id} />
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
}

function Replies({ saleId, replyToId }: RepliesProps) {
  const { comments } = useComments({
    saleId,
    replyToId,
  })

  return (
    <div>
      <ul>
        {comments?.map((comment) => (
          <li key={comment.id}>
            <Comment saleId={saleId} comment={comment} replyToId={replyToId} />

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
      name: string
      image: string
    }
  }
  replyToId?: string
}

export function Comment({ saleId, comment, replyToId }: CommentProps) {
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
      <div className="flex">
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
          <header>
            <span>{comment.user.name}</span>
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
          </header>
          <div>
            {mode === 'text' ? (
              <p>{comment.text}</p>
            ) : (
              <>
                <div className="rounded-lg border p-4">
                  <TextareaAutosize
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Editar comentário..."
                    className="w-full resize-none appearance-none overflow-hidden bg-transparent text-sm focus:outline-none"
                  />
                </div>
                <Button onClick={() => handleUpdateComment()}>Salvar</Button>
              </>
            )}
          </div>
          <footer>
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
      </div>

      <DropdownMenuContent align="end" className="w-[160px]">
        <DropdownMenuItem onClick={() => setMode('input')}>
          <Icons.Edit className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
          Editar
        </DropdownMenuItem>

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
}

function CommentSubmit({ saleId, commentId }: CommentSubmitProps) {
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
    <div className="flex gap-x-4">
      <UserAvatar user={{ name: null, image: null }} />
      <div className="flex-1 space-y-2.5">
        <div className="rounded-lg border p-4">
          <TextareaAutosize
            ref={inputRef}
            value={commentInput}
            onChange={(e) => setCommentInput(e.target.value)}
            placeholder="Adicionar um comentário..."
            className="w-full resize-none appearance-none overflow-hidden bg-transparent text-sm focus:outline-none"
          />
        </div>

        <div className="flex items-center justify-end gap-x-2">
          {commentId && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeActiveReplyCommentId(commentId)}
            >
              Cancelar
            </Button>
          )}

          <Button
            size="sm"
            disabled={!commentInput || createCommentLoading}
            onClick={() => handleCreateComment()}
          >
            {createCommentLoading && (
              <Icons.Spinner
                className="mr-2 h-4 w-4 animate-spin"
                aria-hidden="true"
              />
            )}
            <Icons.Send className="mr-2 h-4 w-4" />
            Comentar
          </Button>
        </div>
      </div>
    </div>
  )
}
