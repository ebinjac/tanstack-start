// components/layout/tohub-layout.tsx

import { useState } from 'react'
import { TohubSidebar, TohubSidebarMobileButton } from './tohub-sidebar'
import { AuthProvider, useAuthContext } from '@/contexts/auth-context'
import { cn } from '@/lib/utils'

interface TohubLayoutProps {
  teamId: string
  children: React.ReactNode
}

function TohubLayoutContent({ teamId, children }: TohubLayoutProps) {
  const { teams } = useAuthContext()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const currentTeam = teams.find(team => team.id === teamId)

  if (!currentTeam) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Team Not Found</h1>
            <p className="text-gray-600">The team you're looking for doesn't exist or you don't have access.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex h-screen">
        <div className="absolute top-4 left-4 z-50 lg:hidden">
          <TohubSidebarMobileButton onClick={() => setIsMobileMenuOpen(true)} />
        </div>
        <TohubSidebar
          teamId={teamId}
          isMobileOpen={isMobileMenuOpen}
          onMobileOpenChange={setIsMobileMenuOpen}
        />

        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-4 py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

export function TohubLayout({ teamId, children }: TohubLayoutProps) {
  return (
    <AuthProvider>
      <TohubLayoutContent teamId={teamId}>
        {children}
      </TohubLayoutContent>
    </AuthProvider>
  )
}