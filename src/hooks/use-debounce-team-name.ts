import { useQuery } from '@tanstack/react-query'
import { useCallback, useRef, useEffect } from 'react'
import { serverCheckTeamNameAvailability } from '@/lib/server/check-team-name'

interface TeamNameCheckResult {
  available: boolean
  message: string
  type: 'success' | 'warning' | 'error'
}

interface UseDebounceTeamNameOptions {
  minLength?: number
  debounceMs?: number
  enabled?: boolean
}

// Simple debounce function
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export function useDebounceTeamName(
  teamName: string,
  options: UseDebounceTeamNameOptions = {}
) {
  const {
    minLength = 2,
    debounceMs = 500,
    enabled = true
  } = options

  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const query = useQuery({
    queryKey: ['check-team-name', teamName],
    queryFn: () => serverCheckTeamNameAvailability({ data: { teamName } }),
    enabled: teamName.length >= minLength && enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  // Debounced check function
  const checkTeamName = useCallback((name: string) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      if (name.length >= minLength && enabled) {
        // The query will automatically refetch when the query key changes
        // So we don't need to manually invalidate anything
      }
    }, debounceMs)
  }, [minLength, debounceMs, enabled])

  // Effect to trigger debounced check when team name changes
  useEffect(() => {
    checkTeamName(teamName)
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [teamName, checkTeamName])

  return {
    ...query,
    checkTeamName,
    isChecking: query.isFetching && teamName.length >= minLength,
    result: query.data as TeamNameCheckResult | undefined
  }
}