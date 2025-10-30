"use client";

import type React from "react";
import { useState, useRef, useEffect } from "react";
import {
  Mic,
  ArrowRight,
  Menu,
  X,
  User,
  LogOut,
  Settings,
  UserCircle,
  Volume2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";

import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Doc } from "../convex/_generated/dataModel";
import { useSpeechInput, speak } from "../utils/speech";

interface TypingMessage {
  id: string;
  type: "ai";
  content: string;
  isTyping: boolean;
}

interface ChatItem {
  id: number;
  title: string;
  timestamp: Date;
}

export default function Home() {
  // --- States ---
  const [message, setMessage] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isChatActive, setIsChatActive] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // --- Mic Visualizer States ---
  const [isRecording, setIsRecording] = useState(false);
  const [visualizerBars, setVisualizerBars] = useState([0, 0, 0, 0]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // --- Message States ---
  const [isLoading, setIsLoading] = useState(false);
  const [userId] = useState("user-" + Math.random().toString(36).substr(2, 9));
  const [typingIndicator, setTypingIndicator] = useState<TypingMessage | null>(null);

  // --- Convex Hooks ---
  const convexMessages = useQuery(api.messages.list, { user: userId }) || [];
  const sendMessage = useMutation(api.messages.send);

  // --- Speech Hook ---
  const { transcript, listening, toggleListening, resetTranscript } = useSpeechInput();

  // --- Effects ---
  useEffect(() => {
    if (transcript) {
      setMessage(transcript);
    }
  }, [transcript]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [convexMessages, typingIndicator]);

  // --- Visualizer Logic ---
  const updateVisualizer = () => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    const barCount = 4;
    const barWidth = Math.floor(dataArray.length / barCount);
    const newBars = [];

    for (let i = 0; i < barCount; i++) {
      const start = i * barWidth;
      const end = start + barWidth;
      const slice = dataArray.slice(start, end);
      const average = slice.reduce((a, b) => a + b) / slice.length;
      newBars.push(average / 255);
    }

    setVisualizerBars(newBars);
    animationFrameRef.current = requestAnimationFrame(updateVisualizer);
  };

  // --- Mic Click Handler ---
  const handleMicClick = async () => {
    toggleListening();

    if (isRecording) {
      setIsRecording(false);
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      setVisualizerBars([0, 0, 0, 0]);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;
      const analyser = audioContext.createAnalyser();
      analyserRef.current = analyser;
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.start();
      setIsRecording(true);
      updateVisualizer();
    } catch (error) {
      console.error("Error accessing microphone:", error);
    }
  };

  // --- Send Message Handler ---
  const handleSendMessage = async () => {
    const messageText = message.trim();
    if (!messageText || isLoading) return;

    if (!isChatActive) {
      setIsChatActive(true);
    }

    setMessage("");
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

      if (!response.ok) throw new Error("API request failed");
      const { response: aiText } = await response.json();

      await sendMessage({
        user: userId,
        role: "assistant",
        text: aiText,
      });
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

  return (
    <main className="relative min-h-screen overflow-hidden flex">
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

      {/* Sidebar */}
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: sidebarOpen ? 256 : 0 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="relative z-20 bg-white/70 backdrop-blur-md border-r border-blue-100/50 flex flex-col overflow-hidden"
      >
        <div className="p-4 space-y-6 flex-1 overflow-y-auto">
          <h2 className="text-sm font-serif font-light text-foreground tracking-wide">
            Previous Chats
          </h2>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="relative z-10 flex-1 flex flex-col">
        {/* Top Controls */}
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
                <motion.button
                  whileHover={{ backgroundColor: "rgba(59, 130, 246, 0.1)" }}
                  className="w-full px-4 py-3 text-left text-sm font-serif text-foreground flex items-center gap-3 transition-colors"
                >
                  <UserCircle className="w-4 h-4" />
                  Profile
                </motion.button>
                <motion.button
                  whileHover={{ backgroundColor: "rgba(59, 130, 246, 0.1)" }}
                  className="w-full px-4 py-3 text-left text-sm font-serif text-foreground flex items-center gap-3 transition-colors border-t border-blue-100/30"
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </motion.button>
                <motion.button
                  whileHover={{ backgroundColor: "rgba(239, 68, 68, 0.1)" }}
                  className="w-full px-4 py-3 text-left text-sm font-serif text-red-600 flex items-center gap-3 transition-colors border-t border-blue-100/30"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Main Views */}
        <AnimatePresence mode="wait">
          {isChatActive ? (
            // CHAT VIEW
            <motion.div
              key="chat-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex-1 flex flex-col overflow-hidden"
            >
              <div className="flex-1 overflow-y-auto px-6 py-24 flex justify-center">
                <div className="w-full max-w-2xl space-y-4">
                  {/* Messages */}
                  {convexMessages.map((msg: Doc<"messages">) => (
                    <motion.div
                      key={msg._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className={`flex gap-2 ${
                        msg.role === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      {/* Read Aloud Button */}
                      {msg.role === "assistant" && (
                        <motion.button
                          onClick={() => speak(msg.text)}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className="w-8 h-8 rounded-full bg-white/80 backdrop-blur-md text-foreground/50 hover:text-foreground transition-colors border border-blue-100/50 flex-shrink-0 flex items-center justify-center mt-1"
                        >
                          <Volume2 className="w-4 h-4" />
                        </motion.button>
                      )}

                      {/* Message Bubble - FIXED */}
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        className={`max-w-xs px-4 py-3 rounded-2xl font-serif text-sm ${
                          msg.role === "user"
                            ? "bg-blue-500 text-white rounded-br-none"
                            : "bg-white/80 backdrop-blur-md text-foreground border border-blue-100/50 rounded-bl-none"
                        } prose prose-sm prose-p:my-0`}
                      >
                        <ReactMarkdown>{msg.text}</ReactMarkdown>
                      </motion.div>
                    </motion.div>
                  ))}

                  {/* Typing Indicator */}
                  {typingIndicator && (
                    <motion.div
                      key="typing-id"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="flex justify-start"
                    >
                      <motion.div className="max-w-xs px-4 py-3 rounded-2xl font-serif text-sm bg-white/80 backdrop-blur-md text-foreground border border-blue-100/50 rounded-bl-none">
                        <div className="flex gap-1 items-center h-6">
                          <motion.span
                            animate={{ y: [0, -4, 0] }}
                            transition={{
                              duration: 0.6,
                              repeat: Number.POSITIVE_INFINITY,
                            }}
                            className="w-2 h-2 bg-foreground rounded-full"
                          />
                          <motion.span
                            animate={{ y: [0, -4, 0] }}
                            transition={{
                              duration: 0.6,
                              repeat: Number.POSITIVE_INFINITY,
                              delay: 0.1,
                            }}
                            className="w-2 h-2 bg-foreground rounded-full"
                          />
                          <motion.span
                            animate={{ y: [0, -4, 0] }}
                            transition={{
                              duration: 0.6,
                              repeat: Number.POSITIVE_INFINITY,
                              delay: 0.2,
                            }}
                            className="w-2 h-2 bg-foreground rounded-full"
                          />
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Input Area (Chat View) */}
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
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="flex-1 bg-transparent text-foreground placeholder-muted-foreground focus:outline-none font-serif text-base"
                    autoFocus
                    disabled={isLoading}
                  />
                  {/* Mic Button */}
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleMicClick}
                    className={`relative w-10 h-10 ${
                      isRecording ? "bg-red-500" : "bg-blue-500"
                    } hover:bg-blue-600 text-white rounded-full p-2 transition-colors flex items-center justify-center`}
                  >
                    {isRecording ? (
                      <div className="flex gap-1 items-center justify-center h-full">
                        {visualizerBars.map((bar, i) => (
                          <motion.div
                            key={i}
                            animate={{ height: `${Math.max(4, bar * 20)}px` }}
                            transition={{ duration: 0.1 }}
                            className="w-1 bg-white rounded-full"
                            style={{ minHeight: "4px" }}
                          />
                        ))}
                      </div>
                    ) : (
                      <Mic className="w-5 h-5" />
                    )}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSendMessage}
                    disabled={isLoading || !message.trim()}
                    className="bg-blue-500 hover:bg-blue-600 text-white rounded-full p-2 transition-colors disabled:opacity-50"
                  >
                    <ArrowRight className="w-5 h-5" />
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          ) : (
            // INITIAL VIEW
            <motion.div
              key="initial-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex-1 flex flex-col items-center justify-center px-6"
            >
              <div className="w-full max-w-2xl space-y-12">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="text-center"
                >
                  <h1 className="text-6xl font-serif font-light text-foreground tracking-wide">
                    Pulse
                  </h1>
                </motion.div>

                {/* Input Box */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="bg-white/80 backdrop-blur-md rounded-3xl shadow-2xl border border-blue-100/50 p-6 flex gap-3 items-center"
                >
                  <input
                    type="text"
                    placeholder="Ask me anything..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="flex-1 bg-transparent text-foreground placeholder-muted-foreground focus:outline-none font-serif text-base"
                    autoFocus
                    disabled={isLoading}
                  />
                  {/* Mic Button */}
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleMicClick}
                    className={`relative w-10 h-10 ${
                      isRecording ? "bg-red-500" : "bg-blue-500"
                    } hover:bg-blue-600 text-white rounded-full p-2 transition-colors flex items-center justify-center`}
                  >
                    {isRecording ? (
                      <div className="flex gap-1 items-center justify-center h-full">
                        {visualizerBars.map((bar, i) => (
                          <motion.div
                            key={i}
                            animate={{ height: `${Math.max(4, bar * 20)}px` }}
                            transition={{ duration: 0.1 }}
                            className="w-1 bg-white rounded-full"
                            style={{ minHeight: "4px" }}
                          />
                        ))}
                      </div>
                    ) : (
                      <Mic className="w-5 h-5" />
                    )}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSendMessage}
                    disabled={isLoading || !message.trim()}
                    className="bg-blue-500 hover:bg-blue-600 text-white rounded-full p-2 transition-colors disabled:opacity-50"
                  >
                    <ArrowRight className="w-5 h-5" />
                  </motion.button>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}