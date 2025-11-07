import { useState, useEffect } from 'react'

export default function DemoPasswordGate({ children }: { children: React.ReactNode }) {
  const [password, setPassword] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [error, setError] = useState('')
  const [demoPassword, setDemoPassword] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Fetch demo password from API and check if already authenticated
  useEffect(() => {
    const demoAuth = localStorage.getItem('demo_auth')
    if (demoAuth === 'authenticated') {
      setIsAuthenticated(true)
      setIsLoading(false)
      return
    }

    // Fetch demo password from backend
    const fetchDemoPassword = async () => {
      try {
        const API_BASE_URL = import.meta.env.VITE_API_URL || ''
        const response = await fetch(`${API_BASE_URL}/api/demo/password`)
        const data = await response.json()
        setDemoPassword(data.password)
      } catch (err) {
        console.error('Failed to fetch demo password:', err)
        setDemoPassword('capyx2024') // Fallback password
      } finally {
        setIsLoading(false)
      }
    }

    fetchDemoPassword()
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!demoPassword) {
      setError('Loading password configuration...')
      return
    }
    
    if (password === demoPassword) {
      localStorage.setItem('demo_auth', 'authenticated')
      setIsAuthenticated(true)
      setError('')
    } else {
      setError('Incorrect password')
      setPassword('')
    }
  }

  if (isAuthenticated) {
    return <>{children}</>
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-capyx-400 to-capyx-600 flex items-center justify-center">
        <div className="text-gray-900 text-xl font-semibold">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-capyx-400 to-capyx-600 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-capyx-400 to-capyx-600 rounded-full mb-4">
            <svg className="w-10 h-10 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            <span className="text-capyx-600">Capyx</span> Perks
          </h1>
          <p className="text-gray-600 font-medium">Demo Access Required</p>
          <p className="text-sm text-gray-500 mt-2">
            This is a demo/test environment for company personnel only
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Access Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setError('')
              }}
              placeholder="Enter demo password"
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                error 
                  ? 'border-red-500 focus:ring-red-500' 
                  : 'border-gray-300 focus:ring-capyx-500 focus:border-capyx-500'
              }`}
              autoFocus
            />
            {error && (
              <p className="mt-2 text-sm text-red-600 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </p>
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-capyx-500 to-capyx-600 hover:from-capyx-600 hover:to-capyx-700 text-gray-900 font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl"
          >
            Access Demo
          </button>
        </form>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-600 text-center">
            <svg className="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            For access, please contact your IT administrator
          </p>
        </div>
      </div>
    </div>
  )
}

