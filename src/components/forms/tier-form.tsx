'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import * as React from 'react'
import { useForm } from 'react-hook-form'
import { type z } from 'zod'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { tierSchema } from '@/lib/validations/tier-list'
import type { Tier } from '@/types'

const PRESET_COLORS = [
  { value: '#10B981', label: 'Verde' },
  { value: '#3B82F6', label: 'Azul' },
  { value: '#F59E0B', label: 'Amarelo' },
  { value: '#EF4444', label: 'Vermelho' },
  { value: '#06B6D4', label: 'Ciano' },
  { value: '#6366F1', label: 'Índigo' },
  { value: '#EC4899', label: 'Rosa' },
  { value: '#8B5CF6', label: 'Roxo' },
]

type Inputs = z.infer<typeof tierSchema>

interface TierFormProps {
  onSave: (data: {
    name: string
    priceLimit: number | null
    color: string
  }) => void
  editingTier?: Tier | null
}

export function TierForm({ onSave, editingTier }: TierFormProps) {
  const form = useForm<Inputs>({
    resolver: zodResolver(tierSchema),
    defaultValues: {
      name: editingTier?.name ?? '',
      color: editingTier?.color ?? '#10B981',
      noBudgetLimit: editingTier?.priceLimit == null,
      priceLimit:
        editingTier?.priceLimit != null
          ? String(editingTier.priceLimit / 100)
          : '',
    },
  })

  const noBudgetLimit = form.watch('noBudgetLimit')

  function onSubmit(data: Inputs) {
    onSave({
      name: data.name,
      priceLimit: data.noBudgetLimit
        ? null
        : Math.round((Number(data.priceLimit) || 0) * 100),
      color: data.color,
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
              <FormLabel>Nome do Tier</FormLabel>
              <FormControl>
                <Input
                  placeholder='Ex: "Melhor até R$ 1.000"'
                  aria-invalid={!!form.formState.errors.name}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-3">
          <FormField
            control={form.control}
            name="noBudgetLimit"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between">
                <FormLabel>Limite de Preço (R$)</FormLabel>
                <div className="flex items-center gap-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <span className="text-xs text-muted-foreground">
                    Sem limite
                  </span>
                </div>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="priceLimit"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="1000"
                    min={0}
                    step="0.01"
                    disabled={noBudgetLimit}
                    aria-invalid={!!form.formState.errors.priceLimit}
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
          name="color"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cor</FormLabel>
              <div className="flex items-center gap-2">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => field.onChange(c.value)}
                    className={cn(
                      'size-8 rounded-full transition-all',
                      field.value === c.value
                        ? 'scale-110 ring-2 ring-foreground ring-offset-2 ring-offset-background'
                        : 'opacity-60 hover:scale-105 hover:opacity-100',
                    )}
                    style={{ backgroundColor: c.value }}
                    aria-label={c.label}
                  />
                ))}
              </div>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  Ou escolha:
                </span>
                <input
                  type="color"
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                  className="size-8 cursor-pointer rounded border-0 bg-transparent p-0"
                />
                <span className="font-mono text-xs text-muted-foreground">
                  {field.value}
                </span>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="button" onClick={form.handleSubmit(onSubmit)}>
          {editingTier ? 'Salvar' : 'Criar Tier'}
        </Button>
      </form>
    </Form>
  )
}
