import { create } from 'zustand'

interface FormModalStore {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const useFormModal = create<FormModalStore>((set) => ({
  open: false,
  onOpenChange: (open) => set({ open }),
}))
