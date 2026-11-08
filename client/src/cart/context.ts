import { createContext } from 'react'

export interface CartItem {
  productId: string
  slug: string
  title: string
  imageUrl: string | null
  priceNgn: number
  size: string | null
  quantity: number
}

export interface CartState {
  items: CartItem[]
  /** Total number of pieces (sum of quantities). */
  count: number
  subtotalNgn: number
  add: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void
  setQuantity: (productId: string, size: string | null, quantity: number) => void
  remove: (productId: string, size: string | null) => void
  clear: () => void
}

export const CartContext = createContext<CartState | null>(null)
