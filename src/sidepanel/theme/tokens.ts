export interface ThemeTokens {
  bg: string;
  surface: string;
  surfaceHover: string;
  card: string;
  cardBorder: string;
  text: string;
  textMuted: string;
  textDim: string;
  accent: string;
  accentGlow: string;
  green: string;
  greenBg: string;
  red: string;
  redBg: string;
  yellow: string;
  yellowBg: string;
  orange: string;
  orangeBg: string;
  border: string;
  divider: string;
  shadow: string;
  panelShadow: string;
}

export const DARK: ThemeTokens = {
  bg: '#0f1117',
  surface: '#1a1d27',
  surfaceHover: '#222632',
  card: '#1e2230',
  cardBorder: '#2a2e3e',
  text: '#e8eaf0',
  textMuted: '#8b90a0',
  textDim: '#5c6070',
  accent: '#3b82f6',
  accentGlow: 'rgba(59,130,246,0.15)',
  green: '#22c55e',
  greenBg: 'rgba(34,197,94,0.12)',
  red: '#ef4444',
  redBg: 'rgba(239,68,68,0.12)',
  yellow: '#eab308',
  yellowBg: 'rgba(234,179,8,0.12)',
  orange: '#f97316',
  orangeBg: 'rgba(249,115,22,0.12)',
  border: '#2a2e3e',
  divider: '#252836',
  shadow: '0 8px 32px rgba(0,0,0,0.5)',
  panelShadow: '0 0 0 1px rgba(255,255,255,0.06), 0 16px 48px rgba(0,0,0,0.6)',
};

export const LIGHT: ThemeTokens = {
  bg: '#f4f5f7',
  surface: '#ffffff',
  surfaceHover: '#f0f1f4',
  card: '#ffffff',
  cardBorder: '#e2e4ea',
  text: '#1a1d27',
  textMuted: '#6b7084',
  textDim: '#9ca0b0',
  accent: '#2563eb',
  accentGlow: 'rgba(37,99,235,0.08)',
  green: '#16a34a',
  greenBg: 'rgba(22,163,74,0.08)',
  red: '#dc2626',
  redBg: 'rgba(220,38,38,0.08)',
  yellow: '#ca8a04',
  yellowBg: 'rgba(202,138,4,0.08)',
  orange: '#ea580c',
  orangeBg: 'rgba(234,88,12,0.08)',
  border: '#e2e4ea',
  divider: '#eef0f4',
  shadow: '0 8px 32px rgba(0,0,0,0.08)',
  panelShadow: '0 0 0 1px rgba(0,0,0,0.06), 0 16px 48px rgba(0,0,0,0.12)',
};
