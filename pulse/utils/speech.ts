"use client";

import { useEffect, useState } from "react";

export function speak(text: string) {
  if (typeof window === "undefined") return;

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.9;
  utterance.pitch = 1;
  utterance.volume = 1;

  const loadVoices = () => {
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(
      (voice) => voice.lang.startsWith("en") && voice.name.includes("Female")
    ) || voices.find((voice) => voice.lang.startsWith("en"));
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }
  };

  if (window.speechSynthesis.getVoices().length > 0) {
    loadVoices();
  } else {
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }

  window.speechSynthesis.speak(utterance);
}

export function useSpeechInput() {
  const [transcript, setTranscript] = useState("");
  const [listening, setListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn("Speech recognition not supported in this browser");
      setSupported(false);
      return;
    }

    const recognitionInstance = new SpeechRecognition();
    
    recognitionInstance.continuous = false; 
    recognitionInstance.interimResults = true;
    recognitionInstance.lang = "en-US";
    recognitionInstance.maxAlternatives = 1;

    recognitionInstance.onresult = (event: any) => {
      let interimTranscript = "";
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + " ";
        } else {
          interimTranscript += transcript;
        }
      }

      if (finalTranscript) {
        setTranscript((prev) => prev + finalTranscript);
      }
    };

    recognitionInstance.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      
      switch (event.error) {
        case "network":
          console.warn("Network error - check your internet connection or try localhost");
          break;
        case "not-allowed":
          console.warn("Microphone access denied - please allow microphone permission");
          break;
        case "no-speech":
          console.warn("No speech detected - try speaking again");
          break;
        case "aborted":
          console.warn("Speech recognition aborted");
          break;
        default:
          console.warn(`Speech recognition error: ${event.error}`);
      }
      
      setListening(false);
    };

    recognitionInstance.onend = () => {
      console.log("Speech recognition ended");
      setListening(false);
    };

    recognitionInstance.onstart = () => {
      console.log("Speech recognition started");
    };

    setRecognition(recognitionInstance);

    return () => {
      if (recognitionInstance) {
        recognitionInstance.stop();
      }
    };
  }, []);

  const toggleListening = () => {
    if (!recognition || !supported) {
      alert("Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari.");
      return;
    }

    if (listening) {
      recognition.stop();
      setListening(false);
    } else {
      try {
        recognition.start();
        setListening(true);
      } catch (error) {
        console.error("Error starting recognition:", error);
        setListening(false);
      }
    }
  };

  const resetTranscript = () => {
    setTranscript("");
  };

  return {
    transcript,
    listening,
    toggleListening,
    resetTranscript,
    supported,
  };
}