'use client'

import { TelegramForm } from '@/components/forms/telegram-form'

interface TelegramMainProps {
  whatsappEnabled: boolean
}

export function TelegramMain({ whatsappEnabled }: TelegramMainProps) {
  return <TelegramForm whatsappEnabled={whatsappEnabled} />
}
