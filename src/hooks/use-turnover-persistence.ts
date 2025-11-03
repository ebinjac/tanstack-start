// hooks/use-turnover-persistence.ts

import { useState, useEffect, useCallback, useRef } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { 
  saveTurnoverDraft,
  getTurnoverDraft,
  getTeamDrafts,
  deleteTurnoverDraft,
  autoSaveTurnoverDraft,
  getPrefillData,
  getTurnoverHistoryForPrefill
} from '@/lib/server/persistence'

interface TurnoverData {
  teamId: string
  applicationId?: string | null
  subApplicationId?: string | null
  handoverFrom: string
  handoverTo: string
  status: 'draft' | 'active' | 'completed' | 'archived'
  entries: any[]
}

interface PrefillOptions {
  teamId: string
  applicationId?: string
  subApplicationId?: string
  handoverFrom?: string
  handoverTo?: string
}

interface UseTurnoverPersistenceOptions {
  teamId: string
  applicationId?: string
  subApplicationId?: string
  autoSaveInterval?: number // in milliseconds, default to 30 seconds
  enableAutoSave?: boolean
}

export function useTurnoverPersistence({
  teamId,
  applicationId,
  subApplicationId,
  autoSaveInterval = 30000,
  enableAutoSave = true
}: UseTurnoverPersistenceOptions) {
  const [isDirty, setIsDirty] = useState(false)
  const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null)
  const [isAutoSaving, setIsAutoSaving] = useState(false)
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Query for draft data
  const { data: draftData, isLoading: isLoadingDraft, refetch: refetchDraft } = useQuery({
    queryKey: ['turnover-draft', teamId, applicationId, subApplicationId],
    queryFn: () => getTurnoverDraft({
      data: { teamId, applicationId, subApplicationId }
    }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  // Query for prefill data
  const { data: prefillData, isLoading: isLoadingPrefill, refetch: refetchPrefill } = useQuery({
    queryKey: ['turnover-prefill', teamId, applicationId, subApplicationId],
    queryFn: () => getPrefillData({
      data: { teamId, applicationId, subApplicationId }
    }),
    staleTime: 10 * 60 * 1000, // 10 minutes
    enabled: !draftData?.data // Only fetch prefill data if no draft exists
  })

  // Mutations
  const saveDraftMutation = useMutation({
    mutationFn: saveTurnoverDraft,
    onSuccess: () => {
      setIsDirty(false)
      setLastSaveTime(new Date())
      refetchDraft()
    },
  })

  const autoSaveMutation = useMutation({
    mutationFn: autoSaveTurnoverDraft,
    onSuccess: () => {
      setIsDirty(false)
      setLastSaveTime(new Date())
      refetchDraft()
    },
  })

  const deleteDraftMutation = useMutation({
    mutationFn: deleteTurnoverDraft,
    onSuccess: () => {
      refetchDraft()
    },
  })

  // Save draft function
  const saveDraft = useCallback((data: TurnoverData) => {
    return saveDraftMutation.mutateAsync({
      data: {
        teamId: data.teamId,
        applicationId: data.applicationId || undefined,
        subApplicationId: data.subApplicationId || undefined,
        handoverFrom: data.handoverFrom,
        handoverTo: data.handoverTo,
        status: data.status,
        entries: data.entries
      }
    })
  }, [saveDraftMutation])

  // Auto-save function
  const autoSave = useCallback((data: TurnoverData) => {
    if (!enableAutoSave || !isDirty) return

    setIsAutoSaving(true)
    return autoSaveMutation.mutateAsync({
      data: {
        teamId: data.teamId,
        applicationId: data.applicationId || undefined,
        subApplicationId: data.subApplicationId || undefined,
        handoverFrom: data.handoverFrom,
        handoverTo: data.handoverTo,
        status: data.status,
        entries: data.entries
      }
    }).finally(() => {
      setIsAutoSaving(false)
    })
  }, [enableAutoSave, isDirty, autoSaveMutation])

  // Mark data as dirty
  const markAsDirty = useCallback(() => {
    setIsDirty(true)
  }, [])

  // Reset dirty state
  const resetDirty = useCallback(() => {
    setIsDirty(false)
  }, [])

  // Delete draft function
  const deleteDraft = useCallback((draftId: string) => {
    return deleteDraftMutation.mutateAsync({
      data: { draftId }
    })
  }, [deleteDraftMutation])

  // Get initial data (from draft or prefill)
  const getInitialData = useCallback((): TurnoverData | null => {
    if (draftData?.data) {
      const draft = draftData.data as any
      return {
        teamId: draft.teamId,
        applicationId: draft.applicationId || undefined,
        subApplicationId: draft.subApplicationId || undefined,
        handoverFrom: draft.handoverFrom,
        handoverTo: draft.handoverTo,
        status: draft.status,
        entries: draft.entries
      }
    }
    
    if (prefillData?.data) {
      const prefill = prefillData.data as any
      if (prefill.source === 'previous' || prefill.source === 'draft') {
        return {
          teamId: prefill.turnoverData.teamId,
          applicationId: prefill.turnoverData.applicationId || undefined,
          subApplicationId: prefill.turnoverData.subApplicationId || undefined,
          handoverFrom: prefill.turnoverData.handoverFrom,
          handoverTo: prefill.turnoverData.handoverTo,
          status: prefill.turnoverData.status,
          entries: prefill.turnoverData.entries
        }
      } else {
        return {
          teamId: prefill.turnoverData.teamId || teamId,
          applicationId: prefill.turnoverData.applicationId || undefined,
          subApplicationId: prefill.turnoverData.subApplicationId || undefined,
          handoverFrom: prefill.turnoverData.handoverFrom || '',
          handoverTo: prefill.turnoverData.handoverTo || '',
          status: prefill.turnoverData.status || 'draft',
          entries: prefill.turnoverData.entries || []
        }
      }
    }
    
    return null
  }, [draftData?.data, prefillData?.data, teamId])

  // Set up auto-save timer
  useEffect(() => {
    if (!enableAutoSave) return

    // Clear existing timer
    if (autoSaveTimerRef.current) {
      clearInterval(autoSaveTimerRef.current)
    }

    // Set up new timer
    autoSaveTimerRef.current = setInterval(() => {
      if (isDirty && !isAutoSaving) {
        // We'll call autoSave from the component when data changes
        // This timer just checks if we need to auto-save
      }
    }, autoSaveInterval)

    // Clean up timer on unmount
    return () => {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current)
      }
    }
  }, [enableAutoSave, autoSaveInterval, isDirty, isAutoSaving])

  // Get prefill options
  const getPrefillOptions = useCallback((): PrefillOptions => {
    return {
      teamId,
      applicationId,
      subApplicationId
    }
  }, [teamId, applicationId, subApplicationId])

  return {
    // Data
    draftData: draftData?.data,
    prefillData: prefillData?.data,
    
    // Loading states
    isLoadingDraft,
    isLoadingPrefill,
    
    // Mutation states
    isSavingDraft: saveDraftMutation.isPending,
    isAutoSaving,
    isDeletingDraft: deleteDraftMutation.isPending,
    
    // State
    isDirty,
    lastSaveTime,
    
    // Functions
    saveDraft,
    autoSave,
    markAsDirty,
    resetDirty,
    deleteDraft,
    getInitialData,
    getPrefillOptions,
    
    // Refetch functions
    refetchDraft,
    refetchPrefill
  }
}

// Hook for managing all team drafts
export function useTeamDrafts(teamId: string) {
  const { data: draftsData, isLoading, refetch } = useQuery({
    queryKey: ['team-drafts', teamId],
    queryFn: () => getTeamDrafts({ data: teamId }),
    staleTime: 2 * 60 * 1000, // 2 minutes
  })

  const deleteDraftMutation = useMutation({
    mutationFn: deleteTurnoverDraft,
    onSuccess: () => {
      refetch()
    },
  })

  const drafts = draftsData?.data || []

  const deleteDraft = useCallback((draftId: string) => {
    return deleteDraftMutation.mutateAsync({
      data: { draftId }
    })
  }, [deleteDraftMutation])

  return {
    drafts,
    isLoading,
    isDeletingDraft: deleteDraftMutation.isPending,
    deleteDraft,
    refetch
  }
}

// Hook for getting prefill suggestions
export function usePrefillSuggestions(options: PrefillOptions) {
  const { data: prefillData, isLoading, refetch } = useQuery({
    queryKey: ['turnover-prefill', options],
    queryFn: () => getPrefillData({ data: options }),
    staleTime: 10 * 60 * 1000, // 10 minutes
  })

  const { data: historyData, isLoading: isLoadingHistory } = useQuery({
    queryKey: ['turnover-history-prefill', options],
    queryFn: () => getTurnoverHistoryForPrefill({ data: options }),
    staleTime: 15 * 60 * 1000, // 15 minutes
  })

  return {
    prefillData: prefillData?.data,
    historyData: historyData?.data || [],
    isLoading: isLoading || isLoadingHistory,
    refetch
  }
}