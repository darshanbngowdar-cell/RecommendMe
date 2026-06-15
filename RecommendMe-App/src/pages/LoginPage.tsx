import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Mail, Phone, Lock, ShoppingBag, ArrowRight, Moon, Sun, CheckCircle2, XCircle } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { getProfile, loginUser } from "@/services/api";
import { saveAuthSession } from "@/services/authStorage";
import { buildAuthNavigationState, getAuthReturnTo, type AuthNavigationState } from "@/services/authRedirect";

const CHAT_STORAGE_KEY = "recommendme-chat-state-v2";

function getActiveChatSessionId(): string | undefined {
  try {
    const raw = sessionStorage.getItem(CHAT_STORAGE_KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as { activeSessionId?: string | null };
    return parsed.activeSessionId || undefined;
  } catch {
    return undefined;
  }
}

function Toast({ success, message, onClose }: { success: boolean; message: string; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -28, scale: 0.93 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -16, scale: 0.96 }}
      transition={{ type: "spring", stiffness: 340, damping: 28 }}
      className={`fixed top-6 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-3
        px-5 py-3.5 rounded-2xl shadow-2xl border backdrop-blur-md min-w-[300px] max-w-sm
        ${success ? "bg-emerald-950/90 border-emerald-500/40 text-emerald-100" : "bg-red-950/90 border-red-500/40 text-red-100"}`}
    >
      {success ? <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" /> : <XCircle className="h-5 w-5 text-red-400 shrink-0" />}
      <div className="flex-1">
        <p className="text-sm font-semibold">{success ? "Success!" : "Error"}</p>
        <p className="text-[12px] opacity-80 mt-0.5">{message}</p>
      </div>
      <button onClick={onClose} className="opacity-60 hover:opacity-100 ml-2">
        <XCircle className="h-4 w-4" />
      </button>
    </motion.div>
  );
}

function Field({ label, type = "text", value, onChange, placeholder, icon: Icon, error, suffix }: {
  label: string; type?: string; value: string; onChange: (v: string) => void;
  placeholder?: string; icon?: React.ElementType; error?: string; suffix?: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-bold text-foreground/60 tracking-widest uppercase">{label}</label>
      <div className="relative">
        {Icon && <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />}
        <input
          type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
          className={`w-full h-12 rounded-xl border bg-secondary/30 text-foreground text-sm
            placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/40
            focus:border-primary/50 transition-all
            ${Icon ? "pl-10" : "pl-4"} ${suffix ? "pr-11" : "pr-4"}
            ${error ? "border-destructive/60 ring-1 ring-destructive/20" : "border-border/60"}`}
        />
        {suffix && <div className="absolute right-3.5 top-1/2 -translate-y-1/2">{suffix}</div>}
      </div>
      {error && <p className="text-[11px] text-destructive flex items-center gap-1"><XCircle className="h-3 w-3 shrink-0" />{error}</p>}
    </div>
  );
}

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const authState = location.state as AuthNavigationState | undefined;
  const returnTo = getAuthReturnTo(authState, "/");
  const prefillIdentifier = authState?.prefillIdentifier || "";

  const [identifier, setIdentifier] = useState(prefillIdentifier);
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ identifier?: string; password?: string }>({});
  const [toast, setToast] = useState<{ success: boolean; message: string } | null>(null);
  const isDevMode = import.meta.env.DEV || import.meta.env.MODE !== "production";

  const trimmedIdentifier = identifier.trim();
  const looksLikePhone = /^\s*[+\d]/.test(identifier);
  const identifierIcon = looksLikePhone ? Phone : Mail;

  const validate = () => {
    if (isDevMode) {
      setErrors({});
      return true;
    }

    const e: typeof errors = {};
    if (!trimmedIdentifier) {
      e.identifier = "Email or phone is required";
    } else if (looksLikePhone) {
      if (!/^\+?[\d\s()-]{8,18}$/.test(trimmedIdentifier)) {
        e.identifier = "Enter a valid phone number";
      }
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedIdentifier)) {
      e.identifier = "Enter a valid email address";
    }
    if (!password) e.password = "Password is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const response = await loginUser({
        identifier: trimmedIdentifier || undefined,
        password: password || undefined,
        session_id: getActiveChatSessionId(),
      });
      const profile = response.profile || (await getProfile(response.token));
      saveAuthSession({ token: response.token, user: response.user, profile });
      setToast({ success: true, message: "Welcome back! Redirecting…" });
      setTimeout(() => navigate(returnTo), 900);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to login right now.";
      const normalized = message.toLowerCase();
      const shouldRouteToSignup =
        normalized.includes("no account found") ||
        normalized.includes("invalid password") ||
        normalized.includes("invalid credentials") ||
        normalized.includes("invalid email") ||
        normalized.includes("invalid phone");

      if (shouldRouteToSignup) {
        setToast({ success: false, message: "No account found. Redirecting to create one…" });
        setTimeout(
          () =>
            navigate("/signup", {
              state: buildAuthNavigationState(returnTo, identifier),
            }),
          900
        );
      } else {
        setToast({ success: false, message });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AnimatePresence>
        {toast && <Toast success={toast.success} message={toast.message} onClose={() => setToast(null)} />}
      </AnimatePresence>

      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <Link to="/" className="font-display text-lg font-bold text-foreground flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <ShoppingBag className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            RecommendMe
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/#about" className="hidden sm:inline-flex text-sm font-semibold text-muted-foreground hover:text-foreground px-3 h-9 rounded-xl items-center transition-colors">
              About
            </Link>
            <Link to="/#contact" className="hidden sm:inline-flex text-sm font-semibold text-muted-foreground hover:text-foreground px-3 h-9 rounded-xl items-center transition-colors">
              Contact
            </Link>
            <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors" aria-label="Toggle theme">
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <Link to="/signup" state={{ returnTo }} className="text-sm font-semibold text-muted-foreground hover:text-foreground border border-border/60 hover:border-border px-4 h-9 rounded-xl inline-flex items-center transition-all">
              Sign Up
            </Link>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-4 pt-20 pb-10">
        <div className="w-full max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="bg-card border border-border/60 rounded-3xl shadow-xl shadow-black/10 overflow-hidden"
          >
            <div className="h-1 bg-gradient-to-r from-primary via-primary/70 to-primary/30" />

            <div className="p-7 sm:p-9 space-y-6">
              <div>
                <p className="text-[11px] font-bold tracking-widest uppercase text-muted-foreground mb-1">Welcome back</p>
                <h1 className="text-2xl font-bold text-foreground">Log in to your account</h1>
              </div>

              <div className="space-y-4">
                <Field
                  label="Email or phone"
                  type="text"
                  value={identifier}
                  onChange={setIdentifier}
                  placeholder={looksLikePhone ? "Enter your phone number" : "Enter your email address"}
                  icon={identifierIcon}
                  error={errors.identifier}
                />
                <div>
                  <Field
                    label="Password"
                    type={showPass ? "text" : "password"}
                    value={password}
                    onChange={setPassword}
                    placeholder="Enter your password"
                    icon={Lock}
                    error={errors.password}
                    suffix={
                      <button type="button" onClick={() => setShowPass(!showPass)} className="text-muted-foreground hover:text-foreground transition-colors">
                        {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    }
                  />
                  <div className="flex justify-end mt-1.5">
                    <button className="text-[12px] text-primary hover:underline font-medium">Forgot password?</button>
                  </div>
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full h-12 bg-primary text-primary-foreground font-bold text-sm rounded-xl
                  hover:bg-primary/90 active:scale-[0.98] transition-all shadow-sm
                  disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <><span className="w-4 h-4 border-2 border-primary-foreground/40 border-t-primary-foreground rounded-full animate-spin" />Signing in…</>
                ) : (
                  <>Log In <ArrowRight className="h-4 w-4" /></>
                )}
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border/60" /></div>
                <div className="relative flex justify-center"><span className="bg-card px-3 text-[11px] text-muted-foreground">Don't have an account?</span></div>
              </div>

              <Link to="/signup" state={{ returnTo }} className="w-full h-11 border border-border/70 hover:border-primary/40 hover:bg-primary/5 text-foreground font-semibold text-sm rounded-xl transition-all flex items-center justify-center gap-2">
                Create a free account
              </Link>
            </div>
          </motion.div>

          <p className="text-center text-[12px] text-muted-foreground mt-6">
            By continuing you agree to our <button className="text-primary hover:underline">Terms</button> &amp; <button className="text-primary hover:underline">Privacy Policy</button>
          </p>
        </div>
      </div>
    </div>
  );
}