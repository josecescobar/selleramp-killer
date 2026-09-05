export type AlertStatus = 'safe' | 'warn' | 'danger' | 'neutral';

export type AlertType =
  | 'BRAND_GATING'
  | 'IP_COMPLAINTS'
  | 'HAZMAT'
  | 'OVERSIZE'
  | 'PRIVATE_LABEL'
  | 'MELTABLE'
  | 'ADULT_CONTENT'
  | 'PRICE_VOLATILITY';

export interface Alert {
  type: AlertType;
  icon: string;
  label: string;
  status: AlertStatus;
  detail?: string;
}
