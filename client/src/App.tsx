import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router-dom'
import { AuthProvider } from './auth/AuthProvider'
import { CartProvider } from './cart/CartProvider'
import { HelpProvider } from './help/HelpProvider'
import { queryClient } from './lib/queryClient'
import { router } from './router'

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <HelpProvider>
            <RouterProvider router={router} />
          </HelpProvider>
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}
