import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi, productApi } from '../api/api'
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import InventoryAdjustModal from '../components/InventoryAdjustModal'
import { getImageUrl } from '../utils/imageUtils'

interface UserDetailModalProps {
  user: any
  isOpen: boolean
  onClose: () => void
}

function UserDetailModal({ user, isOpen, onClose }: UserDetailModalProps) {
  const [grantAmount, setGrantAmount] = useState('')
  const [grantDescription, setGrantDescription] = useState('')
  const queryClient = useQueryClient()

  const { data: balance } = useQuery({
    queryKey: ['admin', 'user-balance', user?.id],
    queryFn: () => adminApi.getUserBalance(user.id),
    enabled: !!user && isOpen,
  })

  const { data: ledger } = useQuery({
    queryKey: ['admin', 'user-ledger', user?.id],
    queryFn: () => adminApi.getUserLedger(user.id),
    enabled: !!user && isOpen,
  })

  const { data: orders } = useQuery({
    queryKey: ['admin', 'user-orders', user?.id],
    queryFn: () => adminApi.getUserOrders(user.id),
    enabled: !!user && isOpen,
  })

  const grantCreditsMutation = useMutation({
    mutationFn: () => adminApi.grantCredits(user.id, parseFloat(grantAmount), grantDescription),
    onSuccess: () => {
      toast.success('Credits granted successfully!')
      queryClient.invalidateQueries({ queryKey: ['admin', 'user-balance', user.id] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'user-ledger', user.id] })
      setGrantAmount('')
      setGrantDescription('')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to grant credits')
    },
  })

  if (!isOpen || !user) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{user.name}</h2>
            <p className="text-sm text-gray-600">{user.email}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Credit Balance */}
          <div className="bg-gradient-to-br from-capyx-400 to-capyx-600 rounded-lg p-6 text-gray-900">
            <div className="text-sm font-medium mb-1">Current Balance</div>
            <div className="text-4xl font-bold">{balance?.balance?.toFixed(2) || '0.00'}</div>
            <div className="text-sm mt-1">Credits</div>
          </div>

          {/* Grant Credits Form */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold mb-3">Grant Credits</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  placeholder="Amount"
                  value={grantAmount}
                  onChange={(e) => setGrantAmount(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-capyx-500 focus:border-capyx-500"
                  step="0.01"
                />
                <input
                  type="text"
                  placeholder="Description"
                  value={grantDescription}
                  onChange={(e) => setGrantDescription(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-capyx-500 focus:border-capyx-500"
                />
              </div>
              <button
                onClick={() => grantCreditsMutation.mutate()}
                disabled={!grantAmount || !grantDescription || grantCreditsMutation.isPending}
                className="w-full bg-capyx-500 hover:bg-capyx-600 disabled:bg-gray-300 text-gray-900 font-semibold py-2 rounded-lg transition-colors"
              >
                {grantCreditsMutation.isPending ? 'Granting...' : 'Grant Credits'}
              </button>
            </div>
          </div>

          {/* Credit Ledger */}
          <div>
            <h3 className="font-semibold mb-3">Credit History</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {ledger?.map((entry: any) => (
                <div key={entry.id} className="flex justify-between items-center p-3 bg-gray-50 rounded border border-gray-200">
                  <div>
                    <div className="font-medium text-sm">{entry.description}</div>
                    <div className="text-xs text-gray-500">
                      {new Date(entry.created_at).toLocaleString()}
                    </div>
                  </div>
                  <div className={`font-bold ${entry.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {entry.amount > 0 ? '+' : ''}{entry.amount.toFixed(2)}
                  </div>
                </div>
              ))}
              {ledger?.length === 0 && (
                <div className="text-center py-4 text-gray-500">No credit history</div>
              )}
            </div>
          </div>

          {/* Perk History (Orders) */}
          <div>
            <h3 className="font-semibold mb-3">Perk History</h3>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {orders?.map((order: any) => (
                <div key={order.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-medium">Order #{order.id}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(order.created_at).toLocaleString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-capyx-600">
                        {order.total_credits.toFixed(2)} Credits
                      </div>
                      <span className={`text-xs px-2 py-1 rounded ${
                        order.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                  {order.items && order.items.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {order.items.map((item: any) => (
                        <div key={item.id} className="text-sm text-gray-600">
                          {item.quantity}x - {item.unit_credits} credits each
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {orders?.length === 0 && (
                <div className="text-center py-4 text-gray-500">No orders yet</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

interface ProductModalProps {
  product?: any
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

function ProductModal({ product, isOpen, onClose, onSuccess }: ProductModalProps) {
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState({
    name: product?.name || '',
    description: product?.description || '',
    base_credits: product?.base_credits || '',
  })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>(product?.image_url || '')
  const [variants, setVariants] = useState<any[]>([])
  const [newVariant, setNewVariant] = useState({
    size: '',
    color: '',
    credits_modifier: '' as string | number,
    quantity: '' as string | number
  })

  // Fetch existing variants if editing
  const { data: existingVariants } = useQuery({
    queryKey: ['admin', 'product-variants', product?.id],
    queryFn: () => adminApi.getProductVariants(product.id),
    enabled: !!product && isOpen,
  })

  // Initialize variants when editing
  useEffect(() => {
    if (existingVariants) {
      setVariants(existingVariants)
    }
  }, [existingVariants])

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: product?.name || '',
        description: product?.description || '',
        base_credits: product?.base_credits || '',
      })
      setImageFile(null)
      setImagePreview(product?.image_url || '')
      setVariants([])
      setNewVariant({ size: '', color: '', credits_modifier: '', quantity: '' })
    }
  }, [isOpen, product])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleAddVariant = () => {
    if (!newVariant.size && !newVariant.color) {
      toast.error('Please specify at least size or color')
      return
    }
    const variantToAdd = {
      ...newVariant,
      credits_modifier: newVariant.credits_modifier === '' ? 0 : parseFloat(newVariant.credits_modifier.toString()),
      quantity: newVariant.quantity === '' ? 0 : parseInt(newVariant.quantity.toString(), 10),
      id: Date.now()
    }
    setVariants([...variants, variantToAdd])
    setNewVariant({ size: '', color: '', credits_modifier: '', quantity: '' })
  }

  const handleRemoveVariant = (index: number) => {
    const variantToRemove = variants[index]
    if (product && variantToRemove.id && typeof variantToRemove.id === 'number' && variantToRemove.id < 100000) {
      // Existing variant - delete from server
      deleteVariantMutation.mutate({ productId: product.id, variantId: variantToRemove.id })
    }
    setVariants(variants.filter((_, i) => i !== index))
  }

  const createMutation = useMutation({
    mutationFn: async () => {
      const formDataToSend = new FormData()
      formDataToSend.append('name', formData.name)
      formDataToSend.append('description', formData.description || '')
      formDataToSend.append('base_credits', formData.base_credits.toString())
      if (imageFile) {
        formDataToSend.append('image', imageFile)
      }
      return adminApi.createProduct(formDataToSend)
    },
    onSuccess: async (newProduct) => {
      // Create variants if any, or create a default variant if none specified
      if (variants.length > 0) {
        for (const variant of variants) {
          await adminApi.createVariant(newProduct.id, {
            size: variant.size || null,
            color: variant.color || null,
            credits_modifier: typeof variant.credits_modifier === 'string' ? parseFloat(variant.credits_modifier) || 0 : variant.credits_modifier,
            quantity: typeof variant.quantity === 'string' ? parseInt(variant.quantity, 10) || 0 : variant.quantity
          })
        }
      } else {
        // Create a default variant so the product can be ordered
        await adminApi.createVariant(newProduct.id, {
          size: null,
          color: null,
          credits_modifier: 0,
          quantity: 0
        })
      }
      toast.success('Product created successfully!')
      onSuccess()
      onClose()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to create product')
    },
  })

  const updateMutation = useMutation({
    mutationFn: async () => {
      const formDataToSend = new FormData()
      if (formData.name !== product.name) formDataToSend.append('name', formData.name)
      if (formData.description !== product.description) formDataToSend.append('description', formData.description || '')
      if (formData.base_credits !== product.base_credits) formDataToSend.append('base_credits', formData.base_credits.toString())
      if (imageFile) {
        formDataToSend.append('image', imageFile)
      }
      return adminApi.updateProduct(product.id, formDataToSend)
    },
    onSuccess: async () => {
      // Create new variants
      for (const variant of variants) {
        if (!variant.id || variant.id > 100000) {
          // New variant
          await adminApi.createVariant(product.id, {
            size: variant.size || null,
            color: variant.color || null,
            credits_modifier: typeof variant.credits_modifier === 'string' ? parseFloat(variant.credits_modifier) || 0 : variant.credits_modifier,
            quantity: typeof variant.quantity === 'string' ? parseInt(variant.quantity, 10) || 0 : variant.quantity
          })
        }
      }
      
      toast.success('Product updated successfully!')
      queryClient.invalidateQueries({ queryKey: ['admin', 'product-variants', product.id] })
      onSuccess()
      onClose()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to update product')
    },
  })

  const deleteVariantMutation = useMutation({
    mutationFn: ({ productId, variantId }: { productId: number, variantId: number }) => 
      adminApi.deleteVariant(productId, variantId),
    onSuccess: () => {
      toast.success('Variant deleted')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (product) {
      updateMutation.mutate()
    } else {
      createMutation.mutate()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full my-8 max-h-[90vh] flex flex-col">
        <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center bg-white rounded-t-lg flex-shrink-0">
          <h2 className="text-xl font-bold">{product ? 'Edit Product' : 'Add Product'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Basic Info */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-capyx-500 focus:border-capyx-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-capyx-500 focus:border-capyx-500"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Credits</label>
            <input
              type="number"
              required
              step="0.01"
              value={formData.base_credits}
              onChange={(e) => setFormData({ ...formData, base_credits: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-capyx-500 focus:border-capyx-500"
            />
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Product Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-capyx-500 focus:border-capyx-500"
            />
            {imagePreview && (
              <div className="mt-2">
                <img 
                  src={imagePreview.startsWith('blob:') || imagePreview.startsWith('data:') ? imagePreview : getImageUrl(imagePreview) || imagePreview} 
                  alt="Preview" 
                  className="w-32 h-32 object-cover rounded-lg border border-gray-300"
                  onError={() => {
                    console.error('Image failed to load:', imagePreview)
                  }}
                />
              </div>
            )}
          </div>

          {/* Variants Section - Only show when adding new product */}
          {!product && (
            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold mb-3">Variants (Optional)</h3>
              <p className="text-sm text-gray-600 mb-3">Add size, color, or other variants for this product</p>
              
              {/* Existing Variants */}
              {variants.length > 0 && (
                <div className="space-y-2 mb-4">
                  {variants.map((variant, index) => (
                    <div key={variant.id || index} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1 grid grid-cols-4 gap-2 text-sm">
                        <div><span className="font-medium">Size:</span> {variant.size || 'N/A'}</div>
                        <div><span className="font-medium">Color:</span> {variant.color || 'N/A'}</div>
                        <div><span className="font-medium">Credits:</span> +{variant.credits_modifier}</div>
                        <div><span className="font-medium">Qty:</span> {variant.quantity || 0}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveVariant(index)}
                        className="text-red-600 hover:text-red-800 p-1"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add New Variant */}
              <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Size</label>
                    <input
                      type="text"
                      placeholder="e.g., S, M, L, XL"
                      value={newVariant.size}
                      onChange={(e) => setNewVariant({ ...newVariant, size: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-capyx-500 focus:border-capyx-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Color</label>
                    <input
                      type="text"
                      placeholder="e.g., Red, Blue"
                      value={newVariant.color}
                      onChange={(e) => setNewVariant({ ...newVariant, color: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-capyx-500 focus:border-capyx-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Extra Credits</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newVariant.credits_modifier}
                      onChange={(e) => {
                        setNewVariant({ ...newVariant, credits_modifier: e.target.value })
                      }}
                      placeholder="0"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-capyx-500 focus:border-capyx-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Quantity</label>
                    <input
                      type="number"
                      min="0"
                      value={newVariant.quantity}
                      onChange={(e) => {
                        setNewVariant({ ...newVariant, quantity: e.target.value })
                      }}
                      placeholder="0"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-capyx-500 focus:border-capyx-500"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleAddVariant}
                  className="w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg text-sm font-medium"
                >
                  + Add Variant
                </button>
              </div>
            </div>
          )}

          {/* Info message when editing */}
          {product && (
            <div className="border-t pt-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex gap-3">
                  <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h4 className="text-sm font-semibold text-blue-900 mb-1">Variant Management</h4>
                    <p className="text-sm text-blue-800">
                      To manage variants and stock levels, please use the <strong>Inventory</strong> tab. 
                      Product editing only allows changes to name, description, credits, and images.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="flex-1 bg-capyx-500 hover:bg-capyx-600 text-gray-900 font-semibold py-2 rounded-lg disabled:bg-gray-300"
            >
              {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

interface InventoryManagementTabProps {
  lowStockItems: any[]
  searchQuery: string
  setSearchQuery: (query: string) => void
  stockFilter: 'all' | 'in_stock' | 'low_stock' | 'out_of_stock'
  setStockFilter: (filter: 'all' | 'in_stock' | 'low_stock' | 'out_of_stock') => void
  filteredInventory: any[]
  refetchInventory: () => void
}

function InventoryManagementTab({
  lowStockItems,
  searchQuery,
  setSearchQuery,
  stockFilter,
  setStockFilter,
  filteredInventory,
  refetchInventory,
}: InventoryManagementTabProps) {
  const [selectedVariant, setSelectedVariant] = useState<any>(null)
  const [adjustModalOpen, setAdjustModalOpen] = useState(false)
  const [selectedProductName, setSelectedProductName] = useState('')

  const handleAdjustStock = (variant: any, productName: string) => {
    setSelectedVariant(variant)
    setSelectedProductName(productName)
    setAdjustModalOpen(true)
  }

  const getStockStatusColor = (status: string) => {
    switch (status) {
      case 'out_of_stock': return 'bg-red-100 text-red-800 border-red-200'
      case 'low_stock': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'in_stock': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStockStatusLabel = (status: string) => {
    switch (status) {
      case 'out_of_stock': return 'Out of Stock'
      case 'low_stock': return 'Low Stock'
      case 'in_stock': return 'In Stock'
      default: return 'Unknown'
    }
  }

  return (
    <div>
      {/* Header & Filters */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
          <h2 className="text-lg md:text-xl font-semibold">Inventory Management</h2>
          <button
            onClick={() => refetchInventory()}
            className="flex items-center gap-2 px-4 py-2 border border-capyx-300 rounded-lg hover:bg-capyx-50 text-capyx-700 text-sm w-full md:w-auto justify-center"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col gap-4">
          <div className="w-full">
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-capyx-500 focus:border-capyx-500 text-sm"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setStockFilter('all')}
              className={`px-3 md:px-4 py-2 rounded-lg font-medium text-xs md:text-sm whitespace-nowrap ${
                stockFilter === 'all'
                  ? 'bg-capyx-500 text-gray-900'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStockFilter('in_stock')}
              className={`px-3 md:px-4 py-2 rounded-lg font-medium text-xs md:text-sm whitespace-nowrap ${
                stockFilter === 'in_stock'
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              In Stock
            </button>
            <button
              onClick={() => setStockFilter('low_stock')}
              className={`px-3 md:px-4 py-2 rounded-lg font-medium text-xs md:text-sm whitespace-nowrap ${
                stockFilter === 'low_stock'
                  ? 'bg-yellow-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Low Stock
            </button>
            <button
              onClick={() => setStockFilter('out_of_stock')}
              className={`px-3 md:px-4 py-2 rounded-lg font-medium text-xs md:text-sm whitespace-nowrap ${
                stockFilter === 'out_of_stock'
                  ? 'bg-red-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Out of Stock
            </button>
          </div>
        </div>
      </div>

      {/* Low Stock Alert */}
      {lowStockItems && lowStockItems.length > 0 && stockFilter === 'all' && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-900 mb-3 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Low Stock Items ({lowStockItems.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {lowStockItems.slice(0, 6).map((item: any) => (
              <div key={`${item.product_id}-${item.variant_id}`} className="bg-white rounded-lg p-3 border border-yellow-300">
                <p className="font-medium text-sm">{item.product_name}</p>
                <p className="text-xs text-gray-600 mt-1">
                  {item.variant_size && `Size: ${item.variant_size}`}
                  {item.variant_size && item.variant_color && ' • '}
                  {item.variant_color && `Color: ${item.variant_color}`}
                </p>
                <p className="text-sm font-bold text-yellow-700 mt-2">
                  Only {item.available} left
                </p>
              </div>
            ))}
          </div>
          {lowStockItems.length > 6 && (
            <p className="text-sm text-yellow-700 mt-3">
              + {lowStockItems.length - 6} more items with low stock
            </p>
          )}
        </div>
      )}

      {/* Inventory Cards */}
      <div className="space-y-6">
        {filteredInventory.map((product: any) => (
          <div key={product.id} className="border border-gray-200 rounded-lg overflow-hidden">
            {/* Product Header */}
            <div className="bg-gradient-to-r from-capyx-50 to-white px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900">{product.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{product.description}</p>
                  <div className="flex items-center gap-4 mt-3">
                    <span className="text-sm text-gray-700">
                      <span className="font-semibold">Base Price:</span> {product.base_credits} Credits
                    </span>
                    <span className="text-sm text-gray-700">
                      <span className="font-semibold">Variants:</span> {product.total_variants}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-capyx-600">{product.total_available}</p>
                  <p className="text-xs text-gray-600">Total Available</p>
                  {product.total_reserved > 0 && (
                    <p className="text-xs text-orange-600 mt-1">{product.total_reserved} Reserved</p>
                  )}
                </div>
              </div>
            </div>

            {/* Variants Table */}
            {product.variants && product.variants.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Variant
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Price Modifier
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Stock
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Reserved
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Available
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {product.variants.map((variant: any) => (
                      <tr key={variant.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {variant.size && `Size: ${variant.size}`}
                            {variant.size && variant.color && ' / '}
                            {variant.color && `Color: ${variant.color}`}
                            {!variant.size && !variant.color && 'Default'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {variant.credits_modifier > 0 ? `+${variant.credits_modifier}` : variant.credits_modifier} credits
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {variant.total_stock}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-orange-600">
                          {variant.reserved}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-capyx-600">
                          {variant.available}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getStockStatusColor(variant.stock_status)}`}>
                            {getStockStatusLabel(variant.stock_status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={() => handleAdjustStock(variant, product.name)}
                            className="text-capyx-600 hover:text-capyx-900 font-medium"
                          >
                            Adjust Stock
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="px-6 py-8 text-center text-gray-500">
                No variants found for this product
              </div>
            )}
          </div>
        ))}

        {filteredInventory.length === 0 && (
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p className="text-gray-600 text-lg">No products found</p>
            <p className="text-gray-500 text-sm mt-1">Try adjusting your search or filters</p>
          </div>
        )}
      </div>

      {/* Inventory Adjust Modal */}
      {selectedVariant && (
        <InventoryAdjustModal
          variant={selectedVariant}
          productName={selectedProductName}
          isOpen={adjustModalOpen}
          onClose={() => {
            setAdjustModalOpen(false)
            setSelectedVariant(null)
            setSelectedProductName('')
          }}
        />
      )}
    </div>
  )
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'order_requests' | 'orders' | 'users' | 'products' | 'inventory'>('order_requests')
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [productModalOpen, setProductModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [stockFilter, setStockFilter] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all')
  const [userSearchQuery, setUserSearchQuery] = useState('')
  const [orderSearchQuery, setOrderSearchQuery] = useState('')
  const queryClient = useQueryClient()

  const { data: products, refetch: refetchProducts } = useQuery({
    queryKey: ['products'],
    queryFn: () => productApi.getProducts(),
  })

  const { data: inventoryOverview, refetch: refetchInventory } = useQuery({
    queryKey: ['admin', 'inventory-overview'],
    queryFn: () => adminApi.getInventoryOverview(),
  })

  const { data: lowStockItems } = useQuery({
    queryKey: ['admin', 'low-stock'],
    queryFn: () => adminApi.getLowStockItems(10),
    refetchInterval: 60000, // Refresh every minute
  })

  const { data: orders } = useQuery({
    queryKey: ['admin', 'orders'],
    queryFn: () => adminApi.getAllOrders(),
  })

  const { data: pendingOrders, refetch: refetchPendingOrders } = useQuery({
    queryKey: ['admin', 'pending-orders'],
    queryFn: () => adminApi.getPendingOrders(),
    refetchInterval: 30000, // Refresh every 30 seconds
  })

  const { data: users } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => adminApi.getUsers(),
  })

  const approveOrderMutation = useMutation({
    mutationFn: (orderId: number) => adminApi.approveOrder(orderId),
    onSuccess: () => {
      toast.success('Order approved! Inventory deducted and order marked as fulfilled.')
      refetchPendingOrders()
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'inventory-overview'] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to approve order')
    },
  })

  const rejectOrderMutation = useMutation({
    mutationFn: ({ orderId, reason }: { orderId: number, reason?: string }) => adminApi.rejectOrder(orderId, reason),
    onSuccess: () => {
      toast.success('Order rejected. Credits refunded to user.')
      refetchPendingOrders()
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'inventory-overview'] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to reject order')
    },
  })

  const deleteProductMutation = useMutation({
    mutationFn: (productId: number) => adminApi.deleteProduct(productId),
    onSuccess: () => {
      toast.success('Product deleted successfully!')
      refetchProducts()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to delete product')
    },
  })

  const handleDeleteProduct = (product: any) => {
    if (confirm(`Are you sure you want to delete "${product.name}"?`)) {
      deleteProductMutation.mutate(product.id)
    }
  }

  const handleEditProduct = (product: any) => {
    setEditingProduct(product)
    setProductModalOpen(true)
  }

  const handleCloseProductModal = () => {
    setProductModalOpen(false)
    setEditingProduct(null)
  }

  // Filter inventory based on search and stock status
  const filteredInventory = inventoryOverview?.filter((item: any) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.description?.toLowerCase().includes(searchQuery.toLowerCase())
    
    if (!matchesSearch) return false
    
    if (stockFilter === 'all') return true
    
    const hasVariants = item.variants && item.variants.length > 0
    if (!hasVariants) return stockFilter === 'in_stock'
    
    return item.variants.some((v: any) => {
      if (stockFilter === 'out_of_stock') return v.stock_status === 'out_of_stock'
      if (stockFilter === 'low_stock') return v.stock_status === 'low_stock'
      if (stockFilter === 'in_stock') return v.stock_status === 'in_stock'
      return true
    })
  }) || []

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header with Low Stock Alert */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">
          <span className="text-capyx-600">Capyx</span> Admin Dashboard
        </h1>
        {lowStockItems && lowStockItems.length > 0 && (
          <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-yellow-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span className="text-yellow-800 font-medium text-sm">
                {lowStockItems.length} item{lowStockItems.length !== 1 ? 's' : ''} running low on stock
              </span>
            </div>
            <button
              onClick={() => setActiveTab('inventory')}
              className="text-yellow-700 hover:text-yellow-900 font-medium underline text-sm sm:ml-auto"
            >
              View Details
            </button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-md border border-capyx-200">
        <div className="border-b border-capyx-200">
          <div className="flex overflow-x-auto space-x-2 md:space-x-4 px-4 md:px-6 scrollbar-hide">
            <button
              onClick={() => setActiveTab('order_requests')}
              className={`py-4 border-b-2 font-medium relative whitespace-nowrap text-sm md:text-base flex-shrink-0 ${
                activeTab === 'order_requests'
                  ? 'border-capyx-600 text-capyx-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <span className="hidden sm:inline">Order Requests</span>
              <span className="sm:hidden">Requests</span> ({pendingOrders?.length || 0})
              {pendingOrders && pendingOrders.length > 0 && (
                <span className="absolute -top-1 -right-2 bg-capyx-500 text-gray-900 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                  {pendingOrders.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`py-4 border-b-2 font-medium whitespace-nowrap text-sm md:text-base flex-shrink-0 ${
                activeTab === 'orders'
                  ? 'border-capyx-600 text-capyx-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <span className="hidden sm:inline">All </span>Orders ({orders?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`py-4 border-b-2 font-medium whitespace-nowrap text-sm md:text-base flex-shrink-0 ${
                activeTab === 'users'
                  ? 'border-capyx-600 text-capyx-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Users ({users?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('products')}
              className={`py-4 border-b-2 font-medium whitespace-nowrap text-sm md:text-base flex-shrink-0 ${
                activeTab === 'products'
                  ? 'border-capyx-600 text-capyx-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Products ({products?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('inventory')}
              className={`py-4 border-b-2 font-medium relative whitespace-nowrap text-sm md:text-base flex-shrink-0 ${
                activeTab === 'inventory'
                  ? 'border-capyx-600 text-capyx-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Inventory ({inventoryOverview?.length || 0})
              {lowStockItems && lowStockItems.length > 0 && (
                <span className="absolute -top-1 -right-2 bg-yellow-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {lowStockItems.length}
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="p-6">

          {activeTab === 'order_requests' && (
            <div>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <h2 className="text-lg md:text-xl font-semibold">Pending Order Requests</h2>
                <button
                  onClick={() => refetchPendingOrders()}
                  className="flex items-center justify-center gap-2 px-4 py-2 border border-capyx-300 rounded-lg hover:bg-capyx-50 text-capyx-700 text-sm w-full sm:w-auto"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh
                </button>
              </div>

              {pendingOrders && pendingOrders.length > 0 ? (
                <div className="space-y-4">
                  {pendingOrders.map((order: any) => (
                    <div key={order.id} className="border border-gray-200 rounded-lg overflow-hidden bg-white hover:border-capyx-400 transition-colors">
                      <div className="bg-gradient-to-r from-capyx-50 to-white px-6 py-4 border-b border-gray-200">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-3">
                              <h3 className="text-lg font-bold text-gray-900">Order #{order.id}</h3>
                              <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full">
                                PENDING APPROVAL
                              </span>
                            </div>
                          <p className="text-sm text-gray-600 mt-1">
                            Requested by: <span className="font-medium">{order.user?.name || 'Unknown User'}</span> ({order.user?.email || 'No email'})
                          </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(order.created_at).toLocaleString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-capyx-600">{order.total_credits.toFixed(2)} Credits</p>
                            <p className="text-xs text-gray-600 mt-1">Total Cost</p>
                          </div>
                        </div>
                      </div>

                      <div className="px-6 py-4">
                        <h4 className="font-semibold text-sm text-gray-700 mb-3">Order Items:</h4>
                        <div className="space-y-2 mb-4">
                          {order.items && order.items.map((item: any) => (
                            <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                              <div className="flex-1">
                                <p className="font-medium text-sm">{item.product_name || `Product #${item.variant_id}`}</p>
                                {(item.variant_size || item.variant_color) && (
                                  <p className="text-xs text-gray-600">
                                    {item.variant_size && `Size: ${item.variant_size}`}
                                    {item.variant_size && item.variant_color && ' • '}
                                    {item.variant_color && `Color: ${item.variant_color}`}
                                  </p>
                                )}
                                <p className="text-xs text-gray-600">Quantity: {item.quantity}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold text-capyx-600">{item.total_credits.toFixed(2)} Credits</p>
                                <p className="text-xs text-gray-500">{item.unit_credits.toFixed(2)} each</p>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
                          <button
                            onClick={() => {
                              if (confirm(`Mark order #${order.id} as fulfilled?\n\nThis will:\n- Remove items from inventory\n- Mark order as completed\n\nNote: Credits (${order.total_credits.toFixed(2)}) were already deducted from user's balance.`)) {
                                approveOrderMutation.mutate(order.id)
                              }
                            }}
                            disabled={approveOrderMutation.isPending}
                            className="flex-1 bg-capyx-500 hover:bg-capyx-600 text-gray-900 font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm md:text-base"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span>{approveOrderMutation.isPending ? 'Approving...' : 'Approve & Mark Fulfilled'}</span>
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Reject order #${order.id}?\n\nThis will:\n- Cancel the order\n- Release reserved inventory\n- REFUND ${order.total_credits.toFixed(2)} credits back to user`)) {
                                rejectOrderMutation.mutate({ orderId: order.id })
                              }
                            }}
                            disabled={rejectOrderMutation.isPending}
                            className="flex-1 border-2 border-red-500 hover:bg-red-50 text-red-600 font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm md:text-base"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            <span>{rejectOrderMutation.isPending ? 'Rejecting...' : 'Reject Order'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                  <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-gray-600 text-lg font-medium">No Pending Orders</p>
                  <p className="text-gray-500 text-sm mt-1">All order requests have been processed</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'users' && (
            <div>
              <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-4">
                <h2 className="text-lg md:text-xl font-semibold">User Management</h2>
                <div className="w-full md:w-64">
                  <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-capyx-500 focus:border-capyx-500 text-sm"
                  />
                </div>
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-capyx-200">
                      <th className="text-left py-3 px-4">Name</th>
                      <th className="text-left py-3 px-4">Email</th>
                      <th className="text-left py-3 px-4">Role</th>
                      <th className="text-left py-3 px-4">Start Date</th>
                      <th className="text-left py-3 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users?.filter((user: any) => {
                      const searchLower = userSearchQuery.toLowerCase()
                      return user.name.toLowerCase().includes(searchLower) || 
                             user.email.toLowerCase().includes(searchLower)
                    }).map((user: any) => (
                      <tr key={user.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">{user.name}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">{user.email}</td>
                        <td className="py-3 px-4">
                          <span className="capitalize px-3 py-1 bg-capyx-100 text-capyx-800 rounded-full text-xs font-medium">
                            {user.role}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {new Date(user.start_date).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => setSelectedUser(user)}
                            className="text-capyx-600 hover:text-capyx-700 font-medium text-sm"
                          >
                            Manage →
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-3">
                {users?.filter((user: any) => {
                  const searchLower = userSearchQuery.toLowerCase()
                  return user.name.toLowerCase().includes(searchLower) || 
                         user.email.toLowerCase().includes(searchLower)
                }).map((user: any) => (
                  <div key={user.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-base">{user.name}</h3>
                        <p className="text-sm text-gray-600 break-words">{user.email}</p>
                      </div>
                      <span className="capitalize px-3 py-1 bg-capyx-100 text-capyx-800 rounded-full text-xs font-medium whitespace-nowrap ml-2">
                        {user.role}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-200">
                      <span className="text-xs text-gray-500">
                        Since: {new Date(user.start_date).toLocaleDateString()}
                      </span>
                      <button
                        onClick={() => setSelectedUser(user)}
                        className="text-capyx-600 hover:text-capyx-700 font-medium text-sm"
                      >
                        Manage →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'orders' && (
            <div>
              <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-4">
                <h2 className="text-lg md:text-xl font-semibold">All Orders</h2>
                <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                  <button
                    onClick={() => {
                      const pendingOrdersList = orders?.filter((order: any) => order.status === 'pending') || []
                      if (pendingOrdersList.length === 0) {
                        toast.error('No pending orders to approve')
                        return
                      }
                      if (confirm(`Approve all ${pendingOrdersList.length} pending order(s)?\n\nThis will:\n- Remove items from inventory\n- Mark all orders as completed\n\nNote: Credits were already deducted from users' balances.`)) {
                        // Approve each pending order
                        pendingOrdersList.forEach((order: any) => {
                          approveOrderMutation.mutate(order.id)
                        })
                      }
                    }}
                    disabled={approveOrderMutation.isPending || !orders?.some((order: any) => order.status === 'pending')}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-capyx-500 hover:bg-capyx-600 text-gray-900 font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm md:text-base"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="hidden sm:inline">Approve All Pending</span>
                    <span className="sm:hidden">Approve All</span>
                  </button>
                  <div className="w-full sm:w-64">
                    <input
                      type="text"
                      placeholder="Search by user name..."
                      value={orderSearchQuery}
                      onChange={(e) => setOrderSearchQuery(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-capyx-500 focus:border-capyx-500 text-sm"
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                {orders?.filter((order: any) => {
                  if (!orderSearchQuery) return true
                  const searchLower = orderSearchQuery.toLowerCase()
                  return order.user?.name?.toLowerCase().includes(searchLower)
                }).map((order: any) => (
                  <div key={order.id} className="border border-gray-200 rounded-lg overflow-hidden bg-white hover:border-capyx-400 transition-colors">
                    <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-4 border-b border-gray-200">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-3">
                            <h3 className="text-lg font-bold text-gray-900">Order #{order.id}</h3>
                            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                              order.status === 'completed' 
                                ? 'bg-green-100 text-green-800' 
                                : order.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {order.status.toUpperCase()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            User: <span className="font-medium">{order.user?.name || 'Unknown User'}</span> ({order.user?.email || 'No email'})
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(order.created_at).toLocaleString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-capyx-600">{order.total_credits.toFixed(2)} Credits</p>
                          <p className="text-xs text-gray-600 mt-1">Total Cost</p>
                        </div>
                      </div>
                    </div>

                    <div className="px-6 py-4">
                      <div className="flex justify-between items-center">
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm text-gray-700 mb-2">Order Items:</h4>
                          <div className="space-y-1">
                            {order.items && order.items.length > 0 ? (
                              order.items.map((item: any) => (
                                <div key={item.id} className="text-sm text-gray-600">
                                  • <strong>{item.product_name || `Product #${item.variant_id}`}</strong>
                                  {(item.variant_size || item.variant_color) && (
                                    <span className="text-gray-500">
                                      {' '}({item.variant_size && `Size: ${item.variant_size}`}
                                      {item.variant_size && item.variant_color && ', '}
                                      {item.variant_color && `Color: ${item.variant_color}`})
                                    </span>
                                  )}
                                  {' '}- Qty: {item.quantity} - {item.total_credits.toFixed(2)} credits
                                </div>
                              ))
                            ) : (
                              <p className="text-sm text-gray-500">No items</p>
                            )}
                          </div>
                        </div>
                        
                        {order.status === 'pending' && (
                          <div className="flex gap-2 ml-4">
                            <button
                              onClick={() => {
                                if (confirm(`Approve order #${order.id}?`)) {
                                  approveOrderMutation.mutate(order.id)
                                }
                              }}
                              className="px-4 py-2 bg-capyx-500 hover:bg-capyx-600 text-gray-900 font-semibold rounded-lg text-sm"
                            >
                              ✓ Approve
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Reject order #${order.id}? Credits will be refunded.`)) {
                                  rejectOrderMutation.mutate({ orderId: order.id })
                                }
                              }}
                              className="px-4 py-2 border-2 border-red-500 hover:bg-red-50 text-red-600 font-semibold rounded-lg text-sm"
                            >
                              ✗ Reject
                            </button>
                          </div>
                        )}
                        
                        {order.status === 'completed' && order.completed_at && (
                          <div className="text-sm text-green-600 ml-4">
                            ✓ Fulfilled on {new Date(order.completed_at).toLocaleDateString()}
                          </div>
                        )}
                        
                        {order.status === 'cancelled' && (
                          <div className="text-sm text-red-600 ml-4">
                            ✗ Cancelled
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                
                {orders?.filter((order: any) => {
                  if (!orderSearchQuery) return true
                  const searchLower = orderSearchQuery.toLowerCase()
                  return order.user?.name?.toLowerCase().includes(searchLower)
                }).length === 0 && (
                  <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                    <p className="text-gray-600 text-lg">No orders found</p>
                    <p className="text-gray-500 text-sm mt-1">Try adjusting your search</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'products' && (
            <div>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                <h2 className="text-lg md:text-xl font-semibold">Product Management</h2>
                <button
                  onClick={() => setProductModalOpen(true)}
                  className="bg-capyx-500 hover:bg-capyx-600 text-gray-900 font-semibold px-4 py-2 rounded-lg shadow-md shadow-capyx-500/20 text-sm md:text-base w-full sm:w-auto"
                >
                  + Add Product
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {products?.map((product: any) => (
                  <div key={product.id} className="border border-capyx-200 rounded-lg p-4 hover:border-capyx-400 transition-colors">
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-base md:text-lg truncate">{product.name}</h3>
                        <p className="text-xs md:text-sm text-gray-600 mt-1 line-clamp-2">{product.description}</p>
                        <p className="text-capyx-600 font-bold mt-2 text-sm md:text-base">{product.base_credits} Credits</p>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <button
                          onClick={() => handleEditProduct(product)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                          title="Edit"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded"
                          title="Delete"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'inventory' && (
            <InventoryManagementTab
              lowStockItems={lowStockItems}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              stockFilter={stockFilter}
              setStockFilter={setStockFilter}
              filteredInventory={filteredInventory}
              refetchInventory={refetchInventory}
            />
          )}
        </div>
      </div>

      {/* Modals */}
      <UserDetailModal
        user={selectedUser}
        isOpen={!!selectedUser}
        onClose={() => setSelectedUser(null)}
      />

      <ProductModal
        product={editingProduct}
        isOpen={productModalOpen}
        onClose={handleCloseProductModal}
        onSuccess={refetchProducts}
      />
    </div>
  )
}
