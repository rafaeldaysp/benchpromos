'use client'

import { useQuery } from '@apollo/client'
import { toast } from 'sonner'

import { Icons } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { RESENT_EMAIL_TIME_MS } from '@/constants'
import { useCountdown } from '@/hooks/use-countdown'
import { SEND_EMAIL } from '@/queries'

interface ResendEmailProps {
  email: string
  redirectUrl: string
  tokenType: 'EMAIL_CONFIRMATION' | 'RESET_PASSWORD'
}

export function SendEmail({ email, redirectUrl, tokenType }: ResendEmailProps) {
  const {
    data,
    refetch,
    loading: isLoading,
  } = useQuery<{
    sendTokenToEmail: { lastSent: string; message: string }
  }>(SEND_EMAIL, {
    variables: {
      input: {
        email,
        redirectUrl,
        tokenType,
      },
    },
    fetchPolicy: 'cache-and-network',
    refetchWritePolicy: 'overwrite',
    onError(error) {
      toast.error(error.message)
    },
    onCompleted(data) {
      toast.success(data.sendTokenToEmail.message)
    },
  })

  const { minutes, seconds } = useCountdown(
    data ? new Date(data.sendTokenToEmail.lastSent) : new Date(),
    RESENT_EMAIL_TIME_MS,
  )

  const hasCountdown = minutes > 0 || seconds > 0

  if (minutes * 60 * 1000 + seconds * 1000 < RESENT_EMAIL_TIME_MS) {
    return (
      <Button
        className="w-full"
        disabled={isLoading || hasCountdown}
        onClick={() => refetch()}
      >
        {isLoading && <Icons.Spinner className="mr-2 size-4 animate-spin" />}
        Reenviar email
        {hasCountdown && (
          <>
            {' '}
            ({minutes.toString().length < 2 ? `0${minutes}` : minutes}:
            {seconds.toString().length < 2 ? `0${seconds}` : seconds})
          </>
        )}
      </Button>
    )
  }

  return (
    <div className="flex w-full justify-center">
      <Icons.Spinner className="size-4 animate-spin" />
    </div>
  )
}
