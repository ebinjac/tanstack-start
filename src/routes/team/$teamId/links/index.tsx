import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/team/$teamId/links/')({
  beforeLoad: ({ params }) => {
    // Redirect to the all links page
    throw redirect({
      to: '/team/$teamId/links/all-links',
      params: { teamId: params.teamId }
    })
  },
})