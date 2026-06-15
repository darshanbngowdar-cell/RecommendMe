import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Camera, CheckCircle2, User, Upload, Sparkles, Key, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAuthSession, saveAuthSession } from "@/services/authStorage";
import { getProfile, requestPasswordReset, resetPassword, updateProfile, uploadAvatar } from "@/services/api";
import AvatarPicker from "@/components/avatars/AvatarPicker";
import { getAvatarById } from "@/components/avatars/avatarUtils";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="space-y-2.5 block">
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const session = getAuthSession();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [profile, setProfile] = useState({
    username: session?.profile?.username || session?.user.username || "",
    email: session?.profile?.email || session?.user.email || "",
    gender: "Other",
    age: "",
    interests: "",
    about: "",
    avatarId: "neutral-1",
    avatarUrl: "",
    avatarFilePath: "",
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const loadProfile = async (token: string) => {
    setLoading(true);
    setLoadError(null);
    try {
      const profilePayload = await getProfile(token);
      setProfile({
        username: profilePayload.username,
        email: profilePayload.email,
        gender: profilePayload.gender,
        age: profilePayload.age ? String(profilePayload.age) : "",
        interests: profilePayload.interests.join(", "),
        about: profilePayload.about,
        avatarId: profilePayload.avatarFilePath ? "custom-1" : "neutral-1",
        avatarUrl: profilePayload.avatarUrl || "",
        avatarFilePath: profilePayload.avatarFilePath || "",
      });
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Unable to load profile.");
      setMessage({ type: "error", text: "Unable to sync latest profile. Showing available local data." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!session?.token) {
      setLoading(true);
      const timer = setTimeout(() => {
        navigate("/login", { state: { returnTo: "/profile" } });
      }, 0);
      return () => clearTimeout(timer);
    }

    void loadProfile(session.token);
  }, [navigate, session?.token]);

  const selectedAvatar = useMemo(() => profile.avatarId, [profile.avatarId]);
  const avatarComponent = useMemo(() => {
    const avatar = getAvatarById(selectedAvatar);
    return avatar || null;
  }, [selectedAvatar]);

  const handleSave = async () => {
    if (!session?.token) return;
    setSaving(true);
    setMessage(null);
    try {
      const updated = await updateProfile(session.token, {
        username: profile.username.trim(),
        gender: profile.gender,
        age: profile.age ? Number(profile.age) : null,
        interests: profile.interests.split(",").map((item) => item.trim()).filter(Boolean),
        about: profile.about.trim(),
        avatar_url: profile.avatarUrl || profile.avatarId,
        avatar_file_path: profile.avatarFilePath || null,
      });
      saveAuthSession({
        token: session.token,
        user: session.user,
        profile: updated,
      });
      setMessage({ type: "success", text: "Profile saved successfully." });
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Unable to save profile." });
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async () => {
    if (!session?.token || !avatarFile) return;
    if (!/[.](jpg|jpeg|png|webp)$/i.test(avatarFile.name)) {
      setMessage({ type: "error", text: "Use JPG, PNG, or WEBP images only." });
      return;
    }
    if (avatarFile.size > 2 * 1024 * 1024) {
      setMessage({ type: "error", text: "Avatar must be 2MB or smaller." });
      return;
    }
    try {
      const updated = await uploadAvatar(session.token, avatarFile);
      setProfile((prev) => ({ ...prev, avatarUrl: updated.avatarUrl, avatarFilePath: updated.avatarFilePath || "" }));
      saveAuthSession({ token: session.token, user: session.user, profile: updated });
      setMessage({ type: "success", text: "Avatar uploaded." });
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Unable to upload avatar." });
    }
  };

  const handleResetRequest = async () => {
    if (!profile.email.trim()) {
      setMessage({ type: "error", text: "Email is required for password reset." });
      return;
    }
    try {
      const response = await requestPasswordReset({ identifier: profile.email.trim() });
      setResetToken(response.reset_token || "");
      setMessage({ type: "success", text: "Reset token generated. Use it below to complete the reset." });
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Unable to request password reset." });
    }
  };

  const handleResetPassword = async () => {
    if (!resetToken.trim() || !newPassword.trim()) {
      setMessage({ type: "error", text: "Provide both a reset token and a new password." });
      return;
    }
    try {
      await resetPassword({ reset_token: resetToken.trim(), new_password: newPassword });
      setMessage({ type: "success", text: "Password updated. You can now log in with the new password." });
      setResetToken("");
      setNewPassword("");
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Unable to reset password." });
    }
  };

  if (loading) {
    return <div className="min-h-screen grid place-items-center bg-background text-muted-foreground">Loading profile...</div>;
  }

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
            Personalize your profile
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Page Title */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <h1 className="text-4xl font-bold tracking-tight">Your Profile</h1>
          <p className="mt-2 text-muted-foreground">Manage your information and preferences to get better recommendations</p>
        </motion.div>

        {loadError && (
          <div className="mb-6 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-300 flex items-center justify-between gap-3">
            <span>{loadError}</span>
            {session?.token && (
              <Button variant="outline" size="sm" onClick={() => void loadProfile(session.token)}>
                Retry
              </Button>
            )}
          </div>
        )}

        {/* Content Grid */}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Form Section */}
          <div className="space-y-6 lg:col-span-2">
            {/* Account Section */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-semibold">Account Information</h2>
                    <p className="text-xs text-muted-foreground">Basic details used for personalization</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Username">
                      <input
                        value={profile.username}
                        onChange={(e) => setProfile((prev) => ({ ...prev, username: e.target.value }))}
                        className="h-11 w-full rounded-lg border border-border/60 bg-background px-4 py-2.5 text-sm transition-colors focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/20"
                        placeholder="Enter your name"
                      />
                    </Field>
                    <Field label="Email">
                      <input
                        value={profile.email}
                        disabled
                        className="h-11 w-full rounded-lg border border-border/60 bg-muted/50 px-4 py-2.5 text-sm text-muted-foreground cursor-not-allowed"
                      />
                    </Field>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Gender">
                      <select
                        value={profile.gender}
                        onChange={(e) => setProfile((prev) => ({ ...prev, gender: e.target.value }))}
                        className="h-11 w-full rounded-lg border border-border/60 bg-background px-4 py-2.5 text-sm transition-colors focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/20"
                      >
                        <option>Male</option>
                        <option>Female</option>
                        <option>Other</option>
                      </select>
                    </Field>
                    <Field label="Age">
                      <input
                        type="number"
                        min="13"
                        max="120"
                        value={profile.age}
                        onChange={(e) => setProfile((prev) => ({ ...prev, age: e.target.value }))}
                        className="h-11 w-full rounded-lg border border-border/60 bg-background px-4 py-2.5 text-sm transition-colors focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/20"
                        placeholder="Your age"
                      />
                    </Field>
                  </div>

                  <Field label="Interests & Hobbies">
                    <input
                      value={profile.interests}
                      onChange={(e) => setProfile((prev) => ({ ...prev, interests: e.target.value }))}
                      className="h-11 w-full rounded-lg border border-border/60 bg-background px-4 py-2.5 text-sm transition-colors focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/20"
                      placeholder="e.g., technology, fitness, gaming"
                    />
                  </Field>

                  <Field label="About You">
                    <textarea
                      value={profile.about}
                      onChange={(e) => setProfile((prev) => ({ ...prev, about: e.target.value }))}
                      placeholder="Tell us a bit about yourself... This helps us better personalize recommendations."
                      className="min-h-32 w-full rounded-lg border border-border/60 bg-background px-4 py-2.5 text-sm transition-colors focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/20 resize-none leading-relaxed"
                    />
                  </Field>
                </div>
              </div>
            </motion.div>

            {/* Security Section */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                    <Key className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <h2 className="font-semibold">Password & Security</h2>
                    <p className="text-xs text-muted-foreground">Update your password securely</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    To change your password, first request a reset token, then use it to set a new password.
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Button variant="outline" onClick={handleResetRequest} className="w-full">
                      Request Reset Token
                    </Button>
                    <Button variant="outline" onClick={handleResetPassword} className="w-full">
                      Set New Password
                    </Button>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input
                      value={resetToken}
                      onChange={(e) => setResetToken(e.target.value)}
                      placeholder="Paste your reset token here..."
                      className="h-11 rounded-lg border border-border/60 bg-background px-4 py-2.5 text-sm transition-colors focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/20"
                    />
                    <input
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="New password"
                      type="password"
                      className="h-11 rounded-lg border border-border/60 bg-background px-4 py-2.5 text-sm transition-colors focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/20"
                    />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Messages */}
            {message && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                <div
                  className={`rounded-lg border p-4 text-sm flex items-start gap-3 ${
                    message.type === "success"
                      ? "border-emerald-500/30 bg-emerald-500/10"
                      : "border-red-500/30 bg-red-500/10"
                  }`}
                >
                  <div className="mt-0.5">
                    {message.type === "success" ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                    )}
                  </div>
                  <span
                    className={
                      message.type === "success"
                        ? "text-emerald-700 dark:text-emerald-300"
                        : "text-red-700 dark:text-red-300"
                    }
                  >
                    {message.text}
                  </span>
                </div>
              </motion.div>
            )}
          </div>

          {/* Sidebar: Avatar Section */}
          <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <div className="rounded-2xl border border-border/60 bg-gradient-to-br from-card via-card to-secondary/20 p-6 shadow-sm hover:shadow-md transition-shadow sticky top-24">
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Camera className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-semibold">Your Avatar</h2>
                    <p className="text-xs text-muted-foreground">Choose from professional options</p>
                  </div>
                </div>

                {/* Avatar Preview - Enhanced */}
                <div className="mb-8 flex justify-center">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent rounded-3xl blur-lg" />
                    <div className="relative p-3 bg-gradient-to-br from-primary/5 to-secondary/30 rounded-3xl border border-primary/20">
                      {avatarComponent && avatarComponent.component ? (
                        <avatarComponent.component size={140} />
                      ) : (
                        <div className="w-40 h-40 bg-muted rounded-2xl flex items-center justify-center">
                          <User className="w-10 h-10 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Avatar Picker with better spacing */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold mb-4">Select Avatar</h3>
                  <AvatarPicker selectedAvatarId={selectedAvatar} onSelect={(id) => setProfile((prev) => ({ ...prev, avatarId: id }))} size="sm" />
                </div>

                {/* Custom Upload Section */}
                <div className="border-t border-border/40 pt-6">
                  <h3 className="text-sm font-semibold mb-3">Upload Custom Avatar</h3>
                  <div className="rounded-lg border border-dashed border-border/50 p-4 text-center hover:border-primary/30 transition-colors">
                    <Upload className="h-5 w-5 text-muted-foreground mx-auto mb-2" />
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
                      className="text-xs cursor-pointer w-full"
                    />
                    <p className="text-xs text-muted-foreground mt-2">JPG, PNG or WEBP (max 2MB)</p>
                    <Button variant="outline" size="sm" onClick={handleAvatarUpload} disabled={!avatarFile} className="w-full mt-3">
                      Upload
                    </Button>
                  </div>
                </div>

                {/* Info Card */}
                <div className="mt-6 p-3 bg-secondary/30 rounded-lg">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    <strong>Tip:</strong> Choose a professional avatar that represents you. It will be displayed across the app.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Action Buttons */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-3">
              <Button variant="default" className="w-full h-11 font-semibold" onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Save Profile"}
              </Button>
              <Button variant="outline" className="w-full h-11" asChild>
                <Link to="/settings">Settings</Link>
              </Button>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}

