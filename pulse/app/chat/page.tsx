"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import ChatBubble from "@/components/ChatBubble";
import VoiceButton from "@/components/VoiceButton";
import { Send } from "lucide-react";
import { useSpeechInput, speak } from "@/utils/speech";
import { motion } from "framer-motion";

export default function ChatPage() {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userId] = useState("user-" + Math.random().toString(36).substr(2, 9));
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const messages = useQuery(api.messages.list, { user: userId }) || [];
  const sendMessage = useMutation(api.messages.send);

  const { transcript, listening, toggleListening, resetTranscript } =
    useSpeechInput();

  useEffect(() => {
    if (transcript) {
      setInput(transcript);
    }
  }, [transcript]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (text?: string) => {
    const messageText = text || input;
    if (!messageText.trim() || isLoading) return;

    setInput("");
    resetTranscript();
    setIsLoading(true);

    try {
      // Save user message
      await sendMessage({
        user: userId,
        role: "user",
        text: messageText,
      });

      // Get AI response
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: messageText }),
      });

      const data = await response.json();
      const aiResponse = data.response;

      // Save AI message
      await sendMessage({
        user: userId,
        role: "assistant",
        text: aiResponse,
      });

      // Speak the response
      speak(aiResponse);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceToggle = () => {
    toggleListening();
    if (listening && transcript) {
      handleSend(transcript);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-4xl mx-auto p-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-lg p-6 mb-4"
      >
        <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          AI Health Assistant
        </h1>
        <p className="text-gray-600 mt-2">
          Ask me anything about your health
        </p>
      </motion.div>

      <div className="flex-1 bg-white rounded-2xl shadow-lg p-6 overflow-y-auto mb-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            <p>Start a conversation...</p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <ChatBubble
              key={msg._id}
              role={msg.role}
              text={msg.text}
              index={idx}
            />
          ))
        )}
        {isLoading && (
          <div className="flex gap-2 items-center text-gray-500">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-4 flex gap-3 items-center">
        <VoiceButton isListening={listening} onClick={handleVoiceToggle} />
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleSend()}
          placeholder="Type your message..."
          className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
          disabled={isLoading}
        />
        <motion.button
          onClick={() => handleSend()}
          disabled={isLoading || !input.trim()}
          className="p-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl hover:from-indigo-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
          whileTap={{ scale: 0.95 }}
        >
          <Send className="w-5 h-5" />
        </motion.button>
      </div>
    </div>
  );
}