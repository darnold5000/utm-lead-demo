import type { Metadata } from "next"
import { LinkDetail } from "@/components/link-detail"

export const metadata: Metadata = { title: "Link performance" }

export default function LinkDetailPage() {
  return <LinkDetail />
}
