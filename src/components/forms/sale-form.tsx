'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

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
import { saleSchema } from '@/lib/validations/sale'

type Inputs = z.infer<typeof saleSchema>

const defaultValues: Partial<Inputs> = {}

export function SaleForm() {
  const form = useForm<Inputs>({
    resolver: zodResolver(saleSchema),
    defaultValues,
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

        <FormItem>
          <FormLabel>Comentários (opcional)</FormLabel>
          <FormControl>
            <Textarea {...form.register('comments')} />
          </FormControl>
          <FormMessage />
        </FormItem>

        <Button type="submit">Cadastrar</Button>
      </form>
    </Form>
  )
}
