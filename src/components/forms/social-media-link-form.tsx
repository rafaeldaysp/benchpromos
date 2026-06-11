'use client'

import { gql, useMutation } from '@apollo/client'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { type z } from 'zod'

import { Icons } from '@/components/icons'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import {
  socialMediaPlatformMeta,
  socialMediaPlatformOrder,
  socialMediaTypeMeta,
  socialMediaTypeOrder,
} from '@/constants/social-media'
import { env } from '@/env.mjs'
import { useFormStore } from '@/hooks/use-form-store'
import { socialMediaLinkSchema } from '@/lib/validations/social-media-link'

const CREATE_SOCIAL_MEDIA_LINK = gql`
  mutation CreateSocialMediaLink($input: CreateSocialMediaLinkInput!) {
    createSocialMediaLink(createSocialMediaLinkInput: $input) {
      id
    }
  }
`

const UPDATE_SOCIAL_MEDIA_LINK = gql`
  mutation UpdateSocialMediaLink($input: UpdateSocialMediaLinkInput!) {
    updateSocialMediaLink(updateSocialMediaLinkInput: $input) {
      id
    }
  }
`

type Inputs = z.infer<typeof socialMediaLinkSchema>

const defaultValues: Partial<Inputs> = {
  url: '',
  title: '',
  description: '',
  active: false,
}

interface SocialMediaLinkFormProps {
  mode?: 'create' | 'update'
  socialMediaLink?: { id?: string } & Partial<Inputs>
}

export function SocialMediaLinkForm({
  mode = 'create',
  socialMediaLink,
}: SocialMediaLinkFormProps) {
  const form = useForm<Inputs>({
    resolver: zodResolver(socialMediaLinkSchema),
    defaultValues: {
      ...defaultValues,
      ...socialMediaLink,
    },
  })
  const { setOpenDialog } = useFormStore()
  const router = useRouter()

  const [mutateSocialMediaLink, { loading: isLoading }] = useMutation(
    mode === 'create' ? CREATE_SOCIAL_MEDIA_LINK : UPDATE_SOCIAL_MEDIA_LINK,
    {
      context: {
        headers: {
          'api-key': env.NEXT_PUBLIC_API_KEY,
        },
      },
      onError(error, _clientOptions) {
        toast.error(error.message)
      },
      onCompleted(_data, _clientOptions) {
        form.reset()

        setOpenDialog(
          mode === 'create'
            ? 'socialMediaLinkCreateForm'
            : `socialMediaLinkUpdateForm.${socialMediaLink?.id}`,
          false,
        )

        const message =
          mode === 'create'
            ? 'Link cadastrado com sucesso.'
            : 'Link atualizado com sucesso.'

        toast.success(message)
        router.refresh()
      },
    },
  )

  async function onSubmit(data: Inputs) {
    await mutateSocialMediaLink({
      variables: {
        input: {
          id: socialMediaLink?.id,
          ...data,
        },
      },
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="platform"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Plataforma</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma plataforma" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {socialMediaPlatformOrder.map((platform) => (
                    <SelectItem key={platform} value={platform}>
                      {socialMediaPlatformMeta[platform].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um tipo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {socialMediaTypeOrder.map((type) => (
                    <SelectItem key={type} value={type}>
                      {socialMediaTypeMeta[type].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Define em qual seção o link aparece na página pública.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Link</FormLabel>
              <FormControl>
                <Input
                  placeholder="https://..."
                  aria-invalid={!!form.formState.errors.url}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Título (opcional)</FormLabel>
              <FormControl>
                <Input
                  placeholder="Nota interna"
                  {...field}
                  value={field.value ?? ''}
                />
              </FormControl>
              <FormDescription>
                Anotação para o painel. Não aparece na página pública.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição (opcional)</FormLabel>
              <FormControl>
                <Input
                  placeholder="Nota interna"
                  {...field}
                  value={field.value ?? ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="active"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-md border border-input px-3 py-2 shadow-sm">
              <div className="space-y-0.5">
                <FormLabel>Ativo</FormLabel>
                <FormDescription>
                  Links ativos são exibidos na página pública.
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <Button
          type="button"
          onClick={form.handleSubmit(onSubmit)}
          disabled={isLoading}
        >
          {isLoading && (
            <Icons.Spinner
              className="mr-2 size-4 animate-spin"
              aria-hidden="true"
            />
          )}
          {mode === 'create' ? 'Cadastrar' : 'Atualizar'}
        </Button>
      </form>
    </Form>
  )
}
