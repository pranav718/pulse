"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { MessageSquare, Calendar, FileText, Activity } from "lucide-react";

export default function Home() {
  const features = [
    {
      icon: <MessageSquare className="w-8 h-8" />,
      title: "AI Chat",
      description: "Talk to your health assistant",
      href: "/chat",
      gradient: "from-blue-500 to-indigo-500",
    },
    {
      icon: <Calendar className="w-8 h-8" />,
      title: "Appointments",
      description: "Book and manage appointments",
      href: "/appointments",
      gradient: "from-purple-500 to-pink-500",
    },
    {
      icon: <FileText className="w-8 h-8" />,
      title: "Reports",
      description: "Upload and analyze health reports",
      href: "/reports",
      gradient: "from-pink-500 to-rose-500",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-12"
      >
        <div className="flex items-center justify-center mb-4">
          <Activity className="w-16 h-16 text-indigo-600" />
        </div>
        <h1 className="text-6xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
          Pulse
        </h1>
        <p className="text-xl text-gray-600">
          Your AI-powered health assistant
        </p>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-6 max-w-5xl w-full">
        {features.map((feature, index) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
          >
            <Link href={feature.href}>
              <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 cursor-pointer">
                <div
                  className={`bg-gradient-to-r ${feature.gradient} w-16 h-16 rounded-xl flex items-center justify-center text-white mb-4`}
                >
                  {feature.icon}
                </div>
                <h2 className="text-2xl font-bold mb-2">{feature.title}</h2>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}