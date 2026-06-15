import { AVATAR_OPTIONS } from "./avatarData";
import {
  AvatarMale1,
  AvatarMale2,
  AvatarMale3,
  AvatarFemale1,
  AvatarFemale2,
  AvatarFemale3,
  AvatarNeutral1,
  AvatarNeutral2,
  AvatarNeutral3,
} from "./AvatarIllustrations";

const AVATAR_COMPONENT_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  "male-1": AvatarMale1,
  "male-2": AvatarMale2,
  "male-3": AvatarMale3,
  "female-1": AvatarFemale1,
  "female-2": AvatarFemale2,
  "female-3": AvatarFemale3,
  "neutral-1": AvatarNeutral1,
  "neutral-2": AvatarNeutral2,
  "neutral-3": AvatarNeutral3,
};

export function getAvatarById(avatarId: string) {
  const avatar = AVATAR_OPTIONS.find((a) => a.id === avatarId);
  if (!avatar) return null;
  return {
    ...avatar,
    component: AVATAR_COMPONENT_MAP[avatarId],
  };
}

export function getRandomAvatarId(): string {
  return AVATAR_OPTIONS[Math.floor(Math.random() * AVATAR_OPTIONS.length)].id;
}

export function getAvatarsByCategory(category: "male" | "female" | "neutral") {
  return AVATAR_OPTIONS.filter((a) => a.category === category);
}
