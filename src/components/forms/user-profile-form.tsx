'use client'

import { gql, useMutation } from '@apollo/client'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import type * as z from 'zod'

import { getCurrentUserToken } from '@/app/_actions/user'
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
import { userProfileSchema } from '@/lib/validations/user-profile'
import { Icons } from '../icons'
import { UserAvatar } from '../user-avatar'

const UPDATE_USER_PROFILE = gql`
  mutation UpdateUserProfile($input: UpdateUserProfileInput!) {
    updateUserProfile(updateUserProfileInput: $input) {
      name
      image
    }
  }
`

type Inputs = z.infer<typeof userProfileSchema>

interface UserProfileFormProps {
  user: {
    name: string
    image?: string
  }
}

export function UserProfileForm({ user }: UserProfileFormProps) {
  const router = useRouter()

  const form = useForm<Inputs>({
    resolver: zodResolver(userProfileSchema),
    defaultValues: {
      ...user,
    },
  })

  const [updateProfile, { loading: isLoading }] = useMutation(
    UPDATE_USER_PROFILE,
    {
      onError(error, _clientOptions) {
        toast.error(error.message)
      },
      onCompleted(_data, _clientOptions) {
        toast.success('Perfil atualizado com sucesso!')
        router.refresh()
      },
    },
  )

  async function onSubmit({ name, image }: Inputs) {
    const token = await getCurrentUserToken()
    updateProfile({
      variables: {
        input: {
          name,
        },
      },
      context: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="image"
          render={() => (
            <FormItem>
              <FormLabel className="text-base">Foto de perfil</FormLabel>
              <div className="flex items-center space-x-4">
                <UserAvatar
                  user={{
                    name: user.name || null,
                    image: user.image || null,
                  }}
                  className="h-8 w-8"
                />
                {/* Implementar a lógica de upload de arquivos */}
                <FormControl>
                  <Input
                    disabled
                    type="file"
                    className="cursor-pointer pt-1.5 file:cursor-pointer file:rounded-lg file:bg-accent file:text-accent-foreground file:hover:bg-accent/50"
                  />
                </FormControl>
              </div>
              <FormDescription>
                Selecine um imagem para usar como foto de perfil pública.
                (Temporariamente desabilitado)
              </FormDescription>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base">Nome</FormLabel>
              <FormControl>
                <Input placeholder="Seu nome" {...field} />
              </FormControl>
              <FormDescription>
                Este nome será mostrado publicamente.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button disabled={isLoading} type="submit">
          {isLoading && <Icons.Spinner className="mr-2 h-4 w-4 animate-spin" />}
          Atualizar perfil
        </Button>
      </form>
    </Form>
  )
}
