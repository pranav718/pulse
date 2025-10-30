import type { Metadata } from "next";
import { Instrument_Serif } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { ConvexClientProvider } from "./ConvexClientProvider";
import Navbar from "@/components/Navbar";

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: ["400"],
});

export const metadata: Metadata = {
  title: "Pulse - AI Health Assistant",
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
        <ConvexClientProvider>
          <Navbar />
          {children}
        </ConvexClientProvider>
        <Analytics />
      </body>
    </html>
  );
}