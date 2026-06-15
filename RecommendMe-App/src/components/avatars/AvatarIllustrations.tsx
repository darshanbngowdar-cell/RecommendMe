/**
 * Professional, minimal, SaaS-style avatar illustrations
 * Diverse, gender-inclusive options with soft colors and clean outlines
 */

// Male Avatars
export const AvatarMale1 = ({ size = 64, className = "" }) => (
  <svg viewBox="0 0 120 120" width={size} height={size} className={className} xmlns="http://www.w3.org/2000/svg">
    <rect width="120" height="120" rx="24" fill="#E8F0FE" />
    <circle cx="60" cy="35" r="18" fill="#6366F1" />
    <path d="M30 60C30 50 40 50 60 50C80 50 90 60 90 75C90 90 80 100 60 100C40 100 30 90 30 75Z" fill="#6366F1" />
    <circle cx="45" cy="65" r="4" fill="#E8F0FE" />
    <circle cx="75" cy="65" r="4" fill="#E8F0FE" />
  </svg>
);

export const AvatarMale2 = ({ size = 64, className = "" }) => (
  <svg viewBox="0 0 120 120" width={size} height={size} className={className} xmlns="http://www.w3.org/2000/svg">
    <rect width="120" height="120" rx="24" fill="#F0E8FE" />
    <circle cx="60" cy="32" r="20" fill="#8B5CF6" />
    <path d="M25 65C25 55 35 50 60 50C85 50 95 55 95 70C95 92 80 105 60 105C40 105 25 92 25 70Z" fill="#8B5CF6" />
    <path d="M40 70C40 65 43 62 48 62C53 62 56 65 56 70" stroke="#F0E8FE" strokeWidth="2" fill="none" />
    <path d="M72 70C72 65 75 62 80 62C85 62 88 65 88 70" stroke="#F0E8FE" strokeWidth="2" fill="none" />
  </svg>
);

export const AvatarMale3 = ({ size = 64, className = "" }) => (
  <svg viewBox="0 0 120 120" width={size} height={size} className={className} xmlns="http://www.w3.org/2000/svg">
    <rect width="120" height="120" rx="24" fill="#FEF3E8" />
    <circle cx="60" cy="36" r="19" fill="#EA580C" />
    <path d="M32 68C32 55 42 48 60 48C78 48 88 55 88 68C88 88 75 102 60 102C45 102 32 88 32 68Z" fill="#EA580C" />
    <circle cx="48" cy="68" r="5" fill="#FEF3E8" />
    <circle cx="72" cy="68" r="5" fill="#FEF3E8" />
    <path d="M50 78C55 82 65 82 70 78" stroke="#FEF3E8" strokeWidth="2" fill="none" strokeLinecap="round" />
  </svg>
);

// Female Avatars
export const AvatarFemale1 = ({ size = 64, className = "" }) => (
  <svg viewBox="0 0 120 120" width={size} height={size} className={className} xmlns="http://www.w3.org/2000/svg">
    <rect width="120" height="120" rx="24" fill="#FFE8F0" />
    <circle cx="60" cy="34" r="19" fill="#EC4899" />
    <path d="M35 62C35 55 42 48 60 48C78 48 85 55 85 62C85 62 85 75 75 85C75 95 68 105 60 105C52 105 45 95 45 85C35 75 35 62 35 62Z" fill="#EC4899" />
    <path d="M35 62C35 62 30 75 30 85C30 95 42 105 60 105" fill="none" stroke="#EC4899" strokeWidth="2" />
    <circle cx="48" cy="68" r="4" fill="#FFE8F0" />
    <circle cx="72" cy="68" r="4" fill="#FFE8F0" />
  </svg>
);

export const AvatarFemale2 = ({ size = 64, className = "" }) => (
  <svg viewBox="0 0 120 120" width={size} height={size} className={className} xmlns="http://www.w3.org/2000/svg">
    <rect width="120" height="120" rx="24" fill="#E8F8F5" />
    <circle cx="60" cy="35" r="18" fill="#14B8A6" />
    <path d="M30 65C30 55 40 48 60 48C80 48 90 55 90 65C90 78 82 92 75 98C68 104 60 105 60 105C60 105 52 104 45 98C38 92 30 78 30 65Z" fill="#14B8A6" />
    <path d="M35 65L25 85C25 98 35 108 60 108C85 108 95 98 95 85L85 65" fill="#14B8A6" opacity="0.3" />
    <circle cx="48" cy="70" r="3.5" fill="#E8F8F5" />
    <circle cx="72" cy="70" r="3.5" fill="#E8F8F5" />
  </svg>
);

export const AvatarFemale3 = ({ size = 64, className = "" }) => (
  <svg viewBox="0 0 120 120" width={size} height={size} className={className} xmlns="http://www.w3.org/2000/svg">
    <rect width="120" height="120" rx="24" fill="#FEF3C7" />
    <circle cx="60" cy="33" r="19" fill="#D97706" />
    <path d="M28 62C28 52 38 45 60 45C82 45 92 52 92 62C92 75 85 92 75 100C65 108 60 108 60 108C60 108 55 108 45 100C35 92 28 75 28 62Z" fill="#D97706" />
    <path d="M32 72C32 82 40 95 60 95C80 95 88 82 88 72" fill="none" stroke="#FEF3C7" strokeWidth="2" />
    <circle cx="47" cy="65" r="4" fill="#FEF3C7" />
    <circle cx="73" cy="65" r="4" fill="#FEF3C7" />
  </svg>
);

// Neutral Avatars
export const AvatarNeutral1 = ({ size = 64, className = "" }) => (
  <svg viewBox="0 0 120 120" width={size} height={size} className={className} xmlns="http://www.w3.org/2000/svg">
    <rect width="120" height="120" rx="24" fill="#F3E8FF" />
    <circle cx="60" cy="35" r="18" fill="#A855F7" />
    <rect x="35" y="58" width="50" height="45" rx="12" fill="#A855F7" />
    <circle cx="48" cy="70" r="3" fill="#F3E8FF" />
    <circle cx="72" cy="70" r="3" fill="#F3E8FF" />
    <path d="M50 80H70" stroke="#F3E8FF" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const AvatarNeutral2 = ({ size = 64, className = "" }) => (
  <svg viewBox="0 0 120 120" width={size} height={size} className={className} xmlns="http://www.w3.org/2000/svg">
    <rect width="120" height="120" rx="24" fill="#DBEAFE" />
    <circle cx="60" cy="32" r="19" fill="#0EA5E9" />
    <path d="M32 65C32 55 42 50 60 50C78 50 88 55 88 65C88 80 79 95 60 100C41 95 32 80 32 65Z" fill="#0EA5E9" />
    <rect x="45" y="67" width="8" height="8" rx="1" fill="#DBEAFE" />
    <rect x="67" y="67" width="8" height="8" rx="1" fill="#DBEAFE" />
    <path d="M48 82C52 85 68 85 72 82" stroke="#DBEAFE" strokeWidth="1.5" fill="none" strokeLinecap="round" />
  </svg>
);

export const AvatarNeutral3 = ({ size = 64, className = "" }) => (
  <svg viewBox="0 0 120 120" width={size} height={size} className={className} xmlns="http://www.w3.org/2000/svg">
    <rect width="120" height="120" rx="24" fill="#F5F3FF" />
    <circle cx="60" cy="34" r="19" fill="#6366F1" opacity="0.8" />
    <path d="M30 62C30 55 38 48 60 48C82 48 90 55 90 62C90 75 82 95 70 100C60 103 60 103 60 103C60 103 60 103 50 100C38 95 30 75 30 62Z" fill="#6366F1" opacity="0.8" />
    <circle cx="45" cy="68" r="3.5" fill="#F5F3FF" />
    <circle cx="75" cy="68" r="3.5" fill="#F5F3FF" />
    <path d="M45 80Q60 85 75 80" stroke="#F5F3FF" strokeWidth="2" fill="none" strokeLinecap="round" />
  </svg>
);
