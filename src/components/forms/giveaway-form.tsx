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
import { env } from '@/env.mjs'
import { useFormStore } from '@/hooks/use-form-store'
import { giveawaySchema } from '@/lib/validations/giveaway'
import { removeNullValues } from '@/utils'
import { DateTimePicker } from '../ui/datetime-picker'
import { ScrollArea } from '../ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'
import { Textarea } from '../ui/textarea'
import { Calendar } from '../ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import { ptBR } from 'date-fns/locale'

const CREATE_GIVEAWAY = gql`
  mutation CreateGiveaway($input: CreateGiveawayInput!) {
    createGiveaway(createGiveawayInput: $input) {
      id
    }
  }
`

const UPDATE_GIVEAWAY = gql`
  mutation UpdateGiveaway($input: UpdateGiveawayInput!) {
    updateGiveaway(updateGiveawayInput: $input) {
      id
    }
  }
`

type Inputs = z.infer<typeof giveawaySchema>

const defaultValues: Partial<Inputs> = {
  name: '',
  description: '',
  drawAt: new Date(),
  status: 'CLOSED',
}

interface GiveawayFormProps {
  mode?: 'create' | 'update'
  giveaway?: { id?: string } & Partial<Inputs>
}

export function GiveawayForm({ mode = 'create', giveaway }: GiveawayFormProps) {
  const form = useForm<Inputs>({
    resolver: zodResolver(giveawaySchema),
    defaultValues: {
      ...defaultValues,
      ...removeNullValues(giveaway),
    },
  })

  const { setOpenDialog } = useFormStore()
  const router = useRouter()

  const [mutateGiveaway, { loading: isLoading }] = useMutation(
    mode === 'create' ? CREATE_GIVEAWAY : UPDATE_GIVEAWAY,
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
            ? 'giveawayCreateForm'
            : `giveawayUpdateForm.${giveaway?.id}`,
          false,
        )

        const message =
          mode === 'create'
            ? 'Sorteio cadastrado com sucesso.'
            : 'Sorteio atualizado com sucesso.'

        toast.success(message)
        router.refresh()
      },
    },
  )

  async function onSubmit({ ...data }: Inputs) {
    await mutateGiveaway({
      variables: {
        input: {
          id: giveaway?.id,
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
                  placeholder="Forza Horizon Ultra FHD"
                  aria-invalid={!!form.formState.errors.name}
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
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Textarea rows={4} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="drawAt"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Data de sorteio</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={'outline'}
                      className={cn(
                        'w-full pl-3 text-left font-normal',
                        !field.value && 'text-muted-foreground',
                      )}
                    >
                      {field.value ? (
                        format(field.value, 'PPP', { locale: ptBR })
                      ) : (
                        <span>Selecione uma data</span>
                      )}
                      <CalendarIcon className="ml-auto size-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    locale={ptBR}
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) => date < new Date('1900-01-01')}
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Array.from([
                    { value: 'OPEN', label: 'Aberto' },
                    { value: 'CLOSED', label: 'Fechado' },
                  ]).map((giveawayStatus) => (
                    <SelectItem
                      key={giveawayStatus.value}
                      value={giveawayStatus.value}
                    >
                      {giveawayStatus.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isLoading}>
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
