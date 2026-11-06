import type { Metadata } from "next"
import { LinksView } from "@/components/links-view"

export const metadata: Metadata = { title: "Campaign links" }

export default function LinksPage() {
  return <LinksView />
}
