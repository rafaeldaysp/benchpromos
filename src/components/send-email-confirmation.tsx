'use client'

import { gql, useQuery } from '@apollo/client'
import { toast } from 'sonner'

import { env } from '@/env.mjs'
import { useCountdown } from '@/hooks/use-countdown'
import { Icons } from './icons'
import { Button } from './ui/button'

const SEND_EMAIL = gql`
  query SendConfirmationLink($input: SendTokenToEmailInput!) {
    sendTokenToEmail(sendTokenToEmailInput: $input) {
      lastSent
      message
    }
  }
`

const RESENT_EMAIL_TIME_MS = 60 * 1000

interface ResendEmailProps {
  email: string
}

export function SendEmail({ email }: ResendEmailProps) {
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
        redirectUrl: `${env.NEXT_PUBLIC_APP_URL}/sign-up/step2`,
        tokenType: 'EMAIL_CONFIRMATION',
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

  const [minutes, seconds] = useCountdown(
    data ? new Date(data.sendTokenToEmail.lastSent) : new Date(),
    RESENT_EMAIL_TIME_MS,
  )

  const hasCountdown = minutes > 0 || seconds > 0

  if (data && minutes * 60 * 1000 < RESENT_EMAIL_TIME_MS)
    return (
      <Button
        className="w-full"
        disabled={isLoading || hasCountdown}
        onClick={() => refetch()}
      >
        {isLoading && <Icons.Spinner className="mr-2 h-4 w-4 animate-spin" />}
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
  return (
    <div className="flex w-full justify-center">
      <Icons.Spinner className="h-4 w-4 animate-spin" />
    </div>
  )
}
