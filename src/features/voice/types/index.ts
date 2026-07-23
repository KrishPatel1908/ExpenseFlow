export type SpeechRecognitionStatus =
  | "idle"
  | "requesting-permission"
  | "listening"
  | "processing"
  | "error"
  | "unsupported";

export type VoiceLanguageCode = "en-IN" | "hi-IN" | "gu-IN";

export type SpeechRecognitionErrorCode =
  | "not-allowed"
  | "no-speech"
  | "audio-capture"
  | "network"
  | "aborted"
  | "service-not-allowed"
  | "bad-grammar"
  | "language-not-supported"
  | "unsupported-browser"
  | "unknown";

export interface SpeechRecognitionErrorDetails {
  code: SpeechRecognitionErrorCode;
  message: string;
}

export interface WebSpeechRecognitionResultItem {
  transcript: string;
  confidence: number;
}

export interface WebSpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): WebSpeechRecognitionResultItem;
  [index: number]: WebSpeechRecognitionResultItem;
}

export interface WebSpeechRecognitionResultList {
  length: number;
  item(index: number): WebSpeechRecognitionResult;
  [index: number]: WebSpeechRecognitionResult;
}

export interface WebSpeechRecognitionEvent {
  resultIndex: number;
  results: WebSpeechRecognitionResultList;
}

export interface WebSpeechRecognitionErrorEvent {
  error: string;
  message?: string;
}

export interface ISpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: WebSpeechRecognitionErrorEvent) => void) | null;
  onresult: ((event: WebSpeechRecognitionEvent) => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

export interface VoiceParsedResult {
  customer?: string;
  amount?: number;
  transactionType?: "credit" | "debit";
  category?: string;
  description?: string;
  date?: string;
  matchedCustomer?: {
    customerName: string;
    customerPhone: string;
    category?: string | null;
  } | null;
  multipleCustomerMatches?: Array<{
    customerName: string;
    customerPhone: string;
    category?: string | null;
  }>;
}

export interface VoiceApiResponse {
  success: boolean;
  data?: {
    customer: string;
    amount: number;
    transactionType: "credit" | "debit";
    category: string;
    description: string;
    date: string;
    normalizedCategory?: string;
    formattedDate?: string;
  };
  reason?: string | null;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => ISpeechRecognitionInstance;
    webkitSpeechRecognition?: new () => ISpeechRecognitionInstance;
  }
}
