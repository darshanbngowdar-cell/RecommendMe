import { useState, useMemo } from "react";
import { Shuffle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AVATAR_OPTIONS } from "./avatarData";
import { getAvatarById } from "./avatarUtils";

interface AvatarPickerProps {
  selectedAvatarId: string;
  onSelect: (avatarId: string) => void;
  size?: "sm" | "md" | "lg";
}

export default function AvatarPicker({ selectedAvatarId, onSelect, size = "md" }: AvatarPickerProps) {
  const [filterCategory, setFilterCategory] = useState<"all" | "male" | "female" | "neutral">("all");

  const filteredAvatars = useMemo(() => {
    return filterCategory === "all" ? AVATAR_OPTIONS : AVATAR_OPTIONS.filter((a) => a.category === filterCategory);
  }, [filterCategory]);

  const handleRandomize = () => {
    const randomAvatar = AVATAR_OPTIONS[Math.floor(Math.random() * AVATAR_OPTIONS.length)];
    onSelect(randomAvatar.id);
  };

  const sizeMap = {
    sm: { grid: "grid-cols-3 gap-2", avatar: 48 },
    md: { grid: "grid-cols-4 gap-3", avatar: 64 },
    lg: { grid: "grid-cols-5 gap-4", avatar: 80 },
  };

  const sizing = sizeMap[size];

  return (
    <div className="space-y-4">
      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: "all" as const, label: "All" },
          { key: "male" as const, label: "Male" },
          { key: "female" as const, label: "Female" },
          { key: "neutral" as const, label: "Neutral" },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilterCategory(key)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              filterCategory === key
                ? "bg-primary text-primary-foreground"
                : "bg-secondary/60 text-foreground hover:bg-secondary"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Avatar Grid */}
      <div className={`grid ${sizing.grid}`}>
        {filteredAvatars.map((avatar) => {
          const AvatarComponent = avatar.component;
          const isSelected = selectedAvatarId === avatar.id;

          return (
            <button
              key={avatar.id}
              onClick={() => onSelect(avatar.id)}
              className={`group relative rounded-xl sm:rounded-2xl border-2 transition-all overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                isSelected ? "border-primary ring-2 ring-primary/20 shadow-lg shadow-primary/20" : "border-border/60 hover:border-primary/30"
              }`}
              title={avatar.name}
              aria-label={`Select ${avatar.name} avatar`}
            >
              <div className="p-1 bg-background/50">
                <AvatarComponent size={sizing.avatar} />
              </div>
              {isSelected && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-[calc(0.75rem-2px)] sm:rounded-[calc(1.25rem-2px)]">
                  <div className="w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Randomize Button */}
      <div className="pt-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleRandomize}
          className="w-full gap-2"
        >
          <Shuffle className="h-4 w-4" />
          Randomize Avatar
        </Button>
      </div>
    </div>
  );
}
