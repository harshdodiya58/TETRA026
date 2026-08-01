import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "CurriPulse AI — Syllabus audit & market alignment for Indian higher education",
    template: "%s · CurriPulse AI",
  },
  description:
    "Audit university syllabi against live Indian tech hiring data and generate a 15% micro-augmentation patch that clears Board of Studies fast-track — OBE, Bloom's Taxonomy, and NBA compliant.",
  keywords: [
    "syllabus audit",
    "Outcome-Based Education",
    "NBA accreditation",
    "NAAC",
    "Board of Studies",
    "curriculum alignment",
    "Indian higher education",
  ],
  openGraph: {
    title: "CurriPulse AI",
    description:
      "Bridge the 3-year higher education gap in 30 seconds. Syllabus audit and BoS fast-track patch generation.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-base text-ink">{children}</body>
    </html>
  );
}
