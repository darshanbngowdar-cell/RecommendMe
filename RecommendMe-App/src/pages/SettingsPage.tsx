import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/useTheme";
import { Moon, Sun, ArrowLeft, Monitor, Keyboard, Info, Sparkles, AlertTriangle, Shield, Zap } from "lucide-react";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 100 },
    },
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/chat" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to Chat
          </Link>
          <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card px-3 py-1 text-xs text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Preferences & settings
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Page Title */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <h1 className="text-4xl font-bold tracking-tight">Settings</h1>
          <p className="mt-2 text-muted-foreground">Customize your experience and preferences</p>
        </motion.div>

        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
          {/* Appearance Section */}
          <motion.div variants={itemVariants} className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Sun className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Appearance</h2>
                <p className="text-sm text-muted-foreground">Customize how RecommendMe looks</p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { key: "light" as const, icon: Sun, label: "Light" },
                { key: "dark" as const, icon: Moon, label: "Dark" },
                { key: "system" as const, icon: Monitor, label: "System" },
              ].map(({ key, icon: Icon, label }) => (
                <button
                  key={key}
                  onClick={() => {
                    if (key === "system") {
                      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
                      setTheme(prefersDark ? "dark" : "light");
                    } else {
                      setTheme(key);
                    }
                  }}
                  className={`group relative overflow-hidden flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                    theme === key
                      ? "border-primary ring-2 ring-primary/20 bg-primary/5"
                      : "border-border/60 hover:border-primary/30 bg-secondary/20"
                  }`}
                  aria-label={`Set ${label} theme`}
                  aria-pressed={theme === key}
                >
                  <Icon className="h-5 w-5 transition-transform group-hover:scale-110" />
                  <span className="text-sm font-medium">{label}</span>
                  {theme === key && (
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-10 bg-primary pointer-events-none" />
                  )}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Keyboard Shortcuts */}
          <motion.div variants={itemVariants} className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                <Keyboard className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Keyboard Shortcuts</h2>
                <p className="text-sm text-muted-foreground">Quick actions for the chat interface</p>
              </div>
            </div>

            <div className="space-y-3 bg-secondary/30 rounded-lg p-4">
              {[
                { keys: ["Enter"], action: "Send message" },
                { keys: ["Shift", "Enter"], action: "New line in message" },
                { keys: ["Esc"], action: "Close sidebar (mobile)" },
              ].map(({ keys, action }) => (
                <div key={action} className="flex items-center justify-between py-2">
                  <span className="text-sm text-foreground">{action}</span>
                  <div className="flex items-center gap-1">
                    {keys.map((key, i) => (
                      <span key={key}>
                        {i > 0 && <span className="text-xs text-muted-foreground mx-1">+</span>}
                        <kbd className="px-2.5 py-1.5 text-xs font-mono bg-background border border-border/60 rounded-md text-foreground shadow-sm">
                          {key}
                        </kbd>
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Data & Privacy */}
          <motion.div variants={itemVariants} className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                <Shield className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Data & Privacy</h2>
                <p className="text-sm text-muted-foreground">How we handle your information</p>
              </div>
            </div>
          <div className="space-y-3 text-sm text-muted-foreground">
              <div className="p-4 bg-amber-500/10 rounded-lg border border-amber-500/20">
                <p className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                  <span>Your chat sessions are stored locally in your browser only. <strong className="text-foreground">Refreshing will clear conversations.</strong></span>
                </p>
              </div>
              <ul className="space-y-2 list-none">
                <li className="flex items-center gap-2">
                  <div className="w-1 h-1 bg-primary rounded-full" />
                  <span>No personal data collection or tracking</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1 h-1 bg-primary rounded-full" />
                  <span>Profile settings are synced to your account only</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1 h-1 bg-primary rounded-full" />
                  <span>All data is encrypted in transit</span>
                </li>
              </ul>
            </div>
          </motion.div>

          {/* About & Information */}
          <motion.div variants={itemVariants} className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/10">
                <Info className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">About RecommendMe</h2>
                <p className="text-sm text-muted-foreground">Learn more about this app</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg border border-primary/20">
                <h3 className="font-semibold text-foreground mb-2">AI-Powered Product Discovery Engine</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Describe what you need in plain language and get curated product recommendations with real prices and direct purchase links. No cart, no checkout, no ads.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <p className="text-xs text-muted-foreground">Version</p>
                  <p className="text-sm font-semibold">1.0 MVP</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">License</p>
                  <p className="text-sm font-semibold">MIT License</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Quick Links */}
          <motion.div variants={itemVariants} className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                <Zap className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Quick Actions</h2>
                <p className="text-sm text-muted-foreground">Manage your account and preferences</p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild variant="outline" className="flex-1">
                <Link to="/profile">Manage Profile</Link>
              </Button>
              <Button asChild variant="outline" className="flex-1">
                <Link to="/chat">Back to Chat</Link>
              </Button>
            </div>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}
