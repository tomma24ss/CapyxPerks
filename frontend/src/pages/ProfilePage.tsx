import { useQuery } from '@tanstack/react-query'
import { userApi, creditApi } from '../api/api'
import { useCreditBalance } from '../hooks/useCreditBalance'

export default function ProfilePage() {
  const { data: user } = useQuery({
    queryKey: ['user', 'me'],
    queryFn: () => userApi.getMe(),
  })

  const { data: balance } = useCreditBalance()
  
  const { data: ledger } = useQuery({
    queryKey: ['credits', 'ledger'],
    queryFn: () => creditApi.getLedger(),
  })

  if (!user) {
    return <div className="container mx-auto px-4 py-8">Loading...</div>
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl md:text-3xl font-bold mb-6">My Profile</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
          <h2 className="text-lg md:text-xl font-semibold mb-4">Personal Information</h2>
          <div className="space-y-3">
            <div>
              <span className="text-gray-600 text-sm">Name:</span>
              <p className="font-semibold">{user.name}</p>
            </div>
            <div>
              <span className="text-gray-600 text-sm">Email:</span>
              <p className="font-semibold break-words">{user.email}</p>
            </div>
            <div>
              <span className="text-gray-600 text-sm">Role:</span>
              <p className="font-semibold capitalize">{user.role}</p>
            </div>
            <div>
              <span className="text-gray-600 text-sm">Start Date:</span>
              <p className="font-semibold">{new Date(user.start_date).toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
          <h2 className="text-lg md:text-xl font-semibold mb-4">CapyCoin Balance</h2>
          <div className="text-center py-4">
            <p className="text-3xl md:text-4xl font-bold text-capyx-600 mb-2">
              {balance?.balance.toFixed(2) || '0.00'}
            </p>
            <p className="text-gray-600 text-sm md:text-base">CapyCoins Available</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mt-6">
        <h2 className="text-lg md:text-xl font-semibold mb-4">CapyCoin Ledger</h2>
        {ledger && ledger.length > 0 ? (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Date</th>
                    <th className="text-left py-2">Type</th>
                    <th className="text-left py-2">Amount</th>
                    <th className="text-left py-2">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {ledger.map((entry) => (
                    <tr key={entry.id} className="border-b">
                      <td className="py-2 text-sm">
                        {new Date(entry.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-2">
                        <span
                          className={`capitalize px-2 py-1 rounded text-xs ${
                            entry.credit_type === 'grant'
                              ? 'bg-green-100 text-green-800'
                              : entry.credit_type === 'debit'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {entry.credit_type}
                        </span>
                      </td>
                      <td className={`py-2 font-semibold ${entry.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {entry.amount > 0 ? '+' : ''}
                        {entry.amount.toFixed(2)}
                      </td>
                      <td className="py-2 text-sm text-gray-600">{entry.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
              {ledger.map((entry) => (
                <div key={entry.id} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex justify-between items-start mb-2">
                    <span
                      className={`capitalize px-2 py-1 rounded text-xs font-medium ${
                        entry.credit_type === 'grant'
                          ? 'bg-green-100 text-green-800'
                          : entry.credit_type === 'debit'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {entry.credit_type}
                    </span>
                    <span className={`font-bold text-lg ${entry.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {entry.amount > 0 ? '+' : ''}
                      {entry.amount.toFixed(2)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">{entry.description}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(entry.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="text-gray-500 text-center py-4">No ledger entries yet</p>
        )}
      </div>
    </div>
  )
}

