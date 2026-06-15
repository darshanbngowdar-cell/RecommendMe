import { FormEvent, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  MessageSquare,
  Search,
  ShoppingBag,
  Sparkles,
  Mail,
  Sun,
  Moon,
  ShieldCheck,
  Ban,
  ShoppingCart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/useTheme";

const workflow = [
  {
    icon: MessageSquare,
    title: "Tell us the real goal",
    description: "Describe what you need in plain language with any budget or timing constraints.",
  },
  {
    icon: Search,
    title: "We remove ambiguity",
    description: "We ask only the most useful questions to narrow the decision fast.",
  },
  {
    icon: ShoppingBag,
    title: "Get actionable options",
    description: "Receive ranked options with live prices and direct buy links.",
  },
];

const TRUST_BADGES = [
  { icon: ShieldCheck, label: "No ads" },
  { icon: Ban, label: "No sponsored results" },
  { icon: ShoppingCart, label: "No cart needed" },
];

const testimonials = [
  {
    quote: "I found a student laptop in one chat without opening 20 tabs.",
  },
  {
    quote: "The follow-up questions were exactly what I needed to narrow options fast.",
  },
  {
    quote: "It feels like a shopping expert that actually listens to constraints.",
  },
];

function ChatPreviewAnimation() {
  const navigate = useNavigate();
  const messages = [
    {
      role: "user",
      text: "I need gear for a 3-day Himalayan trek",
    },

    {
      role: "ai",
      text: "Where are you trekking and what's your experience level?",
    },
    {
      role: "user",
      text: "Beginner. Going to Kedarkantha.",
    },
    {
      role: "ai",
      text: "Perfect. I'll tailor this for a beginner-friendly winter trek.",
    },
    {
      role: "ai-tag",
      text: "🎒 50L Backpack · 🥾 Waterproof Boots · 🧥 Thermal Layers · 🔦 Headlamp",
    },
  ];

  return (
    <button
      onClick={() => navigate("/chat", { state: { initialQuery: "I need gear for a 3-day Himalayan trek" } })}
      className="glass w-full max-w-[34rem] rounded-2xl p-5 text-left shadow-2xl transition-all duration-500 hover:border-primary/40 hover:shadow-primary/10 cursor-pointer group"
      aria-label="Try this example in chat"
    >
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border">
        <div className="w-3 h-3 rounded-full bg-destructive/60" />
        <div className="w-3 h-3 rounded-full bg-warning/60" />
        <div className="w-3 h-3 rounded-full bg-success/60" />
        <span className="ml-2 text-xs text-muted-foreground font-medium">RecommendMe Chat</span>
        <span className="ml-auto text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
          Click to try
          <ArrowRight className="h-3 w-3" />
        </span>
      </div>
      <div className="space-y-3">
        {messages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 + i * 0.22, duration: 0.3 }}
            className={msg.role === "user" ? "flex justify-end" : ""}
          >
            <div
              className={`text-xs leading-relaxed px-3 py-2 rounded-xl ${
                msg.role === "user"
                  ? "bg-chat-user text-chat-user-foreground max-w-[80%]"
                  : msg.role === "ai-tag"
                  ? "bg-secondary text-secondary-foreground inline-flex gap-1 flex-wrap"
                  : "bg-chat-ai text-chat-ai-foreground border border-border max-w-[85%]"
              }`}
            >
              {msg.text}
            </div>
          </motion.div>
        ))}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.8 }}
          className="flex gap-1 pl-1"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-pulse-dot" />
          <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-pulse-dot" style={{ animationDelay: "0.2s" }} />
          <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-pulse-dot" style={{ animationDelay: "0.4s" }} />
        </motion.div>
      </div>
    </button>
  );
}

interface ContactForm {
  name: string;
  email: string;
  message: string;
}

const initialForm: ContactForm = {
  name: "",
  email: "",
  message: "",
};

const Index = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const heroRef = useRef<HTMLElement>(null);
  const [showFloatingCTA, setShowFloatingCTA] = useState(false);

  const [form, setForm] = useState<ContactForm>(initialForm);
  const [errors, setErrors] = useState<Partial<ContactForm>>({});
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [recommendationCount, setRecommendationCount] = useState(0);
  const [hoursSaved, setHoursSaved] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!heroRef.current) return;
      const rect = heroRef.current.getBoundingClientRect();
      setShowFloatingCTA(rect.bottom < 0);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const recommendationTarget = 580;
    const hoursTarget = 1;
    const duration = 1300;
    const startedAt = performance.now();

    let raf = 0;
    const animate = (now: number) => {
      const progress = Math.min((now - startedAt) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);

      setRecommendationCount(Math.floor(recommendationTarget * eased));
      setHoursSaved(Number((hoursTarget * eased).toFixed(1)));

      if (progress < 1) {
        raf = requestAnimationFrame(animate);
      }
    };

    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (!hash) return;
    const section = document.getElementById(hash);
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  const handleAnchorClick = (event: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => {
    event.preventDefault();
    const section = document.getElementById(sectionId);
    if (!section) return;
    section.scrollIntoView({ behavior: "smooth" });
    window.history.replaceState({}, "", `/#${sectionId}`);
  };

  const validateForm = (): boolean => {
    const nextErrors: Partial<ContactForm> = {};

    if (!form.name.trim()) nextErrors.name = "Name is required.";
    if (!form.email.trim()) {
      nextErrors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      nextErrors.email = "Enter a valid email address.";
    }
    if (!form.message.trim()) nextErrors.message = "Please provide a short message.";

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleContactSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validateForm()) {
      setSubmitMessage("Please review the highlighted fields and try again.");
      return;
    }

    setSubmitMessage("Thanks for reaching out. We will respond within one business day.");
    setForm(initialForm);
    setErrors({});
  };

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      <nav className="fixed inset-x-0 top-0 z-50 glass border-b-0 border-white/5">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2 font-display text-lg font-bold tracking-tight">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <ShoppingBag className="h-4 w-4" />
            </span>
            RecommendMe
          </Link>

          <div className="flex items-center gap-1 sm:gap-2">
            <a href="#how-it-works" onClick={(e) => handleAnchorClick(e, "how-it-works")} className="hidden sm:inline-flex rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-accent/50 hover:text-foreground">
              How it works
            </a>
            <a href="#about" onClick={(e) => handleAnchorClick(e, "about")} className="hidden md:inline-flex rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-accent/50 hover:text-foreground">
              About
            </a>
            <a href="#contact" onClick={(e) => handleAnchorClick(e, "contact")} className="hidden lg:inline-flex rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-accent/50 hover:text-foreground">
              Contact
            </a>

            <button
              onClick={toggleTheme}
              className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            <Link to="/chat" className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border/70 px-4 text-sm font-semibold text-foreground transition-all hover:border-primary/50 hover:bg-primary/5">
              <MessageSquare className="h-3.5 w-3.5" />
              Chat
            </Link>
          </div>
        </div>
      </nav>

      <section ref={heroRef} className="relative px-4 pb-16 pt-28 sm:px-6 sm:pb-20 sm:pt-32 lg:pb-20 lg:pt-32">
        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/2 -z-10 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/20 blur-[120px]" />
        <div className="absolute top-1/2 left-3/4 -z-10 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-pink-500/10 dark:bg-pink-500/20 blur-[120px]" />
        
        <div className="mx-auto grid max-w-[1320px] gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-center xl:gap-16">
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-secondary/80 backdrop-blur-md px-4 py-1.5 text-xs font-semibold text-secondary-foreground border border-white/10 shadow-sm">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              AI product decision assistant
            </div>
            <h1 className="font-display text-[clamp(2.7rem,5vw,4.5rem)] font-bold leading-[0.96] tracking-tight text-balance max-w-[12ch]">
              <span className="text-foreground">From </span>
              <span
                className="text-gradient"
                style={{ textShadow: "0 0 18px rgba(59, 130, 246, 0.28)" }}
              >
                3 hours
              </span>
              <span className="text-foreground"> of tab-switching to </span>
              <span className="text-gradient" style={{ textShadow: "0 0 18px rgba(59, 130, 246, 0.22)" }}>
                the right product
              </span>
              <span className="text-foreground"> in </span>
              <span
                className="text-gradient"
                style={{ textShadow: "0 0 20px rgba(59, 130, 246, 0.35)" }}
              >
                2 minutes
              </span>
            </h1>

            <p className="mt-6 max-w-[42rem] text-base leading-7 text-muted-foreground sm:text-lg">
              Describe what you need in plain language. We ask a few smart questions, then show you the best options — with real prices and direct buy links.
            </p>
            <p className="mt-4 text-sm font-medium text-muted-foreground sm:text-[0.95rem]">Tired of reading 47 reviews and still not knowing what to buy?</p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button variant="hero" size="lg" asChild>
                <Link to="/chat">
                  Start chat
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="hero-outline" size="lg" asChild>
                <a href="#how-it-works" onClick={(e) => handleAnchorClick(e, "how-it-works")}>See workflow</a>
              </Button>
            </div>

            <p className="mt-5 text-sm font-semibold text-foreground/90">No cart. No checkout. Just clarity.</p>

            <div className="mt-4 flex flex-wrap gap-2">
              {TRUST_BADGES.map((badge) => (
                <div
                  key={badge.label}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card px-3 py-1.5 text-[11px] text-muted-foreground"
                >
                  <badge.icon className="h-3.5 w-3.5 text-primary" />
                  {badge.label}
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="hidden lg:flex justify-end pl-8 xl:pl-16"
          >
            <ChatPreviewAnimation />
          </motion.div>
        </div>
      </section>

      <section className="px-4 pb-10 sm:px-6 sm:pb-14">
        <div className="mx-auto grid max-w-6xl gap-4 sm:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-2xl border border-border/70 bg-card p-6"
          >
            <p className="text-3xl font-bold tracking-tight sm:text-4xl">{recommendationCount.toLocaleString("en-IN")}+</p>
            <p className="mt-1 text-sm text-muted-foreground">recommendations made</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.06 }}
            className="rounded-2xl border border-border/70 bg-card p-6"
          >
            <p className="text-3xl font-bold tracking-tight sm:text-4xl">{hoursSaved} hours</p>
            <p className="mt-1 text-sm text-muted-foreground">saved today</p>
          </motion.div>
        </div>
      </section>

      <section className="px-4 pb-12 sm:px-6 sm:pb-16">
        <div className="mx-auto max-w-6xl rounded-3xl border border-border/70 bg-card p-6 sm:p-8">
          <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">How we find the best products</h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">
            We search real-time listings from Google Shopping, then our RecommendMe AI ranks results based on your exact needs. Every recommendation includes current prices and a direct link to buy.
          </p>
        </div>
      </section>

      <section id="how-it-works" className="border-y border-border/60 bg-secondary/30 px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 text-center">
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">How it works</h2>
            <p className="mt-3 text-muted-foreground">A short path from a vague need to a clear shortlist.</p>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {workflow.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
                className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/5"
              >
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <step.icon className="h-5 w-5 text-primary" />
                  </div>
                  <span className="font-display text-3xl text-muted-foreground/35">0{index + 1}</span>
                </div>
                <h3 className="text-base font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="about" className="px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">About RecommendMe</p>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">We help you pick what truly fits.</h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
              You share your actual goal, budget, and constraints. RecommendMe asks targeted questions and narrows the noise into options you can confidently choose from.
            </p>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
              We do not just suggest products. We match options to your context so every recommendation has a clear reason behind it and a practical next step.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button variant="hero" asChild>
                <Link to="/chat">Try the chat flow</Link>
              </Button>
              <Button variant="hero-outline" asChild>
                <Link to="/signup">Create account</Link>
              </Button>
            </div>
          </div>

          <div className="rounded-3xl border border-border/70 bg-card p-6">
            <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">Positioning</h3>
            <div className="mt-4 space-y-3 text-sm">
              <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                <p className="font-semibold">Confidence</p>
                <p className="mt-1 text-muted-foreground">Decisions are supported by context-aware follow-up and structured ranking.</p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                <p className="font-semibold">Clarity</p>
                <p className="mt-1 text-muted-foreground">Every section and recommendation is written to be readable and actionable.</p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                <p className="font-semibold">Outcome-driven matches</p>
                <p className="mt-1 text-muted-foreground">Recommendations are tuned to your use case, budget, and non-negotiables, not generic popularity.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 pb-10 sm:px-6 sm:pb-14">
        <div className="mx-auto max-w-6xl">
          <h3 className="text-center font-display text-2xl font-bold tracking-tight sm:text-3xl">What users say</h3>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {testimonials.map((item, index) => (
              <motion.blockquote
                key={item.quote}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.06 }}
                className="rounded-2xl border border-border/70 bg-card p-5"
              >
                <p className="text-sm leading-6 text-foreground">"{item.quote}"</p>
              </motion.blockquote>
            ))}
          </div>
        </div>
      </section>

      <section id="contact" className="border-t border-border/60 bg-secondary/25 px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Contact</p>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">Share your question, feedback, or partnership request.</h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-muted-foreground sm:text-base">
              We keep communication simple. Send a short message and the team will route it to the right owner.
            </p>

            <div className="mt-6 rounded-3xl border border-border/70 bg-card p-6">
              <div className="flex items-start gap-3">
                <Mail className="mt-0.5 h-4 w-4 text-primary" />
                <div>
                  <p className="text-sm font-medium">Best way to reach us</p>
                  <p className="text-sm text-muted-foreground">Use the contact form and we will route your request to the right team.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-border/70 bg-card p-6">
            <form onSubmit={handleContactSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="h-11 w-full rounded-xl border border-border/70 bg-background px-4 text-sm"
                  placeholder="Your name"
                />
                {errors.name ? <p className="mt-1 text-xs text-destructive">{errors.name}</p> : null}
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Email</label>
                <input
                  value={form.email}
                  onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                  className="h-11 w-full rounded-xl border border-border/70 bg-background px-4 text-sm"
                  placeholder="you@example.com"
                />
                {errors.email ? <p className="mt-1 text-xs text-destructive">{errors.email}</p> : null}
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Message</label>
                <textarea
                  value={form.message}
                  onChange={(e) => setForm((prev) => ({ ...prev, message: e.target.value }))}
                  className="min-h-28 w-full rounded-2xl border border-border/70 bg-background px-4 py-3 text-sm"
                  placeholder="How can we help?"
                />
                {errors.message ? <p className="mt-1 text-xs text-destructive">{errors.message}</p> : null}
              </div>

              {submitMessage ? <p className="text-sm text-muted-foreground">{submitMessage}</p> : null}

              <Button type="submit" variant="hero" className="w-full">
                Send message
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      </section>

      <footer className="border-t border-border px-4 py-8 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-sm text-muted-foreground md:flex-row">
          <p>© 2026 RecommendMe</p>
          <div className="flex items-center gap-5">
            <a href="#how-it-works" onClick={(e) => handleAnchorClick(e, "how-it-works")} className="hover:text-foreground">How it works</a>
            <a href="#about" onClick={(e) => handleAnchorClick(e, "about")} className="hover:text-foreground">About</a>
            <a href="#contact" onClick={(e) => handleAnchorClick(e, "contact")} className="hover:text-foreground">Contact</a>
            <Link to="/chat" className="hover:text-foreground">Chat</Link>
            <Link to="/login" className="hover:text-foreground">Log in</Link>
          </div>
        </div>
      </footer>

      <motion.div
        initial={false}
        animate={{ y: showFloatingCTA ? 0 : 80, opacity: showFloatingCTA ? 1 : 0 }}
        transition={{ duration: 0.25 }}
        className="fixed bottom-6 right-6 z-50 sm:hidden"
      >
        <Button variant="hero" className="h-12 rounded-full px-6 shadow-xl" onClick={() => navigate("/chat")}>
          <MessageSquare className="mr-2 h-4 w-4" />
          Start chat
        </Button>
      </motion.div>
    </div>
  );
};

export default Index;
