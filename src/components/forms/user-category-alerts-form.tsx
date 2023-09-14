'use client'

import { gql, useMutation } from '@apollo/client'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import type * as z from 'zod'

import { getCurrentUserToken } from '@/app/_actions/user'
import { Icons } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { userAlertsSchema } from '@/lib/validations/user-alerts'
import { type Category } from '@/types'

const UPDATE_USER_ALERTS = gql`
  mutation UpdateUserAlerts($input: UpdateAllAlertsInput!) {
    updateAllAlerts(updateAllAlertsInput: $input) {
      email
    }
  }
`

type Inputs = z.infer<typeof userAlertsSchema>

interface UserCategoryAlertsFormProps {
  categories: Pick<Category, 'id' | 'name'>[]
  selectedCategories: string[]
}

export function UserCategoryAlertsForm({
  categories,
  selectedCategories,
}: UserCategoryAlertsFormProps) {
  const router = useRouter()

  const form = useForm<Inputs>({
    resolver: zodResolver(userAlertsSchema),
    defaultValues: {
      selectedCategories,
    },
  })

  const [updateUserAlerts, { loading: isLoading }] = useMutation(
    UPDATE_USER_ALERTS,
    {
      onError(error, _clientOptions) {
        toast.error(error.message)
      },
      onCompleted(_data, _clientOptions) {
        toast.success('Seus alertas foram atualizados.')
        router.refresh()
      },
    },
  )

  async function onSubmit({ selectedCategories }: Inputs) {
    const token = await getCurrentUserToken()
    updateUserAlerts({
      context: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      variables: {
        input: {
          selectedCategories,
        },
      },
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="selectedCategories"
          render={() => (
            <FormItem>
              <div className="mb-4">
                <FormLabel className="text-base">
                  Alertas por categoria
                </FormLabel>
                <FormDescription>
                  Você será notificado quando houver promoções desta(s)
                  categoria(s).
                </FormDescription>
              </div>
              <div className="grid grid-cols-2 space-y-2 sm:grid-cols-3">
                {categories.map((category) => (
                  <FormField
                    key={category.id}
                    control={form.control}
                    name={`selectedCategories`}
                    render={({ field }) => {
                      return (
                        <FormItem
                          key={category.id}
                          className="flex flex-row items-end space-x-3 space-y-0"
                        >
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(category.id)}
                              onCheckedChange={(checked) => {
                                return checked
                                  ? field.onChange([
                                      ...field.value,
                                      category.id,
                                    ])
                                  : field.onChange(
                                      field.value?.filter(
                                        (value) => value !== category.id,
                                      ),
                                    )
                              }}
                            />
                          </FormControl>
                          <FormLabel className="font-normal">
                            {category.name}
                          </FormLabel>
                        </FormItem>
                      )
                    }}
                  />
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button disabled={isLoading} type="submit">
          {isLoading && <Icons.Spinner className="mr-2 h-4 w-4 animate-spin" />}
          Atualizar alertas
        </Button>
      </form>
    </Form>
  )
}
