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
import { Textarea } from '@/components/ui/textarea'
import { env } from '@/env.mjs'
import { tierListSchema } from '@/lib/validations/tier-list'
import type { Category } from '@/types'

const CREATE_TIER_LIST = gql`
  mutation CreateTierList($createTierListInput: CreateTierListInput!) {
    createTierList(createTierListInput: $createTierListInput) {
      id
      slug
    }
  }
`

type Inputs = z.infer<typeof tierListSchema>

const defaultValues: Partial<Inputs> = {
  title: '',
  description: '',
  categoryId: '',
}

interface TierListFormProps {
  categories: Pick<Category, 'id' | 'name'>[]
  onSuccess?: (slug: string) => void
}

export function TierListForm({ categories, onSuccess }: TierListFormProps) {
  const form = useForm<Inputs>({
    resolver: zodResolver(tierListSchema),
    defaultValues,
  })
  const router = useRouter()

  const [createTierList, { loading: isLoading }] = useMutation(
    CREATE_TIER_LIST,
    {
      context: {
        headers: {
          'api-key': env.NEXT_PUBLIC_API_KEY,
        },
      },
      onError(error) {
        toast.error(error.message)
      },
      onCompleted(data) {
        form.reset()
        toast.success('Tier list criada com sucesso.')
        const slug = data.createTierList.slug
        onSuccess?.(slug)
        router.push(`/tier-lists/${slug}`)
        router.refresh()
      },
    },
  )

  async function onSubmit(data: Inputs) {
    await createTierList({
      variables: {
        createTierListInput: {
          title: data.title,
          description: data.description || undefined,
          categoryId: data.categoryId,
          tiers: [],
        },
      },
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Título</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ex: Melhores Notebooks 2026"
                  aria-invalid={!!form.formState.errors.title}
                  {...field}
                />
              </FormControl>
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
                <Textarea
                  placeholder="Uma breve descrição da tier list..."
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="categoryId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Categoria</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="max-h-80">
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
          Criar
        </Button>
      </form>
    </Form>
  )
}
