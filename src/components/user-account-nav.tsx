'use client'

import { type Session } from 'next-auth'
import { signOut } from 'next-auth/react'
import Link from 'next/link'
import * as React from 'react'

import { Icons } from '@/components/icons'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { UserAvatar } from '@/components/user-avatar'

interface UserAccountNavProps extends React.HTMLAttributes<HTMLDivElement> {
  user: Session['user']
}

export function UserAccountNav({ user }: UserAccountNavProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="relative">
        <UserAvatar
          user={{ name: user.name || null, image: user.image || null }}
          className="size-8"
        />
        {!user.emailVerified && (
          <Icons.AlertCircle className="absolute right-0.5 top-0.5 size-3 fill-warning text-warning-foreground" />
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        <div className="flex items-center justify-start gap-2 p-2">
          <div className="flex flex-col space-y-1 leading-none">
            {user.name && <p className="font-medium">{user.name}</p>}
            {user.email && (
              <p className="w-[200px] truncate text-sm text-muted-foreground">
                {user.email}
              </p>
            )}
          </div>
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuItem className="cursor-pointer" asChild>
          <Link href="/user/profile">
            <Icons.User className="mr-2 size-4" />
            <span>Perfil</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer" asChild>
          <Link href="/user/alerts">
            <Icons.Bell className="mr-2 size-4" />
            <span>Alertas</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer" asChild>
          <Link href="/user/favorites">
            <Icons.Heart className="mr-2 size-4" />
            <span>Favoritos</span>
          </Link>
        </DropdownMenuItem>

        {user.role === 'ADMIN' && (
          <>
            <DropdownMenuItem className="cursor-pointer" asChild>
              <Link href="/dashboard">
                <Icons.Lock className="mr-2 size-4" />
                <span>Dashboard (Admin)</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer" asChild>
              <Link href="/dashboard/sales">
                <Icons.DollarSign className="mr-2 size-4" />
                <span>Promoções (Admin)</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer" asChild>
              <Link href="/dashboard/benchmarks">
                <Icons.BarChart4 className="mr-2 size-4" />
                <span>Benchmarks (Admin)</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer text-success" asChild>
              <Link href="/dashboard/giveaways">
                <Icons.Gift className="mr-2 size-4" />
                <span>Sorteios (Admin)</span>
              </Link>
            </DropdownMenuItem>
          </>
        )}

        <DropdownMenuItem className="cursor-pointer" asChild>
          <Link href={'/politica-de-privacidade'}>
            <Icons.MenuSquare className="mr-2 size-4" />
            <span>Política de Privacidade</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {!user.emailVerified && (
          <DropdownMenuItem className="cursor-pointer" asChild>
            <Link href={'/sign-up/step2'}>
              <Icons.AlertCircle className="mr-2 size-4" />
              <span>Verificar conta</span>
            </Link>
          </DropdownMenuItem>
        )}

        <DropdownMenuItem
          className="cursor-pointer"
          onSelect={(event) => {
            event.preventDefault()
            signOut()
          }}
        >
          <Icons.LogOut className="mr-2 size-4" />
          <span>Sair</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
