"use client";

import { useState } from "react";
import { parseTransaction, type ParsedTransaction, type NlpLanguageCode } from "@/lib/nlp";

const SAMPLE_CATEGORIES = [
  "Petrol",
  "Grocery",
  "Food",
  "Medicine",
  "Shopping",
  "Salary",
  "Rent",
];

const PRESET_TEST_CASES = [
  {
    label: "EN 1: Today Rahul spent 500 on petrol",
    language: "en-IN" as NlpLanguageCode,
    transcript: "Today Rahul spent 500 on petrol.",
  },
  {
    label: "EN 2: Rahul paid 1200 rent",
    language: "en-IN" as NlpLanguageCode,
    transcript: "Rahul paid 1200 rent.",
  },
  {
    label: "EN 3: I received 25000 salary today",
    language: "en-IN" as NlpLanguageCode,
    transcript: "I received 25000 salary today.",
  },
  {
    label: "EN 4: Tomorrow Rahul will pay 800",
    language: "en-IN" as NlpLanguageCode,
    transcript: "Tomorrow Rahul will pay 800.",
  },
  {
    label: "GU 1: આજે રાહુલને 500 રૂપિયા આપ્યા",
    language: "gu-IN" as NlpLanguageCode,
    transcript: "આજે રાહુલને 500 રૂપિયા આપ્યા.",
  },
  {
    label: "GU 2: આજે 300 પેટ્રોલમાં ખર્ચ કર્યા",
    language: "gu-IN" as NlpLanguageCode,
    transcript: "આજે 300 પેટ્રોલમાં ખર્ચ કર્યા.",
  },
  {
    label: "GU 3: આજે 25000 પગાર મળ્યો",
    language: "gu-IN" as NlpLanguageCode,
    transcript: "આજે 25000 પગાર મળ્યો.",
  },
  {
    label: "EN 5: 5th July 500 petrol",
    language: "en-IN" as NlpLanguageCode,
    transcript: "5th July 500 petrol",
  },
  {
    label: "GU 4: ૫ જુલાઈ 300 પેટ્રોલ આપ્યા",
    language: "gu-IN" as NlpLanguageCode,
    transcript: "૫ જુલાઈ 300 પેટ્રોલ આપ્યા",
  },
];

export default function DevParserPage() {
  const [transcript, setTranscript] = useState<string>("Today Rahul spent 500 on petrol.");
  const [language, setLanguage] = useState<NlpLanguageCode>("en-IN");
  const [categoriesInput, setCategoriesInput] = useState<string>(SAMPLE_CATEGORIES.join(", "));
  const [parsedResult, setParsedResult] = useState<ParsedTransaction | null>(null);
  const [executionTimeMs, setExecutionTimeMs] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleParse = () => {
    setError(null);
    if (!transcript.trim()) {
      setError("Please enter a valid transcript string.");
      setParsedResult(null);
      setExecutionTimeMs(null);
      return;
    }

    try {
      const parsedCategories = categoriesInput
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean);

      const startTime = performance.now();
      const result = parseTransaction(transcript, {
        language,
        availableCategories: parsedCategories,
      });
      const endTime = performance.now();

      setExecutionTimeMs(Number((endTime - startTime).toFixed(3)));
      setParsedResult(result);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Failed to parse transcript.";
      setError(errMsg);
      setParsedResult(null);
      setExecutionTimeMs(null);
    }
  };

  const loadPreset = (preset: (typeof PRESET_TEST_CASES)[number]) => {
    setLanguage(preset.language);
    setTranscript(preset.transcript);
  };

  const getConfidenceBadge = (confidence?: "high" | "medium" | "low") => {
    switch (confidence) {
      case "high":
        return "bg-emerald-100 text-emerald-800 border-emerald-300";
      case "medium":
        return "bg-amber-100 text-amber-800 border-amber-300";
      case "low":
      default:
        return "bg-rose-100 text-rose-800 border-rose-300";
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6 md:p-10 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="border-b border-slate-800 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold uppercase tracking-wider mb-2">
              Development Only
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">
              Rule-Based NLP Parser Tester
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Route: <code className="text-pink-400 bg-slate-800 px-2 py-0.5 rounded">/dev/parser</code>
            </p>
          </div>

          <button
            type="button"
            onClick={handleParse}
            className="bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold py-2.5 px-6 rounded-xl shadow-lg transition-all cursor-pointer self-start md:self-auto"
          >
            Run Parser ⚡
          </button>
        </div>

        {/* Preset Quick Loader */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Quick Test Cases
          </label>
          <div className="flex flex-wrap gap-2">
            {PRESET_TEST_CASES.map((tc, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => loadPreset(tc)}
                className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-3 py-1.5 rounded-lg border border-slate-700 transition-colors cursor-pointer"
              >
                {tc.label}
              </button>
            ))}
          </div>
        </div>

        {/* Input Form */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-800/60 p-6 rounded-2xl border border-slate-800 shadow-xl">
          {/* Transcript Textarea */}
          <div className="md:col-span-2 space-y-2">
            <label htmlFor="dev-transcript-input" className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
              Transcript Text
            </label>
            <textarea
              id="dev-transcript-input"
              rows={3}
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="e.g. Today Rahul spent 500 on petrol."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          {/* Controls Column */}
          <div className="space-y-4">
            {/* Language Selector */}
            <div className="space-y-1.5">
              <label htmlFor="dev-language-select" className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                Language
              </label>
              <select
                id="dev-language-select"
                value={language}
                onChange={(e) => setLanguage(e.target.value as NlpLanguageCode)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-sm text-white font-medium focus:outline-none focus:ring-2 focus:ring-rose-500 cursor-pointer"
              >
                <option value="en-IN">🇬🇧 English (en-IN)</option>
                <option value="gu-IN">🇮🇳 Gujarati (gu-IN)</option>
              </select>
            </div>

            {/* Categories Input */}
            <div className="space-y-1.5">
              <label htmlFor="dev-categories-input" className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                Available Categories
              </label>
              <input
                id="dev-categories-input"
                type="text"
                value={categoriesInput}
                onChange={(e) => setCategoriesInput(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500"
                placeholder="Comma-separated category list"
              />
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-4 bg-rose-950/80 border border-rose-700/80 text-rose-200 text-sm font-semibold rounded-xl">
            ❌ {error}
          </div>
        )}

        {/* Parsing Output Results */}
        {parsedResult && (
          <div className="space-y-6 bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 shadow-2xl">
            {/* Output Header */}
            <div className="flex flex-wrap items-center justify-between border-b border-slate-700 pb-4 gap-4">
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold text-white">Parsed Output</span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${getConfidenceBadge(
                    parsedResult.confidence
                  )}`}
                >
                  {parsedResult.confidence} Confidence
                </span>
              </div>

              {executionTimeMs !== null && (
                <div className="text-xs font-mono text-slate-400 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800">
                  ⏱️ Execution Time: <span className="text-emerald-400 font-bold">{executionTimeMs} ms</span>
                </div>
              )}
            </div>

            {/* Field Breakdown Table */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-slate-900/70 p-3.5 rounded-xl border border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Customer</span>
                <p className="text-base font-bold text-white mt-0.5">
                  {parsedResult.customer || <span className="text-slate-500 font-normal italic">null</span>}
                </p>
              </div>

              <div className="bg-slate-900/70 p-3.5 rounded-xl border border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Amount</span>
                <p className="text-base font-bold text-emerald-400 mt-0.5">
                  {parsedResult.amount !== null ? (
                    `₹${parsedResult.amount}`
                  ) : (
                    <span className="text-slate-500 font-normal italic">null</span>
                  )}
                </p>
              </div>

              <div className="bg-slate-900/70 p-3.5 rounded-xl border border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Transaction Type</span>
                <p className="text-base font-bold mt-0.5">
                  {parsedResult.transactionType === "credit" ? (
                    <span className="text-emerald-400 uppercase">Credit</span>
                  ) : parsedResult.transactionType === "debit" ? (
                    <span className="text-rose-400 uppercase">Debit</span>
                  ) : (
                    <span className="text-slate-500 font-normal italic">null</span>
                  )}
                </p>
              </div>

              <div className="bg-slate-900/70 p-3.5 rounded-xl border border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Category</span>
                <p className="text-base font-bold text-amber-300 mt-0.5">
                  {parsedResult.category || <span className="text-slate-500 font-normal italic">null</span>}
                </p>
              </div>

              <div className="bg-slate-900/70 p-3.5 rounded-xl border border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date</span>
                <p className="text-base font-bold text-sky-300 mt-0.5">
                  {parsedResult.date || <span className="text-slate-500 font-normal italic">null</span>}
                </p>
              </div>

              <div className="bg-slate-900/70 p-3.5 rounded-xl border border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Confidence Score</span>
                <p className="text-base font-bold uppercase mt-0.5 text-slate-200">
                  {parsedResult.confidence}
                </p>
              </div>
            </div>

            {/* Raw JSON View */}
            <div className="space-y-2 pt-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Raw Output JSON</span>
              <pre className="bg-slate-950 p-4 rounded-xl text-xs font-mono text-pink-300 border border-slate-800 overflow-x-auto">
                {JSON.stringify(parsedResult, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
