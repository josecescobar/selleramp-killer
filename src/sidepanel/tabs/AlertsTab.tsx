import { useTheme } from '../theme/ThemeContext';
import { AlertRow } from '../components/AlertRow';
import { SectionHeader } from '../components/SectionHeader';
import type { AnalysisResult } from '@shared/types/messages';

interface AlertsTabProps {
  data: AnalysisResult;
}

export function AlertsTab({ data }: AlertsTabProps) {
  const { tokens: t } = useTheme();
  const warningCount = data.alerts.filter(
    (a) => a.status === 'warn' || a.status === 'danger',
  ).length;

  return (
    <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
      <SectionHeader
        icon={'\u{1F6E1}\uFE0F'}
        title="Risk Analysis"
        badge={`${warningCount} warning${warningCount !== 1 ? 's' : ''}`}
      />

      {data.alerts.map((alert) => (
        <AlertRow
          key={alert.type}
          icon={alert.icon}
          label={alert.label}
          status={alert.status}
          detail={alert.detail ?? ''}
        />
      ))}

      {/* AI Risk Note */}
      {data.dealScore.summary && (
        <div
          style={{
            marginTop: 4,
            background: t.accentGlow,
            border: `1px solid ${t.accent}30`,
            borderRadius: 8,
            padding: '10px 12px',
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: t.accent,
              marginBottom: 4,
              letterSpacing: '0.04em',
            }}
          >
            {'\u2726'} AI RISK ASSESSMENT
          </div>
          <div style={{ fontSize: 11, color: t.textMuted, lineHeight: 1.5 }}>
            {data.dealScore.summary}
          </div>
        </div>
      )}
    </div>
  );
}
