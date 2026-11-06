import type { Metadata } from "next";
import { SimulatorView } from "@/components/simulator-view";

export const metadata: Metadata = { title: "Campaign simulator" };

export default function SimulatorPage() {
  return <SimulatorView />;
}
