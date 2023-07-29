import { type Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { getCurrentUser } from '@/app/_actions/user'
import { OAuthSignIn } from '@/components/auth/oauth-sign-in'
import { SignUpForm } from '@/components/forms/sign-up-form'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { env } from '@/env.mjs'

export const metadata: Metadata = {
  metadataBase: new URL(env.NEXT_PUBLIC_APP_URL),
  title: 'Cadastrar',
  description: 'Cadastrar uma conta',
}

export default async function SignUpPage() {
  const user = await getCurrentUser()
  if (user) redirect('/')

  return (
    <div>
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">Cadastrar</CardTitle>
          <CardDescription>
            Escolha seu método de cadastro preferido
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <OAuthSignIn />
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Ou continue com
              </span>
            </div>
          </div>
          <SignUpForm />
        </CardContent>
        <CardFooter>
          <div className="text-sm text-muted-foreground">
            Já possui uma conta?{' '}
            <Link
              aria-label="Entrar"
              href="/sign-in"
              className="text-primary underline-offset-4 transition-colors hover:underline"
            >
              Entrar
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
