"use client"

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import {
  convertNextLead,
  createLead,
  markJourney,
  recordArrival,
  saveTrackedLink,
  selectView,
  setLeadStatus,
  setLeadValue,
  simulateLead,
  simulateVisit,
  withNotice,
} from "@/lib/demo-actions"
import { getCampaign, isCampaignId } from "@/lib/campaigns"
import { createInitialState } from "@/lib/seed"
import { DEMO_STORAGE_KEY, readDemoState, writeDemoState } from "@/lib/storage"
import type {
  Arrival,
  DemoData,
  JourneyStage,
  LeadStatus,
  Source,
  TrackedLink,
  ViewId,
} from "@/lib/types"

type FormLeadInput = {
  firstName: string
  lastName: string
  email: string
  phone: string
  campaignId: string
  source: Source
  value: number
  note: string | null
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
  utmContent?: string
  utmTerm?: string | null
  countVisit: boolean
  id: string
  sessionId?: string | null
}

type ArrivalInput = {
  id: string
  campaignId: string
  source: Source
  utm: Arrival["utm"]
  landingPath: string
}

type DemoContextValue = {
  state: DemoData
  setView: (view: ViewId) => void
  setSource: (source: Source) => void
  simulateVisit: () => void
  simulateLead: () => void
  convertNextLead: () => void
  reset: () => void
  setLeadStatus: (id: string, status: LeadStatus) => void
  setLeadValue: (id: string, value: number) => void
  saveLink: (link: TrackedLink) => void
  openLead: (id: string | null) => void
  markJourney: (stage: JourneyStage) => void
  recordArrival: (input: ArrivalInput) => void
  addFormLead: (input: FormLeadInput) => void
}

const DemoContext = createContext<DemoContextValue | null>(null)

export function DemoProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DemoData>(createInitialState)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const saved = readDemoState()
    queueMicrotask(() => {
      if (saved) setState(saved)
      setHydrated(true)
    })
  }, [])

  useEffect(() => {
    if (!hydrated) return
    writeDemoState(state)
  }, [hydrated, state])

  useEffect(() => {
    if (!state.notice) return
    const id = state.notice.id
    const timeout = window.setTimeout(() => {
      setState((current) =>
        current.notice?.id === id ? { ...current, notice: null } : current,
      )
    }, 8000)
    return () => window.clearTimeout(timeout)
  }, [state.notice])

  const value = useMemo<DemoContextValue>(
    () => ({
      state,
      setView: (view) => setState((current) => selectView(current, view)),
      setSource: (source) => setState((current) => ({ ...current, source })),
      simulateVisit: () => setState((current) => simulateVisit(current)),
      simulateLead: () => setState((current) => simulateLead(current)),
      convertNextLead: () => setState((current) => convertNextLead(current)),
      reset: () => {
        localStorage.removeItem(DEMO_STORAGE_KEY)
        setState(
          withNotice(
            createInitialState(),
            "Demo reset. Sample visits, leads, and revenue are restored.",
          ),
        )
      },
      setLeadStatus: (id, status) =>
        setState((current) => setLeadStatus(current, id, status)),
      setLeadValue: (id, value) => setState((current) => setLeadValue(current, id, value)),
      saveLink: (link) => setState((current) => saveTrackedLink(current, link)),
      openLead: (id) => setState((current) => ({ ...current, openLeadId: id })),
      markJourney: (stage) => setState((current) => markJourney(current, stage)),
      recordArrival: (input) => setState((current) => recordArrival(current, input)),
      addFormLead: (input) =>
        setState((current) => {
          const visited = input.countVisit
            ? recordArrival(
                current,
                {
                  id: input.sessionId || `visit-${crypto.randomUUID()}`,
                  campaignId: input.campaignId,
                  source: input.source,
                  utm: {
                    source: input.utmSource || input.source,
                    medium: input.utmMedium || "referral",
                    campaign: input.utmCampaign || input.campaignId,
                    content: input.utmContent || "form",
                    term: input.utmTerm ?? null,
                  },
                  landingPath: isCampaignId(input.campaignId)
                    ? `/lp/${getCampaign(input.campaignId).slug}`
                    : "/visit",
                },
                { notify: false },
              )
            : current
          return createLead(visited, input).state
        }),
    }),
    [state],
  )

  if (!hydrated) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#f4f6f8] px-6 text-sm text-[#5c6370]">
        Loading simulated demo…
      </div>
    )
  }

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>
}

export function useDemo() {
  const context = useContext(DemoContext)
  if (!context) throw new Error("useDemo must be used within DemoProvider")
  return context
}
