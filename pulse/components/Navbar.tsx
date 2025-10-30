"use client";

import Link from "next/link";
import { Activity, MessageSquare, Calendar, FileText, LogOut } from "lucide-react";
import { usePathname } from "next/navigation";
import { useAuthActions } from "@convex-dev/auth/react";
import { Authenticated, Unauthenticated } from "convex/react";

export default function Navbar() {
  const pathname = usePathname();
  const { signOut } = useAuthActions();

  const links = [
    { href: "/", label: "Home", icon: <Activity className="w-4 h-4" /> },
  ];

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex space-x-8">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`inline-flex items-center gap-2 px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? "border-indigo-500 text-gray-900"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                }`}
              >
                {link.icon}
                {link.label}
              </Link>
            ))}
          </div>
          
          <div className="flex items-center">
            <Authenticated>
              <button
                onClick={() => void signOut()}
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:text-gray-900 transition"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </Authenticated>
            
            <Unauthenticated>
              <Link
                href="/auth"
                className="px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition"
              >
                Sign In
              </Link>
            </Unauthenticated>
          </div>
        </div>
      </div>
    </nav>
  );
}