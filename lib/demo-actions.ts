import { getCampaign } from "@/lib/campaigns"
import { localDay } from "@/lib/format"
import { JOURNEY_RANK, SOURCE_META, isSource } from "@/lib/labels"
import { demoEmail, demoPhone, SIM_PEOPLE } from "@/lib/people"
import { utmFor } from "@/lib/utm"
import type {
  CampaignId,
  DemoData,
  JourneyStage,
  Lead,
  LeadStatus,
  Source,
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
  campaignId: CampaignId,
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
    campaignId: CampaignId
    source: Source
    value: number
    note: string | null
    utmSource?: string
    utmMedium?: string
    utmCampaign?: string
    utmContent?: string
    utmTerm?: string | null
    day?: string
    id?: string
  },
): { state: DemoData; lead: Lead } {
  const campaign = getCampaign(input.campaignId)
  const fallback = utmFor(campaign, input.source)
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
      campaignId: input.campaignId,
      source: isSource(input.utmSource) ? input.source : state.source,
    },
    `${lead.firstName} ${lead.lastName} is a new lead from ${SOURCE_META[input.source].label} · ${campaign.shortName}.`,
  )

  return { state: next, lead }
}

export function simulateVisit(state: DemoData): DemoData {
  const campaign = getCampaign(state.campaignId)
  const next = incrementVisit(state, state.campaignId, state.source)
  return withNotice(
    { ...next, journeyStage: advance(state.journeyStage, "visit") },
    `Recorded a ${SOURCE_META[state.source].label} visit to ${campaign.shortName}. No lead yet.`,
  )
}

export function simulateLead(state: DemoData): DemoData {
  const campaign = getCampaign(state.campaignId)
  const [firstName, lastName] = SIM_PEOPLE[state.simIndex % SIM_PEOPLE.length]
  const withVisit = incrementVisit(state, state.campaignId, state.source)
  const { state: withLead, lead } = createLead(
    {
      ...withVisit,
      simIndex: state.simIndex + 1,
      journeyStage: advance(state.journeyStage, "visit"),
    },
    {
      firstName,
      lastName,
      email: demoEmail(firstName, lastName, `.sim${state.simIndex + 1}`),
      phone: demoPhone(200 + state.simIndex),
      campaignId: state.campaignId,
      source: state.source,
      value: campaign.demoValue,
      note: "Added from presenter controls",
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
  const campaign = getCampaign(lead.campaignId)
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
      view: state.view === "all" ? "all" : lead.campaignId,
      campaignId: lead.campaignId,
    },
    `${updated.firstName} ${updated.lastName} · ${campaign.shortName} is now ${statusLabel(status)}.${revenueNote}`,
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
  const campaign = getCampaign(view)
  return {
    ...state,
    view,
    campaignId: view,
    source: campaign.source,
    journeyStage: "ad",
    highlightLeadId: null,
  }
}

export function markJourney(state: DemoData, stage: JourneyStage): DemoData {
  return { ...state, journeyStage: advance(state.journeyStage, stage) }
}
