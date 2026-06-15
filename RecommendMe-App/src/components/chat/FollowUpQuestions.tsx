import { motion, AnimatePresence } from "framer-motion";

interface FollowUpQuestionsProps {
  questions: string[];
  onSelectOption?: (option: string) => void;
}

/**
 * Parses a question string to extract any inline option chips.
 *
 * Looks for patterns like:
 *   "Road running, trail running, or gym use?"
 *   "Light, intense, emotional, or funny?"
 *   "Something light, intense, emotional, or funny?"
 *
 * Returns { questionText, options } where options may be empty if no
 * valid chip set was detected.
 */
function parseQuestionWithOptions(raw: string): {
  questionText: string;
  options: string[];
} {
  // Match " — opt1, opt2, or opt3?" or just bare "opt1, opt2, or opt3?"
  // at the end of the sentence.
  const dashPattern = /—\s*(.+?)(?:\?|$)/;
  const dashMatch = raw.match(dashPattern);

  let optionSection: string | null = null;
  let questionText = raw;

  if (dashMatch) {
    optionSection = dashMatch[1].trim();
    // The part before the dash is the question stem
    questionText = raw.split("—")[0].trim();
    if (!questionText) questionText = raw;
  } else {
    // Try: detect "a, b, or c?" at end of string
    const trailingPattern = /^(.*?)\s*[:—]?\s*([A-Z][^:—]+(?:,\s*[^,]+)*,?\s*or\s+[^?]+)\??$/i;
    const trailingMatch = raw.match(trailingPattern);
    if (trailingMatch && trailingMatch[1] && trailingMatch[2]) {
      questionText = trailingMatch[1].trim();
      optionSection = trailingMatch[2].trim();
    }
  }

  if (!optionSection) return { questionText: raw, options: [] };

  // Split by comma and "or"
  const parts = optionSection
    .split(/,\s*|\s+or\s+/i)
    .map((p) => p.replace(/[?.]$/, "").trim())
    .filter((p) => p.length > 0 && p.length <= 40);

  // Only use chips if we have 2–5 meaningful options
  if (parts.length < 2 || parts.length > 5) {
    return { questionText: raw, options: [] };
  }

  return { questionText, options: parts };
}

export default function FollowUpQuestions({
  questions,
  onSelectOption,
}: FollowUpQuestionsProps) {
  if (!questions || questions.length === 0) return null;

  return (
    <div className="space-y-4">
      {questions.map((question, idx) => {
        const { questionText, options } = parseQuestionWithOptions(question);
        const hasOptions = options.length >= 2;

        return (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.08, duration: 0.28 }}
            className="space-y-2"
          >
            {/* Question text */}
            <p className="text-sm leading-relaxed text-chat-ai-foreground">
              {hasOptions ? (
                <>
                  {questionText}
                  {questionText && !questionText.endsWith("?") && !questionText.endsWith(":") ? " —" : ""}
                </>
              ) : (
                question
              )}
            </p>

            {/* Option chips */}
            {hasOptions && (
              <AnimatePresence>
                <div className="flex flex-wrap gap-1.5">
                  {options.map((option) => (
                    <motion.button
                      key={option}
                      type="button"
                      initial={{ opacity: 0, scale: 0.92 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.18 }}
                      onClick={() => onSelectOption?.(option)}
                      className="inline-flex items-center px-3 py-1 rounded-lg border border-border/70
                                 bg-secondary/70 hover:bg-primary/10 hover:border-primary/40
                                 text-xs font-medium text-foreground transition-all duration-150
                                 cursor-pointer select-none active:scale-95"
                    >
                      {option}
                    </motion.button>
                  ))}
                </div>
              </AnimatePresence>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
