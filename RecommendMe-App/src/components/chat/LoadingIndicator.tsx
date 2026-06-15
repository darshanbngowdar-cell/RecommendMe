import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

const LOADING_MESSAGES = {
  understanding: "Understanding your needs...",
  generating: "Finding the best recommendations for you...",
  fetching: "Best recommendations on the way...",
} as const;

interface LoadingIndicatorProps {
  phase?: "understanding" | "generating" | "fetching";
}

export default function LoadingIndicator({ phase = "understanding" }: LoadingIndicatorProps) {
  const message = LOADING_MESSAGES[phase] || LOADING_MESSAGES.understanding;

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="flex gap-3 py-3"
    >
      {/* AI avatar */}
      <div className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center shrink-0 mt-0.5">
        <span className="text-xs font-semibold text-foreground select-none">AI</span>
      </div>

      <div className="flex flex-col gap-1.5">
        {/* Stage text */}
        <motion.p
          key={message}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="text-sm font-medium text-foreground"
        >
          {message}
        </motion.p>

        {/* Animated dots */}
        <div className="flex gap-1 pl-0.5 mt-0.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-pulse-dot"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>

        {phase === "fetching" && (
          <div className="mt-3 space-y-3">
            {[0, 1].map((row) => (
              <div key={row} className="rounded-2xl border border-border/50 bg-card p-3">
                <Skeleton className="h-4 w-40" />
                <div className="mt-3 flex gap-3 overflow-hidden">
                  {[0, 1, 2].map((card) => (
                    <div key={card} className="w-[140px] shrink-0 space-y-2">
                      <Skeleton className="h-16 w-full rounded-lg" />
                      <Skeleton className="h-3 w-24" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

