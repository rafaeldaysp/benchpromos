'use client'

import { gql, useMutation } from '@apollo/client'
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
import { signIn } from 'next-auth/react'

const CREATE_USER = gql`
  mutation CreateUserWithCredentials($input: AddUserInput!) {
    createUserWithCredentials(input: $input) {
      id
    }
  }
`

type Inputs = z.infer<typeof authSchema>

export function SignUpForm() {
  const form = useForm<Inputs>({
    resolver: zodResolver(authSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
  })

  const [createUser, { loading: isLoading }] = useMutation(CREATE_USER, {
    onError(error, _clientOptions) {
      toast.error(error.message)
    },
    async onCompleted(data, clientOptions) {
      const credentials = clientOptions?.variables?.input as Inputs

      await signIn('credentials', {
        ...credentials,
        callbackUrl: '/sign-up/step2',
        redirect: true,
      })
    },
  })

  async function onSubmit(data: Inputs) {
    await createUser({
      variables: {
        input: {
          ...data,
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
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome</FormLabel>
              <FormControl>
                <Input placeholder="Rafael Days" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
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
