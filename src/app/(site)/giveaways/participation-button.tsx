'use client'

import Link from 'next/link'
import { CheckCircle, Heart, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { type useGiveawayParticipation } from '@/hooks/use-giveaway-participation'

export function ParticipationButton({
  id,
  name,
  participation,
}: {
  id: string
  name: string
  participation: ReturnType<typeof useGiveawayParticipation>
}) {
  const {
    enabled,
    loading,
    unavailable,
    pending,
    uncertain,
    subscribedIds,
    changeParticipation,
    verify,
  } = participation
  const action = pending[id]
  if (!enabled) {
    return (
      <Button asChild className="w-full">
        <Link href="/sign-in">Entre para participar</Link>
      </Button>
    )
  }
  if (loading || action) {
    const label =
      action === 'joining'
        ? 'Inscrevendo…'
        : action === 'leaving'
          ? 'Saindo…'
          : 'Verificando inscrição…'
    return (
      <Button disabled className="w-full" aria-busy="true">
        <Loader2 className="mr-2 size-4 animate-spin" />
        {label}
      </Button>
    )
  }
  if (unavailable) {
    return (
      <Button disabled className="w-full" variant="outline">
        Inscrição indisponível
      </Button>
    )
  }
  if (uncertain[id]) {
    return (
      <Button
        className="w-full"
        variant="outline"
        onClick={() => void verify(id)}
      >
        Verificar minha inscrição
      </Button>
    )
  }
  if (!subscribedIds.has(id)) {
    return (
      <Button
        className="w-full"
        onClick={() => void changeParticipation(id, true)}
      >
        <Heart className="mr-2 size-4" />
        Inscrever-se
      </Button>
    )
  }
  return (
    <div className="space-y-2 text-center">
      <p
        role="status"
        className="flex items-center justify-center gap-2 text-sm text-success"
      >
        <CheckCircle className="size-4" />
        Você está participando
      </p>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="ghost" size="sm">
            Sair do sorteio
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sair do sorteio?</AlertDialogTitle>
            <AlertDialogDescription>
              Você deixará de concorrer a {name}. Deseja cancelar sua inscrição?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continuar participando</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void changeParticipation(id, false)}
            >
              Confirmar saída
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
