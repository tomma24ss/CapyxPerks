export interface User {
  id: number
  email: string
  name: string
  role: 'intern' | 'employee' | 'senior' | 'admin'
  start_date: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Product {
  id: number
  name: string
  description: string
  base_credits: number
  image_url?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Variant {
  id: number
  product_id: number
  size?: string
  color?: string
  credits_modifier: number
  created_at: string
}

export interface ProductDetail extends Product {
  variants: Variant[]
}

export interface CreditBalance {
  balance: number
  user_id: number
}

export interface CreditLedger {
  id: number
  user_id: number
  amount: number
  credit_type: 'grant' | 'debit' | 'adjust'
  description?: string
  reference_order_id?: number
  created_at: string
}

export interface OrderItem {
  id: number
  order_id: number
  variant_id: number
  quantity: number
  unit_credits: number
  total_credits: number
  created_at: string
}

export interface Order {
  id: number
  user_id: number
  status: 'pending' | 'processing' | 'completed' | 'cancelled'
  total_credits: number
  created_at: string
  updated_at: string
  completed_at?: string
  items: OrderItem[]
}

export interface CartItem {
  variant_id: number
  product_id: number
  quantity: number
  product_name: string
  variant_size?: string
  variant_color?: string
  credits: number
}

