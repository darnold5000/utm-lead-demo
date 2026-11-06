import { CAMPAIGNS, getCampaign } from "@/lib/campaigns"
import { SOURCE_META } from "@/lib/labels"
import type {
  CampaignId,
  Lead,
  Source,
  ViewId,
  VisitBucket,
} from "@/lib/types"

export type CampaignStats = {
  id: CampaignId
  visitors: number
  leads: number
  booked: number
  appointments: number
  customers: number
  spend: number
  revenue: number
  cpl: number | null
  roas: number | null
  leadRate: number | null
  sources: Source[]
}

export type Totals = {
  visitors: number
  leads: number
  appointments: number
  customers: number
  spend: number
  revenue: number
  cpl: number | null
  roas: number | null
  leadRate: number | null
}

export type DayPoint = {
  day: string
  visitors: number
  leads: number
  customers: number
}

export type SourcePoint = {
  source: Source
  label: string
  color: string
  visitors: number
  leads: number
  customers: number
}

function ratio(part: number, whole: number) {
  if (whole <= 0) return null
  return part / whole
}

function matches(view: ViewId, campaignId: CampaignId) {
  return view === "all" || view === campaignId
}

export function campaignStats(buckets: VisitBucket[], leads: Lead[]): CampaignStats[] {
  return CAMPAIGNS.map((campaign) => {
    const campaignLeads = leads.filter((lead) => lead.campaignId === campaign.id)
    const customers = campaignLeads.filter((lead) => lead.status === "converted")
    const booked = campaignLeads.filter((lead) => lead.status === "booked")
    const visitors = buckets
      .filter((bucket) => bucket.campaignId === campaign.id)
      .reduce((sum, bucket) => sum + bucket.count, 0)
    const revenue = customers.reduce((sum, lead) => sum + lead.value, 0)
    const sourceCounts = new Map<Source, number>()
    for (const bucket of buckets) {
      if (bucket.campaignId !== campaign.id || bucket.count <= 0) continue
      sourceCounts.set(bucket.source, (sourceCounts.get(bucket.source) ?? 0) + bucket.count)
    }
    const sources = [...sourceCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([source]) => source)

    return {
      id: campaign.id,
      visitors,
      leads: campaignLeads.length,
      booked: booked.length,
      appointments: booked.length + customers.length,
      customers: customers.length,
      spend: campaign.spend,
      revenue,
      cpl: campaignLeads.length > 0 ? campaign.spend / campaignLeads.length : null,
      roas: campaign.spend > 0 ? revenue / campaign.spend : null,
      leadRate: ratio(campaignLeads.length, visitors),
      sources: sources.length > 0 ? sources : [campaign.source],
    }
  })
}

export function summarize(stats: CampaignStats[], view: ViewId): Totals {
  const rows = stats.filter((row) => matches(view, row.id))
  const visitors = rows.reduce((sum, row) => sum + row.visitors, 0)
  const leads = rows.reduce((sum, row) => sum + row.leads, 0)
  const appointments = rows.reduce((sum, row) => sum + row.appointments, 0)
  const customers = rows.reduce((sum, row) => sum + row.customers, 0)
  const spend = rows.reduce((sum, row) => sum + row.spend, 0)
  const revenue = rows.reduce((sum, row) => sum + row.revenue, 0)

  return {
    visitors,
    leads,
    appointments,
    customers,
    spend,
    revenue,
    cpl: leads > 0 ? spend / leads : null,
    roas: spend > 0 ? revenue / spend : null,
    leadRate: ratio(leads, visitors),
  }
}

export function seriesFor(buckets: VisitBucket[], leads: Lead[], view: ViewId) {
  const days = new Set<string>()
  for (const bucket of buckets) {
    if (matches(view, bucket.campaignId)) days.add(bucket.day)
  }
  for (const lead of leads) {
    if (matches(view, lead.campaignId)) days.add(lead.day)
  }

  const byDay: DayPoint[] = [...days].sort().map((day) => ({
    day,
    visitors: buckets
      .filter((bucket) => bucket.day === day && matches(view, bucket.campaignId))
      .reduce((sum, bucket) => sum + bucket.count, 0),
    leads: leads.filter((lead) => lead.day === day && matches(view, lead.campaignId)).length,
    customers: leads.filter(
      (lead) =>
        lead.day === day && lead.status === "converted" && matches(view, lead.campaignId),
    ).length,
  }))

  const bySource: SourcePoint[] = (Object.keys(SOURCE_META) as Source[]).map((source) => ({
    source,
    label: SOURCE_META[source].label,
    color: SOURCE_META[source].color,
    visitors: buckets
      .filter((bucket) => bucket.source === source && matches(view, bucket.campaignId))
      .reduce((sum, bucket) => sum + bucket.count, 0),
    leads: leads.filter((lead) => lead.source === source && matches(view, lead.campaignId))
      .length,
    customers: leads.filter(
      (lead) =>
        lead.source === source &&
        lead.status === "converted" &&
        matches(view, lead.campaignId),
    ).length,
  }))

  const byCampaign = campaignStats(buckets, leads)
    .filter((row) => matches(view, row.id))
    .map((row) => ({
      ...row,
      name: getCampaign(row.id).shortName,
    }))

  return { byDay, bySource: bySource.filter((row) => row.visitors > 0 || row.leads > 0), byCampaign }
}

export function visibleLeads(leads: Lead[], view: ViewId) {
  return leads
    .filter((lead) => matches(view, lead.campaignId))
    .slice()
    .sort((a, b) => b.day.localeCompare(a.day) || b.id.localeCompare(a.id))
}
