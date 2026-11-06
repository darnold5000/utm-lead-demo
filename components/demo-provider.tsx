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
  incrementVisit,
  markJourney,
  selectView,
  setLeadStatus,
  simulateLead,
  simulateVisit,
  withNotice,
} from "@/lib/demo-actions"
import { createInitialState } from "@/lib/seed"
import type {
  CampaignId,
  DemoData,
  JourneyStage,
  LeadStatus,
  Source,
  ViewId,
} from "@/lib/types"

type FormLeadInput = {
  firstName: string
  lastName: string
  email: string
  phone: string
  campaignId: CampaignId
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
  openLead: (id: string | null) => void
  markJourney: (stage: JourneyStage) => void
  addFormLead: (input: FormLeadInput) => void
}

const DemoContext = createContext<DemoContextValue | null>(null)

export function DemoProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DemoData>(createInitialState)

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
      reset: () =>
        setState(
          withNotice(
            createInitialState(),
            "Demo reset. Sample visits, leads, and revenue are restored.",
          ),
        ),
      setLeadStatus: (id, status) =>
        setState((current) => setLeadStatus(current, id, status)),
      openLead: (id) => setState((current) => ({ ...current, openLeadId: id })),
      markJourney: (stage) => setState((current) => markJourney(current, stage)),
      addFormLead: (input) =>
        setState((current) => {
          const visited = input.countVisit
            ? incrementVisit(current, input.campaignId, input.source)
            : current
          const stage: JourneyStage =
            visited.journeyStage === "ad" ? "visit" : visited.journeyStage
          return createLead({ ...visited, journeyStage: stage }, input).state
        }),
    }),
    [state],
  )

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>
}

export function useDemo() {
  const context = useContext(DemoContext)
  if (!context) throw new Error("useDemo must be used within DemoProvider")
  return context
}
