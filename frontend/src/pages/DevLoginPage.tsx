import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { authApi, userApi } from '../api/api'
import toast from 'react-hot-toast'

interface DevUser {
  email: string
  name: string
  role: string
}

export default function DevLoginPage() {
  const navigate = useNavigate()
  const { setAuth, isAuthenticated } = useAuthStore()
  const [existingUsers, setExistingUsers] = useState<DevUser[]>([])
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/')
    }
    
    // Fetch existing users for quick selection
    authApi.getDevUsers()
      .then(setExistingUsers)
      .catch((error) => {
        console.error('Failed to fetch users:', error)
      })
  }, [isAuthenticated, navigate])

  const handleDevLogin = async (selectedEmail?: string, selectedName?: string) => {
    setLoading(true)
    const loginEmail = selectedEmail || email
    const loginName = selectedName || name

    if (!loginEmail) {
      toast.error('Email is required')
      setLoading(false)
      return
    }

    try {
      const data = await authApi.devLogin(loginEmail, loginName)
      // Store the token first so subsequent API calls can use it
      localStorage.setItem('access_token', data.access_token)
      
      // Fetch user data to get role and other info
      const userData = await userApi.getMe()
      setAuth(data.access_token, userData)
      
      toast.success(`Logged in as ${loginEmail}`)
      navigate('/')
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Login failed')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleQuickLogin = (user: DevUser) => {
    handleDevLogin(user.email, user.name)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('/images/capyx_banner.png')] bg-cover bg-center opacity-10"></div>
      
      <div className="relative max-w-2xl w-full bg-gray-800 rounded-2xl shadow-2xl p-8 border border-capyx-500/30">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img src="/images/capyx.png" alt="Capyx" className="h-16" />
          </div>
          <h1 className="text-4xl font-bold text-capyx-400 mb-2">Perks</h1>
          <p className="text-gray-300">Development Login</p>
          <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full bg-capyx-500/20 text-capyx-400 text-sm border border-capyx-500/30">
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            Development Mode
          </div>
        </div>

        {existingUsers.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-capyx-400 mb-4">Quick Login (Existing Users)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {existingUsers.map((user) => (
                <button
                  key={user.email}
                  onClick={() => handleQuickLogin(user)}
                  disabled={loading}
                  className="text-left p-4 border-2 border-gray-700 rounded-lg hover:border-capyx-500 hover:bg-gray-700/50 transition-all duration-200 disabled:opacity-50 group"
                >
                  <div className="font-semibold text-white group-hover:text-capyx-400">{user.name}</div>
                  <div className="text-sm text-gray-400">{user.email}</div>
                  <div className="mt-1">
                    <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                      user.role === 'admin' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                      user.role === 'senior' ? 'bg-green-500/20 text-green-300 border border-green-500/30' :
                      user.role === 'intern' ? 'bg-gray-500/20 text-gray-300 border border-gray-500/30' :
                      'bg-capyx-500/20 text-capyx-300 border border-capyx-500/30'
                    }`}>
                      {user.role}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="border-t border-gray-700 pt-8">
          <h2 className="text-lg font-semibold text-capyx-400 mb-4">Create New User</h2>
          <form onSubmit={(e) => { e.preventDefault(); handleDevLogin(); }} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.name@company.com"
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-capyx-500 focus:border-capyx-500 text-white placeholder-gray-400"
                required
              />
            </div>

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                Full Name (Optional)
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your Name"
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-capyx-500 focus:border-capyx-500 text-white placeholder-gray-400"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-capyx-500 hover:bg-capyx-600 text-gray-900 font-semibold py-3 px-6 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-capyx-500/20"
            >
              {loading ? 'Logging in...' : 'Login / Create Account'}
            </button>
          </form>
        </div>

        <div className="mt-6 text-center text-sm text-gray-400">
          <p className="mb-2">⚠️ This is for development only</p>
          <p>No password required • New users get 200 credits</p>
        </div>
      </div>
    </div>
  )
}

