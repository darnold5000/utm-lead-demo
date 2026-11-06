import { getCampaign, isCampaignId } from "@/lib/campaigns"
import { isSource } from "@/lib/labels"
import type { LinkType, Source, TrackedLink, Utm } from "@/lib/types"

export const LINK_TYPES: { id: LinkType; label: string }[] = [
  { id: "organic", label: "Organic post" },
  { id: "paid", label: "Paid ad" },
  { id: "email", label: "Email" },
  { id: "sms", label: "Text" },
  { id: "qr", label: "QR code" },
  { id: "referral", label: "Referral" },
]

export function linkTypeLabel(type: LinkType) {
  return LINK_TYPES.find((item) => item.id === type)?.label ?? type
}

export function mediumForLink(source: Source, linkType: LinkType) {
  if (linkType === "paid") {
    if (source === "google") return "cpc"
    if (source === "facebook" || source === "instagram") return "paid_social"
    return "paid"
  }
  if (linkType === "organic") return source === "google" ? "organic" : "organic_social"
  if (linkType === "email") return "email"
  if (linkType === "sms") return "sms"
  if (linkType === "qr") return "qr"
  return "referral"
}

export function nextVariation(links: TrackedLink[], headline: string, exceptId?: string) {
  const base = slugify(headline).replace(/_v\d+$/, "") || "post"
  const used = new Set(
    links
      .filter((link) => link.id !== exceptId)
      .map((link) => link.content)
      .filter((value): value is string => Boolean(value)),
  )
  let version = 1
  let variation = `${base}_v${version}`
  while (used.has(variation)) {
    version += 1
    variation = `${base}_v${version}`
  }
  return variation
}

export function slugify(value: string) {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
  return slug || "campaign"
}

export function normalizeDestination(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return "https://example.com/"
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

export function buildTrackedUrl(input: {
  destination: string
  source: string
  medium: string
  campaign: string
  content: string | null
}) {
  const url = new URL(normalizeDestination(input.destination))
  url.searchParams.set("utm_source", input.source)
  url.searchParams.set("utm_medium", input.medium)
  url.searchParams.set("utm_campaign", slugify(input.campaign))
  if (input.content?.trim()) url.searchParams.set("utm_content", slugify(input.content))
  return url.toString()
}

export function visitPath(link: TrackedLink, arrivalId: string) {
  const tracked = new URL(
    buildTrackedUrl({
      destination: link.destination,
      source: link.source,
      medium: link.medium,
      campaign: link.utmCampaign,
      content: link.content,
    }),
  )
  const params = tracked.searchParams
  params.set("dest", link.destination)
  params.set("sw_link", link.id)
  params.set("sw_arrival", arrivalId)
  return `/visit?${params.toString()}`
}

export function campaignTitle(links: TrackedLink[], id: string) {
  if (isCampaignId(id)) return getCampaign(id).shortName
  const link = links.find((item) => item.id === id)
  if (link) return link.headline?.trim() || link.name
  if (id === "direct") return "Direct"
  if (id === "unknown") return "Unknown"
  if (id.startsWith("referral:")) return `Referral · ${id.slice("referral:".length)}`
  if (id.startsWith("utm:")) return id.slice(4).replaceAll("_", " ")
  return id
}

export function campaignDetail(links: TrackedLink[], id: string) {
  if (isCampaignId(id)) {
    const campaign = getCampaign(id)
    return {
      name: campaign.name,
      shortName: campaign.shortName,
      businessName: campaign.businessName,
    }
  }
  const link = links.find((item) => item.id === id)
  if (link) {
    const headline = link.headline?.trim() || link.name
    return { name: headline, shortName: headline, businessName: link.name }
  }
  const title = campaignTitle(links, id)
  return {
    name: title,
    shortName: title,
    businessName: id === "direct" ? "No campaign tag" : "Untagged visit",
  }
}

export function matchLink(
  links: TrackedLink[],
  utm: { source: string; campaign: string; content: string },
) {
  const content = utm.content.trim()
  return (
    links.find(
      (link) =>
        link.source === utm.source &&
        link.utmCampaign === utm.campaign &&
        (link.content ?? "") === content,
    ) ?? null
  )
}

export function classifyVisit(input: {
  links: TrackedLink[]
  search: { get(name: string): string | null }
  referrer: string
  origin: string
}) {
  const destination = input.search.get("dest")
  const landingPath = destination || "/visit"
  const rawSource = input.search.get("utm_source")
  const rawMedium = input.search.get("utm_medium")
  const rawCampaign = input.search.get("utm_campaign")
  const rawContent = input.search.get("utm_content") ?? ""
  const rawTerm = input.search.get("utm_term")

  if (rawSource || rawCampaign || rawMedium || rawContent) {
    const source: Source = isSource(rawSource) ? rawSource : "other"
    const utm: Utm = {
      source: rawSource || "unknown",
      medium: rawMedium || "unknown",
      campaign: rawCampaign || "",
      content: rawContent,
      term: rawTerm,
    }
    const forced = input.search.get("sw_link")
    const matched = forced
      ? input.links.find((link) => link.id === forced) ?? null
      : rawCampaign
        ? matchLink(input.links, { source: utm.source, campaign: rawCampaign, content: rawContent })
        : null
    return {
      campaignId: forced || matched?.id || (rawCampaign ? `utm:${rawCampaign}` : "unknown"),
      source: matched?.source ?? source,
      utm,
      landingPath,
    }
  }

  const ref = input.search.get("ref") || externalReferrer(input.referrer, input.origin)
  if (ref) {
    let host = ref
    try {
      host = new URL(ref).hostname
    } catch {
      host = ref.replace(/^https?:\/\//, "").split("/")[0] || "website"
    }
    return {
      campaignId: `referral:${host}`,
      source: "referral" as const,
      utm: { source: host, medium: "referral", campaign: "", content: "", term: null },
      landingPath,
    }
  }

  return {
    campaignId: "direct",
    source: "direct" as const,
    utm: { source: "direct", medium: "none", campaign: "", content: "", term: null },
    landingPath,
  }
}

function externalReferrer(referrer: string, origin: string) {
  if (!referrer) return ""
  try {
    const url = new URL(referrer)
    if (url.origin === origin) return ""
    return url.href
  } catch {
    return ""
  }
}
