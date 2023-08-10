'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { type z } from 'zod'
import * as React from 'react'
import { toast } from 'sonner'

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
import { gql, useApolloClient } from '@apollo/client'

const SEND_EMAIL_AUTHORIZATION = gql`
  query SendEmailAuthorization($input: SendTokenToEmailInput!) {
    sendTokenToEmail(sendTokenToEmailInput: $input)
  }
`

type Inputs = z.infer<typeof checkEmailSchema>

export function ResetPasswordForm() {
  const form = useForm<Inputs>({
    resolver: zodResolver(checkEmailSchema),
    defaultValues: {
      email: '',
    },
  })

  const [isLoading, setIsLoading] = React.useState(false)

  const client = useApolloClient()

  const url = document.location.href

  async function onSubmit({ email }: Inputs) {
    setIsLoading(true)
    const { data, errors } = await client.query({
      query: SEND_EMAIL_AUTHORIZATION,
      variables: {
        input: {
          tokenType: 'RESET_PASSWORD',
          email,
          redirectUrl: `${url}/step2`,
        },
      },
      errorPolicy: 'all',
    })
    setIsLoading(false)
    console.log(data.sendTokenToEmail)
    data.sendTokenToEmail === true
      ? toast.success(
          'Um link de mudança de senha foi enviado ao email inserido',
        )
      : toast.error(
          errors?.[0].message ?? 'Não foi possível realizar esta operação',
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
                <Input placeholder="bboyrafinhazika@gmail.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button disabled={isLoading}>
          {isLoading && (
            <Icons.Spinner
              className="mr-2 h-4 w-4 animate-spin"
              aria-hidden="true"
            />
          )}
          Continuar
          <span className="sr-only">
            Continuar para verificação de redefinição de senha
          </span>
        </Button>
      </form>
    </Form>
  )
}
