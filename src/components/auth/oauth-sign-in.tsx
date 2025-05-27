'use client'

import { signIn } from 'next-auth/react'
import * as React from 'react'
import { toast } from 'sonner'

import { Icons } from '@/components/icons'
import { Button } from '@/components/ui/button'

const oauthProviders = [{ name: 'google', icon: 'Google' }] satisfies {
  name: string
  icon: keyof typeof Icons
}[]

export function OAuthSignIn() {
  const [isLoading, setIsLoading] = React.useState<string | null>(null)

  async function oauthSignIn(provider: string) {
    setIsLoading(provider)

    const callback = await signIn(provider, {
      callbackUrl: '/',
      redirect: false,
    })

    setIsLoading(null)

    if (callback?.error) {
      toast.error('Something went wrong. Please try again.')
    }
  }

  return (
    <div className="grid grid-cols-1">
      {oauthProviders.map((provider) => {
        const Icon = Icons[provider.icon]

        return (
          <Button
            aria-label={`Sign in with ${provider.name}`}
            key={provider.name}
            variant="outline"
            className="w-full bg-background capitalize sm:w-auto"
            onClick={() => oauthSignIn(provider.name)}
            disabled={isLoading !== null}
          >
            {isLoading === provider.name ? (
              <Icons.Spinner
                className="mr-2 h-4 w-4 animate-spin"
                aria-hidden="true"
              />
            ) : (
              <Icon className="mr-2 h-4 w-4" aria-hidden="true" />
            )}
            {provider.name}
          </Button>
        )
      })}
    </div>
  )
}
