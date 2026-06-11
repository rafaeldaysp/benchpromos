'use client'

import { gql, useMutation } from '@apollo/client'
import dayjs from 'dayjs'
import 'dayjs/locale/pt-br'
import relativeTime from 'dayjs/plugin/relativeTime'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { DashboardItemCard } from '@/components/dashboard-item-card'
import { SocialMediaLinkForm } from '@/components/forms/social-media-link-form'
import { Icons } from '@/components/icons'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import {
  socialMediaPlatformMeta,
  socialMediaTypeMeta,
} from '@/constants/social-media'
import { env } from '@/env.mjs'
import { useFormStore } from '@/hooks/use-form-store'
import { cn } from '@/lib/utils'
import type { SocialMediaLink } from '@/types'

dayjs.extend(relativeTime)
dayjs.locale('pt-br')

const UPDATE_SOCIAL_MEDIA_LINK = gql`
  mutation UpdateSocialMediaLinkActive($input: UpdateSocialMediaLinkInput!) {
    updateSocialMediaLink(updateSocialMediaLinkInput: $input) {
      id
      active
    }
  }
`

const DELETE_SOCIAL_MEDIA_LINK = gql`
  mutation DeleteSocialMediaLink($socialMediaLinkId: ID!) {
    removeSocialMediaLink(id: $socialMediaLinkId) {
      id
    }
  }
`

interface SocialMediaLinksMainProps {
  socialMediaLinks: SocialMediaLink[]
}

export function SocialMediaLinksMain({
  socialMediaLinks,
}: SocialMediaLinksMainProps) {
  const { openDialogs, setOpenDialog } = useFormStore()
  const router = useRouter()

  const mutationContext = {
    headers: {
      'api-key': env.NEXT_PUBLIC_API_KEY,
    },
  }

  const [updateSocialMediaLink, { loading: isUpdating }] = useMutation(
    UPDATE_SOCIAL_MEDIA_LINK,
    {
      context: mutationContext,
      onError(error) {
        toast.error(error.message)
      },
      onCompleted() {
        router.refresh()
      },
    },
  )

  const [deleteSocialMediaLink] = useMutation(DELETE_SOCIAL_MEDIA_LINK, {
    context: mutationContext,
    onError(error) {
      toast.error(error.message)
    },
    onCompleted() {
      toast.success('Link deletado com sucesso.')
      router.refresh()
    },
  })

  return (
    <div className="space-y-8">
      {/* Social Media Links Actions */}
      <div className="flex justify-end gap-x-2">
        <Sheet
          open={openDialogs['socialMediaLinkCreateForm']}
          onOpenChange={(open) =>
            setOpenDialog('socialMediaLinkCreateForm', open)
          }
        >
          <SheetTrigger asChild>
            <Button variant="outline">Adicionar</Button>
          </SheetTrigger>
          <SheetContent
            className="w-full space-y-4 overflow-auto sm:max-w-xl"
            side="left"
          >
            <SheetHeader>
              <SheetTitle>ADICIONAR LINK</SheetTitle>
            </SheetHeader>
            <SocialMediaLinkForm />
          </SheetContent>
        </Sheet>
      </div>

      {/* Social Media Links */}
      {socialMediaLinks.length > 0 ? (
        <ScrollArea
          className={cn('rounded-md border', {
            'h-[600px]': socialMediaLinks.length > 8,
          })}
        >
          {socialMediaLinks.map((socialMediaLink) => {
            const platform = socialMediaPlatformMeta[socialMediaLink.platform]
            const type = socialMediaTypeMeta[socialMediaLink.type]

            return (
              <DashboardItemCard.Root key={socialMediaLink.id}>
                <DashboardItemCard.Content>
                  <div className="flex flex-wrap items-center gap-2">
                    {platform && (
                      <span
                        className="flex items-center gap-1.5 text-sm font-medium"
                        style={{ color: platform.color }}
                      >
                        <platform.icon className="size-4" />
                        {platform.label}
                      </span>
                    )}
                    {type && <Badge variant="secondary">{type.label}</Badge>}
                    {socialMediaLink.active && (
                      <Badge variant="success">Ativo</Badge>
                    )}
                  </div>
                  <p className="break-all text-sm leading-7">
                    {socialMediaLink.url}
                  </p>
                  {socialMediaLink.title && (
                    <span className="text-xs text-muted-foreground">
                      {socialMediaLink.title}
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">
                    Atualizado {dayjs(socialMediaLink.updatedAt).fromNow()}
                  </span>
                </DashboardItemCard.Content>

                <DashboardItemCard.Actions>
                  <div className="flex items-center gap-2 self-center rounded-md border border-input px-3 py-1.5 shadow-sm">
                    <Label
                      htmlFor={`social-media-link-active-${socialMediaLink.id}`}
                      className="text-xs font-normal text-muted-foreground"
                    >
                      Ativo
                    </Label>
                    <Switch
                      id={`social-media-link-active-${socialMediaLink.id}`}
                      checked={socialMediaLink.active}
                      disabled={isUpdating}
                      onCheckedChange={(checked) =>
                        updateSocialMediaLink({
                          variables: {
                            input: { id: socialMediaLink.id, active: checked },
                          },
                        })
                      }
                    />
                  </div>

                  <Sheet
                    open={
                      openDialogs[
                        `socialMediaLinkUpdateForm.${socialMediaLink.id}`
                      ]
                    }
                    onOpenChange={(open) =>
                      setOpenDialog(
                        `socialMediaLinkUpdateForm.${socialMediaLink.id}`,
                        open,
                      )
                    }
                  >
                    <SheetTrigger asChild>
                      <DashboardItemCard.Action icon={Icons.Edit} />
                    </SheetTrigger>
                    <SheetContent
                      className="w-full space-y-4 overflow-auto sm:max-w-xl"
                      side="left"
                    >
                      <SheetHeader>
                        <SheetTitle>EDITAR LINK</SheetTitle>
                      </SheetHeader>
                      <SocialMediaLinkForm
                        mode="update"
                        socialMediaLink={socialMediaLink}
                      />
                    </SheetContent>
                  </Sheet>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <DashboardItemCard.Action
                        variant="destructive"
                        icon={Icons.Trash}
                      />
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Essa ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() =>
                            deleteSocialMediaLink({
                              variables: {
                                socialMediaLinkId: socialMediaLink.id,
                              },
                            })
                          }
                        >
                          Continuar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </DashboardItemCard.Actions>
              </DashboardItemCard.Root>
            )
          })}
        </ScrollArea>
      ) : (
        <div className="flex justify-center">
          <p className="text-muted-foreground">Nenhum link encontrado.</p>
        </div>
      )}
    </div>
  )
}
