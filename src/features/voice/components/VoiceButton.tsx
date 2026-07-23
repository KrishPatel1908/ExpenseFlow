"use client";

import { useState, useEffect, useCallback } from "react";
import { Mic, Globe, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { requestMicrophoneAccess, SUPPORTED_VOICE_LANGUAGES } from "../utils/speech";
import { useSpeechRecognition } from "../hooks/useSpeechRecognition";
import { ListeningIndicator } from "./ListeningIndicator";
import {
  VoiceTransactionDialog,
  type VoiceConfirmationFormValues,
} from "./VoiceTransactionDialog";
import type { VoiceLanguageCode, VoiceApiResponse } from "../types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export interface VoiceButtonProps {
  onVoiceComplete: (data: VoiceConfirmationFormValues) => void;
  className?: string;
  variant?: "default" | "outline" | "secondary" | "ghost";
}

export function VoiceButton({
  onVoiceComplete,
  className = "",
  variant = "default",
}: VoiceButtonProps) {
  const [listeningModalOpen, setListeningModalOpen] = useState(false);
  const [isProcessingAi, setIsProcessingAi] = useState(false);
  const [hasFailed, setHasFailed] = useState(false);

  // Parsed AI data state for confirmation dialog
  const [parsedData, setParsedData] = useState<VoiceApiResponse["data"] | null>(null);
  const [lastTranscript, setLastTranscript] = useState<string>("");
  const [confirmationDialogOpen, setConfirmationDialogOpen] = useState(false);

  const {
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
  } = useSpeechRecognition({ initialLanguage: "en-IN" });

  // Handle speech recognition errors via Sonner toasts
  useEffect(() => {
    if (error) {
      toast.error(error.message);
    }
  }, [error]);

  const processTranscriptWithAi = useCallback(async (textToProcess: string) => {
    if (!textToProcess.trim()) {
      toast.error("No speech transcript detected. Please try again.");
      return;
    }

    setIsProcessingAi(true);
    setHasFailed(false);
    const toastId = toast.loading("Processing voice with Gemini AI...");

    if (process.env.NODE_ENV === "development") {
      console.log("[Voice Module] Processing transcript:", textToProcess);
    }

    try {
      const res = await fetch("/api/voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: textToProcess }),
      });

      const json: VoiceApiResponse = await res.json();

      if (!res.ok || !json.success || !json.data) {
        setHasFailed(true);
        toast.error(json.reason || "Failed to process voice transcript.", { id: toastId });
        return;
      }

      toast.success("Voice transcript processed successfully!", { id: toastId });
      setParsedData(json.data);
      setConfirmationDialogOpen(true);
    } catch (err: unknown) {
      setHasFailed(true);
      console.error("[Voice Module] Network or processing error:", err);
      toast.error("Network failure while reaching Voice API. Click Retry to try again.", {
        id: toastId,
      });
    } finally {
      setIsProcessingAi(false);
    }
  }, []);

  const handleStart = async () => {
    if (!isSupported) {
      toast.error(
        "Web Speech API is not supported in this browser. Please use Chrome, Edge, Safari, or Brave."
      );
      return;
    }

    const hasPermission = await requestMicrophoneAccess();
    if (!hasPermission) {
      toast.error(
        "Microphone permission denied. Please allow microphone access in your browser settings."
      );
      return;
    }

    reset();
    setHasFailed(false);
    setListeningModalOpen(true);
    start();
  };

  const handleStop = async () => {
    stop();
    setListeningModalOpen(false);

    const fullTranscript = (transcript + " " + interimTranscript).trim();

    if (!fullTranscript) {
      toast.error("No speech detected. Please try speaking again.");
      return;
    }

    setLastTranscript(fullTranscript);
    await processTranscriptWithAi(fullTranscript);
  };

  const handleRetry = async () => {
    if (lastTranscript) {
      await processTranscriptWithAi(lastTranscript);
    } else {
      handleStart();
    }
  };

  const handleConfirmVoiceData = (confirmedValues: VoiceConfirmationFormValues) => {
    onVoiceComplete(confirmedValues);
    setConfirmationDialogOpen(false);
    setParsedData(null);
  };

  const currentLanguageOption =
    SUPPORTED_VOICE_LANGUAGES.find((l) => l.code === language) || SUPPORTED_VOICE_LANGUAGES[0];

  return (
    <div className="flex items-center gap-1.5">
      {/* Language Selector Dropdown */}
      <div className="relative inline-flex items-center">
        <select
          value={language}
          onChange={(e) => changeLanguage(e.target.value as VoiceLanguageCode)}
          disabled={isListening || isProcessingAi}
          aria-label="Select voice recognition language"
          className="appearance-none bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold py-2 pl-7 pr-6 rounded-lg border border-slate-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-rose-500 disabled:opacity-50 transition-colors"
          title="Select Voice Language"
        >
          {SUPPORTED_VOICE_LANGUAGES.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.flag} {lang.label}
            </option>
          ))}
        </select>
        <Globe className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500 pointer-events-none" />
      </div>

      {/* Voice Button */}
      <Button
        type="button"
        onClick={isListening ? handleStop : handleStart}
        disabled={isProcessingAi}
        variant={variant}
        aria-label={isListening ? "Stop listening to voice" : "Start voice expense input"}
        aria-expanded={listeningModalOpen}
        className={`relative flex items-center gap-2 cursor-pointer font-semibold transition-all ${
          isListening
            ? "bg-rose-600 hover:bg-rose-700 text-white animate-pulse shadow-md shadow-rose-500/20"
            : className ||
              "bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white shadow"
        }`}
      >
        {isProcessingAi ? (
          <Loader2 className="h-4 w-4 animate-spin text-white" />
        ) : (
          <Mic className={`h-4 w-4 ${isListening ? "animate-bounce" : ""}`} />
        )}
        <span>{isProcessingAi ? "Processing..." : isListening ? "Listening..." : "Voice Add"}</span>
      </Button>

      {/* Retry Button (Visible if processing failed) */}
      {hasFailed && !isProcessingAi && !isListening && (
        <Button
          type="button"
          onClick={handleRetry}
          variant="outline"
          size="sm"
          aria-label="Retry AI processing"
          className="text-xs font-medium text-rose-600 border-rose-200 hover:bg-rose-50 gap-1.5 cursor-pointer"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Retry Voice</span>
        </Button>
      )}

      {/* Active Listening Dialog */}
      <Dialog
        open={listeningModalOpen}
        onOpenChange={(open) => {
          if (!open) handleStop();
        }}
      >
        <DialogContent className="sm:max-w-[420px] p-0 overflow-hidden">
          <DialogHeader className="p-4 bg-slate-50/60 border-b border-slate-100">
            <DialogTitle className="text-center text-slate-900 font-bold flex items-center justify-center gap-2">
              <Mic className="h-5 w-5 text-rose-600 animate-pulse" />
              <span>Voice Input ({currentLanguageOption.label})</span>
            </DialogTitle>
            <DialogDescription className="text-center text-xs text-slate-500">
              Speak naturally in {currentLanguageOption.label}. Speak amounts, customer names, or details.
            </DialogDescription>
          </DialogHeader>

          <ListeningIndicator
            transcript={(transcript + " " + interimTranscript).trim()}
            onStop={handleStop}
            languageName={currentLanguageOption.label}
          />
        </DialogContent>
      </Dialog>

      {/* Voice Confirmation Dialog */}
      <VoiceTransactionDialog
        isOpen={confirmationDialogOpen}
        onOpenChange={setConfirmationDialogOpen}
        transcript={lastTranscript}
        initialData={parsedData}
        onConfirm={handleConfirmVoiceData}
        onCancel={() => {
          setConfirmationDialogOpen(false);
          setParsedData(null);
        }}
      />
    </div>
  );
}
