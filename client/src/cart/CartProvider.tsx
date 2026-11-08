import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { CartContext, type CartItem, type CartState } from './context'

const STORAGE_KEY = 'aradam.cart.v1'
const MAX_PER_LINE = 10

function load(): CartItem[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
    return Array.isArray(parsed) ? (parsed as CartItem[]) : []
  } catch {
    return []
  }
}

const same = (a: CartItem, productId: string, size: string | null) => a.productId === productId && a.size === size

/**
 * Client-side cart kept in localStorage. It stores display data only; the server
 * re-reads prices and availability from the database when the order is created.
 */
export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(load)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items])

  const add = useCallback<CartState['add']>((item, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => same(i, item.productId, item.size))
      if (existing) {
        return prev.map((i) => (i === existing ? { ...i, quantity: Math.min(MAX_PER_LINE, i.quantity + quantity) } : i))
      }
      return [...prev, { ...item, quantity: Math.min(MAX_PER_LINE, quantity) }]
    })
  }, [])

  const setQuantity = useCallback<CartState['setQuantity']>((productId, size, quantity) => {
    setItems((prev) =>
      quantity <= 0
        ? prev.filter((i) => !same(i, productId, size))
        : prev.map((i) => (same(i, productId, size) ? { ...i, quantity: Math.min(MAX_PER_LINE, quantity) } : i)),
    )
  }, [])

  const remove = useCallback<CartState['remove']>((productId, size) => {
    setItems((prev) => prev.filter((i) => !same(i, productId, size)))
  }, [])

  const clear = useCallback(() => setItems([]), [])

  const value = useMemo<CartState>(
    () => ({
      items,
      count: items.reduce((n, i) => n + i.quantity, 0),
      subtotalNgn: items.reduce((sum, i) => sum + i.priceNgn * i.quantity, 0),
      add,
      setQuantity,
      remove,
      clear,
    }),
    [items, add, setQuantity, remove, clear],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
