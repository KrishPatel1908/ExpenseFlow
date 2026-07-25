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
  onSilenceTimeout?: () => void;
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
  abort: () => void;
  reset: () => void;
  changeLanguage: (lang: VoiceLanguageCode) => void;
  getFinalOrInterimTranscript: () => string;
}

export function useSpeechRecognition(
  options: UseSpeechRecognitionOptions = {}
): UseSpeechRecognitionReturn {
  const { initialLanguage = "en-IN", silenceTimeoutMs = 3000, onSilenceTimeout } = options;

  const [language, setLanguage] = useState<VoiceLanguageCode>(initialLanguage);
  const [transcript, setTranscript] = useState<string>("");
  const [interimTranscript, setInterimTranscript] = useState<string>("");
  const [isListening, setIsListening] = useState<boolean>(false);
  const [error, setError] = useState<SpeechRecognitionErrorDetails | null>(null);
  const [isSupported] = useState<boolean>(() => isSpeechRecognitionSupported());

  // References for single-instance management and state safety
  const recognitionRef = useRef<ISpeechRecognitionInstance | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isStartingRef = useRef<boolean>(false);
  const isListeningRef = useRef<boolean>(false);
  const onSilenceTimeoutRef = useRef<(() => void) | undefined>(onSilenceTimeout);

  // Result tracking refs for strict deduplication
  const processedFinalIndicesRef = useRef<Set<number>>(new Set());
  const finalSegmentsRef = useRef<string[]>([]);
  const finalTranscriptRef = useRef<string>("");
  const interimTranscriptRef = useRef<string>("");

  useEffect(() => {
    onSilenceTimeoutRef.current = onSilenceTimeout;
  }, [onSilenceTimeout]);

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
        if (isListeningRef.current) {
          if (recognitionRef.current) {
            try {
              recognitionRef.current.stop();
            } catch {
              // Ignore if already stopped
            }
          }
          if (onSilenceTimeoutRef.current) {
            onSilenceTimeoutRef.current();
          }
        }
      }, silenceTimeoutMs);
    }
  }, [clearSilenceTimer, silenceTimeoutMs]);

  // Clean up recognition instance and strip all event listeners
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
    isStartingRef.current = false;
    isListeningRef.current = false;
  }, [clearSilenceTimer]);

  // Full reset of transcripts, timers, indices, and error state
  const reset = useCallback(() => {
    clearSilenceTimer();
    processedFinalIndicesRef.current.clear();
    finalSegmentsRef.current = [];
    finalTranscriptRef.current = "";
    interimTranscriptRef.current = "";
    setTranscript("");
    setInterimTranscript("");
    setError(null);
  }, [clearSilenceTimer]);

  // Retrieve clean non-duplicated transcript (Final if present, else fallback to Interim)
  const getFinalOrInterimTranscript = useCallback(() => {
    const finalClean = finalTranscriptRef.current.trim();
    if (finalClean) return finalClean;
    return interimTranscriptRef.current.trim();
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

  // Stop recognition manually (preserves transcript)
  const stop = useCallback(() => {
    clearSilenceTimer();
    if (!isListeningRef.current && !isStartingRef.current) return;

    isListeningRef.current = false;
    isStartingRef.current = false;
    setIsListening(false);

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Safely ignore
      }
    }
  }, [clearSilenceTimer]);

  // Abort recognition immediately (clears state completely)
  const abort = useCallback(() => {
    destroyRecognition();
    reset();
    setIsListening(false);
  }, [destroyRecognition, reset]);

  // Start recognition session
  const start = useCallback(() => {
    if (!isSpeechRecognitionSupported()) {
      setError({
        code: "unsupported-browser",
        message: "Web Speech API is not supported in this browser.",
      });
      return;
    }

    // Prevent duplicate start calls if already starting or listening
    if (isStartingRef.current || isListeningRef.current) {
      return;
    }
    isStartingRef.current = true;

    // Fully reset state before new session
    destroyRecognition();
    reset();

    const SpeechRecognitionClass = getSpeechRecognitionClass();
    if (!SpeechRecognitionClass) {
      isStartingRef.current = false;
      setError({
        code: "unsupported-browser",
        message: "Failed to initialize Speech Recognition.",
      });
      return;
    }

    try {
      setError(null);

      const instance = new SpeechRecognitionClass();
      instance.continuous = true;
      instance.interimResults = true;
      instance.lang = language;
      instance.maxAlternatives = 1;

      instance.onstart = () => {
        isStartingRef.current = false;
        isListeningRef.current = true;
        setIsListening(true);
        resetSilenceTimer();
      };

      instance.onresult = (event: WebSpeechRecognitionEvent) => {
        resetSilenceTimer();
        let interimConcat = "";
        let hasNewFinal = false;

        for (let i = 0; i < event.results.length; i++) {
          const result = event.results[i];
          if (!result || !result[0]) continue;
          const text = (result[0].transcript || "").trim();
          if (!text) continue;

          if (result.isFinal) {
            // Process each final index AT MOST ONCE
            if (!processedFinalIndicesRef.current.has(i)) {
              processedFinalIndicesRef.current.add(i);

              // Guard against identical contiguous segment duplication
              const lastSegment = finalSegmentsRef.current[finalSegmentsRef.current.length - 1];
              if (!lastSegment || lastSegment.toLowerCase() !== text.toLowerCase()) {
                finalSegmentsRef.current.push(text);
                hasNewFinal = true;
              }
            }
          } else {
            // Only aggregate non-final interim text
            interimConcat += (interimConcat ? " " : "") + text;
          }
        }

        if (hasNewFinal) {
          const joinedFinal = finalSegmentsRef.current.join(" ");
          finalTranscriptRef.current = joinedFinal;
          setTranscript(joinedFinal);
        }

        interimTranscriptRef.current = interimConcat.trim();
        setInterimTranscript(interimConcat.trim());
      };

      instance.onerror = (event: WebSpeechRecognitionErrorEvent) => {
        clearSilenceTimer();
        isStartingRef.current = false;
        isListeningRef.current = false;

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
        isStartingRef.current = false;
        isListeningRef.current = false;
        setIsListening(false);
        setInterimTranscript("");
        interimTranscriptRef.current = "";
      };

      recognitionRef.current = instance;
      instance.start();
    } catch (err: unknown) {
      isStartingRef.current = false;
      isListeningRef.current = false;
      const msg = err instanceof Error ? err.message : "Failed to start speech recognition.";
      setError({ code: "unknown", message: msg });
      setIsListening(false);
    }
  }, [clearSilenceTimer, destroyRecognition, language, reset, resetSilenceTimer]);

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
    abort,
    reset,
    changeLanguage,
    getFinalOrInterimTranscript,
  };
}
