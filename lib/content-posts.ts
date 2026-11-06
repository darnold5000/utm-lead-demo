import type { TrackedLink } from "@/lib/types"

export const APC_DESTINATION = "https://athletesperformancecenter.example/softball"

const createdAt = "2026-11-01T15:00:00.000Z"

export const CONTENT_POSTS: TrackedLink[] = [
  {
    id: "post-throw-harder",
    destination: APC_DESTINATION,
    source: "facebook",
    linkType: "organic",
    medium: "organic_social",
    name: "Softball Training",
    headline: "Help Your Daughter Throw Harder",
    body: "Parents in Plainfield: if your daughter loves softball but her throws are coming up short, Athletes Performance Center can help. We coach throwing mechanics, arm strength, and confidence in a small group. Come see what a few focused sessions can do before the season starts.",
    utmCampaign: "softball_training",
    content: "throw_harder_v1",
    spend: null,
    baseline: { visitors: 145, leads: 18, customers: 6, revenue: 900 },
    createdAt,
  },
  {
    id: "post-tryouts-speed",
    destination: APC_DESTINATION,
    source: "facebook",
    linkType: "organic",
    medium: "organic_social",
    name: "Softball Training",
    headline: "Get Faster Before Tryouts",
    body: "Tryouts are closer than they feel. Athletes Performance Center in Plainfield is opening a few softball speed and first-step sessions so players can show up quicker on the bases and in the outfield. Message us to hold a spot this month.",
    utmCampaign: "softball_training",
    content: "tryouts_speed_v1",
    spend: null,
    baseline: { visitors: 310, leads: 32, customers: 11, revenue: 1650 },
    createdAt,
  },
  {
    id: "post-plainfield-elite",
    destination: APC_DESTINATION,
    source: "facebook",
    linkType: "organic",
    medium: "organic_social",
    name: "Softball Training",
    headline: "Elite Softball Training in Plainfield",
    body: "Elite softball training is now available in Plainfield. Athletes Performance Center coaches hitting, throwing, and game speed for players who want more than a generic workout. Tour the facility and meet the staff.",
    utmCampaign: "softball_training",
    content: "plainfield_elite_v1",
    spend: null,
    baseline: { visitors: 95, leads: 8, customers: 2, revenue: 300 },
    createdAt,
  },
]

export function normalizeLink(link: TrackedLink): TrackedLink {
  return {
    ...link,
    headline: link.headline ?? "",
    body: link.body ?? "",
    baseline: link.baseline ?? null,
  }
}

export function withContentPosts(links: TrackedLink[]) {
  const ids = new Set(links.map((link) => link.id))
  const missing = CONTENT_POSTS.filter((post) => !ids.has(post.id))
  return missing.length === 0 ? links : [...links, ...missing]
}
