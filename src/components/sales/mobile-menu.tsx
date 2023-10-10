import { type ApolloClient } from '@apollo/client'
import Link from 'next/link'
import * as React from 'react'

import { AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { cn } from '@/lib/utils'
import { Icons } from '../icons'
import { Button, buttonVariants } from '../ui/button'
import { Drawer, DrawerContent } from '../ui/drawer'
import { ReactionDrawer } from './reaction-drawer'
import { HighlightSaleToggle } from './sale-highlight'

interface MobileMenuProps {
  open: boolean
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
  setOpenSaleDialog: (dialogName: string, open: boolean) => void
  sale: {
    slug: string
    id: string
    productSlug?: string
    category: {
      slug: string
    }
    highlight: boolean
  }
  user?: { id: string; isAdmin: boolean }
  apolloClient: ApolloClient<unknown>
}

export function MobileMenu({
  open,
  setOpen,
  sale,
  user,
  apolloClient,
  setOpenSaleDialog,
}: MobileMenuProps) {
  const [snap, setSnap] = React.useState<number | string | null>(0.7)
  return (
    <Drawer
      snapPoints={[0.7, 1]}
      activeSnapPoint={snap}
      setActiveSnapPoint={setSnap}
      open={open}
      onClose={() => setOpen(false)}
    >
      <DrawerContent
        className={cn(
          'fixed h-full max-h-[70%] space-y-2 rounded-t-2xl sm:hidden',
          {
            'overflow-y-hidden': snap !== 1,
            'max-h-[80%]': user?.isAdmin,
          },
        )}
      >
        <div className="relative -top-2 left-1/2 h-1.5 w-12 shrink-0 -translate-x-1/2 rounded-full bg-accent" />
        <main className="flex flex-col space-y-1">
          <ReactionDrawer
            saleId={sale.id}
            apolloClient={apolloClient}
            userId={user?.id}
          />

          <h3 className="py-2 text-sm text-muted-foreground">Interagir</h3>
          <Link
            href={`/sale/${sale.slug}/${sale.id}#comments`}
            className={cn(
              buttonVariants({ variant: 'ghost', size: 'lg' }),
              'justify-start px-2 ',
            )}
          >
            <Icons.MessageCircle className="mr-4 h-4 w-4" />
            <span>Comentar</span>
          </Link>

          <Link
            href={`/sale/${sale.slug}/${sale.id}`}
            className={cn(
              buttonVariants({ variant: 'ghost', size: 'lg' }),
              'justify-start px-2 ',
            )}
          >
            <Icons.GanttChartSquare className="mr-4 h-4 w-4" />
            <span>Visualizar promoção</span>
          </Link>
          {sale.productSlug && (
            <>
              <h3 className="py-3 text-sm text-muted-foreground">
                Mais informações
              </h3>

              <Link
                href={`/${sale.category.slug}/${sale.productSlug}`}
                className={cn(
                  buttonVariants({ variant: 'ghost', size: 'lg' }),
                  'justify-start px-2 ',
                )}
              >
                <Icons.Eye className="mr-4 h-4 w-4" />
                <span>Visualizar produto</span>
              </Link>
              <Link
                href={`/${sale.category.slug}/${sale.productSlug}#historico`}
                className={cn(
                  buttonVariants({ variant: 'ghost', size: 'lg' }),
                  'justify-start px-2 ',
                )}
              >
                <Icons.LineChart className="mr-4 h-4 w-4" />
                <span>Histórico de preços</span>
              </Link>
              <Link
                href={`/${sale.category.slug}/${sale.productSlug}#precos`}
                className={cn(
                  buttonVariants({ variant: 'ghost', size: 'lg' }),
                  'justify-start px-2 ',
                )}
              >
                <Icons.DollarSign className="mr-4 h-4 w-4" />
                <span>Opções de compra</span>
              </Link>
            </>
          )}
          {user?.isAdmin && (
            <>
              <h3 className="py-3 text-sm text-muted-foreground">Admin</h3>

              <HighlightSaleToggle
                sale={{ highlight: sale.highlight, id: sale.id }}
                user={user}
                className="h-10 cursor-pointer gap-2 rounded-md px-2 font-medium"
              />

              <Button
                variant={'ghost'}
                className={cn(
                  buttonVariants({ variant: 'ghost', size: 'lg' }),
                  'justify-start px-2 ',
                )}
                onClick={() =>
                  setOpenSaleDialog(`saleUpdateForm.${sale.id}`, true)
                }
              >
                <Icons.Edit className="mr-4 h-4 w-4" />
                Editar
              </Button>

              <AlertDialogTrigger asChild>
                <Button
                  variant={'ghost'}
                  className={cn(
                    buttonVariants({ variant: 'ghost', size: 'lg' }),
                    'justify-start px-2 ',
                  )}
                >
                  <Icons.Trash className="mr-4 h-4 w-4" />
                  Excluir
                </Button>
              </AlertDialogTrigger>
            </>
          )}
        </main>
      </DrawerContent>
    </Drawer>
  )
}
