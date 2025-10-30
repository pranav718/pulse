// app/auth/page.tsx
"use client";

import { SignIn } from "@clerk/nextjs";
import { motion } from "framer-motion";

export default function AuthPage() {
  return (
    <div className="relative min-h-screen overflow-hidden flex items-center justify-center p-4">
      {/* Background */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background: "radial-gradient(125% 125% at 50% 90%, #ffffff 40%, #6366f1 100%)",
        }}
      />
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-1">
        <div className="absolute top-20 left-10 w-96 h-96 bg-blue-300 rounded-full blur-pulse opacity-40" />
        <div className="absolute bottom-32 right-20 w-80 h-80 bg-blue-200 rounded-full blur-pulse-slow opacity-35" />
      </div>

      {/* Clerk Sign In Component */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10"
      >
        <SignIn 
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "bg-white/80 backdrop-blur-md shadow-2xl border border-blue-100/50 rounded-3xl",
              headerTitle: "font-serif",
              headerSubtitle: "font-serif",
              socialButtonsBlockButton: "font-serif border-2 border-blue-100",
              formButtonPrimary: "bg-gradient-to-r from-blue-400 to-indigo-500 font-serif",
              footerActionLink: "text-blue-500 font-serif",
            }
          }}
          routing="path"
          path="/auth"
          signUpUrl="/auth"
          afterSignInUrl="/dashboard"
          afterSignUpUrl="/dashboard"
        />
      </motion.div>
    </div>
  );
}