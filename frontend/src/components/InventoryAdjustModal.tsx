import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '../api/api'
import toast from 'react-hot-toast'

interface InventoryAdjustModalProps {
  variant: any
  productName: string
  isOpen: boolean
  onClose: () => void
}

export default function InventoryAdjustModal({ variant, productName, isOpen, onClose }: InventoryAdjustModalProps) {
  const queryClient = useQueryClient()
  const [adjustment, setAdjustment] = useState<string | number>('')
  const [reason, setReason] = useState('')

  const adjustMutation = useMutation({
    mutationFn: () => {
      const adjustmentValue = adjustment === '' ? 0 : (typeof adjustment === 'string' ? parseInt(adjustment, 10) : adjustment)
      return adminApi.adjustInventory(variant.id, adjustmentValue, reason)
    },
    onSuccess: () => {
      toast.success('Inventory adjusted successfully!')
      queryClient.invalidateQueries({ queryKey: ['admin', 'inventory-overview'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'product-variants'] })
      onClose()
      setAdjustment('')
      setReason('')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to adjust inventory')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const adjustmentValue = adjustment === '' ? 0 : (typeof adjustment === 'string' ? parseInt(adjustment, 10) : adjustment)
    if (adjustmentValue === 0 || !reason) {
      toast.error('Please fill in all fields')
      return
    }
    adjustMutation.mutate()
  }

  if (!isOpen) return null

  const adjustmentValue = adjustment === '' ? 0 : (typeof adjustment === 'string' ? parseInt(adjustment, 10) : adjustment)
  const newTotal = variant.total_stock + adjustmentValue
  const newAvailable = newTotal - variant.reserved

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">Adjust Inventory</h2>
            <p className="text-sm text-gray-600 mt-1">{productName}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Current Stock Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Variant:</span>
                <p className="font-medium">
                  {variant.size && `Size: ${variant.size}`}
                  {variant.size && variant.color && ' / '}
                  {variant.color && `Color: ${variant.color}`}
                  {!variant.size && !variant.color && 'Default'}
                </p>
              </div>
              <div>
                <span className="text-gray-600">Current Stock:</span>
                <p className="font-medium">{variant.total_stock}</p>
              </div>
              <div>
                <span className="text-gray-600">Reserved:</span>
                <p className="font-medium">{variant.reserved}</p>
              </div>
              <div>
                <span className="text-gray-600">Available:</span>
                <p className="font-medium">{variant.available}</p>
              </div>
            </div>
          </div>

          {/* Adjustment Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Adjustment Amount
              <span className="text-gray-500 font-normal ml-1">(positive to add, negative to remove)</span>
            </label>
            <input
              type="number"
              required
              value={adjustment}
              onChange={(e) => setAdjustment(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-capyx-500 focus:border-capyx-500"
              placeholder="e.g., 50 or -10"
            />
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
            <textarea
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-capyx-500 focus:border-capyx-500"
              rows={3}
              placeholder="e.g., New shipment received, Damaged items removed"
            />
          </div>

          {/* Preview */}
          {adjustment !== '' && adjustmentValue !== 0 && (
            <div className={`p-3 rounded-lg ${adjustmentValue > 0 ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <p className="text-sm font-medium text-gray-700">After adjustment:</p>
              <p className="text-lg font-bold mt-1">
                Total: {newTotal} | Available: {newAvailable}
              </p>
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
              disabled={adjustMutation.isPending || adjustment === '' || adjustmentValue === 0 || !reason}
              className="flex-1 bg-capyx-500 hover:bg-capyx-600 text-gray-900 font-semibold py-2 rounded-lg disabled:bg-gray-300"
            >
              {adjustMutation.isPending ? 'Adjusting...' : 'Adjust Inventory'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

