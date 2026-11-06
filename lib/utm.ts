import { getCampaign } from "@/lib/campaigns"
import { mediumFor } from "@/lib/labels"
import type { Campaign, Lead, Source, Utm } from "@/lib/types"

export function utmFor(campaign: Campaign, source: Source, term: string | null = null): Utm {
  return {
    source,
    medium: mediumFor(source),
    campaign: campaign.utmCampaign,
    content: campaign.utmContent,
    term: source === "google" ? (term ?? campaign.utmTerm) : term,
  }
}

export function trackingPath(campaign: Campaign, source: Source) {
  const utm = utmFor(campaign, source)
  const params = new URLSearchParams({
    utm_source: utm.source,
    utm_medium: utm.medium,
    utm_campaign: utm.campaign,
    utm_content: utm.content,
  })
  if (utm.term) params.set("utm_term", utm.term)
  return `/lp/${campaign.slug}?${params.toString()}`
}

export function absoluteUrl(origin: string, path: string) {
  return `${origin}${path}`
}

export function leadPath(lead: Lead) {
  const campaign = getCampaign(lead.campaignId)
  const params = new URLSearchParams({
    utm_source: lead.utm.source,
    utm_medium: lead.utm.medium,
    utm_campaign: lead.utm.campaign,
    utm_content: lead.utm.content,
  })
  if (lead.utm.term) params.set("utm_term", lead.utm.term)
  return `/lp/${campaign.slug}?${params.toString()}`
}

export function parameterRows(utm: Utm) {
  const rows = [
    { name: "utm_source", value: utm.source },
    { name: "utm_medium", value: utm.medium },
    { name: "utm_campaign", value: utm.campaign },
    { name: "utm_content", value: utm.content },
  ]
  if (utm.term) rows.push({ name: "utm_term", value: utm.term })
  return rows
}
