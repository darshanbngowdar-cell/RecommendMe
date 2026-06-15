import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Mail, Phone, Lock, User, ShoppingBag, ArrowRight, Moon, Sun, CheckCircle2, XCircle } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { signupUser } from "@/services/api";
import { buildAuthNavigationState, getAuthReturnTo } from "@/services/authRedirect";

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

function getStrength(password: string) {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  const map = [
    { label: "Weak", color: "#ef4444" },
    { label: "Weak", color: "#ef4444" },
    { label: "Fair", color: "#f97316" },
    { label: "Good", color: "#eab308" },
    { label: "Strong", color: "#22c55e" },
    { label: "Very Strong", color: "#10b981" },
  ];
  return { score, ...map[score] };
}

function PasswordStrengthBar({ password }: { password: string }) {
  if (!password) return null;
  const { score, label, color } = getStrength(password);
  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="h-1 flex-1 rounded-full transition-all duration-300"
            style={{ backgroundColor: i < score ? color : "hsl(var(--border))", opacity: i < score ? 1 : 0.35 }} />
        ))}
      </div>
      <p className="text-[11px] font-semibold" style={{ color }}>{label}</p>
    </div>
  );
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
        <p className="text-sm font-semibold">{success ? "Account Created!" : "Registration Failed"}</p>
        <p className="text-[12px] opacity-80 mt-0.5">{message}</p>
      </div>
      <button onClick={onClose} className="opacity-60 hover:opacity-100 ml-2"><XCircle className="h-4 w-4" /></button>
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
      {error && <p className="text-[11px] text-destructive flex items-center gap-1"><XCircle className="h-3 w-3 shrink-0" /> {error}</p>}
    </div>
  );
}

const termsText = `Terms of Service\n\nBy creating an account, you agree to use RecommendMe in compliance with applicable laws and platform guidelines. You are responsible for the accuracy of the information you provide. RecommendMe provides recommendations for informational purposes only and does not guarantee product availability, price, or performance. We reserve the right to suspend accounts that abuse or misuse the service.\n\nPrivacy Policy\n\nWe collect account details needed for authentication and basic product experience personalization. Passwords are securely hashed and never stored in plaintext. We do not sell your personal information. Data may be used to improve recommendation quality and service reliability. By using RecommendMe, you consent to this processing and storage for MVP usage.`;

function TermsModal({
  open,
  title,
  content,
  onClose,
}: {
  open: boolean;
  title: string;
  content: string;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[210] bg-black/50 backdrop-blur-sm p-3 sm:p-6 flex items-center justify-center">
      <div className="w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl max-h-[90vh] flex flex-col">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">{title}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <XCircle className="h-5 w-5" />
          </button>
        </div>
        <div
          className="px-5 py-4 overflow-y-auto text-sm text-muted-foreground leading-relaxed whitespace-pre-line"
        >
          {content}
        </div>
        <div className="px-5 py-4 border-t border-border flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 h-10 rounded-lg border border-border/60 text-foreground hover:bg-accent"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SignUpPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  const returnTo = getAuthReturnTo(location.state, "/");
  const prefillIdentifier = (location.state as { prefillIdentifier?: string } | undefined)?.prefillIdentifier || "";

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState(prefillIdentifier.includes("@") ? prefillIdentifier : "");
  const [phone, setPhone] = useState(prefillIdentifier.includes("@") ? "" : prefillIdentifier);
  const [password, setPassword] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [modalType, setModalType] = useState<"terms" | "privacy" | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{ success: boolean; message: string } | null>(null);

  const inferredUsername = useMemo(() => {
    if (username.trim()) return username;
    const guess = `${firstName}${lastName}`.trim().replace(/\s+/g, "");
    return guess || "";
  }, [firstName, lastName, username]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!firstName.trim()) e.firstName = "First name is required";
    if (!lastName.trim()) e.lastName = "Last name is required";
    if (!inferredUsername.trim()) e.username = "Username is required";
    if (!email.trim() && !phone.trim()) e.contact = "Add at least email or phone";
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Enter a valid email";
    if (phone.trim() && !/^\+?[\d\s-]{8,15}$/.test(phone)) e.phone = "Enter a valid phone number";
    if (!password) e.password = "Password is required";
    else if (getStrength(password).score < 2) e.password = "Password is too weak";
    if (!confirmPass) e.confirmPass = "Please confirm your password";
    else if (confirmPass !== password) e.confirmPass = "Passwords do not match";
    if (!termsAccepted) e.terms = "You must accept Terms and Privacy to continue";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      await signupUser({
        username: inferredUsername,
        first_name: firstName,
        last_name: lastName,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        password,
        session_id: getActiveChatSessionId(),
      });

      setToast({ success: true, message: "Account created. Please log in to continue…" });
      setTimeout(
        () =>
          navigate("/login", {
              state: buildAuthNavigationState(returnTo, email.trim() || phone.trim() || undefined),
          }),
        900
      );
    } catch (error) {
      setToast({
        success: false,
        message: error instanceof Error ? error.message : "Unable to create account.",
      });
    } finally {
      setLoading(false);
    }
  };

  const passMatch = confirmPass.length > 0 && confirmPass === password;
  const passMismatch = confirmPass.length > 0 && confirmPass !== password;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AnimatePresence>
        {toast && <Toast success={toast.success} message={toast.message} onClose={() => setToast(null)} />}
      </AnimatePresence>

      <TermsModal
        open={modalType !== null}
        title={modalType === "privacy" ? "Privacy Policy" : "Terms of Service"}
        content={termsText}
        onClose={() => setModalType(null)}
      />

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
            <Link to="/login" state={{ returnTo }} className="text-sm font-semibold text-muted-foreground hover:text-foreground border border-border/60 hover:border-border px-4 h-9 rounded-xl inline-flex items-center transition-all">
              Log In
            </Link>
          </div>
        </div>
      </nav>

      <div className="flex-1 flex items-center justify-center px-3 sm:px-6 pt-20 sm:pt-24 pb-8 sm:pb-10">
        <div className="w-full max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="bg-card border border-border/60 rounded-3xl shadow-xl shadow-black/10 overflow-hidden"
          >
            <div className="h-1 bg-gradient-to-r from-primary via-primary/70 to-primary/30" />

            <div className="p-5 sm:p-8 md:p-10 space-y-5 sm:space-y-6">
              <div>
                <p className="text-[11px] font-bold tracking-widest uppercase text-muted-foreground mb-1">Get started for free</p>
                <h1 className="text-2xl font-bold text-foreground">Create your account</h1>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <Field label="First name" value={firstName} onChange={setFirstName} placeholder="Arjun" icon={User} error={errors.firstName} />
                <Field label="Last name" value={lastName} onChange={setLastName} placeholder="Sharma" error={errors.lastName} />
              </div>

              <Field label="Username" value={username} onChange={setUsername} placeholder="arjunsharma" icon={User} error={errors.username} />

              {errors.contact && <p className="text-[11px] text-destructive">{errors.contact}</p>}
              <div className="grid sm:grid-cols-2 gap-3">
                <Field label="Email address" type="email" value={email} onChange={setEmail} placeholder="you@example.com" icon={Mail} error={errors.email} />
                <Field label="Phone number" type="tel" value={phone} onChange={setPhone} placeholder="+91 98765 43210" icon={Phone} error={errors.phone} />
              </div>

              <div>
                <Field
                  label="Set password" type={showPass ? "text" : "password"} value={password} onChange={setPassword}
                  placeholder="Create a strong password" icon={Lock} error={errors.password}
                  suffix={
                    <button type="button" onClick={() => setShowPass(!showPass)} className="text-muted-foreground hover:text-foreground transition-colors">
                      {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  }
                />
                <PasswordStrengthBar password={password} />
              </div>

              <div>
                <Field
                  label="Confirm password" type={showConfirm ? "text" : "password"} value={confirmPass} onChange={setConfirmPass}
                  placeholder="Re-enter your password" icon={Lock} error={errors.confirmPass}
                  suffix={
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="text-muted-foreground hover:text-foreground transition-colors">
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  }
                />
                <AnimatePresence>
                  {(passMatch || passMismatch) && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className={`mt-1.5 text-[11px] flex items-center gap-1 font-semibold ${passMatch ? "text-emerald-500" : "text-destructive"}`}
                    >
                      {passMatch ? <><CheckCircle2 className="h-3 w-3" /> Passwords match</> : <><XCircle className="h-3 w-3" /> Passwords don't match</>}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              <label className="flex items-start gap-2.5 text-sm text-muted-foreground">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-border accent-primary"
                />
                <span>
                  I agree to the
                  <button type="button" onClick={() => setModalType("terms")} className="mx-1 text-primary hover:underline">Terms of Service</button>
                  &amp;
                  <button type="button" onClick={() => setModalType("privacy")} className="ml-1 text-primary hover:underline">Privacy Policy</button>
                </span>
              </label>
              {errors.terms && <p className="text-[11px] text-destructive">{errors.terms}</p>}

              <button
                onClick={handleSubmit}
                disabled={loading || !termsAccepted}
                className="w-full h-12 bg-primary text-primary-foreground font-bold text-sm rounded-xl
                  hover:bg-primary/90 active:scale-[0.98] transition-all shadow-sm
                  disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <><span className="w-4 h-4 border-2 border-primary-foreground/40 border-t-primary-foreground rounded-full animate-spin" />Creating account…</>
                ) : (
                  <>Create Account <ArrowRight className="h-4 w-4" /></>
                )}
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border/60" /></div>
                <div className="relative flex justify-center"><span className="bg-card px-3 text-[11px] text-muted-foreground">Already have an account?</span></div>
              </div>

              <Link to="/login" state={{ returnTo }} className="w-full h-11 border border-border/70 hover:border-primary/40 hover:bg-primary/5 text-foreground font-semibold text-sm rounded-xl transition-all flex items-center justify-center gap-2">
                Log in instead
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
