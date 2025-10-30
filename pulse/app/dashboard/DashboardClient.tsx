// app/dashboard/DashboardClient.tsx
"use client";

import { useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Activity,
  MessageSquare,
  FileText,
  Calendar,
  LogOut,
  ChevronRight,
} from "lucide-react";
import Image from "next/image";

interface DashboardClientProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export default function DashboardClient({ user }: DashboardClientProps) {
  const router = useRouter();
  const { signOut } = useClerk();

  const handleSignOut = () => {
    signOut(() => router.push("/auth"));
  };

  const stats = [
    { label: "Total Chats", value: "12", icon: MessageSquare, color: "from-blue-400 to-indigo-500" },
    { label: "Reports Uploaded", value: "8", icon: FileText, color: "from-purple-400 to-pink-500" },
    { label: "Appointments", value: "3", icon: Calendar, color: "from-green-400 to-emerald-500" },
  ];

  const quickActions = [
    { label: "New Chat", icon: MessageSquare, href: "/chat" },
    { label: "Upload Report", icon: FileText, href: "/chat?action=upload" },
    { label: "Book Appointment", icon: Calendar, href: "/chat?action=appointment" },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background - Same as chat */}
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

      {/* Content */}
      <div className="relative z-10 min-h-screen p-6">
        {/* Header */}
        <div className="max-w-6xl mx-auto mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {user.image ? (
                <Image
                  src={user.image}
                  alt={user.name || "User"}
                  width={64}
                  height={64}
                  className="rounded-2xl"
                />
              ) : (
                <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-2xl flex items-center justify-center">
                  <Activity className="w-8 h-8 text-white" />
                </div>
              )}
              <div>
                <h1 className="text-3xl font-serif font-light text-foreground">
                  Welcome back, {user.name?.split(" ")[0] || "User"}
                </h1>
                <p className="text-foreground/60 font-serif text-sm">
                  {user.email}
                </p>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSignOut}
              className="px-6 py-3 bg-white/80 backdrop-blur-md border border-blue-100/50 rounded-xl font-serif text-sm text-foreground hover:shadow-lg transition-all flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </motion.button>
          </div>
        </div>

        {/* Back to Chat Button */}
        <div className="max-w-6xl mx-auto mb-6">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push("/chat")}
            className="px-6 py-3 bg-gradient-to-r from-blue-400 to-indigo-500 text-white rounded-xl font-serif text-sm hover:shadow-lg transition-all flex items-center gap-2"
          >
            <MessageSquare className="w-4 h-4" />
            Back to Chat
          </motion.button>
        </div>

        {/* Stats Grid */}
        <div className="max-w-6xl mx-auto mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/80 backdrop-blur-md rounded-2xl border border-blue-100/50 p-6 hover:shadow-lg transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                  <ChevronRight className="w-5 h-5 text-foreground/30" />
                </div>
                <h3 className="text-3xl font-serif font-light text-foreground mb-1">
                  {stat.value}
                </h3>
                <p className="text-sm text-foreground/60 font-serif">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="max-w-6xl mx-auto mb-8">
          <h2 className="text-xl font-serif font-light text-foreground mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {quickActions.map((action, index) => (
              <motion.button
                key={action.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                onClick={() => router.push(action.href)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="bg-white/80 backdrop-blur-md rounded-2xl border border-blue-100/50 p-6 hover:shadow-lg transition-all flex items-center gap-4"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center">
                  <action.icon className="w-6 h-6 text-white" />
                </div>
                <span className="font-serif text-foreground">{action.label}</span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="max-w-6xl mx-auto">
          <h2 className="text-xl font-serif font-light text-foreground mb-4">
            Recent Activity
          </h2>
          <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-blue-100/50 p-6">
            <p className="text-foreground/60 font-serif text-sm text-center py-8">
              No recent activity yet. Start a conversation to see your history here!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}