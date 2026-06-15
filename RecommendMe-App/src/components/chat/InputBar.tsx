import { useState, KeyboardEvent, useRef, useEffect } from "react";
import { Send } from "lucide-react";

interface InputBarProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

const placeholders = [
  "e.g. 'Best running shoes under ₹5,000 for flat feet'",
  "e.g. 'Gift ideas for a 10-year-old who loves science'",
  "e.g. 'Setting up a home office, budget ₹20,000'",
  "e.g. 'Waterproof camera for underwater photography'",
];

const DEBOUNCE_DELAY = 300; // Prevent accidental double-clicks/rapid fires

export default function InputBar({ onSend, disabled }: InputBarProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [placeholderIdx] = useState(() => Math.floor(Math.random() * placeholders.length));
  const lastSubmitTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!disabled) {
      textareaRef.current?.focus();
    }
  }, [disabled]);

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;

    // Prevent duplicate submissions via debounce
    const now = Date.now();
    if (now - lastSubmitTimeRef.current < DEBOUNCE_DELAY) {
      // Suppress duplicate submit within DEBOUNCE_DELAY ms
      return;
    }
    lastSubmitTimeRef.current = now;

    onSend(trimmed);
    setValue("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const charCount = value.length;
  const maxChars = 500;

  return (
    <div className="w-full border-t border-border bg-background px-3 sm:px-4 py-2 sm:py-3 shrink-0">
      <div className="mx-auto w-full max-w-6xl">
        <div className={`flex items-end gap-2 bg-secondary/80 rounded-2xl px-3 sm:px-4 py-2 border border-transparent transition-colors focus-within:border-ring/30 focus-within:bg-secondary`}>
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => {
              if (e.target.value.length <= maxChars) {
                setValue(e.target.value);
              }
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholders[placeholderIdx]}
            disabled={disabled}
            rows={1}
            className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground/50 text-sm resize-none outline-none max-h-32 py-2 leading-relaxed disabled:opacity-50"
            style={{ minHeight: "24px" }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = "auto";
              target.style.height = Math.min(target.scrollHeight, 128) + "px";
            }}
            aria-label="Type your message"
          />
          <div className="flex items-center gap-1 pb-1">
            {charCount > 0 && (
              <span className={`text-[10px] tabular-nums mr-1 ${charCount > maxChars * 0.9 ? "text-destructive" : "text-muted-foreground/50"}`}>
                {charCount}/{maxChars}
              </span>
            )}
            <button
              type="button"
              onClick={handleSend}
              disabled={disabled || !value.trim()}
              className="p-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-20 disabled:cursor-not-allowed transition-all shrink-0"
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="flex items-center justify-between mt-1.5 px-1 gap-2">
          <span className="text-[10px] text-muted-foreground/40 hidden sm:inline">
            Include budget, use case, or preferences for better results
          </span>
          <span className="text-[10px] text-muted-foreground/40 hidden sm:inline">
            We don't sell products or handle transactions
          </span>
          <span className="text-[9px] text-muted-foreground/40 sm:hidden">
            Include budget & preferences • No sales
          </span>
        </div>
      </div>
    </div>
  );
}
