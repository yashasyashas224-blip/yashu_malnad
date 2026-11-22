import React, { useState } from 'react';
import { Bot, Send, Navigation, X, Sparkles, Compass } from 'lucide-react';

interface AIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToEntity: (entity: any) => void;
}

interface Message {
  sender: 'user' | 'assistant';
  text: string;
  matchedEntity?: any;
  navigationAction?: any;
  suggestedQuestions?: string[];
}

export const AIAssistantModal: React.FC<AIAssistantModalProps> = ({
  isOpen,
  onClose,
  onNavigateToEntity
}) => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'assistant',
      text: 'Namaskara! I am your verified Malnad College of Engineering (MCE) Campus AI Assistant. How can I help you navigate campus today?',
      suggestedQuestions: [
        'Where is the CSE department?',
        'Where is the Examination Section?',
        'Where is the AI and ML laboratory?',
        'Take me to ME-RIISE Foundation',
        'Where is the Principal\'s Office?'
      ]
    }
  ]);

  if (!isOpen) return null;

  const handleSend = (textToSend?: string) => {
    const q = textToSend || input;
    if (!q.trim()) return;

    const userMsg: Message = { sender: 'user', text: q };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    fetch('/api/ai/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: q })
    })
      .then(res => res.json())
      .then(data => {
        setLoading(false);
        if (data.success && data.result) {
          const r = data.result;
          setMessages(prev => [
            ...prev,
            {
              sender: 'assistant',
              text: r.answer,
              matchedEntity: r.matchedEntity,
              navigationAction: r.navigationAction,
              suggestedQuestions: r.suggestedQuestions
            }
          ]);
        }
      })
      .catch(() => {
        setLoading(false);
        setMessages(prev => [
          ...prev,
          { sender: 'assistant', text: 'Sorry, I encountered an issue connecting to the MCE campus service.' }
        ]);
      });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-md flex flex-col justify-end sm:justify-center sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white/95 backdrop-blur-2xl rounded-t-3xl sm:rounded-3xl max-w-lg w-full sm:mx-auto h-[86vh] sm:h-[78vh] flex flex-col shadow-2xl border border-white/80 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#07162c] via-[#0f2c59] to-[#1e3a8a] text-white p-4.5 px-5 flex items-center justify-between shadow-md">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-900 flex items-center justify-center font-black shadow-md">
              <Bot className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm flex items-center space-x-1.5">
                <span>MCE Campus Assistant</span>
                <Sparkles className="w-4 h-4 text-amber-300" />
              </h3>
              <p className="text-[11px] text-slate-300 font-medium">Grounded strictly on verified MCE records</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {messages.map((m, idx) => (
            <div key={idx} className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}>
              <div
                className={`max-w-[88%] rounded-3xl p-4 text-xs sm:text-sm leading-relaxed shadow-sm ${
                  m.sender === 'user'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-br-none shadow-blue-500/10'
                    : 'bg-slate-100/90 text-slate-900 rounded-bl-none border border-slate-200'
                }`}
              >
                <p>{m.text}</p>

                {/* Direct Action Navigation Pill */}
                {m.navigationAction?.available && m.matchedEntity && (
                  <button
                    onClick={() => {
                      onNavigateToEntity(m.matchedEntity);
                      onClose();
                    }}
                    className="mt-3.5 w-full bg-[#0f2c59] hover:bg-slate-900 active:scale-[0.98] text-white px-4 py-2.5 rounded-2xl text-xs font-extrabold flex items-center justify-center space-x-2 shadow-lg transition-all border border-amber-400/30"
                  >
                    <Navigation className="w-3.5 h-3.5 text-amber-400" />
                    <span>{m.navigationAction.label}</span>
                  </button>
                )}
              </div>

              {/* Suggested Questions */}
              {m.suggestedQuestions && m.suggestedQuestions.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {m.suggestedQuestions.map((sq, sIdx) => (
                    <button
                      key={sIdx}
                      onClick={() => handleSend(sq)}
                      className="text-[11px] font-bold bg-blue-50 hover:bg-blue-100/80 text-[#0f2c59] border border-blue-200/80 rounded-full px-3 py-1.5 transition-all active:scale-95 shadow-2xs"
                    >
                      {sq}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center space-x-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-100 text-slate-500 text-xs font-medium w-fit">
              <div className="w-2 h-2 rounded-full bg-blue-600 animate-bounce" />
              <div className="w-2 h-2 rounded-full bg-blue-600 animate-bounce delay-100" />
              <div className="w-2 h-2 rounded-full bg-blue-600 animate-bounce delay-200" />
              <span>Querying verified Malnad College records...</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-3 sm:p-4 border-t border-slate-100 bg-slate-50/80 flex items-center space-x-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Ask where any department, lab or office is..."
            className="flex-1 bg-white border border-slate-200 rounded-2xl px-4 py-3 text-xs sm:text-sm focus:outline-none focus:border-blue-500 font-medium shadow-inner"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
            className="w-11 h-11 bg-[#0f2c59] hover:bg-slate-900 disabled:opacity-40 text-white rounded-2xl shadow-lg transition-all active:scale-95 flex items-center justify-center shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
