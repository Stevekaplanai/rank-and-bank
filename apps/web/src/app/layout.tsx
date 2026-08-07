import type { Metadata } from "next";
import { Syne, DM_Sans } from "next/font/google";
import { AppProviders } from "@/components/AppProviders";
import { Header } from "@/components/Header";
import "./globals.css";

const display = Syne({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["600", "700", "800"],
});

const sans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Rank & Bank — Miami Conviction Markets",
  description:
    "Ryan ranks Miami condos. The community backs them with Solana bonding-curve tokens. The chain settles everything.",
  openGraph: {
    title: "Rank & Bank",
    description: "Zillow meets pump.fun — Miami real estate conviction markets on Solana.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${display.variable} ${sans.variable} min-h-screen font-sans antialiased`}
      >
        <AppProviders>
          <Header />
          <main className="mx-auto min-h-[calc(100vh-64px)] max-w-6xl px-4 py-6 sm:py-10">
            {children}
          </main>
          <footer className="border-t border-white/10 py-8 text-center text-xs text-mist/60">
            Rank & Bank · Solana devnet · Ryan ranks them. The community backs
            them. The chain settles everything.
          </footer>
        </AppProviders>
      </body>
    </html>
  );
}
