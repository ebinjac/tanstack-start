// hooks/use-flagging.ts

import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  flagEntry,
  unflagEntry,
  bulkFlagEntries,
  getFlaggedEntries,
  getFlaggedEntriesCount,
  getFlaggingStatistics,
  getFlaggingHistory
} from '@/lib/server/flagging'

interface FlagEntryOptions {
  entryId: string
  priority: 'normal' | 'important' | 'flagged' | 'needs_action' | 'long_pending'
  comment?: string
}

interface BulkFlagEntriesOptions {
  entryIds: string[]
  priority: 'normal' | 'important' | 'flagged' | 'needs_action' | 'long_pending'
  comment?: string
}

interface GetFlaggedEntriesOptions {
  teamId: string
  applicationId?: string
  subApplicationId?: string
  priority?: 'normal' | 'important' | 'flagged' | 'needs_action' | 'long_pending'
}

interface GetFlaggingStatisticsOptions {
  teamId: string
  applicationId?: string
  subApplicationId?: string
  timeRange?: '7days' | '30days' | '90days'
}

export function useFlagging() {
  const queryClient = useQueryClient()
  const [selectedEntries, setSelectedEntries] = useState<string[]>([])

  // Mutations
  const flagEntryMutation = useMutation({
    mutationFn: (options: FlagEntryOptions) => flagEntry({ data: options }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flagged-entries'] })
      queryClient.invalidateQueries({ queryKey: ['flagged-entries-count'] })
      queryClient.invalidateQueries({ queryKey: ['flagging-statistics'] })
    },
  })

  const unflagEntryMutation = useMutation({
    mutationFn: (entryId: string) => unflagEntry({ data: { entryId } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flagged-entries'] })
      queryClient.invalidateQueries({ queryKey: ['flagged-entries-count'] })
      queryClient.invalidateQueries({ queryKey: ['flagging-statistics'] })
    },
  })

  const bulkFlagEntriesMutation = useMutation({
    mutationFn: (options: BulkFlagEntriesOptions) => bulkFlagEntries({ data: options }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flagged-entries'] })
      queryClient.invalidateQueries({ queryKey: ['flagged-entries-count'] })
      queryClient.invalidateQueries({ queryKey: ['flagging-statistics'] })
      setSelectedEntries([])
    },
  })

  // Flag an entry
  const handleFlagEntry = useCallback((options: FlagEntryOptions) => {
    return flagEntryMutation.mutateAsync(options)
  }, [flagEntryMutation])

  // Unflag an entry
  const handleUnflagEntry = useCallback((entryId: string) => {
    return unflagEntryMutation.mutateAsync(entryId)
  }, [unflagEntryMutation])

  // Bulk flag entries
  const handleBulkFlagEntries = useCallback((options: BulkFlagEntriesOptions) => {
    return bulkFlagEntriesMutation.mutateAsync(options)
  }, [bulkFlagEntriesMutation])

  // Toggle entry selection
  const toggleEntrySelection = useCallback((entryId: string) => {
    setSelectedEntries(prev => {
      if (prev.includes(entryId)) {
        return prev.filter(id => id !== entryId)
      } else {
        return [...prev, entryId]
      }
    })
  }, [])

  // Select all entries
  const selectAllEntries = useCallback((entryIds: string[]) => {
    setSelectedEntries(entryIds)
  }, [])

  // Clear selected entries
  const clearSelectedEntries = useCallback(() => {
    setSelectedEntries([])
  }, [])

  return {
    // Mutations
    flagEntry: handleFlagEntry,
    unflagEntry: handleUnflagEntry,
    bulkFlagEntries: handleBulkFlagEntries,
    
    // Mutation states
    isFlaggingEntry: flagEntryMutation.isPending,
    isUnflaggingEntry: unflagEntryMutation.isPending,
    isBulkFlagging: bulkFlagEntriesMutation.isPending,
    
    // Selection state
    selectedEntries,
    toggleEntrySelection,
    selectAllEntries,
    clearSelectedEntries
  }
}

// Hook for getting flagged entries
export function useFlaggedEntries(options: GetFlaggedEntriesOptions) {
  const { data: flaggedEntriesData, isLoading, refetch } = useQuery({
    queryKey: ['flagged-entries', options],
    queryFn: () => getFlaggedEntries({ data: options }),
    staleTime: 2 * 60 * 1000, // 2 minutes
  })

  return {
    flaggedEntries: flaggedEntriesData?.data || [],
    isLoading,
    refetch
  }
}

// Hook for getting flagged entries count
export function useFlaggedEntriesCount(teamId: string, applicationId?: string, subApplicationId?: string) {
  const { data: countData, isLoading, refetch } = useQuery({
    queryKey: ['flagged-entries-count', teamId, applicationId, subApplicationId],
    queryFn: () => getFlaggedEntriesCount({
      data: { teamId, applicationId, subApplicationId }
    }),
    staleTime: 2 * 60 * 1000, // 2 minutes
  })

  return {
    flaggedCounts: countData?.data || [],
    isLoading,
    refetch
  }
}

// Hook for getting flagging statistics
export function useFlaggingStatistics(options: GetFlaggingStatisticsOptions) {
  const { data: statisticsData, isLoading, refetch } = useQuery({
    queryKey: ['flagging-statistics', options],
    queryFn: () => getFlaggingStatistics({ data: options }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  return {
    statistics: statisticsData?.data,
    isLoading,
    refetch
  }
}

// Hook for getting flagging history for an entry
export function useFlaggingHistory(entryId: string) {
  const { data: historyData, isLoading, refetch } = useQuery({
    queryKey: ['flagging-history', entryId],
    queryFn: () => getFlaggingHistory({ data: { entryId } }),
    staleTime: 10 * 60 * 1000, // 10 minutes
  })

  return {
    history: historyData?.data,
    isLoading,
    refetch
  }
}

// Hook for flagging entries by type
export function useFlaggingByType(options: GetFlaggedEntriesOptions) {
  const { data: flaggedEntriesData, isLoading, refetch } = useQuery({
    queryKey: ['flagged-entries-by-type', options],
    queryFn: () => getFlaggedEntries({ data: options }),
    staleTime: 2 * 60 * 1000, // 2 minutes
  })

  // Group flagged entries by type
  const flaggedEntriesByType = flaggedEntriesData?.data?.reduce((acc: any, entry: any) => {
    if (!acc[entry.entryType]) {
      acc[entry.entryType] = []
    }
    acc[entry.entryType].push(entry)
    return acc
  }, {}) || {}

  return {
    flaggedEntriesByType,
    isLoading,
    refetch
  }
}

// Hook for flagging entries by priority
export function useFlaggingByPriority(options: GetFlaggedEntriesOptions) {
  const { data: flaggedEntriesData, isLoading, refetch } = useQuery({
    queryKey: ['flagged-entries-by-priority', options],
    queryFn: () => getFlaggedEntries({ data: options }),
    staleTime: 2 * 60 * 1000, // 2 minutes
  })

  // Group flagged entries by priority
  const flaggedEntriesByPriority = flaggedEntriesData?.data?.reduce((acc: any, entry: any) => {
    if (!acc[entry.priority]) {
      acc[entry.priority] = []
    }
    acc[entry.priority].push(entry)
    return acc
  }, {}) || {}

  return {
    flaggedEntriesByPriority,
    isLoading,
    refetch
  }
}

// Hook for flagging entries by date
export function useFlaggingByDate(options: GetFlaggedEntriesOptions) {
  const { data: flaggedEntriesData, isLoading, refetch } = useQuery({
    queryKey: ['flagged-entries-by-date', options],
    queryFn: () => getFlaggedEntries({ data: options }),
    staleTime: 2 * 60 * 1000, // 2 minutes
  })

  // Group flagged entries by date
  const flaggedEntriesByDate = flaggedEntriesData?.data?.reduce((acc: any, entry: any) => {
    const date = new Date(entry.updatedAt).toISOString().split('T')[0]
    if (!acc[date]) {
      acc[date] = []
    }
    acc[date].push(entry)
    return acc
  }, {}) || {}

  return {
    flaggedEntriesByDate,
    isLoading,
    refetch
  }
}

// Hook for flagging entries by age
export function useFlaggingByAge(options: GetFlaggedEntriesOptions) {
  const { data: flaggedEntriesData, isLoading, refetch } = useQuery({
    queryKey: ['flagged-entries-by-age', options],
    queryFn: () => getFlaggedEntries({ data: options }),
    staleTime: 2 * 60 * 1000, // 2 minutes
  })

  // Group flagged entries by age (in hours)
  const flaggedEntriesByAge = flaggedEntriesData?.data?.reduce((acc: any, entry: any) => {
    const now = new Date()
    const updatedAt = new Date(entry.updatedAt)
    const ageInHours = Math.floor((now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60))
    
    let ageGroup: string
    if (ageInHours < 1) {
      ageGroup = 'less_than_1_hour'
    } else if (ageInHours < 24) {
      ageGroup = 'less_than_1_day'
    } else if (ageInHours < 72) {
      ageGroup = 'less_than_3_days'
    } else if (ageInHours < 168) {
      ageGroup = 'less_than_1_week'
    } else {
      ageGroup = 'more_than_1_week'
    }
    
    if (!acc[ageGroup]) {
      acc[ageGroup] = []
    }
    acc[ageGroup].push(entry)
    return acc
  }, {}) || {}

  return {
    flaggedEntriesByAge,
    isLoading,
    refetch
  }
}

// Hook for flagging entries by status
export function useFlaggingByStatus(options: GetFlaggedEntriesOptions) {
  const { data: flaggedEntriesData, isLoading, refetch } = useQuery({
    queryKey: ['flagged-entries-by-status', options],
    queryFn: () => getFlaggedEntries({ data: options }),
    staleTime: 2 * 60 * 1000, // 2 minutes
  })

  // Group flagged entries by status
  const flaggedEntriesByStatus = flaggedEntriesData?.data?.reduce((acc: any, entry: any) => {
    const status = entry.priority
    if (!acc[status]) {
      acc[status] = []
    }
    acc[status].push(entry)
    return acc
  }, {}) || {}

  return {
    flaggedEntriesByStatus,
    isLoading,
    refetch
  }
}