'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import Image from 'next/image'
import * as React from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import type { z } from 'zod'

import { Icons } from '@/components/icons'
import { PriceInput } from '@/components/price-input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { buildTelegramPostText } from '@/lib/telegram'
import { telegramMessageSchema } from '@/lib/validations/telegram'

type Inputs = z.infer<typeof telegramMessageSchema>

const highlightOptions = [
  'PARCELADO',
  'PREÇO HISTÓRICO',
  'PREÇÃO',
  'BAIXOU',
  'LANÇAMENTO',
]

const defaultValues: Partial<Inputs> = {
  callout: '',
  caption: '',
  coupon: '',
  couponDiscount: '',
  highlight: undefined,
  imageUrl: '',
  installments: undefined,
  note: '',
  sponsored: true,
  title: '',
  totalInstallmentPrice: undefined,
  url: '',
}

function getPreviewImageUrl(imageUrl?: string) {
  try {
    const url = new URL(imageUrl ?? '')

    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null

    return url.toString()
  } catch {
    return null
  }
}

async function getResponseMessage(response: Response) {
  const body = (await response.json().catch(() => null)) as {
    message?: string
  } | null

  return body?.message
}

export function TelegramForm() {
  const [isLoading, setIsLoading] = React.useState(false)
  const form = useForm<Inputs>({
    resolver: zodResolver(telegramMessageSchema),
    defaultValues,
  })

  const imageUrl = form.watch('imageUrl')
  const title = form.watch('title')
  const price = form.watch('price')
  const url = form.watch('url')
  const coupon = form.watch('coupon')
  const couponDiscount = form.watch('couponDiscount')
  const highlight = form.watch('highlight')
  const callout = form.watch('callout')
  const caption = form.watch('caption')
  const note = form.watch('note')
  const totalInstallmentPrice = form.watch('totalInstallmentPrice')
  const installments = form.watch('installments')
  const sponsored = form.watch('sponsored')

  const previewImageUrl = React.useMemo(
    () => getPreviewImageUrl(imageUrl),
    [imageUrl],
  )
  const previewText = buildTelegramPostText({
    callout: callout || undefined,
    caption: caption || undefined,
    coupon: coupon || undefined,
    couponDiscount: couponDiscount || 'Com Cupom',
    highlight: highlight || undefined,
    imageUrl: imageUrl || 'https://benchpromos.com.br/preview.png',
    installments,
    note: note || undefined,
    price: price || 0,
    sponsored: sponsored ?? true,
    title: title || 'Nome da promoção',
    totalInstallmentPrice,
    url: url || 'https://benchpromos.com.br/promocao/produto/id',
  })

  async function onSubmit(data: Inputs) {
    setIsLoading(true)

    try {
      const response = await fetch('/api/telegram', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const responseMessage = await getResponseMessage(response)

      if (!response.ok) {
        throw new Error(
          responseMessage ?? 'Não foi possível enviar para o Telegram.',
        )
      }

      toast.success(responseMessage ?? 'Mensagem enviada para o Telegram.')
      form.reset(defaultValues)
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Não foi possível enviar para o Telegram.',
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
      <Card className="rounded-lg shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Icons.Send className="size-4 text-primary" aria-hidden="true" />
            Envio para Telegram
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_160px]">
                <FormField
                  control={form.control}
                  name="highlight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Destaque</FormLabel>
                      <Select
                        value={field.value ?? 'none'}
                        onValueChange={(value) =>
                          field.onChange(value === 'none' ? '' : value)
                        }
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Nenhum" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">Nenhum</SelectItem>
                          {highlightOptions.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sponsored"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>#anúncio</FormLabel>
                      <div className="flex h-9 items-center justify-between rounded-md border border-input px-3 shadow-sm">
                        <Label
                          htmlFor="telegram-sponsored"
                          className="text-sm font-normal text-muted-foreground"
                        >
                          Ativo
                        </Label>
                        <FormControl>
                          <Switch
                            id="telegram-sponsored"
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="callout"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Chamada</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Mchose V9 Pro da Havit?!"
                        aria-invalid={!!form.formState.errors.callout}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Imagem</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://cdn.exemplo.com/produto.png"
                        aria-invalid={!!form.formState.errors.imageUrl}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Notebook Gamer Dell G15..."
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
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Link</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://benchpromos.com.br/promocao/..."
                        aria-invalid={!!form.formState.errors.url}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-5 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preço</FormLabel>
                      <FormControl>
                        <PriceInput
                          placeholder="4.447,00"
                          value={field.value ? field.value / 100 : undefined}
                          onValueChange={({ floatValue }) =>
                            field.onChange(
                              floatValue ? ~~(floatValue * 100) : undefined,
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="couponDiscount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Condição do preço</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Com Cupom, À Vista ou Parcelado em 10x"
                          aria-invalid={!!form.formState.errors.couponDiscount}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="coupon"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cupom</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="BENCH10"
                        aria-invalid={!!form.formState.errors.coupon}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-5 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="totalInstallmentPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preço parcelado</FormLabel>
                      <FormControl>
                        <PriceInput
                          placeholder="4.827,34"
                          value={field.value ? field.value / 100 : undefined}
                          onValueChange={({ floatValue }) =>
                            field.onChange(
                              floatValue ? ~~(floatValue * 100) : undefined,
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="installments"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Parcelas</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          placeholder="12"
                          value={field.value ?? ''}
                          onChange={(event) =>
                            field.onChange(
                              event.target.value
                                ? Number(event.target.value)
                                : undefined,
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="caption"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Especificações</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={3}
                        placeholder="TKL | 2.4GHz/Bluetooth/Fio | Keycaps Cherry"
                        aria-invalid={!!form.formState.errors.caption}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="note"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observação final</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Apenas pelo APP Magalu"
                        aria-invalid={!!form.formState.errors.note}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="min-w-36 active:scale-[0.96]"
                >
                  {isLoading ? (
                    <Icons.Spinner
                      className="size-4 animate-spin"
                      aria-hidden="true"
                    />
                  ) : (
                    <Icons.Send className="size-4" aria-hidden="true" />
                  )}
                  Enviar
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card className="rounded-lg shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Prévia</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative aspect-[4/3] overflow-hidden rounded-md bg-muted shadow-[inset_0_0_0_1px_rgba(0,0,0,0.1)] dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)]">
            {previewImageUrl ? (
              <Image
                src={previewImageUrl}
                alt=""
                className="object-contain p-3"
                fill
                sizes="(min-width: 1280px) 420px, 100vw"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <Icons.Image
                  className="size-8 text-muted-foreground"
                  aria-hidden="true"
                />
              </div>
            )}
          </div>

          <pre className="whitespace-pre-wrap break-words rounded-md bg-muted/60 p-4 font-sans text-sm leading-6 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]">
            {previewText}
          </pre>
        </CardContent>
      </Card>
    </div>
  )
}
