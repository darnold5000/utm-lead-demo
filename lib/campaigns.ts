import type { BusinessKind, Campaign, CampaignId } from "@/lib/types"

export const DEMO_ANCHOR_DAY = "2026-11-06"
export const DEMO_DAY_COUNT = 14

export const BUSINESSES: { id: BusinessKind; label: string }[] = [
  { id: "fitness", label: "Fitness training" },
  { id: "lawn", label: "Lawn care" },
  { id: "service", label: "Local service" },
]

export const CAMPAIGNS: Campaign[] = [
  {
    id: "shred",
    business: "fitness",
    businessName: "Northline Athletics",
    name: "6-Week Shred Challenge",
    shortName: "6-Week Shred",
    source: "facebook",
    slug: "6-week-shred",
    utmCampaign: "northline-6-week-shred",
    utmContent: "video-before-after",
    utmTerm: "6 week shred",
    spend: 1680,
    visitors: 1324,
    demoValue: 890,
    newCount: 8,
    bookedCount: 5,
    customerValues: [890, 890, 890, 890, 890, 1040, 740, 980],
    headline: "A 6-week shred that starts with this visit.",
    subhead:
      "Small-group coaching at Northline Athletics. This sample page stands in for the site a prospect lands on after the ad.",
    points: [
      "Sample program value $890",
      "Next group starts Monday",
      "The link keeps the campaign that sent them",
    ],
    cta: "Request a spot",
  },
  {
    id: "intro",
    business: "fitness",
    businessName: "Northline Athletics",
    name: "Free Intro Session",
    shortName: "Free Intro",
    source: "instagram",
    slug: "free-intro",
    utmCampaign: "northline-free-intro",
    utmContent: "story-free-session",
    utmTerm: "personal training intro",
    spend: 940,
    visitors: 876,
    demoValue: 890,
    newCount: 6,
    bookedCount: 4,
    customerValues: [890, 149, 890, 149, 468, 890],
    headline: "Book the free intro from the story you just saw.",
    subhead:
      "A no-contract first session. Some of these sample leads later buy a membership. That is the gap between a lead and a customer.",
    points: [
      "Free 30-minute intro",
      "Sample memberships from $149",
      "Instagram is the default source for this campaign",
    ],
    cta: "Claim the intro",
  },
  {
    id: "spring",
    business: "lawn",
    businessName: "Brightpath Lawn Co.",
    name: "Spring Cleanup Special",
    shortName: "Spring Cleanup",
    source: "facebook",
    slug: "spring-cleanup",
    utmCampaign: "brightpath-spring-cleanup",
    utmContent: "carousel-curb-appeal",
    utmTerm: "spring yard cleanup",
    spend: 720,
    visitors: 684,
    demoValue: 285,
    newCount: 5,
    bookedCount: 4,
    customerValues: [245, 285, 320, 245, 410, 245, 285, 360, 245],
    headline: "Spring cleanup, booked from the ad.",
    subhead:
      "Brightpath Lawn Co. uses this offer to turn neighborhood ads into routed jobs. Prices below are sample job values.",
    points: [
      "Cleanups from $245 in this dataset",
      "Beds, leaves, and haul-away",
      "Facebook carousel is the sample creative",
    ],
    cta: "Request a cleanup",
  },
  {
    id: "mow",
    business: "lawn",
    businessName: "Brightpath Lawn Co.",
    name: "Weekly Mow Route",
    shortName: "Weekly Mow",
    source: "google",
    slug: "weekly-mow",
    utmCampaign: "brightpath-weekly-mow",
    utmContent: "search-lawn-service",
    utmTerm: "lawn service near me",
    spend: 1260,
    visitors: 1108,
    demoValue: 960,
    newCount: 4,
    bookedCount: 3,
    customerValues: [960, 1120, 840, 960, 1280, 960, 720],
    headline: "Get on the weekly mow route.",
    subhead:
      "Searchers looking for lawn service land here. A booked route is worth more than a one-time cleanup, which is why this sample ROAS is higher.",
    points: [
      "Seasonal routes around $960",
      "Google search is the sample source",
      "utm_term records the keyword",
    ],
    cta: "Check route availability",
  },
  {
    id: "tuneup",
    business: "service",
    businessName: "Hearth & Hammer",
    name: "AC Tune-Up Special",
    shortName: "AC Tune-Up",
    source: "google",
    slug: "ac-tune-up",
    utmCampaign: "hearth-ac-tune-up",
    utmContent: "search-ac-tune-up",
    utmTerm: "ac tune up near me",
    spend: 1540,
    visitors: 1412,
    demoValue: 189,
    newCount: 7,
    bookedCount: 5,
    customerValues: [189, 189, 640, 189, 890, 189, 420, 760],
    headline: "An AC tune-up booked from search.",
    subhead:
      "Hearth & Hammer prices the visit at $189. In this sample, some of those appointments become larger repairs. Both show up in the lead record.",
    points: [
      "$189 sample tune-up",
      "Larger jobs stay attached to the same click",
      "Google Ads is the default source",
    ],
    cta: "Book a tune-up",
  },
  {
    id: "repair",
    business: "service",
    businessName: "Hearth & Hammer",
    name: "Same-Day Repair",
    shortName: "Same-Day Repair",
    source: "facebook",
    slug: "same-day-repair",
    utmCampaign: "hearth-same-day-repair",
    utmContent: "video-same-day",
    utmTerm: "same day hvac repair",
    spend: 860,
    visitors: 742,
    demoValue: 540,
    newCount: 4,
    bookedCount: 3,
    customerValues: [480, 720, 540, 860, 390, 640],
    headline: "Same-day repair, traced to the ad.",
    subhead:
      "Urgent jobs from a Facebook video. The sample lead keeps the campaign even after the invoice is marked paid.",
    points: [
      "Most sample tickets land between $390 and $860",
      "Status moves from new lead to booked to paid",
      "Revenue is counted only when they pay",
    ],
    cta: "Request same-day service",
  },
]

export function getCampaign(id: CampaignId) {
  const campaign = CAMPAIGNS.find((item) => item.id === id)
  if (!campaign) throw new Error(`Unknown campaign ${id}`)
  return campaign
}

export function getCampaignBySlug(slug: string) {
  return CAMPAIGNS.find((item) => item.slug === slug) ?? null
}

export function isCampaignId(value: string | null | undefined): value is CampaignId {
  return CAMPAIGNS.some((item) => item.id === value)
}
