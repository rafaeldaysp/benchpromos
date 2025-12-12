'use client'

import { useState } from 'react'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { AwardsDashboardMain } from './main'
import { AwardsRevealMain } from './reveal-main'
import { Sparkles } from 'lucide-react'

export default function AwardsDashboardPage() {
  const [isRevealOpen, setIsRevealOpen] = useState(false)

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium">Awards</h3>
            <p className="text-sm text-muted-foreground">
              Gerencie os prêmios anuais e suas categorias de votação.
            </p>
          </div>
          <Button
            onClick={() => setIsRevealOpen(true)}
            size="lg"
            className="gap-2 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
          >
            <Sparkles className="size-5" />
            Revelar Prêmios
          </Button>
        </div>
        <Separator />
        <AwardsDashboardMain />
      </div>

      {/* Fullscreen Reveal Dialog */}
      <Dialog open={isRevealOpen} onOpenChange={setIsRevealOpen}>
        <DialogContent className="h-screen max-h-screen w-screen max-w-none overflow-y-auto p-0">
          <AwardsRevealMain />
        </DialogContent>
      </Dialog>
    </>
  )
}
