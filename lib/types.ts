export type Source =
  | "facebook"
  | "instagram"
  | "google"
  | "email"
  | "sms"
  | "qr"
  | "referral"
  | "other"
  | "direct"
  | "unknown"

export type LinkType = "organic" | "paid" | "email" | "sms" | "qr" | "referral"

export type BusinessKind = "fitness" | "lawn" | "service"

export type CampaignId =
  | "shred"
  | "intro"
  | "spring"
  | "mow"
  | "tuneup"
  | "repair"

export type LeadStatus = "new" | "booked" | "converted"

export type JourneyStage = "ad" | "visit" | "form" | "lead" | "booked" | "customer"

export type ViewId = "all" | string

export type Utm = {
  source: string
  medium: string
  campaign: string
  content: string
  term: string | null
}

export type Campaign = {
  id: CampaignId
  business: BusinessKind
  businessName: string
  name: string
  shortName: string
  source: Source
  slug: string
  utmCampaign: string
  utmContent: string
  utmTerm: string
  spend: number
  visitors: number
  demoValue: number
  newCount: number
  bookedCount: number
  customerValues: number[]
  headline: string
  subhead: string
  points: string[]
  cta: string
}

export type VisitBucket = {
  campaignId: string
  source: Source
  day: string
  count: number
}

export type Lead = {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  campaignId: string
  source: Source
  status: LeadStatus
  value: number
  day: string
  note: string | null
  utm: Utm
  sessionId: string | null
}

export type Arrival = {
  id: string
  campaignId: string
  source: Source
  utm: Utm
  landingPath: string
  at: string
  day: string
}

export type ContentBaseline = {
  visitors: number
  leads: number
  customers: number
  revenue: number
}

export type TrackedLink = {
  id: string
  destination: string
  source: Source
  linkType: LinkType
  medium: string
  name: string
  headline: string
  body: string
  utmCampaign: string
  content: string | null
  spend: number | null
  baseline: ContentBaseline | null
  createdAt: string
}

export type Notice = {
  id: number
  text: string
}

export type DemoData = {
  buckets: VisitBucket[]
  leads: Lead[]
  campaignId: CampaignId
  source: Source
  view: ViewId
  journeyStage: JourneyStage
  highlightLeadId: string | null
  openLeadId: string | null
  notice: Notice | null
  noticeSeq: number
  simIndex: number
  arrivals: Arrival[]
  activeSessionId: string | null
  links: TrackedLink[]
}
