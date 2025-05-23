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
import { retailerSchema } from '@/lib/validations/retailer'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog'

const CREATE_RETAILER = gql`
  mutation CreateRetailer($input: CreateRetailerInput!) {
    createRetailer(createRetailerInput: $input) {
      id
    }
  }
`

const UPDATE_RETAILER = gql`
  mutation UpdateRetailer($input: UpdateRetailerInput!) {
    updateRetailer(updateRetailerInput: $input) {
      id
    }
  }
`

type Inputs = z.infer<typeof retailerSchema>

const defaultValues: Partial<Inputs> = {
  name: '',
}

interface RetailerFormProps {
  mode?: 'create' | 'update'
  retailer?: { id?: string } & Partial<Inputs>
}

export function RetailerForm({ mode = 'create', retailer }: RetailerFormProps) {
  const form = useForm<Inputs>({
    resolver: zodResolver(retailerSchema),
    defaultValues: {
      ...defaultValues,
      ...retailer,
    },
  })
  const { setOpenDialog } = useFormStore()
  const router = useRouter()

  const [mutateRetailer, { loading: isLoading }] = useMutation(
    mode === 'create' ? CREATE_RETAILER : UPDATE_RETAILER,
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
            ? 'retailerCreateForm'
            : `retailerUpdateForm.${retailer?.id}`,
          false,
        )

        const message =
          mode === 'create'
            ? 'Varejista cadastrado com sucesso.'
            : 'Varejista atualizado com sucesso.'

        toast.success(message)
        router.refresh()
      },
      refetchQueries: ['GetSaleFormData'],
    },
  )

  async function onSubmit(data: Inputs) {
    await mutateRetailer({
      variables: {
        input: {
          id: retailer?.id,
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
                  placeholder="Dell"
                  aria-invalid={!!form.formState.errors.name}
                  {...field}
                />
              </FormControl>
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
              className="mr-2 h-4 w-4 animate-spin"
              aria-hidden="true"
            />
          )}
          {mode === 'create' ? 'Cadastrar' : 'Atualizar'}
        </Button>
      </form>
    </Form>
  )
}

export function RetailerFormDialog() {
  const { openDialogs, setOpenDialog } = useFormStore()
  return (
    <Dialog
      open={openDialogs['retailerCreateForm']}
      onOpenChange={(open) => setOpenDialog('retailerCreateForm', open)}
    >
      <DialogTrigger type="button" asChild>
        <Button type="button" size={'icon'}>
          <Icons.Plus className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="w-full space-y-4 overflow-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>ADICIONAR VAREJISTA</DialogTitle>
        </DialogHeader>
        <RetailerForm />
      </DialogContent>
    </Dialog>
  )
}
