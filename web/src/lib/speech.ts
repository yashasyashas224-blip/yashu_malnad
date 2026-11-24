import { type Language, speechLocale } from './i18n';

/**
 * Thin wrapper over the browser SpeechSynthesis API. Screen readers already
 * read the written steps, so speech is an optional extra: when the browser or
 * the voice is missing, the interface keeps the written instructions and says
 * why speech did not start.
 */

export type SpeechResult = 'spoken' | 'unsupported' | 'no-voice' | 'empty';

export function speechSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'speechSynthesis' in window &&
    typeof window.SpeechSynthesisUtterance === 'function'
  );
}

function pickVoice(locale: string): SpeechSynthesisVoice | null {
  if (!speechSupported()) return null;
  const voices = window.speechSynthesis.getVoices();
  const exact = voices.find((voice) => voice.lang.toLowerCase() === locale.toLowerCase());
  if (exact) return exact;
  const base = locale.split('-')[0]?.toLowerCase() ?? '';
  return voices.find((voice) => voice.lang.toLowerCase().startsWith(base)) ?? null;
}

/** True when the device has a voice for this language installed. */
export function hasVoiceFor(language: Language): boolean {
  return pickVoice(speechLocale(language)) !== null;
}

export function speak(text: string, language: Language): SpeechResult {
  const trimmed = text.trim();
  if (!trimmed) return 'empty';
  if (!speechSupported()) return 'unsupported';

  const locale = speechLocale(language);
  const voice = pickVoice(locale);
  // A Kannada script read with an English voice is unintelligible, so report
  // the missing voice and let the caller offer the English text instead.
  if (language === 'kn' && !voice) return 'no-voice';

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(trimmed);
  utterance.lang = voice?.lang ?? locale;
  if (voice) utterance.voice = voice;
  utterance.rate = 0.95;
  utterance.pitch = 1;
  window.speechSynthesis.speak(utterance);
  return 'spoken';
}

export function stopSpeaking(): void {
  if (speechSupported()) window.speechSynthesis.cancel();
}

/** Whether a Kannada voice exists may only be known after voices load. */
export function onVoicesReady(callback: () => void): () => void {
  if (!speechSupported()) return () => {};
  if (window.speechSynthesis.getVoices().length > 0) {
    callback();
    return () => {};
  }
  window.speechSynthesis.addEventListener('voiceschanged', callback);
  return () => window.speechSynthesis.removeEventListener('voiceschanged', callback);
}
