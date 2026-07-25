"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  ISpeechRecognitionInstance,
  SpeechRecognitionErrorCode,
  SpeechRecognitionErrorDetails,
  SpeechRecognitionStatus,
  VoiceLanguageCode,
  WebSpeechRecognitionErrorEvent,
  WebSpeechRecognitionEvent,
} from "../types";
import { getSpeechRecognitionClass, isSpeechRecognitionSupported, requestMicrophoneAccess } from "../utils/speech";
import { TranscriptManager } from "../utils/transcript-manager";

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
  status: SpeechRecognitionStatus;
  start: () => Promise<void>;
  stop: () => void;
  abort: () => void;
  reset: () => void;
  changeLanguage: (lang: VoiceLanguageCode) => void;
  getFinalOrInterimTranscript: () => string;
  beginProcessing: () => boolean;
  completeProcessing: (success: boolean) => void;
}

const TRANSITIONS: Record<SpeechRecognitionStatus, SpeechRecognitionStatus[]> = {
  IDLE: ["REQUESTING_PERMISSION", "STARTING"],
  REQUESTING_PERMISSION: ["STARTING", "ERROR", "IDLE"],
  STARTING: ["LISTENING", "STOPPING", "ERROR", "IDLE"],
  LISTENING: ["STOPPING", "ERROR", "IDLE"],
  STOPPING: ["PROCESSING", "COMPLETED", "ERROR", "IDLE"],
  PROCESSING: ["COMPLETED", "ERROR", "IDLE"],
  COMPLETED: ["IDLE"],
  ERROR: ["IDLE"],
};

const RECOVERABLE_ERRORS = new Set<SpeechRecognitionErrorCode>(["network", "no-speech", "aborted"]);

function errorMessage(code: SpeechRecognitionErrorCode): string {
  const messages: Partial<Record<SpeechRecognitionErrorCode, string>> = {
    "not-allowed": "Microphone access was denied. Allow it in your browser settings and try again.",
    "service-not-allowed": "Speech recognition is not allowed by this browser or device.",
    "audio-capture": "No microphone is available. Check that it is connected and not in use by another app.",
    network: "Speech recognition could not reach its service. Check your connection and try again.",
    "no-speech": "No speech was detected. Please try again.",
    "language-not-supported": "This language is not supported by speech recognition on this browser.",
    aborted: "Speech recognition stopped unexpectedly. Please try again.",
  };
  return messages[code] || "Speech recognition could not start. Please try again.";
}

export function useSpeechRecognition(options: UseSpeechRecognitionOptions = {}): UseSpeechRecognitionReturn {
  const { initialLanguage = "en-IN", silenceTimeoutMs = 3000, onSilenceTimeout } = options;
  const [language, setLanguage] = useState<VoiceLanguageCode>(initialLanguage);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [status, setStatus] = useState<SpeechRecognitionStatus>("IDLE");
  const [error, setError] = useState<SpeechRecognitionErrorDetails | null>(null);
  const [isSupported] = useState(() => isSpeechRecognitionSupported());

  const recognitionRef = useRef<ISpeechRecognitionInstance | null>(null);
  const statusRef = useRef<SpeechRecognitionStatus>("IDLE");
  const languageRef = useRef(language);
  const transcriptManagerRef = useRef(new TranscriptManager());
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionRef = useRef(0);
  const retryAttemptRef = useRef(0);
  const silenceHandledRef = useRef(false);
  const onSilenceTimeoutRef = useRef(onSilenceTimeout);

  const debug = useCallback((event: string, details?: unknown) => {
    if (process.env.NODE_ENV === "development") console.debug("[SpeechRecognition]", event, details ?? "");
  }, []);

  const transition = useCallback((next: SpeechRecognitionStatus) => {
    const previous = statusRef.current;
    if (previous === next) return true;
    if (!TRANSITIONS[previous].includes(next)) {
      debug("invalid transition ignored", { previous, next });
      return false;
    }
    statusRef.current = next;
    setStatus(next);
    debug("state", { previous, next });
    return true;
  }, [debug]);

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
      debug("silence timer cleared");
    }
  }, [debug]);

  const publishTranscript = useCallback(() => {
    const manager = transcriptManagerRef.current;
    setTranscript(manager.getFinal());
    setInterimTranscript(manager.getInterim());
  }, []);

  const detachRecognition = useCallback((abort: boolean) => {
    clearSilenceTimer();
    const recognition = recognitionRef.current;
    recognitionRef.current = null; // callbacks from this instance are now stale.
    if (!recognition) return;
    recognition.onstart = null;
    recognition.onresult = null;
    recognition.onerror = null;
    recognition.onend = null;
    if (abort) {
      try {
        recognition.abort();
      } catch {
        // Some engines throw when an inactive recognizer is aborted.
      }
    }
    debug("recognition cleaned up", { abort });
  }, [clearSilenceTimer, debug]);

  const reset = useCallback(() => {
    clearSilenceTimer();
    transcriptManagerRef.current.reset();
    retryAttemptRef.current = 0;
    silenceHandledRef.current = false;
    setTranscript("");
    setInterimTranscript("");
    setError(null);
    debug("transcript reset");
  }, [clearSilenceTimer, debug]);

  const stop = useCallback(() => {
    const current = statusRef.current;
    if (current !== "STARTING" && current !== "LISTENING") return;
    clearSilenceTimer();
    if (!transition("STOPPING")) return;
    debug("recognition stop requested");
    try {
      recognitionRef.current?.stop();
    } catch {
      // onend is the source of truth; inactive engines may throw here.
    }
  }, [clearSilenceTimer, debug, transition]);

  const armSilenceTimer = useCallback(() => {
    clearSilenceTimer();
    if (silenceTimeoutMs <= 0) return;
    silenceTimerRef.current = setTimeout(() => {
      if (statusRef.current !== "LISTENING" || silenceHandledRef.current) return;
      silenceHandledRef.current = true;
      debug("silence timeout");
      stop();
      onSilenceTimeoutRef.current?.();
    }, silenceTimeoutMs);
    debug("silence timer armed", silenceTimeoutMs);
  }, [clearSilenceTimer, debug, silenceTimeoutMs, stop]);

  const startNativeRef = useRef<(preserveTranscript: boolean) => void>(() => {});

  const startNative = useCallback((preserveTranscript: boolean) => {
    const Recognition = getSpeechRecognitionClass();
    if (!Recognition) {
      transition("ERROR");
      setError({ code: "unsupported-browser", message: "Web Speech API is not supported in this browser." });
      return;
    }

    detachRecognition(true);
    if (!preserveTranscript) transcriptManagerRef.current.reset();
    transcriptManagerRef.current.beginRecognitionInstance();
    publishTranscript();
    silenceHandledRef.current = false;
    const session = ++sessionRef.current;
    const recognition = new Recognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = languageRef.current;
    recognition.maxAlternatives = 1;

    const isCurrent = () => recognitionRef.current === recognition && sessionRef.current === session;
    recognition.onstart = () => {
      if (!isCurrent()) return;
      debug("recognition started", { session });
      if (statusRef.current === "STOPPING") {
        try { recognition.stop(); } catch {}
        return;
      }
      if (transition("LISTENING")) armSilenceTimer();
    };
    recognition.onresult = (event: WebSpeechRecognitionEvent) => {
      if (!isCurrent() || statusRef.current !== "LISTENING") return;
      let interim = "";
      let hasNewSpeech = false;
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        const text = result?.[0]?.transcript || "";
        if (result?.isFinal) {
          const changed = transcriptManagerRef.current.addFinal(index, text);
          hasNewSpeech ||= changed;
          debug("final result", { index, text, changed });
        } else {
          interim += `${interim ? " " : ""}${text}`;
        }
      }
      const interimChanged = transcriptManagerRef.current.setInterim(interim);
      hasNewSpeech ||= interimChanged;
      publishTranscript();
      debug("interim result", { value: transcriptManagerRef.current.getInterim(), changed: interimChanged });
      // Re-arm only when text actually changed; repeated browser events do not
      // artificially keep the session alive.
      if (hasNewSpeech) armSilenceTimer();
    };
    recognition.onerror = (event: WebSpeechRecognitionErrorEvent) => {
      if (!isCurrent()) return;
      const code = (event.error as SpeechRecognitionErrorCode) || "unknown";
      debug("recognition error", { code, message: event.message });
      clearSilenceTimer();
      detachRecognition(false);
      if (RECOVERABLE_ERRORS.has(code) && retryAttemptRef.current < 1) {
        retryAttemptRef.current += 1;
        transition("ERROR");
        transition("IDLE");
        debug("retrying after recoverable error", { code, attempt: retryAttemptRef.current });
        queueMicrotask(() => startNativeRef.current(true));
        return;
      }
      transition("ERROR");
      setError({ code, message: errorMessage(code) });
      transcriptManagerRef.current.clearInterim();
      publishTranscript();
    };
    recognition.onend = () => {
      if (!isCurrent()) return;
      clearSilenceTimer();
      debug("recognition ended", { state: statusRef.current, final: transcriptManagerRef.current.getFinal() });
      recognitionRef.current = null;
      transcriptManagerRef.current.clearInterim();
      publishTranscript();
      if (statusRef.current === "LISTENING" && !transcriptManagerRef.current.getFinal() && retryAttemptRef.current < 1) {
        retryAttemptRef.current += 1;
        transition("IDLE"); // Never transition directly from LISTENING to STARTING.
        debug("retrying after unexpected end", { attempt: retryAttemptRef.current });
        queueMicrotask(() => startNativeRef.current(true));
      } else if (statusRef.current === "STOPPING") {
        transition("COMPLETED");
      } else if (statusRef.current === "STARTING" || statusRef.current === "LISTENING") {
        transition("COMPLETED");
      }
    };

    recognitionRef.current = recognition;
    if (!transition("STARTING")) return;
    try {
      debug("recognition start requested", { session, language: recognition.lang });
      recognition.start();
    } catch (cause) {
      detachRecognition(false);
      transition("ERROR");
      setError({ code: "unknown", message: cause instanceof Error ? cause.message : "Failed to start speech recognition." });
    }
  }, [armSilenceTimer, clearSilenceTimer, debug, detachRecognition, publishTranscript, transition]);
  useEffect(() => {
    startNativeRef.current = startNative;
  }, [startNative]);

  const start = useCallback(async () => {
    if (!isSpeechRecognitionSupported()) {
      if (statusRef.current !== "ERROR") transition("ERROR");
      setError({ code: "unsupported-browser", message: "Web Speech API is not supported in this browser." });
      return;
    }
    if (!["IDLE", "COMPLETED", "ERROR"].includes(statusRef.current)) {
      debug("duplicate start ignored", statusRef.current);
      return;
    }
    if (statusRef.current !== "IDLE") transition("IDLE");
    reset();
    if (!transition("REQUESTING_PERMISSION")) return;
    const granted = await requestMicrophoneAccess();
    if (statusRef.current !== "REQUESTING_PERMISSION") return;
    if (!granted) {
      transition("ERROR");
      setError({ code: "not-allowed", message: "Microphone access was denied. Allow it in your browser settings and try again." });
      return;
    }
    startNativeRef.current(false);
  }, [debug, reset, transition]);

  const abort = useCallback(() => {
    ++sessionRef.current;
    detachRecognition(true);
    if (statusRef.current !== "IDLE") transition("IDLE");
    reset();
  }, [detachRecognition, reset, transition]);

  const changeLanguage = useCallback((nextLanguage: VoiceLanguageCode) => {
    languageRef.current = nextLanguage;
    setLanguage(nextLanguage);
    debug("language changed", nextLanguage);
  }, [debug]);

  const beginProcessing = useCallback(() => {
    if (statusRef.current === "LISTENING") stop();
    return statusRef.current === "STOPPING" && transition("PROCESSING");
  }, [stop, transition]);

  const completeProcessing = useCallback((success: boolean) => {
    if (statusRef.current === "PROCESSING") transition(success ? "COMPLETED" : "ERROR");
  }, [transition]);

  useEffect(() => { onSilenceTimeoutRef.current = onSilenceTimeout; }, [onSilenceTimeout]);
  useEffect(() => () => {
    ++sessionRef.current;
    detachRecognition(true);
  }, [detachRecognition]);

  return {
    transcript,
    interimTranscript,
    isListening: status === "LISTENING" || status === "STARTING",
    isSupported,
    error,
    language,
    status,
    start,
    stop,
    abort,
    reset,
    changeLanguage,
    getFinalOrInterimTranscript: () => transcriptManagerRef.current.getBest(),
    beginProcessing,
    completeProcessing,
  };
}
