'use client'

import { AppProgressBar as ProgressBar } from 'next-nprogress-bar'

export function NavigationProgressBar() {
  return (
    <ProgressBar
      height="3px"
      color="hsl(var(--primary))"
      options={{ showSpinner: false, trickleSpeed: 200 }}
      shallowRouting
    />
  )
}
