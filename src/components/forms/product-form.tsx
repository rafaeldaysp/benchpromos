'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useFieldArray, useForm } from 'react-hook-form'
import { z } from 'zod'

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
import { labelVariants } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { productSchema } from '@/lib/validations/product'

type Inputs = z.infer<typeof productSchema>

const defaultValues: Partial<Inputs> = {}

export function ProductForm() {
  const form = useForm<Inputs>({
    resolver: zodResolver(productSchema),
    defaultValues,
  })

  const {
    fields: specsFields,
    append: specsAppend,
    remove: specsRemove,
  } = useFieldArray({
    control: form.control,
    name: 'specs',
  })

  function onSubmit(data: Inputs) {
    console.log(data)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormItem>
          <FormLabel>Título</FormLabel>
          <FormControl>
            <Input
              aria-invalid={!!form.formState.errors.title}
              {...form.register('title')}
            />
          </FormControl>
          <FormMessage />
        </FormItem>

        <FormItem>
          <FormLabel>Imagem</FormLabel>
          <FormControl>
            <Input
              aria-invalid={!!form.formState.errors.title}
              {...form.register('imageUrl')}
            />
          </FormControl>
          <FormMessage />
        </FormItem>

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
                <SelectContent>
                  <SelectItem value="m@example.com">m@example.com</SelectItem>
                  <SelectItem value="m@google.com">m@google.com</SelectItem>
                  <SelectItem value="m@support.com">m@support.com</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="subcategoryId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Subcategoria</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma subcategoria" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="m@example.com">m@example.com</SelectItem>
                  <SelectItem value="m@google.com">m@google.com</SelectItem>
                  <SelectItem value="m@support.com">m@support.com</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormItem>
          <FormLabel>Preço de Referência (opcional)</FormLabel>
          <FormControl>
            <Input
              aria-invalid={!!form.formState.errors.referencePrice}
              {...form.register('referencePrice', { valueAsNumber: true })}
            />
          </FormControl>
          <FormMessage />
        </FormItem>

        <FormItem>
          <FormLabel>Review (opcional)</FormLabel>
          <FormControl>
            <Input
              aria-invalid={!!form.formState.errors.reviewUrl}
              {...form.register('reviewUrl')}
            />
          </FormControl>
          <FormMessage />
        </FormItem>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className={labelVariants()}>Especificações (opcional)</label>
            <div className="space-x-2">
              <Button
                type="button"
                size="icon"
                variant="secondary"
                onClick={() => specsAppend({ label: '', value: '' })}
              >
                <Icons.Plus className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="secondary"
                onClick={() => specsRemove(-1)}
              >
                <Icons.Minus className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            {specsFields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-2 gap-x-2">
                <FormItem>
                  <FormControl>
                    <Input
                      aria-invalid={!!form.formState.errors.reviewUrl}
                      {...form.register(`specs.${index}.label`)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>

                <FormItem>
                  <FormControl>
                    <Input
                      aria-invalid={!!form.formState.errors.reviewUrl}
                      {...form.register(`specs.${index}.value`)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </div>
            ))}
          </div>
        </div>

        <FormItem>
          <FormLabel>Descrição (opcional)</FormLabel>
          <FormControl>
            <Textarea {...form.register('description')} />
          </FormControl>
          <FormMessage />
        </FormItem>

        <Button type="submit">Cadastrar</Button>
      </form>
    </Form>
  )
}
