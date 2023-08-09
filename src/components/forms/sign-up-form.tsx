'use client'

import { gql, useApolloClient, useMutation } from '@apollo/client'
import { zodResolver } from '@hookform/resolvers/zod'
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
import { authSchema } from '@/lib/validations/auth'
import { env } from '@/env.mjs'
import { usePathname } from 'next/navigation'

const CREATE_USER = gql`
  mutation CreateUserWithCredentials($input: AddUserInput!) {
    createUserWithCredentials(input: $input) {
      id
    }
  }
`

const SEND_EMAIL_VERIFICATION = gql`
  query SendConfirmationLink($input: SendTokenToEmailInput!) {
    sendTokenToEmail(sendTokenToEmailInput: $input)
  }
`

type Inputs = z.infer<typeof authSchema>

export function SignUpForm() {
  const form = useForm<Inputs>({
    resolver: zodResolver(authSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const pathname = usePathname()
  const client = useApolloClient()

  const [createUser, { loading: isLoading }] = useMutation(CREATE_USER, {
    context: {
      headers: {
        'api-key': env.NEXT_PUBLIC_API_KEY,
      },
    },
    onError(error, _clientOptions) {
      toast.error(error.message)
    },
    async onCompleted(data, clientOptions) {
      const email = clientOptions?.variables?.input.email as string

      console.log(email)

      await client.query({
        query: SEND_EMAIL_VERIFICATION,
        context: {
          headers: {
            'api-key': env.NEXT_PUBLIC_API_KEY,
          },
        },
        variables: {
          input: {
            email,
            tokenType: 'EMAIL_CONFIRMATION',
            redirectUrl: `${pathname}/verify-email`,
          },
        },
      })

      toast.success('Um link de confirmação foi enviado para o seu email')
    },
  })

  function onSubmit({ email, password }: Inputs) {
    createUser({
      variables: {
        input: {
          email,
          password,
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
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Senha</FormLabel>
              <FormControl>
                <Input type="password" placeholder="**********" {...field} />
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
            Continuar para a página de verificação de e-mail
          </span>
        </Button>
      </form>
    </Form>
  )
}
