import { create } from 'zustand'

interface FormStore {
  openDialogs: Record<string, boolean>
  setOpenDialog: (dialogName: string, isOpen: boolean) => void
}

export const useFormStore = create<FormStore>((set) => ({
  openDialogs: {},
  setOpenDialog: (dialogName, isOpen) =>
    set((state) => ({
      openDialogs: {
        ...state.openDialogs,
        [dialogName]: isOpen,
      },
    })),
}))
