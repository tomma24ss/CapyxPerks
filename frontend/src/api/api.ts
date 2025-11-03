import { apiClient } from './client'
import { Product, ProductDetail, Order, CreditBalance, CreditLedger, User, Variant } from '../types'

export const authApi = {
  getAzureLoginUrl: async () => {
    const response = await apiClient.get('/api/auth/azure')
    return response.data.auth_url
  },
  
  callback: async (code: string) => {
    const response = await apiClient.post('/api/auth/callback', { code })
    return response.data
  },
  
  devLogin: async (email: string, name?: string) => {
    const response = await apiClient.post('/api/auth/dev/login', { email, name })
    return response.data
  },
  
  getDevUsers: async () => {
    console.log('Calling /api/auth/dev/users...')
    const response = await apiClient.get('/api/auth/dev/users')
    console.log('Response from /api/auth/dev/users:', response.data)
    console.log('Response type:', typeof response.data, 'Is array?', Array.isArray(response.data))
    return response.data
  },
}

export const userApi = {
  getMe: async (): Promise<User> => {
    const response = await apiClient.get('/api/me')
    return response.data
  },
}

export const creditApi = {
  getBalance: async (): Promise<CreditBalance> => {
    const response = await apiClient.get('/api/credits/balance')
    return response.data
  },
  
  getLedger: async (): Promise<CreditLedger[]> => {
    const response = await apiClient.get('/api/credits/ledger')
    return response.data
  },
}

export const productApi = {
  getProducts: async (): Promise<Product[]> => {
    const response = await apiClient.get('/api/products')
    return response.data
  },
  
  getProduct: async (id: number): Promise<ProductDetail> => {
    const response = await apiClient.get(`/api/products/${id}`)
    return response.data
  },
  
  getVariant: async (id: number): Promise<Variant> => {
    const response = await apiClient.get(`/api/variants/${id}`)
    return response.data
  },
}

export const orderApi = {
  createOrder: async (order: any): Promise<Order> => {
    const response = await apiClient.post('/api/orders', order)
    return response.data
  },
  
  getOrders: async (): Promise<Order[]> => {
    const response = await apiClient.get('/api/orders')
    return response.data
  },
  
  getOrder: async (id: number): Promise<Order> => {
    const response = await apiClient.get(`/api/orders/${id}`)
    return response.data
  },
}

export const adminApi = {
  // Products
  createProduct: async (formData: FormData) => {
    // Don't set Content-Type header - let the browser set it automatically with the boundary
    const response = await apiClient.post('/api/admin/products', formData)
    return response.data
  },
  
  updateProduct: async (productId: number, formData: FormData) => {
    // Don't set Content-Type header - let the browser set it automatically with the boundary
    const response = await apiClient.put(`/api/admin/products/${productId}`, formData)
    return response.data
  },
  
  deleteProduct: async (productId: number) => {
    const response = await apiClient.delete(`/api/admin/products/${productId}`)
    return response.data
  },
  
  // Variants
  getProductVariants: async (productId: number) => {
    const response = await apiClient.get(`/api/admin/products/${productId}/variants`)
    return response.data
  },
  
  createVariant: async (productId: number, variant: any) => {
    const response = await apiClient.post(`/api/admin/products/${productId}/variants`, variant)
    return response.data
  },
  
  updateVariant: async (productId: number, variantId: number, variant: any) => {
    const response = await apiClient.put(`/api/admin/products/${productId}/variants/${variantId}`, variant)
    return response.data
  },
  
  deleteVariant: async (productId: number, variantId: number) => {
    const response = await apiClient.delete(`/api/admin/products/${productId}/variants/${variantId}`)
    return response.data
  },
  
  updateInventory: async (productId: number, variantId: number, quantity: number) => {
    const response = await apiClient.post(`/api/admin/products/${productId}/variants/${variantId}/inventory`, { quantity })
    return response.data
  },
  
  // Credits
  grantCredits: async (userId: number, amount: number, description: string) => {
    const response = await apiClient.post('/api/admin/credits/grant', {
      user_id: userId,
      amount,
      description,
    })
    return response.data
  },
  
  getUserBalance: async (userId: number) => {
    const response = await apiClient.get(`/api/admin/users/${userId}/balance`)
    return response.data
  },
  
  getUserLedger: async (userId: number): Promise<CreditLedger[]> => {
    const response = await apiClient.get(`/api/admin/users/${userId}/ledger`)
    return response.data
  },
  
  getUserOrders: async (userId: number): Promise<Order[]> => {
    const response = await apiClient.get(`/api/admin/users/${userId}/orders`)
    return response.data
  },
  
  // Users
  importUsers: async (users: any[]) => {
    const response = await apiClient.post('/api/admin/users/import', users)
    return response.data
  },
  
  getUsers: async (): Promise<User[]> => {
    const response = await apiClient.get('/api/admin/users')
    return response.data
  },
  
  // Orders
  getAllOrders: async (): Promise<Order[]> => {
    const response = await apiClient.get('/api/admin/orders')
    return response.data
  },
  
  getPendingOrders: async (): Promise<Order[]> => {
    const response = await apiClient.get('/api/admin/orders/pending')
    return response.data
  },
  
  approveOrder: async (orderId: number) => {
    const response = await apiClient.post(`/api/admin/orders/${orderId}/approve`)
    return response.data
  },
  
  rejectOrder: async (orderId: number, reason?: string) => {
    const response = await apiClient.post(`/api/admin/orders/${orderId}/reject`, null, {
      params: { reason }
    })
    return response.data
  },
  
  // Inventory Management
  getInventoryOverview: async () => {
    const response = await apiClient.get('/api/admin/inventory/overview')
    return response.data
  },
  
  getLowStockItems: async (threshold: number = 10) => {
    const response = await apiClient.get('/api/admin/inventory/low-stock', {
      params: { threshold }
    })
    return response.data
  },
  
  adjustInventory: async (variantId: number, adjustment: number, reason: string) => {
    const response = await apiClient.post('/api/admin/inventory/adjust', null, {
      params: { variant_id: variantId, adjustment, reason }
    })
    return response.data
  },
}

