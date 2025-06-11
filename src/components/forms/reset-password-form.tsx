'use client'

import { env } from '@/env.mjs'
import { useApolloClient } from '@apollo/client'
import { zodResolver } from '@hookform/resolvers/zod'
import * as React from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { type z } from 'zod'

import { Icons } from '@/components/icons'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { checkEmailSchema } from '@/lib/validations/auth'
import { SEND_EMAIL } from '@/queries'
import { useCountdown } from '@/hooks/use-countdown'
import { RESENT_EMAIL_TIME_MS } from '@/constants'
import { Alert, AlertDescription } from '../ui/alert'

type Inputs = z.infer<typeof checkEmailSchema>

export function ResetPasswordForm() {
  const form = useForm<Inputs>({
    resolver: zodResolver(checkEmailSchema),
    defaultValues: {
      email: '',
    },
  })

  const [isLoading, setIsLoading] = React.useState(false)
  const [currentData, setCurrentData] = React.useState<{
    sendTokenToEmail: { lastSent: string; message: string } | null
  }>({ sendTokenToEmail: null })
  const client = useApolloClient()

  const { minutes, seconds } = useCountdown(
    currentData.sendTokenToEmail
      ? new Date(currentData.sendTokenToEmail.lastSent)
      : new Date(0),
    RESENT_EMAIL_TIME_MS,
  )

  const hasCountdown = minutes > 0 || seconds > 0

  async function onSubmit({ email }: Inputs) {
    setIsLoading(true)

    const { data, errors } = await client.query<{
      sendTokenToEmail: { lastSent: string; message: string }
    }>({
      query: SEND_EMAIL,
      variables: {
        input: {
          tokenType: 'RESET_PASSWORD',
          email,
          redirectUrl: `${env.NEXT_PUBLIC_APP_URL}/sign-in/reset-password/step2`,
        },
      },
      errorPolicy: 'all',
      fetchPolicy: 'network-only',
    })

    setCurrentData(data)
    setIsLoading(false)

    data.sendTokenToEmail
      ? toast.success(data.sendTokenToEmail.message)
      : toast.error(
          errors?.[0].message ?? 'Algo deu errado, tente novamente mais tarde.',
        )
  }

  return (
    <Form {...form}>
      <form
        className="grid gap-4"
        onSubmit={(...args) => void form.handleSubmit(onSubmit)(...args)}
      >
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="exemplo@seuemail.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {currentData.sendTokenToEmail && hasCountdown && (
          <Alert>
            <Icons.AlertCircle className="size-4" />
            {/* <AlertTitle>Redefinição pendente</AlertTitle> */}
            <AlertDescription>
              {currentData.sendTokenToEmail.message}
            </AlertDescription>
          </Alert>
        )}

        <Button disabled={isLoading || hasCountdown}>
          {isLoading && (
            <Icons.Spinner
              className="mr-2 size-4 animate-spin"
              aria-hidden="true"
            />
          )}
          Enviar email
          {hasCountdown && (
            <>
              {' '}
              ({minutes.toString().length < 2 ? `0${minutes}` : minutes}:
              {seconds.toString().length < 2 ? `0${seconds}` : seconds})
            </>
          )}
          <span className="sr-only">
            Continuar para verificação de redefinição de senha
          </span>
        </Button>
      </form>
    </Form>
  )
}
