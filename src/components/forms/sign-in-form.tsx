'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { type z } from 'zod'
import { signIn } from 'next-auth/react'
import { toast } from 'sonner'
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
import { authSchema } from '@/lib/validations/auth'

type Inputs = Omit<z.infer<typeof authSchema>, 'name'>

export function SignInForm() {
  const form = useForm<Inputs>({
    resolver: zodResolver(authSchema.omit({ name: true })),
    defaultValues: {
      email: '',
      password: '',
    },
  })
  const [isLoading, setIsLoading] = React.useState(false)

  async function onSubmit(data: Inputs) {
    setIsLoading(true)

    const callback = await signIn('credentials', {
      ...data,
      callbackUrl: '/',
      redirect: false,
    })

    setIsLoading(false)

    if (callback?.error) {
      toast.error(callback.error)
    }
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
          Entrar
          <span className="sr-only">Entrar</span>
        </Button>
      </form>
    </Form>
  )
}
