import { useNavigate } from 'react-router-dom'
import { useCartStore } from '../store/cartStore'
import { useCreditBalance } from '../hooks/useCreditBalance'
import toast from 'react-hot-toast'

export default function CartPage() {
  const navigate = useNavigate()
  const { items, removeItem, updateQuantity, clearCart, getTotalCredits } = useCartStore()
  const { data: balance } = useCreditBalance()

  const totalCredits = getTotalCredits()
  const canCheckout = balance && balance.balance >= totalCredits

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-4">Your Cart</h1>
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-gray-500 mb-4">Your cart is empty</p>
          <button
            onClick={() => navigate('/')}
            className="bg-capyx-500 hover:bg-capyx-600 text-gray-900 font-semibold py-2 px-6 rounded-lg"
          >
            Browse Products
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl md:text-3xl font-bold mb-6">Your Cart</h1>

      <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mb-6">
        {items.map((item) => (
          <div key={item.variant_id} className="border-b py-4 last:border-b-0">
            <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-3">
              <div className="flex-1">
                <h3 className="font-semibold text-base md:text-lg">{item.product_name}</h3>
                {(item.variant_size || item.variant_color) && (
                  <p className="text-gray-600 text-sm">
                    {item.variant_size && item.variant_color
                      ? `${item.variant_size} - ${item.variant_color}`
                      : item.variant_size || item.variant_color}
                  </p>
                )}
                <p className="text-capyx-600 font-semibold mt-1 text-sm md:text-base">
                  {item.credits.toFixed(2)} Credits × {item.quantity}
                </p>
              </div>
              <div className="flex items-center justify-between md:justify-end gap-4">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => updateQuantity(item.variant_id, item.quantity - 1)}
                    className="px-3 py-1 border rounded hover:bg-gray-50 font-bold"
                  >
                    -
                  </button>
                  <span className="font-semibold min-w-[2rem] text-center">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.variant_id, item.quantity + 1)}
                    className="px-3 py-1 border rounded hover:bg-gray-50 font-bold"
                  >
                    +
                  </button>
                </div>
                <button
                  onClick={() => removeItem(item.variant_id)}
                  className="text-red-600 hover:text-red-700 font-medium text-sm md:text-base"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
        <div className="space-y-4">
          <div className="flex justify-between items-center text-base md:text-lg">
            <span className="font-semibold">Total:</span>
            <span className="text-xl md:text-2xl font-bold text-capyx-600">
              {totalCredits.toFixed(2)} Credits
            </span>
          </div>
          {balance && (
            <div className="flex justify-between text-sm text-gray-600">
              <span>Available Credits:</span>
              <span>{balance.balance.toFixed(2)}</span>
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-3 sm:space-x-4 sm:gap-0">
            <button
              onClick={() => {
                clearCart()
                toast.success('Cart cleared')
              }}
              className="flex-1 border border-gray-300 hover:bg-gray-50 py-2 px-4 rounded-lg font-medium"
            >
              Clear Cart
            </button>
            <button
              onClick={() => {
                if (canCheckout) {
                  navigate('/checkout')
                } else {
                  toast.error('Insufficient credits')
                }
              }}
              disabled={!canCheckout}
              className={`flex-1 py-2 px-4 rounded-lg font-semibold ${
                canCheckout
                  ? 'bg-capyx-500 hover:bg-capyx-600 text-gray-900'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Proceed to Checkout
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

