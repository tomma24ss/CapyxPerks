import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { CartItem } from '../types'

interface CartState {
  items: CartItem[]
  addItem: (item: CartItem) => void
  removeItem: (variantId: number) => void
  updateQuantity: (variantId: number, quantity: number) => void
  clearCart: () => void
  getTotalCredits: () => number
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => {
        const existingItem = get().items.find((i) => i.variant_id === item.variant_id)
        if (existingItem) {
          set((state) => ({
            items: state.items.map((i) =>
              i.variant_id === item.variant_id ? { ...i, quantity: i.quantity + item.quantity } : i
            ),
          }))
        } else {
          set((state) => ({ items: [...state.items, item] }))
        }
      },
      removeItem: (variantId) => {
        set((state) => ({
          items: state.items.filter((i) => i.variant_id !== variantId),
        }))
      },
      updateQuantity: (variantId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(variantId)
        } else {
          set((state) => ({
            items: state.items.map((i) => (i.variant_id === variantId ? { ...i, quantity } : i)),
          }))
        }
      },
      clearCart: () => set({ items: [] }),
      getTotalCredits: () => {
        return get().items.reduce((total, item) => total + item.credits * item.quantity, 0)
      },
    }),
    {
      name: 'capyx-cart-storage', // localStorage key
      storage: createJSONStorage(() => localStorage),
    }
  )
)

