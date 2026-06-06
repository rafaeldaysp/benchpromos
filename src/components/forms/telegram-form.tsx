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
import {
  buildTelegramPostText,
  calculateTelegramCouponDiscountCents,
  formatTelegramPrice,
  getTelegramEffectiveInstallmentPrice,
  getTelegramEffectivePrice,
} from '@/lib/telegram'
import { telegramMessageSchema } from '@/lib/validations/telegram'

type Inputs = z.infer<typeof telegramMessageSchema>

const CHANNELS = {
  telegram: {
    label: 'Telegram',
    endpoint: '/api/telegram',
    icon: Icons.Send,
  },
  whatsapp: {
    label: 'WhatsApp',
    endpoint: '/api/whatsapp',
    icon: Icons.MessageCircle,
  },
} as const

type Channel = keyof typeof CHANNELS

const highlightOptions = [
  'PARCELADO',
  'PREÇO HISTÓRICO',
  'PREÇÃO',
  'BAIXOU',
  'LANÇAMENTO',
]

const defaultValues: Partial<Inputs> = {
  applyCouponDiscount: true,
  caption: '',
  coupon: '',
  couponDiscount: '',
  highlight: undefined,
  imageUrl: '',
  installments: undefined,
  maxCouponDiscount: undefined,
  note: '',
  priceCondition: '',
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

async function sendToChannel(channel: Channel, data: Inputs) {
  const { label, endpoint } = CHANNELS[channel]

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  const responseMessage = await getResponseMessage(response)

  if (!response.ok) {
    throw new Error(
      responseMessage ?? `Não foi possível enviar para o ${label}.`,
    )
  }

  return responseMessage ?? `Mensagem enviada para o ${label}.`
}

interface TelegramFormProps {
  whatsappEnabled?: boolean
}

export function TelegramForm({ whatsappEnabled = false }: TelegramFormProps) {
  const [isLoading, setIsLoading] = React.useState(false)
  const [channels, setChannels] = React.useState<Record<Channel, boolean>>({
    telegram: true,
    whatsapp: whatsappEnabled,
  })
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
  const applyCouponDiscount = form.watch('applyCouponDiscount')
  const maxCouponDiscount = form.watch('maxCouponDiscount')
  const priceCondition = form.watch('priceCondition')
  const highlight = form.watch('highlight')
  const caption = form.watch('caption')
  const note = form.watch('note')
  const totalInstallmentPrice = form.watch('totalInstallmentPrice')
  const installments = form.watch('installments')
  const sponsored = form.watch('sponsored')

  const previewImageUrl = React.useMemo(
    () => getPreviewImageUrl(imageUrl),
    [imageUrl],
  )
  const previewMessage = {
    applyCouponDiscount: applyCouponDiscount ?? true,
    caption: caption || undefined,
    coupon: coupon || undefined,
    couponDiscount: couponDiscount || undefined,
    highlight: highlight || undefined,
    imageUrl: imageUrl || 'https://benchpromos.com.br/preview.png',
    installments,
    maxCouponDiscount,
    note: note || undefined,
    priceCondition: priceCondition || undefined,
    price: price || 0,
    sponsored: sponsored ?? true,
    title: title || 'Nome da promoção',
    totalInstallmentPrice,
    url: url || 'https://benchpromos.com.br/promocao/produto/id',
  }
  const couponDiscountValue = calculateTelegramCouponDiscountCents({
    couponDiscount,
    maxCouponDiscount,
    price: price || 0,
  })
  const installmentCouponDiscountValue = totalInstallmentPrice
    ? calculateTelegramCouponDiscountCents({
        couponDiscount,
        maxCouponDiscount,
        price: totalInstallmentPrice,
      })
    : 0
  const effectivePrice = getTelegramEffectivePrice(previewMessage)
  const effectiveInstallmentPrice =
    getTelegramEffectiveInstallmentPrice(previewMessage)
  const previewText = buildTelegramPostText(previewMessage)

  async function onSubmit(data: Inputs) {
    const selectedChannels = (Object.keys(CHANNELS) as Channel[]).filter(
      (channel) =>
        channels[channel] && (channel !== 'whatsapp' || whatsappEnabled),
    )

    if (selectedChannels.length === 0) {
      toast.error('Selecione ao menos um canal.')
      return
    }

    setIsLoading(true)

    try {
      const results = await Promise.all(
        selectedChannels.map(async (channel) => {
          try {
            return {
              channel,
              ok: true as const,
              message: await sendToChannel(channel, data),
            }
          } catch (error) {
            return {
              channel,
              ok: false as const,
              message:
                error instanceof Error
                  ? error.message
                  : `Não foi possível enviar para o ${CHANNELS[channel].label}.`,
            }
          }
        }),
      )

      for (const result of results) {
        if (result.ok) {
          toast.success(result.message)
        } else {
          toast.error(result.message)
        }
      }

      if (results.every((result) => result.ok)) {
        form.reset(defaultValues)
      }
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
            {whatsappEnabled
              ? 'Envio para Telegram e WhatsApp'
              : 'Envio para Telegram'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              {whatsappEnabled && (
                <div className="space-y-2">
                  <Label>Canais</Label>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {(Object.keys(CHANNELS) as Channel[]).map((channel) => {
                      const { label, icon: Icon } = CHANNELS[channel]

                      return (
                        <div
                          key={channel}
                          className="flex h-9 items-center justify-between rounded-md border border-input px-3 shadow-sm"
                        >
                          <Label
                            htmlFor={`channel-${channel}`}
                            className="flex items-center gap-2 text-sm font-normal text-muted-foreground"
                          >
                            <Icon className="size-4" aria-hidden="true" />
                            {label}
                          </Label>
                          <Switch
                            id={`channel-${channel}`}
                            checked={channels[channel]}
                            onCheckedChange={(checked) =>
                              setChannels((current) => ({
                                ...current,
                                [channel]: checked,
                              }))
                            }
                          />
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

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
                      <FormLabel>Preço base</FormLabel>
                      <FormControl>
                        <PriceInput
                          placeholder="4.447,00"
                          value={field.value ? field.value / 100 : ''}
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
                  name="priceCondition"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Condição do preço</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Com Cupom, À Vista ou Parcelado em 10x"
                          aria-invalid={!!form.formState.errors.priceCondition}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

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
                          value={field.value ? field.value / 100 : ''}
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

              <div className="grid gap-5 md:grid-cols-2">
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

                <FormField
                  control={form.control}
                  name="couponDiscount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Desconto do cupom</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="10%, 100 ou 10% + 100"
                          aria-invalid={!!form.formState.errors.couponDiscount}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_220px]">
                <FormField
                  control={form.control}
                  name="maxCouponDiscount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cupom Desconto máximo</FormLabel>
                      <FormControl>
                        <PriceInput
                          placeholder="150,00"
                          value={field.value ? field.value / 100 : ''}
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
                  name="applyCouponDiscount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Auto aplicar</FormLabel>
                      <div className="flex h-9 items-center justify-between rounded-md border border-input px-3 shadow-sm">
                        <Label
                          htmlFor="telegram-apply-coupon-discount"
                          className="text-sm font-normal text-muted-foreground"
                        >
                          Ativo
                        </Label>
                        <FormControl>
                          <Switch
                            id="telegram-apply-coupon-discount"
                            checked={field.value ?? true}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {applyCouponDiscount &&
                (couponDiscountValue > 0 ||
                  installmentCouponDiscountValue > 0) && (
                  <div className="space-y-1 rounded-md bg-muted/60 px-3 py-2 text-sm text-muted-foreground shadow-[inset_0_0_0_1px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]">
                    <div>
                      À vista: desconto{' '}
                      <span className="font-medium tabular-nums text-foreground">
                        {formatTelegramPrice(couponDiscountValue)}
                      </span>{' '}
                      • preço no post{' '}
                      <span className="font-medium tabular-nums text-foreground">
                        {formatTelegramPrice(effectivePrice)}
                      </span>
                    </div>

                    {effectiveInstallmentPrice && totalInstallmentPrice && (
                      <div>
                        Parcelado: desconto{' '}
                        <span className="font-medium tabular-nums text-foreground">
                          {formatTelegramPrice(installmentCouponDiscountValue)}
                        </span>{' '}
                        • preço no post{' '}
                        <span className="font-medium tabular-nums text-foreground">
                          {formatTelegramPrice(effectiveInstallmentPrice)}
                        </span>
                      </div>
                    )}
                  </div>
                )}

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
