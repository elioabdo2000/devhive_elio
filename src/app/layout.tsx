import type { Metadata } from "next";
import { Space_Grotesk, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import Navbar from "@/components/Navbar";
import Providers from "@/components/Providers";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  weight: ["500", "600", "700"],
});

const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  variable: "--font-plex-sans",
  weight: ["400", "500", "600"],
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-plex-mono",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "DevHive — A community for developers",
  description: "Publish blogs, join communities, and connect with developers.",
};

// Deliberately NOT calling auth() here. Reading the session cookie in the
// root layout would opt every route in the app into fully dynamic
// rendering (Next.js forces the whole tree under a layout that reads a
// dynamic API to render per-request), which would silently defeat ISR on
// /blogs and /blogs/[slug]. Navbar instead reads the session client-side
// via useSession(), so pages below keep whatever rendering mode they
// declare themselves (static/ISR for blogs, dynamic for communities/profile).
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${plexSans.variable} ${plexMono.variable}`}>
      <body className="min-h-screen bg-paper text-ink antialiased">
        <Providers>
          <Navbar />
          <main>{children}</main>
        </Providers>
      </body>
    </html>
  );
}
