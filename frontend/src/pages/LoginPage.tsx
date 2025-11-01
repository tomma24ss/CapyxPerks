import { useEffect } from 'react'
import { useAuthStore } from '../store/authStore'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { authApi } from '../api/api'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { setAuth, isAuthenticated } = useAuthStore()
  const code = searchParams.get('code')

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/')
    }

    if (code) {
      // Handle Azure AD callback
      authApi.callback(code)
        .then((data) => {
          setAuth(data.access_token, {})
          toast.success('Login successful!')
          navigate('/')
        })
        .catch((error) => {
          toast.error('Login failed')
          console.error(error)
        })
    }
  }, [code, isAuthenticated, navigate, setAuth])

  const handleLogin = async () => {
    try {
      const authUrl = await authApi.getAzureLoginUrl()
      window.location.href = authUrl
    } catch (error) {
      toast.error('Failed to initiate login')
      console.error(error)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">CapyxPerks</h1>
          <p className="text-gray-600">Employee Benefits Platform</p>
        </div>

        <div className="space-y-6">
          <div className="text-center">
            <p className="text-gray-700 mb-4">Login with your work email to access company perks</p>
          </div>

          <button
            onClick={handleLogin}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 flex items-center justify-center space-x-2"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm3 1h6v4H7V5zm6 6H7v2h6v-2z"
                clipRule="evenodd"
              />
            </svg>
            <span>Sign in with Azure AD</span>
          </button>

          <div className="text-center text-sm text-gray-500">
            <p>Secure authentication via Microsoft Azure Active Directory</p>
          </div>
        </div>
      </div>
    </div>
  )
}

