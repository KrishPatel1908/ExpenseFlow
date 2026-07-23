"use client";

import { Mic, Square } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ListeningIndicatorProps {
  transcript?: string;
  onStop: () => void;
  languageName?: string;
}

export function ListeningIndicator({
  transcript,
  onStop,
  languageName = "English / Hindi / Gujarati",
}: ListeningIndicatorProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center justify-center space-y-6 py-6 px-4 text-center"
    >
      {/* Outer Pulse Rings & Mic Icon Animation */}
      <div className="relative flex items-center justify-center" aria-hidden="true">
        <span className="absolute inline-flex h-24 w-24 rounded-full bg-rose-400/30 animate-ping" />
        <span className="absolute inline-flex h-20 w-20 rounded-full bg-rose-500/20 animate-pulse" />
        <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-tr from-rose-600 to-red-500 text-white shadow-lg shadow-rose-500/30">
          <Mic className="h-8 w-8 animate-bounce" />
        </div>
      </div>

      {/* Audio Wave Visualizer Bars */}
      <div className="flex items-center justify-center gap-1.5 h-8" aria-hidden="true">
        <span className="w-1.5 h-4 bg-rose-500 rounded-full animate-[bounce_1s_infinite_100ms]" />
        <span className="w-1.5 h-7 bg-rose-500 rounded-full animate-[bounce_1s_infinite_300ms]" />
        <span className="w-1.5 h-8 bg-rose-600 rounded-full animate-[bounce_1s_infinite_200ms]" />
        <span className="w-1.5 h-6 bg-rose-500 rounded-full animate-[bounce_1s_infinite_400ms]" />
        <span className="w-1.5 h-3 bg-rose-400 rounded-full animate-[bounce_1s_infinite_150ms]" />
      </div>

      {/* Status Heading */}
      <div className="space-y-1">
        <h3 className="text-lg font-bold text-slate-900">Listening...</h3>
        <p className="text-xs text-slate-500">
          Speak naturally in <span className="font-semibold text-slate-700">{languageName}</span>
        </p>
      </div>

      {/* Live Transcript Box */}
      <div
        className="w-full max-w-sm min-h-[64px] max-h-[120px] overflow-y-auto p-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-700 font-medium italic transition-all flex items-center justify-center"
        aria-label="Live speech transcript preview"
      >
        {transcript ? (
          <p className="not-italic text-slate-900 font-normal">&quot;{transcript}&quot;</p>
        ) : (
          <p className="text-slate-400 text-xs not-italic">Say e.g. &quot;Today Rahul spent 500 on petrol&quot;</p>
        )}
      </div>

      {/* Stop Recording Button */}
      <Button
        type="button"
        onClick={onStop}
        variant="destructive"
        aria-label="Stop speech recognition"
        className="bg-rose-600 hover:bg-rose-700 text-white font-semibold gap-2 rounded-full px-6 py-2 shadow-md transition-transform hover:scale-105 cursor-pointer"
      >
        <Square className="h-4 w-4 fill-white" />
        <span>Done Speaking / Stop</span>
      </Button>
    </div>
  );
}
