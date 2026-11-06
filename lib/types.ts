export type Source = "facebook" | "instagram" | "google"

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

export type ViewId = "all" | CampaignId

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
  campaignId: CampaignId
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
  campaignId: CampaignId
  source: Source
  status: LeadStatus
  value: number
  day: string
  note: string | null
  utm: Utm
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
}
