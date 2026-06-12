export const colors = {
  background: "#0f1f17",
  backgroundDark: "#0a1510",
  surface: "#1a2e22",
  surfaceAlt: "#16281e",
  border: "#2f5a40",
  accent: "#e8c873",
  text: "#f4f1e8",
  textMuted: "#9fb3a6",
  trump: "#e8c873",
  success: "#3aa873",
  danger: "#d9534f",
} as const;

export type ColorToken = keyof typeof colors;
