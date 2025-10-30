import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ConvexClientProvider } from "./ConvexClientProvider";
import Navbar from "@/components/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Pulse - AI Health Assistant",
  description: "Your intelligent voice-enabled health companion",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ConvexClientProvider>
          <Navbar />
          <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
            {children}
          </main>
        </ConvexClientProvider>
      </body>
    </html>
  );
}