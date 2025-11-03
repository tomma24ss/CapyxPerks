import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { productApi } from '../api/api'
import { useCartStore } from '../store/cartStore'
import toast from 'react-hot-toast'
import { useState, useEffect } from 'react'
import { getImageUrl } from '../utils/imageUtils'

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { addItem } = useCartStore()
  const [selectedVariant, setSelectedVariant] = useState<any>(null)
  const [quantity, setQuantity] = useState(1)

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: () => productApi.getProduct(Number(id)),
    enabled: !!id,
  })

  // Automatically select the variant if there's only one (default case)
  useEffect(() => {
    if (product?.variants && product.variants.length === 1 && !selectedVariant) {
      setSelectedVariant(product.variants[0])
    }
  }, [product, selectedVariant])

  if (isLoading) {
    return <div className="container mx-auto px-4 py-8">Loading...</div>
  }

  if (!product) {
    return <div className="container mx-auto px-4 py-8">Product not found</div>
  }

  const handleAddToCart = () => {
    if (!selectedVariant) {
      toast.error('Please select a variant')
      return
    }

    addItem({
      variant_id: selectedVariant.id,
      product_id: product.id,
      quantity,
      product_name: product.name,
      variant_size: selectedVariant.size,
      variant_color: selectedVariant.color,
      credits: product.base_credits + selectedVariant.credits_modifier,
    })

    toast.success('Added to cart!')
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <button
        onClick={() => navigate(-1)}
        className="text-capyx-600 hover:text-capyx-700 mb-4 flex items-center"
      >
        ← Back
      </button>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="flex flex-col md:flex-row">
          <div className="w-full md:w-1/2 h-64 md:h-96 bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center">
            {getImageUrl(product.image_url) ? (
              <img 
                src={getImageUrl(product.image_url)!} 
                alt={product.name} 
                className="h-full w-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                  e.currentTarget.parentElement!.innerHTML = '<div class="text-white text-6xl">🎁</div>'
                }}
              />
            ) : (
              <div className="text-white text-6xl">🎁</div>
            )}
          </div>
          <div className="w-full md:w-1/2 p-4 md:p-8">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3 md:mb-4">{product.name}</h1>
            <p className="text-gray-600 mb-4 md:mb-6 text-sm md:text-base">{product.description}</p>

            <div className="mb-4 md:mb-6">
              <span className="text-3xl md:text-4xl font-bold text-capyx-600">
                {product.base_credits.toFixed(2)} Credits
              </span>
            </div>

            {product.variants && product.variants.length > 1 && (
              <div className="mb-4 md:mb-6">
                <h3 className="font-semibold mb-2 text-sm md:text-base">Variants:</h3>
                <div className="space-y-2">
                  {product.variants.map((variant) => (
                    <button
                      key={variant.id}
                      onClick={() => setSelectedVariant(variant)}
                      className={`w-full text-left p-3 border rounded-lg text-sm md:text-base ${
                        selectedVariant?.id === variant.id
                          ? 'border-capyx-600 bg-capyx-50'
                          : 'border-gray-300 hover:border-capyx-400'
                      }`}
                    >
                      <div className="flex justify-between items-center flex-wrap gap-2">
                        <span>
                          {variant.size && variant.color
                            ? `${variant.size} - ${variant.color}`
                            : variant.size || variant.color || 'Standard'}
                        </span>
                        {variant.credits_modifier !== 0 && (
                          <span className="text-capyx-600 font-semibold">
                            {variant.credits_modifier > 0 ? '+' : ''}
                            {variant.credits_modifier.toFixed(2)} Credits
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-4 md:mb-6">
              <label className="block font-semibold mb-2 text-sm md:text-base">Quantity</label>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50 text-lg font-bold"
                >
                  -
                </button>
                <span className="text-xl font-semibold min-w-[2rem] text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50 text-lg font-bold"
                >
                  +
                </button>
              </div>
            </div>

            <button
              onClick={handleAddToCart}
              className="w-full bg-capyx-500 hover:bg-capyx-600 text-gray-900 font-semibold py-3 px-6 rounded-lg transition duration-200 text-sm md:text-base"
            >
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

