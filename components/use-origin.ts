"use client"

import { useSyncExternalStore } from "react"

const fallbackOrigin = "https://demo.hiresignalworks.com"

export function useOrigin() {
  return useSyncExternalStore(
    () => () => {},
    () => window.location.origin,
    () => fallbackOrigin,
  )
}
