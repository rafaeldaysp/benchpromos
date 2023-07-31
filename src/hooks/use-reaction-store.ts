import { create } from 'zustand'

type Reaction = {
  userId: string
  saleId: string
  content: string
}

type Store = {
  reactions: Reaction[]
  setReactions: (reactions: Reaction[]) => void
}

export const useReactionStore = create<Store>()((set) => ({
  reactions: [],
  setReactions: (reactions: Reaction[]) =>
    set((state) => ({ reactions: [...reactions] })),
}))
