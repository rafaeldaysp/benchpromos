'use client'

import { signIn } from 'next-auth/react'
import * as React from 'react'

import { Icons } from '@/components/icons'
import { Button } from '@/components/ui/button'

type SignInButtonProps = React.HTMLAttributes<HTMLButtonElement>

export function SignInButton({ ...props }: SignInButtonProps) {
  const [isLoading, setIsLoading] = React.useState(false)

  async function signInWithGoogle() {
    setIsLoading(true)

    const callback = await signIn('google', { redirect: false })

    setIsLoading(false)

    if (callback?.error) {
      return alert('Deu ruim.')
    }
  }

  return (
    <>
      <Button
        size="sm"
        onClick={signInWithGoogle}
        disabled={isLoading}
        {...props}
      >
        {isLoading && <Icons.Spinner className="mr-2 h-4 w-4 animate-spin" />}
        Entrar
      </Button>
    </>
  )
}
