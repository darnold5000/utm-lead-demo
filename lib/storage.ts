import { normalizeLink, withContentPosts } from "@/lib/content-posts"
import type { DemoData } from "@/lib/types"

export const DEMO_STORAGE_KEY = "utm-lead-demo:v2"

export function readDemoState(): DemoData | null {
  try {
    const raw = localStorage.getItem(DEMO_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as DemoData
    if (!parsed || !Array.isArray(parsed.buckets) || !Array.isArray(parsed.leads)) return null
    if (!Array.isArray(parsed.arrivals) || typeof parsed.activeSessionId === "undefined") return null
    parsed.links = withContentPosts((Array.isArray(parsed.links) ? parsed.links : []).map(normalizeLink))
    return parsed
  } catch {
    return null
  }
}

export function writeDemoState(state: DemoData) {
  localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(state))
}
