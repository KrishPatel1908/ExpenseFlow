import type { VoiceLanguageCode, ISpeechRecognitionInstance } from "../types";

/**
 * Check if the current browser supports Web Speech API (SpeechRecognition).
 */
export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
}

/**
 * Get native SpeechRecognition constructor from window.
 */
export function getSpeechRecognitionClass(): (new () => ISpeechRecognitionInstance) | null {
  if (typeof window === "undefined") return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

/**
 * Check if microphone permissions are granted.
 */
export async function checkMicrophonePermission(): Promise<PermissionState | "unsupported"> {
  if (typeof navigator === "undefined" || !navigator.permissions) {
    return "unsupported";
  }
  try {
    const permissionStatus = await navigator.permissions.query({ name: "microphone" as PermissionName });
    return permissionStatus.state;
  } catch {
    return "unsupported";
  }
}

/**
 * Request microphone access explicitly to trigger browser permission popup if needed.
 */
export async function requestMicrophoneAccess(): Promise<boolean> {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    return false;
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    // Stop tracks immediately after permission is granted
    stream.getTracks().forEach((track) => track.stop());
    return true;
  } catch {
    return false;
  }
}

export interface VoiceLanguageOption {
  code: VoiceLanguageCode;
  label: string;
  flag: string;
}

export const SUPPORTED_VOICE_LANGUAGES: VoiceLanguageOption[] = [
  { code: "en-IN", label: "English", flag: "🇬🇧" },
  { code: "gu-IN", label: "ગુજરાતી", flag: "🇮🇳" },
];
