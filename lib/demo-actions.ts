import { getCampaign, isCampaignId } from "@/lib/campaigns"
import { localDay } from "@/lib/format"
import { JOURNEY_RANK, SOURCE_META, isPresenterSource } from "@/lib/labels"
import { demoEmail, demoPhone, SIM_PEOPLE } from "@/lib/people"
import { campaignTitle } from "@/lib/traffic"
import { utmFor } from "@/lib/utm"
import type {
  Arrival,
  DemoData,
  JourneyStage,
  Lead,
  LeadStatus,
  Source,
  TrackedLink,
  Utm,
  ViewId,
} from "@/lib/types"

function advance(current: JourneyStage, next: JourneyStage): JourneyStage {
  return JOURNEY_RANK[next] > JOURNEY_RANK[current] ? next : current
}

export function withNotice(state: DemoData, text: string): DemoData {
  const noticeSeq = state.noticeSeq + 1
  return { ...state, noticeSeq, notice: { id: noticeSeq, text } }
}

export function incrementVisit(
  state: DemoData,
  campaignId: string,
  source: Source,
  day = localDay(),
): DemoData {
  const index = state.buckets.findIndex(
    (bucket) =>
      bucket.campaignId === campaignId && bucket.source === source && bucket.day === day,
  )
  const buckets =
    index === -1
      ? [...state.buckets, { campaignId, source, day, count: 1 }]
      : state.buckets.map((bucket, bucketIndex) =>
          bucketIndex === index ? { ...bucket, count: bucket.count + 1 } : bucket,
        )

  return { ...state, buckets }
}

function statusStage(status: LeadStatus): JourneyStage {
  if (status === "converted") return "customer"
  if (status === "booked") return "booked"
  return "lead"
}

export function createLead(
  state: DemoData,
  input: {
    firstName: string
    lastName: string
    email: string
    phone: string
    campaignId: string
    source: Source
    value: number
    note: string | null
    sessionId?: string | null
    utmSource?: string
    utmMedium?: string
    utmCampaign?: string
    utmContent?: string
    utmTerm?: string | null
    day?: string
    id?: string
  },
): { state: DemoData; lead: Lead } {
  const seed = isCampaignId(input.campaignId) ? getCampaign(input.campaignId) : null
  const fallback: Utm =
    seed && isPresenterSource(input.source)
      ? utmFor(seed, input.source)
      : {
          source: input.source,
          medium: input.utmMedium || "referral",
          campaign: input.utmCampaign || "",
          content: input.utmContent || "",
          term: input.utmTerm ?? null,
        }
  const lead: Lead = {
    id: input.id ?? `live-${crypto.randomUUID()}`,
    firstName: input.firstName,
    lastName: input.lastName,
    email: input.email,
    phone: input.phone,
    campaignId: input.campaignId,
    source: input.source,
    status: "new",
    value: input.value,
    day: input.day ?? localDay(),
    note: input.note,
    sessionId: input.sessionId ?? null,
    utm: {
      source: input.utmSource || fallback.source,
      medium: input.utmMedium || fallback.medium,
      campaign: input.utmCampaign || fallback.campaign,
      content: input.utmContent || fallback.content,
      term: input.utmTerm === undefined ? fallback.term : input.utmTerm,
    },
  }

  const next = withNotice(
    {
      ...state,
      leads: [...state.leads, lead],
      highlightLeadId: lead.id,
      journeyStage: advance(state.journeyStage, "lead"),
      campaignId: isCampaignId(input.campaignId) ? input.campaignId : state.campaignId,
      source: isPresenterSource(input.source) ? input.source : state.source,
    },
    `${lead.firstName} ${lead.lastName} is a new lead from ${SOURCE_META[input.source].label} · ${campaignTitle(state.links, input.campaignId)}.`,
  )

  return { state: next, lead }
}

export function recordArrival(
  state: DemoData,
  input: {
    id: string
    campaignId: string
    source: Source
    utm: Utm
    landingPath: string
    at?: string
  },
  options?: { notify?: boolean },
): DemoData {
  if (state.arrivals.some((arrival) => arrival.id === input.id)) return state
  const at = input.at ?? new Date().toISOString()
  const day = localDay(new Date(at))
  const visited = incrementVisit(state, input.campaignId, input.source, day)
  const arrival: Arrival = {
    id: input.id,
    campaignId: input.campaignId,
    source: input.source,
    utm: input.utm,
    landingPath: input.landingPath,
    at,
    day,
  }
  const next: DemoData = {
    ...visited,
    arrivals: [arrival, ...visited.arrivals],
    activeSessionId: arrival.id,
    journeyStage: advance(visited.journeyStage, "visit"),
    campaignId: isCampaignId(input.campaignId) ? input.campaignId : state.campaignId,
    source: isPresenterSource(input.source) ? input.source : state.source,
    view:
      state.view === "all" || state.view === input.campaignId
        ? state.view
        : isCampaignId(input.campaignId)
          ? input.campaignId
          : "all",
  }
  if (options?.notify === false) return next
  return withNotice(
    next,
    `Anonymous visit from ${SOURCE_META[input.source].label} · ${campaignTitle(state.links, input.campaignId)}. Counted before any form.`,
  )
}

export function simulateVisit(state: DemoData): DemoData {
  const campaign = getCampaign(state.campaignId)
  return recordArrival(state, {
    id: `visit-${crypto.randomUUID()}`,
    campaignId: state.campaignId,
    source: state.source,
    utm: utmFor(campaign, state.source),
    landingPath: `/lp/${campaign.slug}`,
  })
}

export function simulateLead(state: DemoData): DemoData {
  const campaign = getCampaign(state.campaignId)
  const [firstName, lastName] = SIM_PEOPLE[state.simIndex % SIM_PEOPLE.length]
  const sessionId = `visit-${crypto.randomUUID()}`
  const withVisit = recordArrival(
    state,
    {
      id: sessionId,
      campaignId: state.campaignId,
      source: state.source,
      utm: utmFor(campaign, state.source),
      landingPath: `/lp/${campaign.slug}`,
    },
    { notify: false },
  )
  const { state: withLead, lead } = createLead(
    { ...withVisit, simIndex: state.simIndex + 1 },
    {
      firstName,
      lastName,
      email: demoEmail(firstName, lastName, `.sim${state.simIndex + 1}`),
      phone: demoPhone(200 + state.simIndex),
      campaignId: state.campaignId,
      source: state.source,
      value: campaign.demoValue,
      note: "Added from presenter controls",
      sessionId,
    },
  )
  return withNotice(
    { ...withLead, simIndex: state.simIndex + 1 },
    `${lead.firstName} ${lead.lastName} came in from ${SOURCE_META[state.source].label} · ${campaign.shortName}. The visit and the lead both count.`,
  )
}

export function setLeadStatus(state: DemoData, leadId: string, status: LeadStatus): DemoData {
  const lead = state.leads.find((item) => item.id === leadId)
  if (!lead || lead.status === status) return state
  const updated: Lead = { ...lead, status }
  const revenueNote =
    status === "converted"
      ? ` ${formatRevenue(updated.value)} now counts as attributed revenue.`
      : status === "booked"
        ? " The appointment is booked. Revenue waits until they pay."
        : " Revenue from this lead is no longer included."

  return withNotice(
    {
      ...state,
      leads: state.leads.map((item) => (item.id === leadId ? updated : item)),
      highlightLeadId: leadId,
      journeyStage: advance(state.journeyStage, statusStage(status)),
      view:
        state.view === "all" || state.view === lead.campaignId
          ? state.view
          : isCampaignId(lead.campaignId)
            ? lead.campaignId
            : "all",
      campaignId: isCampaignId(lead.campaignId) ? lead.campaignId : state.campaignId,
    },
    `${updated.firstName} ${updated.lastName} · ${campaignTitle(state.links, lead.campaignId)} is now ${statusLabel(status)}.${revenueNote}`,
  )
}

export function setLeadValue(state: DemoData, leadId: string, value: number): DemoData {
  if (!Number.isFinite(value) || value < 0) return state
  const rounded = Math.round(value)
  const lead = state.leads.find((item) => item.id === leadId)
  if (!lead || lead.value === rounded) return state
  return {
    ...state,
    leads: state.leads.map((item) => (item.id === leadId ? { ...item, value: rounded } : item)),
    highlightLeadId: leadId,
  }
}

export function saveTrackedLink(state: DemoData, link: TrackedLink): DemoData {
  const exists = state.links.some((item) => item.id === link.id)
  return withNotice(
    {
      ...state,
      links: exists
        ? state.links.map((item) => (item.id === link.id ? link : item))
        : [link, ...state.links],
    },
    exists
      ? `Updated ${link.headline?.trim() || link.name}.`
      : `Saved ${link.headline?.trim() || link.name}. The link is ready to reuse.`,
  )
}

function statusLabel(status: LeadStatus) {
  if (status === "converted") return "a paying customer"
  if (status === "booked") return "a booked appointment"
  return "a new lead"
}

function formatRevenue(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value)
}

export function convertNextLead(state: DemoData): DemoData {
  const highlighted = state.leads.find(
    (lead) => lead.id === state.highlightLeadId && lead.status !== "converted",
  )
  const pool = state.leads
    .filter((lead) => lead.campaignId === state.campaignId && lead.status !== "converted")
    .sort((a, b) => b.day.localeCompare(a.day) || b.id.localeCompare(a.id))
  const lead = highlighted ?? pool[0]
  if (!lead) {
    const campaign = getCampaign(state.campaignId)
    return withNotice(
      state,
      `Every lead in ${campaign.shortName} is already a paying customer.`,
    )
  }
  return setLeadStatus(state, lead.id, "converted")
}

export function selectView(state: DemoData, view: ViewId): DemoData {
  if (view === "all") return { ...state, view: "all" }
  if (!isCampaignId(view)) return { ...state, view }
  const campaign = getCampaign(view)
  return {
    ...state,
    view,
    campaignId: view,
    source: isPresenterSource(campaign.source) ? campaign.source : state.source,
    journeyStage: "ad",
    highlightLeadId: null,
  }
}

export function markJourney(state: DemoData, stage: JourneyStage): DemoData {
  return { ...state, journeyStage: advance(state.journeyStage, stage) }
}
