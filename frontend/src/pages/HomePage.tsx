import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { productApi } from '../api/api'
import { getImageUrl } from '../utils/imageUtils'

export default function HomePage() {
  const { data: products, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => productApi.getProducts(),
  })

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading products...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          <span className="text-capyx-600">Capyx</span> Company Perks
        </h1>
        <p className="text-gray-600">Redeem your credits for amazing company goodies!</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products?.map((product) => (
          <Link
            key={product.id}
            to={`/products/${product.id}`}
            className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-200 overflow-hidden border-2 border-transparent hover:border-capyx-400"
          >
            <div className="h-48 bg-gradient-to-br from-capyx-400 to-capyx-600 flex items-center justify-center">
              {getImageUrl(product.image_url) ? (
                <img
                  src={getImageUrl(product.image_url)!}
                  alt={product.name}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                    e.currentTarget.parentElement!.innerHTML = '<div class="text-gray-900 text-4xl">🎁</div>'
                  }}
                />
              ) : (
                <div className="text-gray-900 text-4xl">🎁</div>
              )}
            </div>
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{product.name}</h3>
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">{product.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-capyx-600">
                  {product.base_credits.toFixed(2)} Credits
                </span>
                <span className="text-capyx-600 hover:text-capyx-700 font-medium">
                  View Details →
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {products?.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No products available at the moment.</p>
        </div>
      )}
    </div>
  )
}

