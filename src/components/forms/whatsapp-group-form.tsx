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
import { Switch } from '@/components/ui/switch'
import { env } from '@/env.mjs'
import { useFormStore } from '@/hooks/use-form-store'
import { whatsappGroupSchema } from '@/lib/validations/whatsapp-group'

const CREATE_WHATSAPP_GROUP = gql`
  mutation CreateWhatsappGroup($input: CreateWhatsappGroupInput!) {
    createWhatsappGroup(createWhatsappGroupInput: $input) {
      id
    }
  }
`

const UPDATE_WHATSAPP_GROUP = gql`
  mutation UpdateWhatsappGroup($input: UpdateWhatsappGroupInput!) {
    updateWhatsappGroup(updateWhatsappGroupInput: $input) {
      id
    }
  }
`

type Inputs = z.infer<typeof whatsappGroupSchema>

const defaultValues: Partial<Inputs> = {
  url: '',
  active: false,
}

interface WhatsappGroupFormProps {
  mode?: 'create' | 'update'
  whatsappGroup?: { id?: string } & Partial<Inputs>
}

export function WhatsappGroupForm({
  mode = 'create',
  whatsappGroup,
}: WhatsappGroupFormProps) {
  const form = useForm<Inputs>({
    resolver: zodResolver(whatsappGroupSchema),
    defaultValues: {
      ...defaultValues,
      ...whatsappGroup,
    },
  })
  const { setOpenDialog } = useFormStore()
  const router = useRouter()

  const [mutateWhatsappGroup, { loading: isLoading }] = useMutation(
    mode === 'create' ? CREATE_WHATSAPP_GROUP : UPDATE_WHATSAPP_GROUP,
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
            ? 'whatsappGroupCreateForm'
            : `whatsappGroupUpdateForm.${whatsappGroup?.id}`,
          false,
        )

        const message =
          mode === 'create'
            ? 'Grupo cadastrado com sucesso.'
            : 'Grupo atualizado com sucesso.'

        toast.success(message)
        router.refresh()
      },
    },
  )

  async function onSubmit(data: Inputs) {
    await mutateWhatsappGroup({
      variables: {
        input: {
          id: whatsappGroup?.id,
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
          name="url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Link do grupo</FormLabel>
              <FormControl>
                <Input
                  placeholder="https://chat.whatsapp.com/..."
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
          name="active"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-md border border-input px-3 py-2 shadow-sm">
              <div className="space-y-0.5">
                <FormLabel>Ativo</FormLabel>
                <FormDescription>
                  O grupo ativo é o exibido na página pública.
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
