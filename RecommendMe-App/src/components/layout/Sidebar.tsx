import { useNavigate } from "react-router-dom";
import {
  Plus, MessageSquare, Trash2, Settings, Home, Moon, Sun,
  Sparkles, UserCircle2, LogIn, LogOut, Search, X,
} from "lucide-react";
import type { ChatSession } from "../../hooks/useChat";
import { useTheme } from "@/hooks/useTheme";
import { motion, AnimatePresence } from "framer-motion";
import { getAuthSession, clearAuthSession } from "@/services/authStorage";
import { buildAuthNavigationState } from "@/services/authRedirect";
import { useMemo, useState } from "react";

interface SidebarProps {
  open: boolean;
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string) => void;
  onClose: () => void;
}

export default function Sidebar({
  open,
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  onClose,
}: SidebarProps) {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [searchTerm, setSearchTerm] = useState("");
  const authSession = getAuthSession();
  const profile = authSession?.profile;
  const displayName = profile?.username || authSession?.user.username || "Guest";
  const displayEmail =
    profile?.email ||
    authSession?.user.email ||
    authSession?.user.phone ||
    "Sign in to sync profile";

  const handleLogout = () => {
    clearAuthSession();
    navigate("/login", { state: buildAuthNavigationState("/") });
  };

  const filteredSessions = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return sessions;
    return sessions.filter((s) => s.title.toLowerCase().includes(term));
  }, [sessions, searchTerm]);

  /*
   * LAYOUT STRATEGY
   * ─────────────────────────────────────────────────────────────
   * Desktop (lg+):
   *   The sidebar is a normal flex column child of the page root.
   *   When open  → w-72 (288px), full height via h-full.
   *   When closed → w-0, overflow-hidden, border removed.
   *   This pushes the main content area left/right naturally — NO position:fixed.
   *
   * Mobile (< lg):
   *   The sidebar overlays via position:fixed.
   *   A backdrop covers the rest of the screen and closes the sidebar on click.
   *   Slide in/out via translateX.
   * ─────────────────────────────────────────────────────────────
   */

  return (
    <>
      {/* ── Mobile backdrop ───────────────────────────────────── */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
            onClick={onClose}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* ── Sidebar panel ─────────────────────────────────────── */}
      <aside
        className={[
          /* Base */
          "flex flex-col bg-sidebar border-r border-sidebar-border overflow-hidden",
          "transition-[width] duration-300 ease-in-out",
          /* Desktop: inline layout — no fixed positioning */
          "lg:relative lg:inset-auto lg:z-auto lg:h-full lg:shrink-0",
          open ? "lg:w-72" : "lg:w-0 lg:border-r-0",
          /* Mobile: overlay — fixed, slides in/out */
          "fixed inset-y-0 left-0 z-50 lg:translate-x-0",
          open ? "w-72 translate-x-0" : "w-72 -translate-x-full",
        ].join(" ")}
        role="navigation"
        aria-label="Chat sidebar"
      >
        {/* ── Header ────────────────────────────────────────────── */}
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-sidebar-border px-4">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2.5 rounded-lg hover:opacity-75 transition-opacity min-w-0"
            aria-label="Go to home page"
          >
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary">
              <Sparkles className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            <span className="truncate text-sm font-bold tracking-tight text-sidebar-foreground font-display">
              RecommendMe
            </span>
          </button>

          {/* Close button — visible on mobile only */}
          <button
            onClick={onClose}
            className="lg:hidden flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── New Chat button ────────────────────────────────────── */}
        <div className="shrink-0 px-3 pt-3 pb-2">
          <button
            onClick={() => { onNewChat(); onClose(); }}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-[13px] font-semibold text-primary-foreground transition-colors hover:bg-primary/90 active:scale-[0.98]"
            aria-label="Start new chat"
          >
            <Plus className="h-4 w-4 shrink-0" />
            New Chat
          </button>
        </div>

        {/* ── Search ────────────────────────────────────────────── */}
        <div className="shrink-0 px-3 pb-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/60" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search chats…"
              className="w-full rounded-lg border border-sidebar-border bg-sidebar-accent/40 py-2 pl-8 pr-3 text-[13px] text-sidebar-foreground placeholder:text-muted-foreground/60 outline-none focus:border-primary/40 focus:bg-sidebar-accent/70 transition-colors"
              aria-label="Search conversations"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-muted-foreground transition-colors"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* ── Session list ──────────────────────────────────────── */}
        {/*
         * flex-1 + overflow-y-auto: this is the only scrolling region.
         * min-h-0 prevents flex children from overflowing their parent.
         */}
        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-1">
          {sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-sidebar-accent">
                <MessageSquare className="h-5 w-5 text-muted-foreground/50" />
              </div>
              <p className="text-[13px] font-medium text-muted-foreground">No chats yet</p>
              <p className="mt-1 text-[11px] text-muted-foreground/60">Start a new chat to begin</p>
            </div>
          ) : (
            <>
              <div className="mb-1 flex items-center justify-between px-2 py-2">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                  Recent
                </span>
                <span className="text-[10px] tabular-nums text-muted-foreground/50">
                  {filteredSessions.length}
                </span>
              </div>

              {filteredSessions.length === 0 ? (
                <p className="px-2 py-3 text-[12px] text-muted-foreground/70">No matches found.</p>
              ) : (
                <div className="space-y-0.5">
                  {filteredSessions.map((session) => (
                    <div
                      key={session.id}
                      onClick={() => { onSelectSession(session.id); onClose(); }}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === "Enter" && onSelectSession(session.id)}
                      aria-label={`Switch to chat: ${session.title}`}
                      aria-current={session.id === activeSessionId ? "true" : undefined}
                      className={[
                        "group flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-2 text-[13px] transition-all",
                        session.id === activeSessionId
                          ? "bg-sidebar-accent text-sidebar-accent-foreground ring-1 ring-ring/10"
                          : "text-sidebar-foreground hover:bg-sidebar-accent/50",
                      ].join(" ")}
                    >
                      <MessageSquare className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <span className="flex-1 truncate" title={session.title}>
                        {session.title}
                      </span>
                      <button
                        onClick={(e) => { e.stopPropagation(); onDeleteSession(session.id); }}
                        className="shrink-0 rounded p-1 opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100 text-muted-foreground"
                        aria-label={`Delete chat: ${session.title}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Bottom section ────────────────────────────────────── */}
        <div className="mt-auto shrink-0 border-t border-sidebar-border">
          {/* User card */}
          <div className="px-3 py-3">
            <div className="rounded-xl border border-sidebar-border bg-sidebar-accent/40 p-3">
              <div className="mb-3 flex items-center gap-3">
                {profile?.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt={`${displayName} avatar`}
                    className="h-9 w-9 shrink-0 rounded-lg border border-sidebar-border object-cover"
                  />
                ) : (
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-sidebar-border bg-sidebar-accent">
                    <UserCircle2 className="h-5 w-5 text-sidebar-foreground/70" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold text-sidebar-foreground">{displayName}</p>
                  <p className="truncate text-[11px] text-muted-foreground/75">{displayEmail}</p>
                </div>
              </div>
              <button
                onClick={() =>
                  authSession
                    ? navigate("/profile")
                    : navigate("/login", { state: buildAuthNavigationState("/") })
                }
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-sidebar-border px-3 py-2 text-[12px] font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent/70 active:scale-[0.98]"
                aria-label={authSession ? "Open profile" : "Sign in"}
              >
                {authSession
                  ? <UserCircle2 className="h-3.5 w-3.5 shrink-0" />
                  : <LogIn className="h-3.5 w-3.5 shrink-0" />
                }
                {authSession ? "Manage Profile" : "Sign In"}
              </button>
            </div>
          </div>

          {/* Nav actions */}
          <div className="space-y-0.5 border-t border-sidebar-border/60 px-3 py-2">
            {[
              { icon: Settings, label: "Settings", action: () => navigate("/settings") },
              {
                icon: theme === "dark" ? Sun : Moon,
                label: theme === "dark" ? "Light mode" : "Dark mode",
                action: toggleTheme,
              },
              { icon: Home, label: "Home", action: () => navigate("/") },
            ].map(({ icon: Icon, label, action }) => (
              <button
                key={label}
                onClick={action}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] text-sidebar-foreground transition-colors hover:bg-sidebar-accent/60"
                aria-label={label}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{label}</span>
              </button>
            ))}
            {authSession && (
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] text-destructive transition-colors hover:bg-destructive/10"
                aria-label="Log out"
              >
                <LogOut className="h-4 w-4 shrink-0" />
                <span>Log Out</span>
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}