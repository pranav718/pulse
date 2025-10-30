"use client";

import { SignInForm } from "@/components/SignInForm";

export default function AuthPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <SignInForm />
    </div>
  );
}