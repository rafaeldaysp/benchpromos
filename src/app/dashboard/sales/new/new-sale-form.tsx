'use client'

import * as React from 'react'

import { SaleForm } from '@/components/forms/sale-form'

interface NewSaleFormProps {
  whatsappEnabled: boolean
  discordEnabled: boolean
}

export function NewSaleForm({
  whatsappEnabled,
  discordEnabled,
}: NewSaleFormProps) {
  // In the sheet, closing unmounts the form. This page stays open, so remount
  // after each save to also clear local state form.reset() doesn't cover
  // (selected discounts, deal switch, share options).
  const [formKey, setFormKey] = React.useState(0)

  return (
    <SaleForm
      key={formKey}
      enableShare
      whatsappEnabled={whatsappEnabled}
      discordEnabled={discordEnabled}
      productSlug={null}
      onSuccess={() => setFormKey((key) => key + 1)}
    />
  )
}
