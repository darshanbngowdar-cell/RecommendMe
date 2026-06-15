/**
 * Avatar data and options
 * Separated from component file to avoid React Fast Refresh issues
 */

export interface AvatarOption {
  id: string;
  name: string;
  category: "male" | "female" | "neutral";
}

export const AVATAR_OPTIONS: AvatarOption[] = [
  { id: "male-1", name: "Alexander", category: "male" },
  { id: "male-2", name: "Marcus", category: "male" },
  { id: "male-3", name: "Sebastian", category: "male" },
  { id: "female-1", name: "Emma", category: "female" },
  { id: "female-2", name: "Sophia", category: "female" },
  { id: "female-3", name: "Isabella", category: "female" },
  { id: "neutral-1", name: "Jordan", category: "neutral" },
  { id: "neutral-2", name: "Casey", category: "neutral" },
  { id: "neutral-3", name: "Avery", category: "neutral" },
];

export const AVATAR_COLORS: Record<string, { bg: string; text: string }> = {
  "male-1": { bg: "#E8F0FE", text: "#6366F1" },
  "male-2": { bg: "#F0E8FE", text: "#8B5CF6" },
  "male-3": { bg: "#FEF3E8", text: "#EA580C" },
  "female-1": { bg: "#FFE8F0", text: "#EC4899" },
  "female-2": { bg: "#E8F8F5", text: "#14B8A6" },
  "female-3": { bg: "#FEF3C7", text: "#D97706" },
  "neutral-1": { bg: "#F3E8FF", text: "#A855F7" },
  "neutral-2": { bg: "#DBEAFE", text: "#0EA5E9" },
  "neutral-3": { bg: "#F5F3FF", text: "#6366F1" },
};
