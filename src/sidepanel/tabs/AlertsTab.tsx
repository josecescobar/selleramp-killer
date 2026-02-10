import { useTheme } from '../theme/ThemeContext';
import { AlertRow } from '../components/AlertRow';
import { SectionHeader } from '../components/SectionHeader';
import type { AnalysisResult } from '@shared/types/messages';

interface AlertsTabProps {
  data: AnalysisResult;
}

export function AlertsTab({ data }: AlertsTabProps) {
  const { tokens: t } = useTheme();

  const dangerCount = data.alerts.filter((a) => a.status === 'danger').length;
  const warnCount = data.alerts.filter((a) => a.status === 'warn').length;
  const clearCount = data.alerts.filter((a) => a.status === 'safe' || a.status === 'neutral').length;

  const issues = data.alerts.filter((a) => a.status === 'danger' || a.status === 'warn');
  const clear = data.alerts.filter((a) => a.status === 'safe' || a.status === 'neutral');

  const summaryColor = dangerCount > 0 ? t.red : warnCount > 0 ? t.yellow : t.green;
  const summaryBg = dangerCount > 0 ? t.redBg : warnCount > 0 ? t.yellowBg : t.greenBg;

  return (
    <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
      {/* Risk Summary Strip */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '8px 12px',
          background: summaryBg,
          borderRadius: 8,
          border: `1px solid ${summaryColor}30`,
        }}
      >
        <span style={{ fontSize: 14 }}>{dangerCount > 0 ? '\u{1F6A8}' : warnCount > 0 ? '\u26A0\uFE0F' : '\u2705'}</span>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flex: 1 }}>
          {dangerCount > 0 && (
            <span style={{ fontSize: 10, fontWeight: 700, color: t.red, letterSpacing: '0.04em' }}>
              {dangerCount} RISK
            </span>
          )}
          {warnCount > 0 && (
            <span style={{ fontSize: 10, fontWeight: 700, color: t.yellow, letterSpacing: '0.04em' }}>
              {warnCount} WARN
            </span>
          )}
          <span style={{ fontSize: 10, fontWeight: 700, color: t.green, letterSpacing: '0.04em' }}>
            {clearCount} CLEAR
          </span>
        </div>
        <span
          style={{
            fontSize: 9,
            fontWeight: 700,
            color: summaryColor,
            letterSpacing: '0.06em',
            padding: '2px 8px',
            borderRadius: 4,
            background: `${summaryColor}15`,
            border: `1px solid ${summaryColor}40`,
          }}
        >
          {dangerCount > 0 ? 'HIGH RISK' : warnCount > 0 ? 'CAUTION' : 'LOW RISK'}
        </span>
      </div>

      {/* Issues Found Group */}
      {issues.length > 0 && (
        <>
          <SectionHeader
            icon={'\u{1F6A9}'}
            title="Issues Found"
            badge={`${issues.length} alert${issues.length !== 1 ? 's' : ''}`}
          />
          {issues.map((alert) => (
            <AlertRow
              key={alert.type}
              icon={alert.icon}
              label={alert.label}
              status={alert.status}
              detail={alert.detail ?? ''}
            />
          ))}
        </>
      )}

      {/* All Clear Group */}
      {clear.length > 0 && (
        <>
          <SectionHeader
            icon={'\u2705'}
            title="All Clear"
            badge={`${clear.length} passed`}
          />
          {clear.map((alert) => (
            <AlertRow
              key={alert.type}
              icon={alert.icon}
              label={alert.label}
              status={alert.status}
              detail={alert.detail ?? ''}
            />
          ))}
        </>
      )}

      {/* AI Risk Assessment */}
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
