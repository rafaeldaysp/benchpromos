'use client'

import { TelegramForm } from '@/components/forms/telegram-form'

interface TelegramMainProps {
  whatsappEnabled: boolean
  discordEnabled: boolean
}

export function TelegramMain({
  whatsappEnabled,
  discordEnabled,
}: TelegramMainProps) {
  return (
    <TelegramForm
      whatsappEnabled={whatsappEnabled}
      discordEnabled={discordEnabled}
    />
  )
}
