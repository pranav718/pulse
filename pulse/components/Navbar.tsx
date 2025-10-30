// components/Navbar.tsx - REPLACE
"use client";

import Link from "next/link";
import { Activity } from "lucide-react";
import { usePathname } from "next/navigation";
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth } from "convex/react";

export default function Navbar() {
  const pathname = usePathname();
  const { signOut } = useAuthActions();
  const { isAuthenticated, isLoading } = useConvexAuth();

  const links = [
    { href: "/", label: "Home", icon: <Activity className="w-4 h-4" /> },
  ];

  if (isLoading) {
    return (
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Activity className="w-6 h-6 text-indigo-500" />
              <span className="font-bold text-lg text-indigo-700 tracking-tight">Pulse</span>
            </div>
            <span className="text-sm text-gray-500">Loading...</span>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand/Logo */}
          <div className="flex items-center gap-3">
            <Activity className="w-6 h-6 text-indigo-500" />
            <span className="font-bold text-lg text-indigo-700 tracking-tight">Serenity</span>
          </div>

          {/* Navigation Links */}
          <div className="flex space-x-6">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`inline-flex items-center gap-2 px-2 py-1 border-b-2 text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? "border-indigo-500 text-indigo-700"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-indigo-600"
                }`}
              >
                {link.icon}
                {link.label}
              </Link>
            ))}
          </div>

          {/* Auth Actions */}
          <div className="flex items-center">
            {isAuthenticated ? (
              <button
                onClick={() => void signOut()}
                className="px-4 py-2 text-sm font-semibold text-indigo-700 border border-indigo-200 rounded-full hover:bg-indigo-50 transition"
              >
                Sign Out
              </button>
            ) : (
              <Link
                href="/auth"
                className="px-4 py-2 bg-indigo-500 text-white rounded-full font-semibold hover:bg-indigo-600 transition"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}