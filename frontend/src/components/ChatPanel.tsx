import { useState, useRef, useEffect, useCallback } from "react";
import type { ChatMessage } from "../types";

interface Props {
  messages: ChatMessage[];
  onSendMessage: (text: string) => Promise<void>;
  error: string | null;
}

export default function ChatPanel({ messages, onSendMessage, error }: Props) {
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;

    setInput("");
    setSending(true);
    try {
      await onSendMessage(text);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  return (
    <div className="flex flex-col h-full min-h-[400px] lg:min-h-0">
      {/* Chat Header */}
      <div className="px-4 py-3 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse-glow" />
          <h2 className="text-sm font-semibold text-text">SolFolio Agent</h2>
          <span className="text-text-muted text-xs">
            Ask about any wallet or token
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-text-muted py-12">
            <span className="text-4xl mb-3">💬</span>
            <p className="text-sm font-medium mb-3">Start a conversation</p>
            <div className="space-y-2 text-xs max-w-xs">
              {[
                "Analyze wallet 7xKX…AsU",
                "What's the price of SOL?",
                "Show me my riskiest holdings",
              ].map((example) => (
                <button
                  key={example}
                  onClick={() => {
                    setInput(example);
                    inputRef.current?.focus();
                  }}
                  className="block w-full text-left px-3 py-2 rounded-lg bg-surface border border-border
                             hover:border-primary/40 hover:text-primary transition-colors"
                >
                  "{example}"
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex animate-fade-in ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-primary/15 text-primary border border-primary/20"
                  : "bg-surface border border-border text-text"
              }`}
            >
              <div className="whitespace-pre-wrap break-words">{msg.text}</div>
              <p className="text-[10px] text-text-muted mt-1.5 opacity-60">
                {new Date(msg.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
        ))}

        {sending && (
          <div className="flex justify-start animate-fade-in">
            <div className="bg-surface border border-border rounded-xl px-4 py-3">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Error */}
      {error && (
        <div className="mx-4 mb-2 px-3 py-2 rounded-lg bg-negative/10 border border-negative/30 text-negative text-xs">
          {error}
        </div>
      )}

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="p-3 border-t border-border shrink-0"
      >
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about a wallet, token, or portfolio…"
            className="flex-1 bg-surface border border-border rounded-lg px-3.5 py-2.5 text-sm text-text
                       placeholder:text-text-muted focus:outline-none focus:border-primary/60
                       transition-colors"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={sending || !input.trim()}
            className="bg-primary text-bg rounded-lg px-4 py-2.5 text-sm font-semibold
                       hover:bg-primary/90 transition-colors disabled:opacity-40
                       disabled:cursor-not-allowed shrink-0"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
