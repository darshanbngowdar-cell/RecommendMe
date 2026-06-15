import { useState } from "react";
import { QuestionOption } from "@/services/api";
import { Send, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

interface QuestionRoundProps {
  questions: QuestionOption[];
  roundNumber: number;
  totalQuestions: number;
  answeredSoFar: number;
  onSubmitAnswers: (answers: { question: string; answer: string }[]) => void;
  disabled?: boolean;
}

export default function QuestionRound({
  questions,
  roundNumber,
  totalQuestions,
  answeredSoFar,
  onSubmitAnswers,
  disabled = false,
}: QuestionRoundProps) {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const allAnswered = questions.every((_, i) => answers[i]?.trim());

  const handleOptionSelect = (questionIndex: number, option: string) => {
    if (disabled) return;
    setAnswers((prev) => ({ ...prev, [questionIndex]: option }));
  };

  const handleTextChange = (questionIndex: number, value: string) => {
    if (disabled) return;
    setAnswers((prev) => ({ ...prev, [questionIndex]: value }));
  };

  const handleSubmit = () => {
    if (!allAnswered || disabled) return;
    const result = questions.map((q, i) => ({
      question: q.question,
      answer: answers[i] || "",
    }));
    onSubmitAnswers(result);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      {/* Round progress */}
      <div className="flex items-center gap-2 px-1">
        <div className="flex gap-1">
          {Array.from({ length: totalQuestions }, (_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i < answeredSoFar
                  ? "w-6 bg-primary"
                  : i < answeredSoFar + questions.length
                  ? "w-6 bg-primary/40"
                  : "w-4 bg-border"
              }`}
            />
          ))}
        </div>
        <span className="text-[11px] text-muted-foreground font-medium">
          {answeredSoFar + 1}–{Math.min(answeredSoFar + questions.length, totalQuestions)} of {totalQuestions}
        </span>
      </div>

      {/* Questions */}
      {questions.map((q, questionIndex) => (
        <motion.div
          key={questionIndex}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: questionIndex * 0.1, duration: 0.25 }}
          className="rounded-2xl border border-border bg-card px-4 py-3.5"
        >
          {/* Question text */}
          <p className="text-sm font-medium text-foreground mb-3">
            <span className="text-primary font-semibold mr-1.5">
              Q{answeredSoFar + questionIndex + 1}.
            </span>
            {q.question}
          </p>

          {/* Option pills */}
          {q.options.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2.5">
              {q.options.map((option, optionIndex) => {
                const isSelected = answers[questionIndex] === option;
                return (
                  <button
                    type="button"
                    key={optionIndex}
                    onClick={() => handleOptionSelect(questionIndex, option)}
                    disabled={disabled}
                    className={`
                      px-3 py-1.5 rounded-full text-xs font-medium
                      transition-all duration-150 border
                      ${
                        isSelected
                          ? "bg-primary text-primary-foreground border-primary shadow-sm scale-[1.02]"
                          : "bg-secondary text-secondary-foreground border-border hover:border-primary/40 hover:bg-primary/5"
                      }
                      ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer active:scale-95"}
                    `}
                  >
                    {isSelected && <CheckCircle2 className="inline h-3 w-3 mr-1 -mt-0.5" />}
                    {option}
                  </button>
                );
              })}
            </div>
          )}

          {/* Custom text input (always available as alternative or for questions without options) */}
          <div className="relative">
            <input
              type="text"
              value={answers[questionIndex] || ""}
              onChange={(e) => handleTextChange(questionIndex, e.target.value)}
              placeholder={q.options.length > 0 ? "Or type your own answer..." : "Type your answer..."}
              disabled={disabled}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/40 disabled:opacity-50"
            />
          </div>
        </motion.div>
      ))}

      {/* Submit button */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex justify-end pt-1"
      >
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!allAnswered || disabled}
          className={`
            inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold
            transition-all duration-200 shadow-sm
            ${
              allAnswered && !disabled
                ? "bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.97]"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            }
          `}
        >
          <Send className="h-3.5 w-3.5" />
          {roundNumber === 2 ? "Get Recommendations" : "Continue"}
        </button>
      </motion.div>
    </motion.div>
  );
}
