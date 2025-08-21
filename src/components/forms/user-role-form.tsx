import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form'
import { type z } from 'zod'
import { Icons } from '../icons'
import { Button } from '../ui/button'
import { userRoleSchema } from '@/lib/validations/user-role'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useFormStore } from '@/hooks/use-form-store'
import { useRouter } from 'next/navigation'
import { gql, useMutation } from '@apollo/client'
import { env } from '@/env.mjs'
import { toast } from 'sonner'

const CHANGE_USER_ROLE = gql`
  mutation ChangeUserRole($userId: String!, $role: Role!) {
    changeRole(userId: $userId, role: $role) {
      id
    }
  }
`

type Input = z.infer<typeof userRoleSchema>

interface UserRoleFormProps {
  user: {
    id: string
    role: 'ADMIN' | 'MOD' | 'USER'
  }
}

export function UserRoleForm({ user }: UserRoleFormProps) {
  const form = useForm<Input>({
    resolver: zodResolver(userRoleSchema),
    defaultValues: {
      role: user.role,
    },
  })
  const { setOpenDialog } = useFormStore()
  const router = useRouter()

  const [changeUserRole, { loading: isLoading }] = useMutation(
    CHANGE_USER_ROLE,
    {
      refetchQueries: ['GetUsers'],
      context: {
        headers: {
          'api-key': env.NEXT_PUBLIC_API_KEY,
        },
      },
      onError(error, _clientOptions) {
        toast.error(error.message)
      },
      onCompleted(_data, _clientOptions) {
        toast.success('Usuário atualizado com sucesso.')
        setOpenDialog(`changeUserRoleForm.${user.id}`, false)
        router.refresh()
      },
    },
  )

  const onSubmit = ({ role }: Input) => {
    changeUserRole({
      variables: {
        userId: user.id,
        role,
      },
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cargo</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um cargo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {['ADMIN', 'MOD', 'USER'].map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex space-x-4">
          <Button
            type="button"
            className="w-full"
            variant={'outline'}
            onClick={() =>
              setOpenDialog(`changeUserRoleForm.${user.id}`, false)
            }
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading && (
              <Icons.Spinner
                className="mr-2 size-4 animate-spin"
                aria-hidden="true"
              />
            )}
            Confirmar
          </Button>
        </div>
      </form>
    </Form>
  )
}
