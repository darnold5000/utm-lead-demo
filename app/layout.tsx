import type { Metadata } from "next";
import { DM_Sans, IBM_Plex_Mono } from "next/font/google";
import { DemoProvider } from "@/components/demo-provider";
import { allowIndexing } from "@/lib/seo";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: {
    default: "UTM Lead Tracking Demo",
    template: "%s · Signal Works Digital",
  },
  description:
    "A Signal Works Digital sales demonstration that connects sample ad clicks to leads, appointments, and paying customers. All figures are fictional.",
  robots: allowIndexing
    ? { index: true, follow: true, googleBot: { index: true, follow: true } }
    : { index: false, follow: false, googleBot: { index: false, follow: false } },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${dmSans.variable} ${ibmPlexMono.variable} h-full antialiased`}>
      <body className="min-h-full bg-[#f4f6f8] text-[#0c0d10]">
        <DemoProvider>{children}</DemoProvider>
      </body>
    </html>
  );
}
