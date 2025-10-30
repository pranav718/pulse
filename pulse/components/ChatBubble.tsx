"use client";

import { motion } from "framer-motion";
import { User, Bot } from "lucide-react";

interface ChatBubbleProps {
  role: "user" | "assistant";
  text: string;
  index: number;
}

export default function ChatBubble({ role, text, index }: ChatBubbleProps) {
  const isUser = role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
    >
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser
            ? "bg-gradient-to-r from-indigo-500 to-purple-500"
            : "bg-gradient-to-r from-pink-500 to-rose-500"
        }`}
      >
        {isUser ? (
          <User className="w-5 h-5 text-white" />
        ) : (
          <Bot className="w-5 h-5 text-white" />
        )}
      </div>
      <div
        className={`max-w-md px-4 py-3 rounded-2xl ${
          isUser
            ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white"
            : "bg-white shadow-md text-gray-800"
        }`}
      >
        <p className="text-sm whitespace-pre-wrap">{text}</p>
      </div>
    </motion.div>
  );
}