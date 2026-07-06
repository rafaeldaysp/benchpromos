'use client'

import { gql, useMutation } from '@apollo/client'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
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
import { env } from '@/env.mjs'
import { useFormStore } from '@/hooks/use-form-store'
import { discordRoleSchema } from '@/lib/validations/discord-role'

const CREATE_DISCORD_ROLE = gql`
  mutation CreateDiscordRole($input: CreateDiscordRoleInput!) {
    createDiscordRole(createDiscordRoleInput: $input) {
      id
    }
  }
`

const UPDATE_DISCORD_ROLE = gql`
  mutation UpdateDiscordRole($input: UpdateDiscordRoleInput!) {
    updateDiscordRole(updateDiscordRoleInput: $input) {
      id
    }
  }
`

type Inputs = z.infer<typeof discordRoleSchema>

const defaultValues: Partial<Inputs> = {
  name: '',
  value: '',
}

interface DiscordRoleFormProps {
  mode?: 'create' | 'update'
  discordRole?: { id?: string } & Partial<Inputs>
}

export function DiscordRoleForm({
  mode = 'create',
  discordRole,
}: DiscordRoleFormProps) {
  const form = useForm<Inputs>({
    resolver: zodResolver(discordRoleSchema),
    defaultValues: {
      ...defaultValues,
      ...discordRole,
    },
  })
  const { setOpenDialog } = useFormStore()
  const router = useRouter()

  const [mutateDiscordRole, { loading: isLoading }] = useMutation(
    mode === 'create' ? CREATE_DISCORD_ROLE : UPDATE_DISCORD_ROLE,
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
            ? 'discordRoleCreateForm'
            : `discordRoleUpdateForm.${discordRole?.id}`,
          false,
        )

        const message =
          mode === 'create'
            ? 'Cargo cadastrado com sucesso.'
            : 'Cargo atualizado com sucesso.'

        toast.success(message)
        router.refresh()
      },
      refetchQueries: ['GetDiscordRolesForShare'],
    },
  )

  async function onSubmit(data: Inputs) {
    await mutateDiscordRole({
      variables: {
        input: {
          id: discordRole?.id,
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
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome</FormLabel>
              <FormControl>
                <Input
                  placeholder="Promoções"
                  aria-invalid={!!form.formState.errors.name}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Nome exibido na seleção de cargos.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="value"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Menção</FormLabel>
              <FormControl>
                <Input
                  placeholder="<@&123456789> ou @everyone"
                  aria-invalid={!!form.formState.errors.value}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Texto inserido no topo da mensagem do Discord.
              </FormDescription>
              <FormMessage />
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
