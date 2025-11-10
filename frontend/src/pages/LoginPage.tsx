import { useState, useEffect } from 'react'
import { useAuthStore } from '../store/authStore'
import { useNavigate } from 'react-router-dom'
import { authApi, userApi } from '../api/api'
import toast from 'react-hot-toast'

interface MockUser {
  email: string
  name: string
  role: string
  password: string
}

export default function LoginPage() {
  const navigate = useNavigate()
  const { setAuth, isAuthenticated } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [mockUsers, setMockUsers] = useState<MockUser[]>([])
  const [showMockUsers, setShowMockUsers] = useState(false)

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/')
    }

    // Fetch mock users if in development
    authApi.getMockUsers()
      .then((users) => {
        if (users && users.length > 0) {
          setMockUsers(users)
        }
      })
      .catch(() => {
        console.log('No mock users available (production mode)')
      })
  }, [isAuthenticated, navigate])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !password) {
      toast.error('Please enter email and password')
      return
    }

    setLoading(true)

    try {
      const data = await authApi.login(email, password)
      localStorage.setItem('access_token', data.access_token)
      
      // Fetch user data
      const userData = await userApi.getMe()
      setAuth(data.access_token, userData)
      
      toast.success('Login successful!')
      navigate('/')
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Invalid email or password')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleQuickLogin = (user: MockUser) => {
    setEmail(user.email)
    setPassword(user.password)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">CapyxPerks</h1>
          <p className="text-gray-600">Employee Benefits Platform</p>
          {mockUsers.length > 0 && (
            <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 text-sm">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Development Mode
            </div>
          )}
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Work Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-capyx-500 focus:border-capyx-500"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-capyx-500 focus:border-capyx-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-capyx-500 hover:bg-capyx-600 text-gray-900 font-semibold py-3 px-6 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {mockUsers.length > 0 && (
          <div className="mt-6">
            <button
              onClick={() => setShowMockUsers(!showMockUsers)}
              className="w-full text-sm text-gray-600 hover:text-gray-900 flex items-center justify-center"
            >
              {showMockUsers ? '▲' : '▼'} {showMockUsers ? 'Hide' : 'Show'} Mock Accounts
            </button>
            
            {showMockUsers && (
              <div className="mt-4 space-y-2">
                <p className="text-xs text-gray-500 text-center mb-2">Click to auto-fill credentials:</p>
                {mockUsers.map((user) => (
                  <button
                    key={user.email}
                    onClick={() => handleQuickLogin(user)}
                    type="button"
                    className="w-full text-left p-3 border border-gray-200 rounded-lg hover:border-capyx-500 hover:bg-capyx-50 transition-all duration-200"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900 text-sm">{user.name}</div>
                        <div className="text-xs text-gray-500">{user.email}</div>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                        user.role === 'senior' ? 'bg-green-100 text-green-800' :
                        user.role === 'intern' ? 'bg-gray-100 text-gray-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {user.role}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>
            {mockUsers.length > 0 
              ? 'Development mode - Mock accounts available'
              : 'Secure authentication via Microsoft Azure AD'
            }
          </p>
        </div>
      </div>
    </div>
  )
}

