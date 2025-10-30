// Your new, correct app/layout.tsx
import type { Metadata } from "next";
import { Instrument_Serif } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css"; // This file has the background styles
import { ConvexClientProvider } from "./ConvexClientProvider";

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: ["400"],
});

export const metadata: Metadata = {
  title: "Serenity - Your Digital Health Assistant", // v0 Title
  description: "Voice and chat-based wellness companion",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={instrumentSerif.className}>
        {/* We provide Convex, but no Navbar or other layout */}
        <ConvexClientProvider>
          {children} 
        </ConvexClientProvider>
        <Analytics />
      </body>
    </html>
  );
}