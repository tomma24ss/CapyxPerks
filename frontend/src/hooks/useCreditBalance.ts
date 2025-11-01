import { useQuery } from '@tanstack/react-query'
import { creditApi } from '../api/api'

export function useCreditBalance() {
  return useQuery({
    queryKey: ['credits', 'balance'],
    queryFn: () => creditApi.getBalance(),
    refetchInterval: 10000, // Refetch every 10 seconds
  })
}

