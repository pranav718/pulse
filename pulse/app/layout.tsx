import { Instrument_Serif } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import { ConvexClientProvider } from "./ConvexClientProvider";

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: ["400"],
});

export const metadata = {
  title: "Pulse - AI Health Assistant",
  description: "Voice and chat-based wellness companion",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={instrumentSerif.className}>
          <ConvexClientProvider>
            {children}
          </ConvexClientProvider>
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  );
}