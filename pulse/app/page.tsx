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
  Plus,
  Image as ImageIcon,
  File,
  Paperclip,
  Loader2,
  MessageSquare,
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

interface AttachedFile {
  file: File;
  preview?: string;
  type: "image" | "file";
}

interface ChatSession {
  id: string;
  title: string;
  timestamp: Date;
  userId: string;
}

export default function Home() {
  // --- States ---
  const [message, setMessage] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isChatActive, setIsChatActive] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [attachMenuOpen, setAttachMenuOpen] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [isProcessingOCR, setIsProcessingOCR] = useState(false);
  const [ocrController, setOcrController] = useState<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Chat Session States ---
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);

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
  const convexMessages = useQuery(
    api.messages.list,
    currentChatId ? { user: userId, chatId: currentChatId } : "skip"
  ) || [];
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

  // Load chat sessions from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`chatSessions-${userId}`);
    if (saved) {
      const sessions = JSON.parse(saved).map((s: any) => ({
        ...s,
        timestamp: new Date(s.timestamp),
      }));
      setChatSessions(sessions);
    }
  }, [userId]);

  // Save chat sessions to localStorage
  useEffect(() => {
    if (chatSessions.length > 0) {
      localStorage.setItem(`chatSessions-${userId}`, JSON.stringify(chatSessions));
    }
  }, [chatSessions, userId]);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".user-menu-container")) {
        setUserMenuOpen(false);
      }
      if (!target.closest(".attach-menu-container")) {
        setAttachMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  // --- OCR Function ---
  const performOCR = async (file: File, controller: AbortController): Promise<string> => {
    try {
      const Tesseract = await import("tesseract.js");
      const result = await Tesseract.recognize(file, "eng", {
        logger: (m) => {
          if (controller.signal.aborted) {
            throw new Error("OCR cancelled");
          }
          console.log(m);
        },
      });
      return result.data.text;
    } catch (error) {
      if (controller.signal.aborted) {
        console.log("OCR cancelled by user");
        return "";
      }
      console.error("OCR Error:", error);
      return "";
    }
  };

  // --- Cancel OCR ---
  const cancelOCR = () => {
    if (ocrController) {
      ocrController.abort();
      setOcrController(null);
    }
    setIsProcessingOCR(false);
    setAttachedFiles([]);
  };

  // --- File Upload Handlers ---
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles: AttachedFile[] = [];
    const controller = new AbortController();
    setOcrController(controller);
    setIsProcessingOCR(true);

    try {
      for (let i = 0; i < files.length; i++) {
        if (controller.signal.aborted) break;

        const file = files[i];
        const isImage = file.type.startsWith("image/");

        if (isImage) {
          const preview = URL.createObjectURL(file);
          newFiles.push({ file, preview, type: "image" });

          // Perform OCR on image
          const text = await performOCR(file, controller);
          if (text.trim() && !controller.signal.aborted) {
            setMessage((prev) => prev + (prev ? "\n\n" : "") + `[Extracted from image]:\n${text}`);
          }
        } else {
          newFiles.push({ file, type: "file" });
        }
      }

      if (!controller.signal.aborted) {
        setAttachedFiles((prev) => [...prev, ...newFiles]);
      }
    } catch (error) {
      console.error("Error processing files:", error);
    } finally {
      setIsProcessingOCR(false);
      setOcrController(null);
      setAttachMenuOpen(false);

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // --- Remove File Handler ---
  const removeFile = (index: number) => {
    setAttachedFiles((prev) => {
      const newFiles = [...prev];
      if (newFiles[index].preview) {
        URL.revokeObjectURL(newFiles[index].preview!);
      }
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  // --- New Chat Handler ---
  const handleNewChat = () => {
    // Close all menus
    setUserMenuOpen(false);
    setAttachMenuOpen(false);
    
    setIsChatActive(false);
    setCurrentChatId(null);
    setMessage("");
    setAttachedFiles([]);
    resetTranscript();
  };

  // --- Load Chat Handler ---
  const handleLoadChat = (chatId: string) => {
    // Close all menus
    setUserMenuOpen(false);
    setAttachMenuOpen(false);
    
    setCurrentChatId(chatId);
    setIsChatActive(true);
  };

  // --- Generate Chat Title ---
  const generateChatTitle = (firstMessage: string): string => {
    const words = firstMessage.trim().split(" ").slice(0, 5).join(" ");
    return words.length > 30 ? words.slice(0, 30) + "..." : words;
  };

  // --- Send Message Handler ---
  const handleSendMessage = async () => {
    const messageText = message.trim();
    if (!messageText || isLoading) return;

    // Close all menus
    setUserMenuOpen(false);
    setAttachMenuOpen(false);

    // Create new chat session if needed
    let chatId = currentChatId;
    if (!chatId) {
      chatId = "chat-" + Date.now() + "-" + Math.random().toString(36).substr(2, 9);
      setCurrentChatId(chatId);

      const newSession: ChatSession = {
        id: chatId,
        title: generateChatTitle(messageText),
        timestamp: new Date(),
        userId,
      };

      setChatSessions((prev) => [newSession, ...prev]);
    }

    if (!isChatActive) {
      setIsChatActive(true);
    }

    setMessage("");
    resetTranscript();
    setIsLoading(true);
    setAttachedFiles([]);

    try {
      await sendMessage({
        user: userId,
        role: "user",
        text: messageText,
        chatId,
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
        chatId,
      });
    } catch (error) {
      console.error("Error sending message:", error);
      await sendMessage({
        user: userId,
        role: "assistant",
        text: "Sorry, I'm having trouble connecting. Please try again.",
        chatId: chatId!,
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

      {/* OCR Processing Notification - FIXED AT TOP CENTER */}
      <AnimatePresence>
        {isProcessingOCR && (
          <motion.div
            initial={{ opacity: 0, y: -100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -100 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-blue-100 px-6 py-4 flex items-center gap-4 min-w-[320px]"
          >
            <Loader2 className="w-5 h-5 text-blue-600 animate-spin flex-shrink-0" />
            <div className="flex-1">
              <p className="font-serif text-sm font-medium text-foreground">
                Extracting text from image...
              </p>
              <p className="font-serif text-xs text-foreground/60 mt-0.5">
                This may take a few seconds
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={cancelOCR}
              className="px-3 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-xs font-serif transition-colors"
            >
              Cancel
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: sidebarOpen ? 256 : 0 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="relative z-20 bg-white/70 backdrop-blur-md border-r border-blue-100/50 flex flex-col overflow-hidden"
      >
        <div className="p-4 space-y-4 flex-1 overflow-y-auto">
          {/* New Chat Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleNewChat}
            className="w-full px-4 py-3 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 text-white font-serif text-sm flex items-center justify-center gap-2 hover:shadow-lg transition-all"
          >
            <Plus className="w-4 h-4" />
            New Chat
          </motion.button>

          {/* Chat History */}
          <div>
            <h2 className="text-xs font-serif font-light text-foreground/60 tracking-wide mb-3 px-2">
              RECENT CHATS
            </h2>
            <div className="space-y-1">
              {chatSessions.length === 0 ? (
                <p className="text-xs font-serif text-foreground/40 px-2 py-4 text-center">
                  No chats yet
                </p>
              ) : (
                chatSessions.map((chat) => (
                  <motion.button
                    key={chat.id}
                    whileHover={{ scale: 1.02, x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleLoadChat(chat.id)}
                    className={`w-full px-3 py-2.5 rounded-lg text-left font-serif text-sm transition-all ${
                      currentChatId === chat.id
                        ? "bg-blue-100/80 text-blue-900"
                        : "text-foreground/70 hover:bg-white/50"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <MessageSquare className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="truncate">{chat.title}</p>
                        <p className="text-xs text-foreground/40 mt-0.5">
                          {new Date(chat.timestamp).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                  </motion.button>
                ))
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="relative z-10 flex-1 flex flex-col">
        {/* Top Controls - FIXED */}
        <div
          className="fixed top-6 z-30 transition-all duration-300"
          style={{ left: sidebarOpen ? "calc(256px + 1.5rem)" : "1.5rem" }}
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setSidebarOpen(!sidebarOpen);
              setUserMenuOpen(false);
            }}
            className="w-12 h-12 rounded-2xl bg-white/80 backdrop-blur-md border border-blue-100/50 flex items-center justify-center hover:bg-white/90 transition-all hover:shadow-lg"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </motion.button>
        </div>

        <div className="fixed top-6 right-6 z-30 user-menu-container">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setUserMenuOpen(!userMenuOpen);
              setAttachMenuOpen(false);
            }}
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
              <div className="flex-1 overflow-y-auto px-6 py-24 pb-64 flex justify-center">
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

                      {/* Message Bubble */}
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

              {/* Input Area (Chat View) - FIXED */}
              <div
                className="fixed bottom-0 left-0 right-0 z-30 px-6 py-6 border-t border-blue-100/50 bg-white/30 backdrop-blur-md flex justify-center transition-all duration-300"
                style={{ left: sidebarOpen ? "256px" : "0" }}
              >
                <div className="w-full max-w-2xl">
                  {/* Attached Files Preview */}
                  {attachedFiles.length > 0 && (
                    <div className="mb-3 flex flex-wrap gap-2">
                      {attachedFiles.map((file, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className="relative group"
                        >
                          {file.type === "image" ? (
                            <div className="relative">
                              <img
                                src={file.preview}
                                alt="Preview"
                                className="w-20 h-20 object-cover rounded-lg border-2 border-blue-100"
                              />
                              <button
                                onClick={() => removeFile(index)}
                                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="relative">
                              <div className="w-20 h-20 bg-white/80 rounded-lg border-2 border-blue-100 flex flex-col items-center justify-center p-2">
                                <File className="w-6 h-6 text-blue-500" />
                                <span className="text-xs text-foreground/70 mt-1 truncate w-full text-center">
                                  {file.file.name.slice(0, 8)}...
                                </span>
                              </div>
                              <button
                                onClick={() => removeFile(index)}
                                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  )}

                  {/* Input Box */}
                  <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-2xl border border-blue-100/50 p-6 flex gap-3 items-center">
                    {/* Attachment Button */}
                    <div className="relative attach-menu-container">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setAttachMenuOpen(!attachMenuOpen)}
                        className="w-10 h-10 bg-gray-100 hover:bg-gray-200 text-foreground rounded-full p-2 transition-colors flex items-center justify-center"
                      >
                        <Plus className="w-5 h-5" />
                      </motion.button>

                      {/* Attachment Menu */}
                      <AnimatePresence>
                        {attachMenuOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="absolute bottom-full mb-2 left-0 w-40 bg-white/90 backdrop-blur-md rounded-xl shadow-lg border border-blue-100/50 overflow-hidden"
                          >
                            <motion.button
                              whileHover={{ backgroundColor: "rgba(59, 130, 246, 0.1)" }}
                              onClick={() => {
                                fileInputRef.current?.click();
                                fileInputRef.current?.setAttribute("accept", "image/*");
                              }}
                              className="w-full px-4 py-3 text-left text-sm font-serif text-foreground flex items-center gap-3 transition-colors"
                            >
                              <ImageIcon className="w-4 h-4" />
                              Image
                            </motion.button>
                            <motion.button
                              whileHover={{ backgroundColor: "rgba(59, 130, 246, 0.1)" }}
                              onClick={() => {
                                fileInputRef.current?.click();
                                fileInputRef.current?.setAttribute(
                                  "accept",
                                  ".pdf,.doc,.docx,.txt"
                                );
                              }}
                              className="w-full px-4 py-3 text-left text-sm font-serif text-foreground flex items-center gap-3 transition-colors border-t border-blue-100/30"
                            >
                              <Paperclip className="w-4 h-4" />
                              File
                            </motion.button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Hidden File Input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/*,.pdf,.doc,.docx,.txt"
                      onChange={handleFileSelect}
                      className="hidden"
                    />

                    <input
                      type="text"
                      placeholder="Ask me anything..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="flex-1 bg-transparent text-foreground placeholder-muted-foreground focus:outline-none font-serif text-base"
                      disabled={isLoading || isProcessingOCR}
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
                      disabled={isLoading || !message.trim() || isProcessingOCR}
                      className="bg-blue-500 hover:bg-blue-600 text-white rounded-full p-2 transition-colors disabled:opacity-50"
                    >
                      <ArrowRight className="w-5 h-5" />
                    </motion.button>
                  </div>
                </div>
              </div>
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

                {/* Attached Files Preview */}
                {attachedFiles.length > 0 && (
                  <div className="flex flex-wrap gap-2 justify-center">
                    {attachedFiles.map((file, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="relative group"
                      >
                        {file.type === "image" ? (
                          <div className="relative">
                            <img
                              src={file.preview}
                              alt="Preview"
                              className="w-20 h-20 object-cover rounded-lg border-2 border-blue-100"
                            />
                            <button
                              onClick={() => removeFile(index)}
                              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="relative">
                            <div className="w-20 h-20 bg-white/80 rounded-lg border-2 border-blue-100 flex flex-col items-center justify-center p-2">
                              <File className="w-6 h-6 text-blue-500" />
                              <span className="text-xs text-foreground/70 mt-1 truncate w-full text-center">
                                {file.file.name.slice(0, 8)}...
                              </span>
                            </div>
                            <button
                              onClick={() => removeFile(index)}
                              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* Input Box */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="bg-white/80 backdrop-blur-md rounded-3xl shadow-2xl border border-blue-100/50 p-6 flex gap-3 items-center"
                >
                  {/* Attachment Button */}
                  <div className="relative attach-menu-container">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setAttachMenuOpen(!attachMenuOpen)}
                      className="w-10 h-10 bg-gray-100 hover:bg-gray-200 text-foreground rounded-full p-2 transition-colors flex items-center justify-center"
                    >
                      <Plus className="w-5 h-5" />
                    </motion.button>

                    {/* Attachment Menu */}
                    <AnimatePresence>
                      {attachMenuOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          transition={{ duration: 0.2 }}
                          className="absolute bottom-full mb-2 left-0 w-40 bg-white/90 backdrop-blur-md rounded-xl shadow-lg border border-blue-100/50 overflow-hidden"
                        >
                          <motion.button
                            whileHover={{ backgroundColor: "rgba(59, 130, 246, 0.1)" }}
                            onClick={() => {
                              fileInputRef.current?.click();
                              fileInputRef.current?.setAttribute("accept", "image/*");
                            }}
                            className="w-full px-4 py-3 text-left text-sm font-serif text-foreground flex items-center gap-3 transition-colors"
                          >
                            <ImageIcon className="w-4 h-4" />
                            Image
                          </motion.button>
                          <motion.button
                            whileHover={{ backgroundColor: "rgba(59, 130, 246, 0.1)" }}
                            onClick={() => {
                              fileInputRef.current?.click();
                              fileInputRef.current?.setAttribute(
                                "accept",
                                ".pdf,.doc,.docx,.txt"
                              );
                            }}
                            className="w-full px-4 py-3 text-left text-sm font-serif text-foreground flex items-center gap-3 transition-colors border-t border-blue-100/30"
                          >
                            <Paperclip className="w-4 h-4" />
                            File
                          </motion.button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Hidden File Input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,.pdf,.doc,.docx,.txt"
                    onChange={handleFileSelect}
                    className="hidden"
                  />

                  <input
                    type="text"
                    placeholder="Ask me anything..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="flex-1 bg-transparent text-foreground placeholder-muted-foreground focus:outline-none font-serif text-base"
                    autoFocus
                    disabled={isLoading || isProcessingOCR}
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
                    disabled={isLoading || !message.trim() || isProcessingOCR}
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