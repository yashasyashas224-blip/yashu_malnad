import { useEffect, useRef, useState } from 'react';
import {
  ArrowUpRight,
  Bot,
  CornerDownLeft,
  MapPin,
  Navigation,
  ShieldCheck,
} from 'lucide-react';
import {
  CATEGORY_BY_ID,
  type CampusLocation,
} from '../data/locations';
import { answerCampusQuestion } from '../lib/assistant';
import { Modal } from './Modal';

interface AssistantPanelProps {
  open: boolean;
  onClose: () => void;
  locations: CampusLocation[];
  onShowLocation: (location: CampusLocation) => void;
  onDirections: (location: CampusLocation) => void;
}

interface ChatMessage {
  id: number;
  role: 'user' | 'assistant';
  text: string;
  locations?: CampusLocation[];
  source?: { label: string; url: string };
  suggestions?: string[];
}

const INITIAL_MESSAGE: ChatMessage = {
  id: 0,
  role: 'assistant',
  text: 'Namaskara! I am the MCE campus guide. Ask me to find a verified place, for example “Where is the library?” or “How do I get to the CS&E department?”. I only answer from the campus dataset and will say when something is not verified.',
  suggestions: ['Where is the library?', 'How do I get to the CS&E department?', 'Where is the canteen?'],
};

export function AssistantPanel({
  open,
  onClose,
  locations,
  onShowLocation,
  onDirections,
}: AssistantPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const logRef = useRef<HTMLDivElement>(null);
  const nextId = useRef(1);

  useEffect(() => {
    if (!open) return;
    const log = logRef.current;
    if (log) log.scrollTop = log.scrollHeight;
  }, [messages, open]);

  const ask = (question: string): void => {
    const trimmed = question.trim();
    if (!trimmed) return;

    const answer = answerCampusQuestion(trimmed, locations);
    const userId = nextId.current++;
    const assistantId = nextId.current++;
    setMessages((current) => [
      ...current,
      { id: userId, role: 'user', text: trimmed },
      {
        id: assistantId,
        role: 'assistant',
        text: answer.text,
        ...(answer.locations.length > 0 ? { locations: answer.locations } : {}),
        ...(answer.source ? { source: answer.source } : {}),
        ...(answer.suggestions ? { suggestions: answer.suggestions } : {}),
      },
    ]);
    setInput('');
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Campus Assistant"
      description="Answers use only the verified campus dataset. No conversation is stored."
      variant="drawer"
    >
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex shrink-0 items-center gap-2 border-b border-slate-100 bg-emerald-50/70 px-5 py-2">
          <ShieldCheck aria-hidden="true" className="h-4 w-4 text-emerald-700" />
          <p className="text-[11px] font-bold text-emerald-900">
            Grounded in verified map data · rule-based, no external AI service
          </p>
        </div>

        <div
          ref={logRef}
          role="log"
          aria-live="polite"
          aria-label="Assistant conversation"
          className="nice-scroll min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4"
        >
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[92%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed ${
                  message.role === 'user'
                    ? 'rounded-br-md bg-navy-900 text-white'
                    : 'rounded-bl-md border border-slate-200 bg-slate-50 text-slate-700'
                }`}
              >
                {message.role === 'assistant' ? (
                  <p className="mb-1 flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    <Bot aria-hidden="true" className="h-3 w-3" />
                    Campus guide
                  </p>
                ) : null}
                <p className="whitespace-pre-line">{message.text}</p>

                {message.locations && message.locations.length > 0 ? (
                  <div className="mt-2.5 space-y-2">
                    {message.locations.map((location) => {
                      const meta = CATEGORY_BY_ID[location.category];
                      return (
                        <div
                          key={location.id}
                          className="rounded-xl border border-slate-200 bg-white p-2.5"
                        >
                          <p className="flex items-center gap-1.5 text-xs font-bold text-navy-900">
                            <span aria-hidden="true">{meta.emoji}</span>
                            {location.name}
                          </p>
                          <div className="mt-1.5 flex flex-wrap gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                onShowLocation(location);
                                onClose();
                              }}
                              className="inline-flex items-center gap-1 rounded-lg bg-navy-900 px-2.5 py-1.5 text-[11px] font-bold text-white hover:bg-navy-800"
                            >
                              <MapPin aria-hidden="true" className="h-3 w-3" />
                              Show on map
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                onDirections(location);
                                onClose();
                              }}
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-1.5 text-[11px] font-bold text-navy-900 hover:bg-slate-50"
                            >
                              <Navigation aria-hidden="true" className="h-3 w-3" />
                              Directions
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : null}

                {message.source ? (
                  <a
                    href={message.source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 hover:underline"
                  >
                    {message.source.label}
                    <ArrowUpRight aria-hidden="true" className="h-3 w-3" />
                  </a>
                ) : null}

                {message.suggestions ? (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {message.suggestions.map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => ask(suggestion)}
                        className="rounded-full border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:border-navy-300 hover:text-navy-900"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          ))}
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            ask(input);
          }}
          className="shrink-0 border-t border-slate-200 px-3 py-2.5"
        >
          <label htmlFor="assistant-question" className="sr-only">
            Ask the campus guide a question
          </label>
          <div className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-2.5 py-1.5 focus-within:border-gold-500 focus-within:ring-4 focus-within:ring-gold-500/20">
            <input
              id="assistant-question"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              maxLength={300}
              placeholder="Ask where something is…"
              className="min-w-0 flex-1 bg-transparent py-1.5 text-sm text-slate-900 outline-none placeholder:text-slate-400"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              aria-label="Send question"
              className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-navy-900 text-white transition hover:bg-navy-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <CornerDownLeft aria-hidden="true" className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-1.5 px-1 text-[10px] leading-relaxed text-slate-400">
            Messages stay in this browser tab. No conversation or location data is stored, and
            this guide does not call a third-party AI service.
          </p>
        </form>
      </div>
    </Modal>
  );
}
