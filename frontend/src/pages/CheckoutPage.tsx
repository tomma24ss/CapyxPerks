import { useNavigate } from 'react-router-dom'
import { useCartStore } from '../store/cartStore'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { orderApi } from '../api/api'
import toast from 'react-hot-toast'
import { useState } from 'react'

export default function CheckoutPage() {
  const navigate = useNavigate()
  const { items, getTotalCredits, clearCart } = useCartStore()
  const queryClient = useQueryClient()
  const [isProcessing, setIsProcessing] = useState(false)

  const checkoutMutation = useMutation({
    mutationFn: orderApi.createOrder,
    onSuccess: () => {
      toast.success('Order submitted! Credits deducted. Waiting for admin to mark as fulfilled.')
      clearCart()
      queryClient.invalidateQueries({ queryKey: ['credits', 'balance'] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      navigate('/profile')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to place order')
    },
    onSettled: () => {
      setIsProcessing(false)
    },
  })

  const handleCheckout = () => {
    setIsProcessing(true)
    const orderData = {
      items: items.map((item) => ({
        variant_id: item.variant_id,
        quantity: item.quantity,
      })),
    }
    checkoutMutation.mutate(orderData as any)
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-2xl md:text-3xl font-bold mb-6">Checkout</h1>

      <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mb-6">
        <h2 className="text-lg md:text-xl font-semibold mb-4">Order Summary</h2>
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.variant_id} className="flex justify-between text-xs md:text-sm gap-2">
              <span className="flex-1">
                {item.product_name} (×{item.quantity})
              </span>
              <span className="font-semibold whitespace-nowrap">{(item.credits * item.quantity).toFixed(2)} CapyCoins</span>
            </div>
          ))}
        </div>
        <div className="border-t pt-4 mt-4">
          <div className="flex justify-between text-base md:text-lg font-semibold">
            <span>Total:</span>
            <span className="text-capyx-600">{getTotalCredits().toFixed(2)} CapyCoins</span>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 md:p-4 mb-6">
        <p className="text-xs md:text-sm text-blue-800">
          <strong>Order Request:</strong> By submitting this order, <strong>{getTotalCredits().toFixed(2)} capycoins will be deducted from your balance immediately</strong>. 
          An admin will review your request and mark it as fulfilled once you receive your items. 
          If your order is rejected, the capycoins will be refunded to your account.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:space-x-4 sm:gap-0">
        <button
          onClick={() => navigate('/cart')}
          disabled={isProcessing}
          className="flex-1 border border-gray-300 hover:bg-gray-50 py-3 px-4 rounded-lg font-semibold disabled:opacity-50"
        >
          Back to Cart
        </button>
        <button
          onClick={handleCheckout}
          disabled={isProcessing}
          className="flex-1 bg-capyx-500 hover:bg-capyx-600 text-gray-900 py-3 px-4 rounded-lg font-semibold disabled:opacity-50"
        >
          {isProcessing ? 'Processing...' : 'Submit Order Request'}
        </button>
      </div>
    </div>
  )
}

