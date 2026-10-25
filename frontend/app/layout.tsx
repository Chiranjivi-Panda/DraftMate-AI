import type { Metadata } from "next";
import { Inter, Playfair_Display, Source_Serif_4, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/ThemeProvider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const display = Playfair_Display({ subsets: ["latin"], variable: "--font-display" });
const serif = Source_Serif_4({ subsets: ["latin"], variable: "--font-serif" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "DraftMate Studio — AI Legal Drafting, Verification & Voice",
  description: "Draft in your style. Verify every authority. Command it by voice.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${display.variable} ${serif.variable} ${mono.variable}`}>
      <body>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
