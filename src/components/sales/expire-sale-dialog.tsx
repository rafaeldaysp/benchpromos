'use client'

import * as React from 'react'

import { Icons } from '@/components/icons'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

interface ExpireSaleDialogProps {
  saleId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (remove: boolean) => Promise<void>
  isLoading?: boolean
}

export function ExpireSaleDialog({
  saleId,
  open,
  onOpenChange,
  onConfirm,
  isLoading,
}: ExpireSaleDialogProps) {
  const [remove, setRemove] = React.useState(false)
  const checkboxId = `expire-sale-remove-${saleId}`

  // Every opening starts unchecked, so deleting is always a deliberate choice.
  React.useEffect(() => {
    if (open) setRemove(false)
  }, [open])

  async function handleConfirm() {
    await onConfirm(remove)
    onOpenChange(false)
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Expirar promoção?</AlertDialogTitle>
          <AlertDialogDescription>
            A promoção será marcada como expirada e a oferta vinculada a ela
            será removida do produto.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="flex items-start gap-3 rounded-md border p-3">
          <Checkbox
            id={checkboxId}
            checked={remove}
            onCheckedChange={(checked) => setRemove(checked === true)}
            disabled={isLoading}
          />
          <div className="grid gap-1">
            <Label htmlFor={checkboxId} className="cursor-pointer">
              Excluir a promoção também
            </Label>
            <p className="text-xs text-muted-foreground">
              Remove a promoção permanentemente. Essa ação não pode ser
              desfeita.
            </p>
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
          <Button
            variant={remove ? 'destructive' : 'default'}
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading && (
              <Icons.Spinner
                className="mr-2 size-4 animate-spin"
                aria-hidden="true"
              />
            )}
            {remove ? 'Expirar e excluir' : 'Expirar'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
