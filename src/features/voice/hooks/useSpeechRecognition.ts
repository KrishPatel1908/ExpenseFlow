"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type {
  VoiceLanguageCode,
  SpeechRecognitionErrorDetails,
  ISpeechRecognitionInstance,
  WebSpeechRecognitionEvent,
  WebSpeechRecognitionErrorEvent,
  SpeechRecognitionErrorCode,
} from "../types";
import { getSpeechRecognitionClass, isSpeechRecognitionSupported } from "../utils/speech";

export interface UseSpeechRecognitionOptions {
  initialLanguage?: VoiceLanguageCode;
  silenceTimeoutMs?: number;
}

export interface UseSpeechRecognitionReturn {
  transcript: string;
  interimTranscript: string;
  isListening: boolean;
  isSupported: boolean;
  error: SpeechRecognitionErrorDetails | null;
  language: VoiceLanguageCode;
  start: () => void;
  stop: () => void;
  reset: () => void;
  changeLanguage: (lang: VoiceLanguageCode) => void;
}

export function useSpeechRecognition(
  options: UseSpeechRecognitionOptions = {}
): UseSpeechRecognitionReturn {
  const { initialLanguage = "en-IN", silenceTimeoutMs = 7000 } = options;

  const [language, setLanguage] = useState<VoiceLanguageCode>(initialLanguage);
  const [transcript, setTranscript] = useState<string>("");
  const [interimTranscript, setInterimTranscript] = useState<string>("");
  const [isListening, setIsListening] = useState<boolean>(false);
  const [error, setError] = useState<SpeechRecognitionErrorDetails | null>(null);
  const [isSupported, setIsSupported] = useState<boolean>(false);

  // References for instance management and lifecycle safety
  const recognitionRef = useRef<ISpeechRecognitionInstance | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isManuallyStoppedRef = useRef<boolean>(false);

  // Check support on mount
  useEffect(() => {
    setIsSupported(isSpeechRecognitionSupported());
  }, []);

  // Helper to clear silence timer
  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  // Helper to reset silence timer
  const resetSilenceTimer = useCallback(() => {
    clearSilenceTimer();
    if (silenceTimeoutMs > 0) {
      silenceTimerRef.current = setTimeout(() => {
        if (recognitionRef.current && isListening) {
          recognitionRef.current.stop();
        }
      }, silenceTimeoutMs);
    }
  }, [clearSilenceTimer, isListening, silenceTimeoutMs]);

  // Clean up recognition instance
  const destroyRecognition = useCallback(() => {
    clearSilenceTimer();
    if (recognitionRef.current) {
      const rec = recognitionRef.current;
      rec.onstart = null;
      rec.onend = null;
      rec.onerror = null;
      rec.onresult = null;
      try {
        rec.abort();
      } catch {
        // Instance might already be inactive
      }
      recognitionRef.current = null;
    }
  }, [clearSilenceTimer]);

  // Reset transcripts & errors
  const reset = useCallback(() => {
    setTranscript("");
    setInterimTranscript("");
    setError(null);
  }, []);

  // Change active language
  const changeLanguage = useCallback(
    (newLang: VoiceLanguageCode) => {
      setLanguage(newLang);
      if (recognitionRef.current) {
        recognitionRef.current.lang = newLang;
      }
    },
    []
  );

  // Stop recognition manually
  const stop = useCallback(() => {
    isManuallyStoppedRef.current = true;
    clearSilenceTimer();
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Safely ignore if already stopped
      }
    }
    setIsListening(false);
  }, [clearSilenceTimer]);

  // Start recognition
  const start = useCallback(() => {
    if (!isSpeechRecognitionSupported()) {
      setError({
        code: "unsupported-browser",
        message: "Web Speech API is not supported in this browser.",
      });
      return;
    }

    // Clean existing instance
    destroyRecognition();

    const SpeechRecognitionClass = getSpeechRecognitionClass();
    if (!SpeechRecognitionClass) {
      setError({
        code: "unsupported-browser",
        message: "Failed to initialize Speech Recognition.",
      });
      return;
    }

    try {
      isManuallyStoppedRef.current = false;
      setError(null);
      setInterimTranscript("");

      const instance = new SpeechRecognitionClass();
      instance.continuous = true;
      instance.interimResults = true;
      instance.lang = language;
      instance.maxAlternatives = 1;

      instance.onstart = () => {
        setIsListening(true);
        resetSilenceTimer();
      };

      instance.onresult = (event: WebSpeechRecognitionEvent) => {
        resetSilenceTimer();
        let finalConcat = "";
        let interimConcat = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const text = result[0]?.transcript || "";

          if (result.isFinal) {
            finalConcat += text;
          } else {
            interimConcat += text;
          }
        }

        if (finalConcat) {
          setTranscript((prev) => (prev ? `${prev} ${finalConcat.trim()}` : finalConcat.trim()));
        }
        setInterimTranscript(interimConcat);
      };

      instance.onerror = (event: WebSpeechRecognitionErrorEvent) => {
        clearSilenceTimer();
        const code: SpeechRecognitionErrorCode =
          (event.error as SpeechRecognitionErrorCode) || "unknown";

        let message = "Speech recognition error occurred.";
        if (code === "not-allowed") {
          message = "Microphone access denied. Please grant permission in browser settings.";
        } else if (code === "no-speech") {
          message = "No speech detected. Please try speaking again.";
        } else if (code === "network") {
          message = "Network communication error during speech recognition.";
        } else if (code === "aborted") {
          message = "Speech recognition was aborted.";
        }

        setError({ code, message });
        setIsListening(false);
      };

      instance.onend = () => {
        clearSilenceTimer();
        setIsListening(false);
        setInterimTranscript("");
      };

      recognitionRef.current = instance;
      instance.start();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to start speech recognition.";
      setError({ code: "unknown", message: msg });
      setIsListening(false);
    }
  }, [clearSilenceTimer, destroyRecognition, language, resetSilenceTimer]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      destroyRecognition();
    };
  }, [destroyRecognition]);

  return {
    transcript,
    interimTranscript,
    isListening,
    isSupported,
    error,
    language,
    start,
    stop,
    reset,
    changeLanguage,
  };
}
