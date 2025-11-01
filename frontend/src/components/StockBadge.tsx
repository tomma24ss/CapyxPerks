interface StockBadgeProps {
  available: number
  total?: number
  size?: 'sm' | 'md' | 'lg'
}

export default function StockBadge({ available, total, size = 'md' }: StockBadgeProps) {
  const getStockStatus = () => {
    if (available === 0) return { label: 'Out of Stock', color: 'bg-red-100 text-red-800 border-red-200' }
    if (available < 10) return { label: 'Low Stock', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' }
    return { label: 'In Stock', color: 'bg-green-100 text-green-800 border-green-200' }
  }

  const status = getStockStatus()
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5'
  }

  return (
    <div className="flex items-center gap-2">
      <span className={`${status.color} ${sizeClasses[size]} rounded-full font-medium border`}>
        {status.label}
      </span>
      <span className="text-sm text-gray-600">
        {available} {total !== undefined && `/ ${total}`} available
      </span>
    </div>
  )
}

