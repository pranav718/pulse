"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
    ArrowRight,
    Menu,
    Mic,
    User,
    X
} from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";


import { api } from "@/convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";
import { speak, useSpeechInput } from "@/utils/speech";
import { useMutation, useQuery } from "convex/react";

interface TypingMessage {
  id: string;
  type: "ai";
  content: string;
  isTyping: boolean;
}

export default function ChatPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true); 
  const [isChatActive, setIsChatActive] = useState(true); 
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [input, setInput] = useState(""); 
  const [isLoading, setIsLoading] = useState(false);
  const [userId] = useState("user-" + Math.random().toString(36).substr(2, 9)); 
  const [typingIndicator, setTypingIndicator] = useState<TypingMessage | null>(null);

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
  }, [messages, typingIndicator]); 

  const handleSendMessage = async () => {
    const messageText = input;
    if (!messageText.trim() || isLoading) return;

    setInput("");
    resetTranscript();
    setIsLoading(true);

    try {
      await sendMessage({
        user: userId,
        role: "user",
        text: messageText,
      });

      setTypingIndicator({
        id: "typing-id",
        type: "ai",
        content: "",
        isTyping: true,
      });
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: messageText }),
      });

      if (!response.ok) {
        throw new Error("API request failed");
      }

      const { response: aiText } = await response.json();

      await sendMessage({
        user: userId,
        role: "assistant",
        text: aiText,
      });

      speak(aiText);

    } catch (error) {
      console.error("Error sending message:", error);
      await sendMessage({
        user: userId,
        role: "assistant",
        text: "Sorry, I'm having trouble connecting. Please try again.",
      });
    } finally {
      setIsLoading(false);
      setTypingIndicator(null); 
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const groupedChats = messages.reduce((groups: any, chat) => {
    const date = new Date(chat._creationTime);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const isYesterday = date.toDateString() === new Date(now.setDate(now.getDate() - 1)).toDateString();
    const isThisWeek = date > new Date(now.setDate(now.getDate() - 6));

    if (isToday) groups.today.push(chat);
    else if (isYesterday) groups.yesterday.push(chat);
    else if (isThisWeek) groups.thisWeek.push(chat);
    else groups.older.push(chat);

    return groups;
  }, {
    today: [],
    yesterday: [],
    thisWeek: [],
    older: [],
  });

  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden flex">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: sidebarOpen ? 256 : 0 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="relative z-20 bg-white/70 backdrop-blur-md border-r border-blue-100/50 flex flex-col overflow-hidden"
      >
        <div className="p-4 space-y-6 flex-1 overflow-y-auto">
          <h2 className="text-sm font-serif font-light text-foreground tracking-wide">Previous Chats</h2>
          <AnimatePresence>
            {groupedChats.today.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="space-y-2"
              >
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      <div className="relative z-10 flex-1 flex flex-col">
        <div className="absolute top-6 left-6 z-30">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-12 h-12 rounded-2xl bg-white/80 backdrop-blur-md border border-blue-100/50 flex items-center justify-center hover:bg-white/90 transition-all hover:shadow-lg"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </motion.button>
        </div>

        <div className="absolute top-6 right-6 z-30">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center hover:shadow-lg transition-all"
          >
            <User className="w-5 h-5 text-white" />
          </motion.button>

          <AnimatePresence>
            {userMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 mt-2 w-48 bg-white/90 backdrop-blur-md rounded-2xl shadow-lg border border-blue-100/50 overflow-hidden"
              >
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key="chat-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="flex-1 flex flex-col overflow-hidden"
          >
            <div className="flex-1 overflow-y-auto px-6 py-24 flex justify-center"> {/* Added padding-top */}
              <div className="w-full max-w-2xl space-y-4">
            
                {messages.map((msg: Doc<"messages">, index) => (
                  <motion.div
                    key={msg._id} 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0 }}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className={`max-w-xs px-4 py-3 rounded-2xl font-serif text-sm ${
                        msg.role === "user" 
                          ? "bg-blue-500 text-white rounded-br-none"
                          : "bg-white/80 backdrop-blur-md text-foreground border border-blue-100/50 rounded-bl-none"
                      }`}
                    >
                      {msg.text} 
                    </motion.div>
                  </motion.div>
                ))}
                {typingIndicator && (
                  <motion.div
                    key={typingIndicator.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex justify-start"
                  >
                    <motion.div
                      className="max-w-xs px-4 py-3 rounded-2xl font-serif text-sm bg-white/80 backdrop-blur-md text-foreground border border-blue-100/50 rounded-bl-none"
                    >
                      <div className="flex gap-1 items-center h-6">
                        <motion.span
                          animate={{ y: [0, -4, 0] }}
                          transition={{ duration: 0.6, repeat: Number.POSITIVE_INFINITY }}
                          className="typing-dot w-2 h-2 bg-foreground rounded-full"
                        />
                        <motion.span
                          animate={{ y: [0, -4, 0] }}
                          transition={{ duration: 0.6, repeat: Number.POSITIVE_INFINITY, delay: 0.1 }}
                          className="typing-dot w-2 h-2 bg-foreground rounded-full"
                        />
                        <motion.span
                          animate={{ y: [0, -4, 0] }}
                          transition={{ duration: 0.6, repeat: Number.POSITIVE_INFINITY, delay: 0.2 }}
                          className="typing-dot w-2 h-2 bg-foreground rounded-full"
                        />
                      </div>
                    </motion.div>
                  </motion.div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="px-6 py-6 border-t border-blue-100/50 bg-white/30 backdrop-blur-md flex justify-center"
            >
              <div className="w-full max-w-2xl bg-white/80 backdrop-blur-md rounded-3xl shadow-2xl border border-blue-100/50 p-6 flex gap-3 items-center">
                <input
                  type="text"
                  placeholder="Ask me anything..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1 bg-transparent text-foreground placeholder-muted-foreground focus:outline-none font-serif text-base"
                  autoFocus
                  disabled={isLoading}
                />
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={toggleListening} 
                  className={`relative w-10 h-10 ${
                    listening ? "bg-red-500 hover:bg-red-600" : "bg-blue-500 hover:bg-blue-600" // 2. Add listening state
                  } text-white rounded-full p-2 transition-colors flex items-center justify-center`}
                >
                  <Mic className="w-5 h-5" /> 
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSendMessage}
                  disabled={isLoading || !input.trim()}
                  className="bg-blue-500 hover:bg-blue-600 text-white rounded-full p-2 transition-colors disabled:opacity-50"
                >
                  <ArrowRight className="w-5 h-5" />
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}