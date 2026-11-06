import { CAMPAIGNS, isCampaignId } from "@/lib/campaigns"
import { SOURCE_META } from "@/lib/labels"
import { campaignDetail, campaignTitle } from "@/lib/traffic"
import type {
  Arrival,
  Lead,
  Source,
  TrackedLink,
  ViewId,
  VisitBucket,
} from "@/lib/types"

export type PostPerformance = {
  id: string
  visitors: number
  leads: number
  customers: number
  revenue: number
  leadRate: number | null
}

export function postPerformance(link: TrackedLink, buckets: VisitBucket[], leads: Lead[]): PostPerformance {
  const liveVisitors = buckets
    .filter((bucket) => bucket.campaignId === link.id)
    .reduce((sum, bucket) => sum + bucket.count, 0)
  const liveLeads = leads.filter((lead) => lead.campaignId === link.id)
  const liveCustomers = liveLeads.filter((lead) => lead.status === "converted")
  const visitors = liveVisitors + (link.baseline?.visitors ?? 0)
  const leadCount = liveLeads.length + (link.baseline?.leads ?? 0)
  const customers = liveCustomers.length + (link.baseline?.customers ?? 0)
  const revenue = liveCustomers.reduce((sum, lead) => sum + lead.value, 0) + (link.baseline?.revenue ?? 0)
  return {
    id: link.id,
    visitors,
    leads: leadCount,
    customers,
    revenue,
    leadRate: visitors > 0 ? leadCount / visitors : null,
  }
}

export type CampaignStats = {
  id: string
  name: string
  businessName: string
  visitors: number
  leads: number
  booked: number
  appointments: number
  customers: number
  spend: number | null
  paid: boolean
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

function matches(view: ViewId, campaignId: string) {
  return view === "all" || view === campaignId
}

function isPaidId(id: string, links: TrackedLink[]) {
  if (isCampaignId(id)) return true
  return links.find((link) => link.id === id)?.linkType === "paid"
}

function statsFor(
  id: string,
  name: string,
  businessName: string,
  paid: boolean,
  spend: number | null,
  fallbackSource: Source | null,
  buckets: VisitBucket[],
  leads: Lead[],
): CampaignStats {
  const campaignLeads = leads.filter((lead) => lead.campaignId === id)
  const customers = campaignLeads.filter((lead) => lead.status === "converted")
  const booked = campaignLeads.filter((lead) => lead.status === "booked")
  const visitors = buckets
    .filter((bucket) => bucket.campaignId === id)
    .reduce((sum, bucket) => sum + bucket.count, 0)
  const revenue = customers.reduce((sum, lead) => sum + lead.value, 0)
  const sourceCounts = new Map<Source, number>()
  for (const bucket of buckets) {
    if (bucket.campaignId !== id || bucket.count <= 0) continue
    sourceCounts.set(bucket.source, (sourceCounts.get(bucket.source) ?? 0) + bucket.count)
  }
  const sources = [...sourceCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([source]) => source)

  return {
    id,
    name,
    businessName,
    visitors,
    leads: campaignLeads.length,
    booked: booked.length,
    appointments: booked.length + customers.length,
    customers: customers.length,
    spend,
    paid,
    revenue,
    cpl: spend != null && campaignLeads.length > 0 ? spend / campaignLeads.length : null,
    roas: paid && spend != null && spend > 0 ? revenue / spend : null,
    leadRate: ratio(campaignLeads.length, visitors),
    sources: sources.length > 0 ? sources : fallbackSource ? [fallbackSource] : [],
  }
}

export function campaignStats(
  buckets: VisitBucket[],
  leads: Lead[],
  links: TrackedLink[] = [],
): CampaignStats[] {
  const known = new Set<string>([...CAMPAIGNS.map((campaign) => campaign.id), ...links.map((link) => link.id)])
  const extras = new Set<string>()
  for (const bucket of buckets) {
    if (!known.has(bucket.campaignId)) extras.add(bucket.campaignId)
  }
  for (const lead of leads) {
    if (!known.has(lead.campaignId)) extras.add(lead.campaignId)
  }

  return [
    ...CAMPAIGNS.map((campaign) =>
      statsFor(
        campaign.id,
        campaign.name,
        campaign.businessName,
        true,
        campaign.spend,
        campaign.source,
        buckets,
        leads,
      ),
    ),
    ...links.map((link) =>
      statsFor(
        link.id,
        link.name,
        link.linkType === "paid" ? "Paid link" : "Unpaid link",
        link.linkType === "paid",
        link.linkType === "paid" ? link.spend : null,
        link.source,
        buckets,
        leads,
      ),
    ),
    ...[...extras].map((id) => {
      const detail = campaignDetail(links, id)
      const source =
        buckets.find((bucket) => bucket.campaignId === id)?.source ??
        leads.find((lead) => lead.campaignId === id)?.source ??
        null
      return statsFor(id, detail.name, detail.businessName, false, null, source, buckets, leads)
    }),
  ]
}

export function summarize(stats: CampaignStats[], view: ViewId): Totals {
  const rows = stats.filter((row) => matches(view, row.id))
  const visitors = rows.reduce((sum, row) => sum + row.visitors, 0)
  const leads = rows.reduce((sum, row) => sum + row.leads, 0)
  const appointments = rows.reduce((sum, row) => sum + row.appointments, 0)
  const customers = rows.reduce((sum, row) => sum + row.customers, 0)
  const spend = rows.reduce((sum, row) => sum + (row.spend ?? 0), 0)
  const revenue = rows.reduce((sum, row) => sum + row.revenue, 0)
  const paidRows = rows.filter((row) => row.paid && row.spend != null && row.spend > 0)
  const paidSpend = paidRows.reduce((sum, row) => sum + (row.spend ?? 0), 0)
  const paidRevenue = paidRows.reduce((sum, row) => sum + row.revenue, 0)

  return {
    visitors,
    leads,
    appointments,
    customers,
    spend,
    revenue,
    cpl: leads > 0 && spend > 0 ? spend / leads : null,
    roas: paidSpend > 0 ? paidRevenue / paidSpend : null,
    leadRate: ratio(leads, visitors),
  }
}

export function channelSplit(buckets: VisitBucket[], links: TrackedLink[], view: ViewId) {
  let paid = 0
  let unpaid = 0
  for (const bucket of buckets) {
    if (!matches(view, bucket.campaignId)) continue
    if (isPaidId(bucket.campaignId, links)) paid += bucket.count
    else unpaid += bucket.count
  }
  return { paid, unpaid }
}

export function seriesFor(
  buckets: VisitBucket[],
  leads: Lead[],
  links: TrackedLink[],
  view: ViewId,
) {
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
      (lead) => lead.day === day && lead.status === "converted" && matches(view, lead.campaignId),
    ).length,
  }))

  const bySource: SourcePoint[] = (Object.keys(SOURCE_META) as Source[]).map((source) => ({
    source,
    label: SOURCE_META[source].label,
    color: SOURCE_META[source].color,
    visitors: buckets
      .filter((bucket) => bucket.source === source && matches(view, bucket.campaignId))
      .reduce((sum, bucket) => sum + bucket.count, 0),
    leads: leads.filter((lead) => lead.source === source && matches(view, lead.campaignId)).length,
    customers: leads.filter(
      (lead) =>
        lead.source === source && lead.status === "converted" && matches(view, lead.campaignId),
    ).length,
  }))

  const byCampaign = campaignStats(buckets, leads, links)
    .filter((row) => matches(view, row.id) && (row.visitors > 0 || row.leads > 0))
    .map((row) => ({
      name: campaignTitle(links, row.id),
      leads: row.leads,
      customers: row.customers,
    }))

  return { byDay, bySource: bySource.filter((row) => row.visitors > 0 || row.leads > 0), byCampaign }
}

export function landingPages(
  buckets: VisitBucket[],
  arrivals: Arrival[],
  links: TrackedLink[],
  view: ViewId,
) {
  const seed = CAMPAIGNS.filter((campaign) => matches(view, campaign.id)).map((campaign) => ({
    path: `/lp/${campaign.slug}`,
    name: campaign.shortName,
    businessName: campaign.businessName,
    visitors: buckets
      .filter((bucket) => bucket.campaignId === campaign.id)
      .reduce((sum, bucket) => sum + bucket.count, 0),
  }))

  const extra = new Map<string, { path: string; name: string; businessName: string; visitors: number }>()
  for (const arrival of arrivals) {
    if (!matches(view, arrival.campaignId) || isCampaignId(arrival.campaignId)) continue
    const current = extra.get(arrival.landingPath) ?? {
      path: arrival.landingPath,
      name: campaignTitle(links, arrival.campaignId),
      businessName: "Tracked visit",
      visitors: 0,
    }
    current.visitors += 1
    extra.set(arrival.landingPath, current)
  }

  return [...seed, ...extra.values()]
}

export function visibleArrivals(arrivals: Arrival[], view: ViewId) {
  return arrivals
    .filter((arrival) => matches(view, arrival.campaignId))
    .slice()
    .sort((a, b) => b.at.localeCompare(a.at))
}

export function visibleLeads(leads: Lead[], view: ViewId) {
  return leads
    .filter((lead) => matches(view, lead.campaignId))
    .slice()
    .sort((a, b) => b.day.localeCompare(a.day) || b.id.localeCompare(a.id))
}
