import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useCreditBalance } from '../hooks/useCreditBalance'
import { useCartStore } from '../store/cartStore'
import { useState } from 'react'

export default function Navbar() {
  const { logout, user } = useAuthStore()
  const { data: balance } = useCreditBalance()
  const { items } = useCartStore()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  const cartItemCount = items.reduce((total, item) => total + item.quantity, 0)

  const handleLogout = () => {
    logout()
    navigate('/login')
    setMobileMenuOpen(false)
  }

  const closeMobileMenu = () => {
    setMobileMenuOpen(false)
  }

  return (
    <nav className="bg-capyx-500 text-black fixed w-full top-0 z-50 shadow-lg">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center" onClick={closeMobileMenu}>
            <img src="/images/capyxperks.png" alt="Capyx Perks" className="h-8 w-auto" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-6">
            <Link to="/" className="hover:text-gray-700 transition-colors font-medium">
              Home
            </Link>
            {user?.role === 'admin' && (
              <Link to="/admin" className="hover:text-gray-700 transition-colors font-medium">
                Admin
              </Link>
            )}
            <div className="flex items-center space-x-2 bg-black/10 px-4 py-2 rounded-lg border border-black/30">
              <svg className="w-5 h-5 text-black" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="font-semibold text-black">{balance?.balance.toFixed(2) || '0.00'}</span>
              <span className="text-gray-700 text-sm">CapyCoins</span>
            </div>
            <Link to="/cart" className="relative hover:text-gray-700 transition-colors flex items-center gap-2 font-medium">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="font-medium">Cart</span>
              {cartItemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-black text-capyx-500 text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                  {cartItemCount}
                </span>
              )}
            </Link>
            <Link to="/profile" className="hover:text-gray-700 transition-colors font-medium">
              Profile
            </Link>
            <button onClick={handleLogout} className="hover:text-gray-700 transition-colors font-medium">
              Logout
            </button>
          </div>

          {/* Mobile: Credits & Cart & Hamburger */}
          <div className="flex lg:hidden items-center space-x-3">
            {/* Credits Badge - Mobile */}
            <div className="flex items-center space-x-1 bg-black/10 px-2 py-1 rounded-lg border border-black/30">
              <svg className="w-4 h-4 text-black" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="font-semibold text-black text-sm">{balance?.balance.toFixed(0) || '0'}</span>
            </div>

            {/* Cart Icon - Mobile */}
            <Link to="/cart" className="relative hover:text-gray-700 transition-colors" onClick={closeMobileMenu}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {cartItemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-black text-capyx-500 text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                  {cartItemCount}
                </span>
              )}
            </Link>

            {/* Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 hover:bg-black/10 rounded-lg transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden mt-4 pb-4 border-t border-black/30 pt-4">
            <div className="flex flex-col space-y-3">
              <Link
                to="/"
                className="hover:text-gray-700 transition-colors py-2 px-3 hover:bg-black/10 rounded-lg font-medium"
                onClick={closeMobileMenu}
              >
                Home
              </Link>
              {user?.role === 'admin' && (
                <Link
                  to="/admin"
                  className="hover:text-gray-700 transition-colors py-2 px-3 hover:bg-black/10 rounded-lg font-medium"
                  onClick={closeMobileMenu}
                >
                  Admin
                </Link>
              )}
              <Link
                to="/profile"
                className="hover:text-gray-700 transition-colors py-2 px-3 hover:bg-black/10 rounded-lg font-medium"
                onClick={closeMobileMenu}
              >
                Profile
              </Link>
              <button
                onClick={handleLogout}
                className="text-left hover:text-gray-700 transition-colors py-2 px-3 hover:bg-black/10 rounded-lg font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

