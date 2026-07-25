/**
 * Keeps browser SpeechRecognition's repeatedly-emitted result list from becoming
 * a repeatedly-appended transcript. It is intentionally independent from React
 * so its state survives render cycles but is reset for every user session.
 */
export class TranscriptManager {
  private finalTranscript = "";
  private interimTranscript = "";
  private readonly processedFinalIndexes = new Set<number>();

  reset(): void {
    this.finalTranscript = "";
    this.interimTranscript = "";
    this.processedFinalIndexes.clear();
  }

  beginRecognitionInstance(): void {
    // Result indexes are scoped to a native recognition instance, while the
    // final transcript is scoped to the whole user session (including retry).
    this.processedFinalIndexes.clear();
    this.interimTranscript = "";
  }

  addFinal(index: number, value: string): boolean {
    if (this.processedFinalIndexes.has(index)) return false;
    this.processedFinalIndexes.add(index);

    const incoming = normalizeTranscript(value);
    if (!incoming) return false;

    const next = mergeTranscript(this.finalTranscript, incoming);
    if (next === this.finalTranscript) return false;
    this.finalTranscript = next;
    return true;
  }

  setInterim(value: string): boolean {
    const next = normalizeTranscript(value);
    if (next === this.interimTranscript) return false;
    this.interimTranscript = next;
    return true;
  }

  clearInterim(): boolean {
    return this.setInterim("");
  }

  getFinal(): string {
    return this.finalTranscript;
  }

  getInterim(): string {
    return this.interimTranscript;
  }

  getBest(): string {
    return this.finalTranscript || this.interimTranscript;
  }
}

export function normalizeTranscript(value: string): string {
  const words = value.trim().replace(/\s+/g, " ").split(" ").filter(Boolean);
  const deduplicated = words.filter((word, index) =>
    index === 0 || word.toLocaleLowerCase() !== words[index - 1].toLocaleLowerCase()
  );
  return removeRepeatedPhrases(deduplicated).join(" ");
}

function mergeTranscript(current: string, incoming: string): string {
  if (!current) return incoming;
  const existing = current.split(" ");
  const addition = incoming.split(" ");
  const same = (left: string, right: string) => left.toLocaleLowerCase() === right.toLocaleLowerCase();

  if (current.toLocaleLowerCase() === incoming.toLocaleLowerCase()) return current;
  if (addition.length >= existing.length && existing.every((word, index) => same(word, addition[index]))) {
    return incoming;
  }
  if (existing.length >= addition.length && addition.every((word, index) => same(word, existing[index]))) {
    return current;
  }

  let overlap = 0;
  for (let length = Math.min(existing.length, addition.length); length > 0; length -= 1) {
    if (existing.slice(-length).every((word, index) => same(word, addition[index]))) {
      overlap = length;
      break;
    }
  }
  return removeRepeatedPhrases([...existing, ...addition.slice(overlap)]).join(" ");
}

function removeRepeatedPhrases(words: string[]): string[] {
  const result: string[] = [];
  for (const word of words) {
    result.push(word);
    for (let size = Math.floor(result.length / 2); size > 0; size -= 1) {
      const left = result.slice(-size * 2, -size);
      const right = result.slice(-size);
      if (left.every((part, index) => part.toLocaleLowerCase() === right[index].toLocaleLowerCase())) {
        result.splice(result.length - size, size);
        break;
      }
    }
  }
  return result;
}
