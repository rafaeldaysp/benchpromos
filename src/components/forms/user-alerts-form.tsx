'use client'

import { gql, useMutation } from '@apollo/client'
import { zodResolver } from '@hookform/resolvers/zod'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useFieldArray, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import type * as z from 'zod'

import { getCurrentUserToken } from '@/app/_actions/user'
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
import { priceFormatter } from '@/utils/formatter'
import { Icons } from '../icons'
import { PriceInput } from '../price-input'
import { Card, CardContent, CardFooter, CardTitle } from '../ui/card'
import { Dialog, DialogContent, DialogTrigger } from '../ui/dialog'

const UPDATE_USER_ALERTS = gql`
  mutation UpdateUserAlerts($input: UpdateUserAlertsInput!) {
    updateUserAlerts(updateUserAlertsInput: $input) {
      email
    }
  }
`

type Inputs = z.infer<typeof userAlertsSchema>

interface AlertsFormProps {
  categories: Pick<Category, 'id' | 'name'>[]
  initialAlerts: {
    selectedCategories: string[]
    subscribedProducts: {
      subscribedPrice: number
      product: {
        id: string
        imageUrl: string
        slug: string
        name: string
        deals: { price: number }[]
      }
    }[]
  }
}

export function AlertsForm({ categories, initialAlerts }: AlertsFormProps) {
  const router = useRouter()

  const form = useForm<Inputs>({
    resolver: zodResolver(userAlertsSchema),
    defaultValues: {
      ...initialAlerts,
    },
  })

  const { fields, remove } = useFieldArray({
    name: 'subscribedProducts',
    control: form.control,
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

  async function onSubmit({ selectedCategories, subscribedProducts }: Inputs) {
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
          subscribedProducts: subscribedProducts.map((product) => ({
            productId: product.product.id,
            price: product.subscribedPrice,
          })),
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

        <fieldset className="space-y-2">
          <div className="mb-4">
            <FormLabel className="text-base">Alertas por produto</FormLabel>
            <FormDescription>
              Receba notificações quando o(s) produto(s) alcançar(em) o preço
              desejado.
            </FormDescription>
          </div>
          <div className="space-y-2 sm:grid sm:grid-cols-2">
            {fields.map((subscription, index) => (
              <FormField
                key={subscription.product.id}
                control={form.control}
                name={`subscribedProducts.${index}.subscribedPrice`}
                render={({ field }) => {
                  return (
                    <FormItem key={subscription.product.id}>
                      <Dialog>
                        <Card className="relative flex select-none flex-col overflow-hidden transition-colors hover:bg-muted/50">
                          <CardContent className="space-y-3 p-3">
                            <CardTitle className="line-clamp-2 space-x-1 text-sm font-semibold">
                              {subscription.product.name}
                            </CardTitle>
                            <div className="grid grid-cols-2 gap-x-3 text-sm text-muted-foreground">
                              <div className="flex h-full items-center">
                                <div className="relative mx-auto aspect-square w-full sm:w-8/12">
                                  <Image
                                    src={subscription.product.imageUrl}
                                    alt={subscription.product.name}
                                    className="rounded-lg object-contain"
                                    fill
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                  />
                                </div>
                              </div>

                              <div className="col-span-1 flex flex-col justify-center space-y-1">
                                <div className="flex flex-col">
                                  <span>Preço atual</span>
                                  <strong className="text-lg text-foreground">
                                    {priceFormatter.format(
                                      subscription.product.deals[0].price / 100,
                                    )}
                                  </strong>
                                </div>

                                <div className="flex flex-col">
                                  <span>Preço desejado</span>

                                  <strong className="text-lg text-foreground">
                                    {priceFormatter.format(field.value / 100)}
                                  </strong>
                                </div>
                              </div>
                            </div>
                          </CardContent>

                          <CardFooter className="flex items-center justify-between p-3 pt-0">
                            <Button
                              type="button"
                              variant={'ghost'}
                              onClick={() => remove(index)}
                            >
                              Excluir
                            </Button>
                            <DialogTrigger asChild>
                              <Button type="button" variant={'ghost'}>
                                Editar
                              </Button>
                            </DialogTrigger>
                          </CardFooter>
                        </Card>
                        <DialogContent>
                          <FormControl>
                            <PriceInput
                              className="text-lg font-semibold text-foreground"
                              value={
                                field.value ? field.value / 100 : undefined
                              }
                              onValueChange={({ floatValue }) =>
                                field.onChange(~~((floatValue ?? 0) * 100))
                              }
                            />
                          </FormControl>
                        </DialogContent>
                      </Dialog>
                      <FormMessage />
                    </FormItem>
                  )
                }}
              />
            ))}
          </div>
        </fieldset>

        <Button disabled={isLoading} type="submit">
          {isLoading && <Icons.Spinner className="mr-2 h-4 w-4 animate-spin" />}
          Atualizar alertas
        </Button>
      </form>
    </Form>
  )
}
