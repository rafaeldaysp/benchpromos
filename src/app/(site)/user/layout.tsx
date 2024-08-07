import { type Metadata } from 'next'

import { UserSidebarNav } from '@/components/layouts/user-sidebar-nav'
import { Separator } from '@/components/ui/separator'

export const metadata: Metadata = {
  title: 'Configurações',
  description: 'Configurações de conta e alertas do usuário.',
}

const userSidebarNavItems = [
  {
    title: 'Perfil',
    href: '/user/profile',
  },
  {
    title: 'Alertas',
    href: '/user/alerts',
  },
  {
    title: 'Favoritos',
    href: '/user/favorites',
  },
]

interface SettingsLayoutProps {
  children: React.ReactNode
}

export default function SettingsLayout({ children }: SettingsLayoutProps) {
  return (
    <div className="space-y-6 px-4 py-8 sm:container">
      <div className="space-y-0.5">
        <h2 className="font-medium tracking-tight">Configurações</h2>
        <p className="text-sm text-muted-foreground">
          Gerencie sua conta e defina seus alertas.
        </p>
      </div>
      <Separator className="my-6" />
      <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
        <aside className="lg:w-1/5">
          <UserSidebarNav items={userSidebarNavItems} />
        </aside>
        <div className="flex-1 lg:max-w-2xl">{children}</div>
      </div>
    </div>
  )
}
