"use client";

import { Mic, MicOff } from "lucide-react";
import { motion } from "framer-motion";

interface VoiceButtonProps {
  isListening: boolean;
  onClick: () => void;
}

export default function VoiceButton({ isListening, onClick }: VoiceButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      className={`p-4 rounded-full transition-all ${
        isListening
          ? "bg-red-500 hover:bg-red-600 animate-pulse-slow"
          : "bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
      } text-white shadow-lg`}
      whileTap={{ scale: 0.95 }}
      whileHover={{ scale: 1.05 }}
    >
      {isListening ? (
        <MicOff className="w-6 h-6" />
      ) : (
        <Mic className="w-6 h-6" />
      )}
    </motion.button>
  );
}