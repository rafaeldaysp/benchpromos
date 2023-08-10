'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { type z } from 'zod'
import * as React from 'react'

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
import { resetPasswordSchema } from '@/lib/validations/auth'
import { gql, useMutation } from '@apollo/client'
import { toast } from 'sonner'
import { signIn } from 'next-auth/react'

const RESET_PASSWORD = gql`
  mutation ResetPassword($input: ResetPasswordInput!) {
    user: resetPassword(resetPasswordInput: $input) {
      email
    }
  }
`

type Inputs = z.infer<typeof resetPasswordSchema>

interface ResetPasswordStep2FormProps {
  token: string
}

export function ResetPasswordStep2Form({ token }: ResetPasswordStep2FormProps) {
  const form = useForm<Inputs>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  })

  const [isLoading, setIsLoading] = React.useState(false)

  const [resetPassword] = useMutation(RESET_PASSWORD, {
    onError(error, _clientOptions) {
      toast.error(error.message)
      setIsLoading(false)
    },
    async onCompleted(data, clientOptions) {
      const email = data.user.email as string
      const password = clientOptions?.variables?.input.password

      const callback = await signIn('credentials', {
        email,
        password,
        callbackUrl: '/',
        redirect: true,
      })

      if (callback?.error) {
        toast.error(callback.error)
      }

      setIsLoading(false)
    },
  })

  function onSubmit({ password }: Inputs) {
    setIsLoading(true)
    resetPassword({
      variables: {
        input: {
          password,
          token,
        },
      },
    })
  }

  return (
    <Form {...form}>
      <form
        className="grid gap-4"
        onSubmit={(...args) => void form.handleSubmit(onSubmit)(...args)}
      >
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Senha</FormLabel>
              <FormControl>
                <Input type="password" placeholder="*********" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirmar senha</FormLabel>
              <FormControl>
                <Input type="password" placeholder="*********" {...field} />
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
          Redefinir senha
          <span className="sr-only">Redefinir senha</span>
        </Button>
      </form>
    </Form>
  )
}
