import { Sparkles, ArrowRight, Film, Laptop, Gift, Utensils, Wrench, Plane } from "lucide-react";
import { motion } from "framer-motion";

const examples = [
  {
    icon: Laptop,
    label: "Student laptop",
    prompt: "Best laptop for a computer science student with a ₹60,000 budget",
  },
  {
    icon: Film,
    label: "Movie night",
    prompt: "Suggest a great movie for a relaxed Friday night — something funny or feel-good",
  },
  {
    icon: Gift,
    label: "Gift ideas",
    prompt: "Gift ideas for my dad who likes gardening and cooking",
  },
  {
    icon: Wrench,
    label: "Project management tool",
    prompt: "Best project management tool for a remote team of 5, under ₹2,000/month",
  },
  {
    icon: Plane,
    label: "Weekend trip",
    prompt: "Weekend trip ideas from Mumbai — beaches, hills, or heritage spots?",
  },
  {
    icon: Utensils,
    label: "Quick recipe",
    prompt: "Quick vegetarian dinner recipe I can make in under 30 minutes",
  },
];

interface StarterPromptsProps {
  onSelect?: (prompt: string) => void;
}

export default function StarterPrompts({ onSelect }: StarterPromptsProps) {
  return (
    <div className="relative flex-1 flex flex-col items-center justify-start px-4 pt-10 pb-8 overflow-y-auto scrollbar-thin">
      {/* Background ambient blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/5 via-background to-background opacity-60 mix-blend-multiply dark:mix-blend-screen" />
        <div className="absolute top-[30%] right-[10%] w-[30rem] h-[30rem] bg-secondary/30 rounded-full blur-[120px]" />
        <div className="absolute -bottom-[20%] left-[20%] w-[40rem] h-[40rem] bg-primary/5 rounded-full blur-[140px]" />
      </div>

      <div className="relative max-w-3xl w-full text-center z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="w-12 sm:w-14 h-12 sm:h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4 sm:mb-5">
            <Sparkles className="h-6 sm:h-7 w-6 sm:w-7 text-primary" />
          </div>
          <h2 className="font-display text-lg sm:text-2xl font-bold text-foreground mb-2">
            What are you looking for today?
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mb-3 max-w-md mx-auto">
            Ask in plain language — products, movies, software, travel ideas, recipes, and more.
            The AI will ask only what it needs to get you great results.
          </p>
          {/* What to expect */}
          <div className="inline-flex items-center gap-2 sm:gap-4 text-[10px] sm:text-[11px] text-muted-foreground/70 mb-6 sm:mb-8 flex-wrap justify-center">
            <span>AI clarifies intent</span>
            <ArrowRight className="h-3 w-3 hidden sm:block" />
            <span>Ranked recommendations</span>
            <ArrowRight className="h-3 w-3 hidden sm:block" />
            <span>Live links & pricing</span>
          </div>
        </motion.div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 mt-2">
          {examples.map((example, index) => (
            <motion.button
              key={example.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 + index * 0.06 }}
              onClick={() => onSelect?.(example.prompt)}
              className="group flex items-start gap-3 rounded-2xl border border-border/70 bg-card/70 p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:bg-accent/40 hover:shadow-lg hover:shadow-black/5"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary transition-transform duration-200 group-hover:scale-105">
                <example.icon className="h-4 w-4 text-foreground" />
              </span>
              <span>
                <span className="block text-sm font-semibold text-foreground">{example.label}</span>
                <span className="mt-1 block text-xs leading-5 text-muted-foreground">{example.prompt}</span>
              </span>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}
