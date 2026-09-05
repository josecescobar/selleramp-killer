import { useState } from "react";

const DARK = {
  bg: "#0f1117",
  surface: "#1a1d27",
  surfaceHover: "#222632",
  card: "#1e2230",
  cardBorder: "#2a2e3e",
  text: "#e8eaf0",
  textMuted: "#8b90a0",
  textDim: "#5c6070",
  accent: "#3b82f6",
  accentGlow: "rgba(59,130,246,0.15)",
  green: "#22c55e",
  greenBg: "rgba(34,197,94,0.12)",
  red: "#ef4444",
  redBg: "rgba(239,68,68,0.12)",
  yellow: "#eab308",
  yellowBg: "rgba(234,179,8,0.12)",
  orange: "#f97316",
  orangeBg: "rgba(249,115,22,0.12)",
  border: "#2a2e3e",
  divider: "#252836",
  shadow: "0 8px 32px rgba(0,0,0,0.5)",
  panelShadow: "0 0 0 1px rgba(255,255,255,0.06), 0 16px 48px rgba(0,0,0,0.6)",
};

const LIGHT = {
  bg: "#f4f5f7",
  surface: "#ffffff",
  surfaceHover: "#f0f1f4",
  card: "#ffffff",
  cardBorder: "#e2e4ea",
  text: "#1a1d27",
  textMuted: "#6b7084",
  textDim: "#9ca0b0",
  accent: "#2563eb",
  accentGlow: "rgba(37,99,235,0.08)",
  green: "#16a34a",
  greenBg: "rgba(22,163,74,0.08)",
  red: "#dc2626",
  redBg: "rgba(220,38,38,0.08)",
  yellow: "#ca8a04",
  yellowBg: "rgba(202,138,4,0.08)",
  orange: "#ea580c",
  orangeBg: "rgba(234,88,12,0.08)",
  border: "#e2e4ea",
  divider: "#eef0f4",
  shadow: "0 8px 32px rgba(0,0,0,0.08)",
  panelShadow: "0 0 0 1px rgba(0,0,0,0.06), 0 16px 48px rgba(0,0,0,0.12)",
};

const ScoreBadge = ({ score, size = 56, t }) => {
  const color = score >= 80 ? t.green : score >= 60 ? t.yellow : score >= 40 ? t.orange : t.red;
  const bgColor = score >= 80 ? t.greenBg : score >= 60 ? t.yellowBg : score >= 40 ? t.orangeBg : t.redBg;
  const label = score >= 80 ? "BUY" : score >= 60 ? "MAYBE" : score >= 40 ? "RISKY" : "PASS";
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      <div
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          background: `conic-gradient(${color} ${score * 3.6}deg, ${bgColor} 0deg)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        <div
          style={{
            width: size - 8,
            height: size - 8,
            borderRadius: "50%",
            background: t.surface,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
          }}
        >
          <span style={{ fontSize: size * 0.34, fontWeight: 700, color, lineHeight: 1 }}>{score}</span>
        </div>
      </div>
      <span style={{ fontSize: 10, fontWeight: 700, color, letterSpacing: "0.08em" }}>{label}</span>
    </div>
  );
};

const MetricBox = ({ label, value, sub, color, t }) => (
  <div
    style={{
      flex: 1,
      padding: "10px 8px",
      background: t.card,
      border: `1px solid ${t.cardBorder}`,
      borderRadius: 8,
      textAlign: "center",
      minWidth: 0,
    }}
  >
    <div style={{ fontSize: 10, color: t.textMuted, marginBottom: 4, fontWeight: 500, letterSpacing: "0.04em", textTransform: "uppercase" }}>{label}</div>
    <div style={{ fontSize: 17, fontWeight: 700, color: color || t.text, lineHeight: 1.1 }}>{value}</div>
    {sub && <div style={{ fontSize: 10, color: t.textDim, marginTop: 3 }}>{sub}</div>}
  </div>
);

const AlertRow = ({ icon, text, status, t }) => {
  const statusColors = { safe: t.green, warn: t.yellow, danger: t.red, neutral: t.textMuted };
  const statusBg = { safe: t.greenBg, warn: t.yellowBg, danger: t.redBg, neutral: t.accentGlow };
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "7px 10px",
        borderRadius: 6,
        background: statusBg[status] || "transparent",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 13 }}>{icon}</span>
        <span style={{ fontSize: 12, color: t.text, fontWeight: 500 }}>{text}</span>
      </div>
      <span
        style={{
          fontSize: 10,
          fontWeight: 700,
          color: statusColors[status],
          textTransform: "uppercase",
          letterSpacing: "0.06em",
        }}
      >
        {status === "safe" ? "✓ Clear" : status === "warn" ? "⚠ Caution" : status === "danger" ? "✕ Risk" : "—"}
      </span>
    </div>
  );
};

const OfferRow = ({ type, price, profit, roi, t }) => (
  <div
    style={{
      display: "grid",
      gridTemplateColumns: "50px 70px 70px 50px",
      gap: 4,
      padding: "6px 10px",
      fontSize: 12,
      borderBottom: `1px solid ${t.divider}`,
      alignItems: "center",
    }}
  >
    <span
      style={{
        fontSize: 10,
        fontWeight: 600,
        padding: "2px 6px",
        borderRadius: 4,
        background: type === "FBA" ? t.accentGlow : t.orangeBg,
        color: type === "FBA" ? t.accent : t.orange,
        textAlign: "center",
      }}
    >
      {type}
    </span>
    <span style={{ fontWeight: 600, color: t.text }}>{price}</span>
    <span style={{ fontWeight: 600, color: t.green }}>{profit}</span>
    <span style={{ fontWeight: 600, color: t.green }}>{roi}</span>
  </div>
);

const MiniChart = ({ t }) => {
  const points = [80, 72, 85, 65, 90, 78, 95, 88, 70, 92, 85, 98, 75, 88, 82, 90, 95, 78, 85, 92];
  const max = Math.max(...points);
  const min = Math.min(...points);
  const h = 48;
  const w = 200;
  const normalized = points.map((p) => h - ((p - min) / (max - min)) * h);
  const pathD = normalized.map((y, i) => `${i === 0 ? "M" : "L"} ${(i / (points.length - 1)) * w} ${y}`).join(" ");
  const areaD = pathD + ` L ${w} ${h} L 0 ${h} Z`;
  return (
    <svg width="100%" height={h + 8} viewBox={`0 0 ${w} ${h + 8}`} preserveAspectRatio="none" style={{ display: "block" }}>
      <defs>
        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={t.accent} stopOpacity="0.2" />
          <stop offset="100%" stopColor={t.accent} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill="url(#chartGrad)" />
      <path d={pathD} fill="none" stroke={t.accent} strokeWidth="1.5" />
    </svg>
  );
};

const SectionHeader = ({ icon, title, t, badge }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "8px 12px 6px",
    }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span style={{ fontSize: 13 }}>{icon}</span>
      <span style={{ fontSize: 11, fontWeight: 700, color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.08em" }}>{title}</span>
    </div>
    {badge && (
      <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 10, background: t.accentGlow, color: t.accent }}>{badge}</span>
    )}
  </div>
);

const TabBar = ({ tabs, active, setActive, t }) => (
  <div style={{ display: "flex", borderBottom: `1px solid ${t.divider}`, padding: "0 8px" }}>
    {tabs.map((tab) => (
      <button
        key={tab.id}
        onClick={() => setActive(tab.id)}
        style={{
          flex: 1,
          padding: "8px 4px",
          fontSize: 11,
          fontWeight: active === tab.id ? 700 : 500,
          color: active === tab.id ? t.accent : t.textMuted,
          background: "none",
          border: "none",
          borderBottom: active === tab.id ? `2px solid ${t.accent}` : "2px solid transparent",
          cursor: "pointer",
          transition: "all 0.15s",
          fontFamily: "inherit",
          letterSpacing: "0.02em",
        }}
      >
        {tab.icon} {tab.label}
      </button>
    ))}
  </div>
);

const OverlayPanel = ({ t, expanded, setExpanded }) => {
  const [activeTab, setActiveTab] = useState("overview");
  const tabs = [
    { id: "overview", label: "Overview", icon: "⚡" },
    { id: "offers", label: "Offers", icon: "🏷" },
    { id: "alerts", label: "Alerts", icon: "🛡" },
    { id: "chart", label: "History", icon: "📈" },
    { id: "ebay", label: "eBay", icon: "🔄" },
  ];

  return (
    <div
      style={{
        width: expanded ? 380 : 340,
        background: t.surface,
        borderRadius: 14,
        boxShadow: t.panelShadow,
        overflow: "hidden",
        fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif",
        transition: "width 0.2s ease",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "10px 14px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: `1px solid ${t.divider}`,
          background: t.bg,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 24,
              height: 24,
              borderRadius: 6,
              background: `linear-gradient(135deg, ${t.accent}, #8b5cf6)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              color: "#fff",
              fontWeight: 800,
            }}
          >
            S
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: t.text, letterSpacing: "-0.01em" }}>SourceTool</span>
          <span style={{ fontSize: 9, fontWeight: 600, color: t.accent, background: t.accentGlow, padding: "1px 6px", borderRadius: 4 }}>PRO</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <button
            onClick={() => setExpanded(!expanded)}
            style={{
              background: "none",
              border: `1px solid ${t.border}`,
              borderRadius: 6,
              color: t.textMuted,
              fontSize: 11,
              padding: "3px 8px",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            {expanded ? "◁" : "▷"}
          </button>
        </div>
      </div>

      {/* Product Summary */}
      <div style={{ padding: "10px 14px", display: "flex", gap: 12, borderBottom: `1px solid ${t.divider}` }}>
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: 8,
            background: t.bg,
            border: `1px solid ${t.cardBorder}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 22,
            flexShrink: 0,
          }}
        >
          👟
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: t.text,
              lineHeight: 1.3,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            Nike Air Max 90 Men's Shoes, White/Black
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 4, alignItems: "center" }}>
            <span style={{ fontSize: 10, color: t.textMuted, fontFamily: "monospace" }}>B0DTTRHD4W</span>
            <span style={{ fontSize: 10, color: t.textDim }}>·</span>
            <span style={{ fontSize: 10, color: t.textMuted }}>Nike</span>
            <span style={{ fontSize: 10, color: t.textDim }}>·</span>
            <span style={{ fontSize: 10, color: t.yellow }}>★ 4.5 (3,291)</span>
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
            <span
              style={{
                fontSize: 9,
                fontWeight: 600,
                padding: "1px 6px",
                borderRadius: 4,
                background: t.greenBg,
                color: t.green,
              }}
            >
              UNGATED
            </span>
            <span
              style={{
                fontSize: 9,
                fontWeight: 600,
                padding: "1px 6px",
                borderRadius: 4,
                background: t.accentGlow,
                color: t.accent,
              }}
            >
              CLOTHING
            </span>
          </div>
        </div>
        <ScoreBadge score={87} t={t} />
      </div>

      {/* Tabs */}
      <TabBar tabs={tabs} active={activeTab} setActive={setActiveTab} t={t} />

      {/* Tab Content */}
      <div style={{ maxHeight: expanded ? 420 : 340, overflowY: "auto" }}>
        {activeTab === "overview" && (
          <div style={{ padding: "8px 12px 12px" }}>
            {/* Cost/Price Input */}
            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 10, color: t.textMuted, fontWeight: 600, display: "block", marginBottom: 3 }}>BUY COST</label>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    background: t.bg,
                    border: `1px solid ${t.border}`,
                    borderRadius: 6,
                    padding: "5px 8px",
                  }}
                >
                  <span style={{ color: t.textDim, fontSize: 13, marginRight: 2 }}>$</span>
                  <span style={{ fontSize: 15, fontWeight: 700, color: t.text }}>52.00</span>
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 10, color: t.textMuted, fontWeight: 600, display: "block", marginBottom: 3 }}>SELL PRICE</label>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    background: t.bg,
                    border: `1px solid ${t.border}`,
                    borderRadius: 6,
                    padding: "5px 8px",
                  }}
                >
                  <span style={{ color: t.textDim, fontSize: 13, marginRight: 2 }}>$</span>
                  <span style={{ fontSize: 15, fontWeight: 700, color: t.text }}>129.99</span>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: 2 }}>
                <button
                  style={{
                    padding: "4px 10px",
                    fontSize: 10,
                    fontWeight: 600,
                    background: t.accentGlow,
                    color: t.accent,
                    border: `1px solid ${t.accent}40`,
                    borderRadius: 5,
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  FBA
                </button>
                <button
                  style={{
                    padding: "4px 10px",
                    fontSize: 10,
                    fontWeight: 500,
                    background: "transparent",
                    color: t.textMuted,
                    border: `1px solid ${t.border}`,
                    borderRadius: 5,
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  FBM
                </button>
              </div>
            </div>

            {/* Key Metrics Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 10 }}>
              <MetricBox label="Profit" value="$42.18" color={t.green} t={t} />
              <MetricBox label="ROI" value="81%" color={t.green} t={t} />
              <MetricBox label="Margin" value="32%" color={t.green} t={t} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 10 }}>
              <MetricBox label="BSR" value="12,450" sub="Top 0.8%" color={t.text} t={t} />
              <MetricBox label="Est. Sales" value="185/mo" sub="± 25 · 78%" color={t.text} t={t} />
              <MetricBox label="Max Cost" value="$68.50" color={t.text} t={t} />
            </div>

            {/* Fee Breakdown (compact) */}
            <div
              style={{
                background: t.bg,
                borderRadius: 8,
                border: `1px solid ${t.cardBorder}`,
                padding: "8px 10px",
                marginBottom: 10,
              }}
            >
              <div style={{ fontSize: 10, fontWeight: 700, color: t.textMuted, marginBottom: 6, letterSpacing: "0.06em" }}>FEE BREAKDOWN</div>
              {[
                ["Referral Fee (17%)", "$22.10"],
                ["FBA Fulfillment", "$6.75"],
                ["Variable Closing", "$0.00"],
                ["Storage (est.)", "$0.48"],
              ].map(([label, val]) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "2px 0", fontSize: 11 }}>
                  <span style={{ color: t.textMuted }}>{label}</span>
                  <span style={{ color: t.text, fontWeight: 500, fontFamily: "monospace", fontSize: 11 }}>{val}</span>
                </div>
              ))}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "4px 0 0",
                  marginTop: 4,
                  borderTop: `1px solid ${t.divider}`,
                  fontSize: 12,
                }}
              >
                <span style={{ color: t.text, fontWeight: 700 }}>Total Fees</span>
                <span style={{ color: t.red, fontWeight: 700, fontFamily: "monospace" }}>−$29.33</span>
              </div>
            </div>

            {/* Quick Actions */}
            <div style={{ display: "flex", gap: 6 }}>
              <button
                style={{
                  flex: 1,
                  padding: "8px 12px",
                  fontSize: 12,
                  fontWeight: 700,
                  background: t.green,
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  letterSpacing: "0.02em",
                }}
              >
                + Add to Buy List
              </button>
              <button
                style={{
                  padding: "8px 12px",
                  fontSize: 12,
                  fontWeight: 600,
                  background: "transparent",
                  color: t.textMuted,
                  border: `1px solid ${t.border}`,
                  borderRadius: 8,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                👁
              </button>
              <button
                style={{
                  padding: "8px 12px",
                  fontSize: 12,
                  fontWeight: 600,
                  background: "transparent",
                  color: t.textMuted,
                  border: `1px solid ${t.border}`,
                  borderRadius: 8,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                📋
              </button>
            </div>
          </div>
        )}

        {activeTab === "offers" && (
          <div>
            <SectionHeader icon="🏷" title="Live Offers" badge="4 sellers" t={t} />
            <div style={{ padding: "0 12px 6px" }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "50px 70px 70px 50px",
                  gap: 4,
                  padding: "4px 10px",
                  fontSize: 10,
                  color: t.textDim,
                  fontWeight: 600,
                  letterSpacing: "0.04em",
                }}
              >
                <span>TYPE</span>
                <span>PRICE</span>
                <span>PROFIT</span>
                <span>ROI</span>
              </div>
              <OfferRow type="FBA" price="$129.99" profit="$42.18" roi="81%" t={t} />
              <OfferRow type="FBA" price="$134.50" profit="$46.69" roi="90%" t={t} />
              <OfferRow type="FBM" price="$119.99" profit="$58.24" roi="112%" t={t} />
              <OfferRow type="FBM" price="$124.95" profit="$63.20" roi="122%" t={t} />
            </div>
            <div style={{ padding: "8px 12px", background: t.bg, margin: "4px 12px 12px", borderRadius: 8, fontSize: 11 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ color: t.textMuted }}>Buy Box Owner</span>
                <span style={{ color: t.text, fontWeight: 600 }}>FBA · StoreXYZ</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ color: t.textMuted }}>Buy Box Stability</span>
                <span style={{ color: t.green, fontWeight: 600 }}>92% (30d)</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: t.textMuted }}>Amazon on Listing?</span>
                <span style={{ color: t.green, fontWeight: 600 }}>No ✓</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === "alerts" && (
          <div style={{ padding: "8px 12px 12px", display: "flex", flexDirection: "column", gap: 4 }}>
            <AlertRow icon="🔒" text="Brand Gating" status="safe" t={t} />
            <AlertRow icon="🛡" text="IP Complaints" status="safe" t={t} />
            <AlertRow icon="⚠️" text="Hazmat / Safety" status="safe" t={t} />
            <AlertRow icon="📦" text="Oversize Item" status="safe" t={t} />
            <AlertRow icon="🏷" text="Private Label Risk" status="warn" t={t} />
            <AlertRow icon="❄️" text="Meltable" status="safe" t={t} />
            <AlertRow icon="🔞" text="Adult Content" status="safe" t={t} />
            <AlertRow icon="📊" text="Price Volatility (90d)" status="warn" t={t} />
            <div
              style={{
                marginTop: 8,
                padding: "10px 12px",
                background: t.yellowBg,
                borderRadius: 8,
                border: `1px solid ${t.yellow}30`,
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 600, color: t.yellow, marginBottom: 4 }}>⚠ AI Risk Note</div>
              <div style={{ fontSize: 11, color: t.text, lineHeight: 1.5 }}>
                Nike has moderate enforcement history. 2 IP claims in this subcategory in the last 90 days. Proceed with caution on new condition only.
              </div>
            </div>
          </div>
        )}

        {activeTab === "chart" && (
          <div style={{ padding: "8px 12px 12px" }}>
            <div style={{ display: "flex", gap: 4, marginBottom: 10 }}>
              {["1M", "3M", "6M", "1Y", "ALL"].map((p, i) => (
                <button
                  key={p}
                  style={{
                    flex: 1,
                    padding: "4px 0",
                    fontSize: 10,
                    fontWeight: i === 1 ? 700 : 500,
                    color: i === 1 ? t.accent : t.textMuted,
                    background: i === 1 ? t.accentGlow : "transparent",
                    border: `1px solid ${i === 1 ? t.accent + "40" : t.border}`,
                    borderRadius: 5,
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  {p}
                </button>
              ))}
            </div>

            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: t.textMuted, marginBottom: 6, letterSpacing: "0.04em" }}>PRICE HISTORY</div>
              <div style={{ background: t.bg, borderRadius: 8, padding: "8px 4px 4px", border: `1px solid ${t.cardBorder}` }}>
                <MiniChart t={t} />
                <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 8px 2px", fontSize: 10, color: t.textDim }}>
                  <span>Nov '25</span>
                  <span>Dec '25</span>
                  <span>Jan '26</span>
                  <span>Feb '26</span>
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
              <div style={{ background: t.bg, borderRadius: 8, padding: "8px 10px", border: `1px solid ${t.cardBorder}` }}>
                <div style={{ fontSize: 10, color: t.textMuted, marginBottom: 2 }}>Avg Price (90d)</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: t.text }}>$127.42</div>
              </div>
              <div style={{ background: t.bg, borderRadius: 8, padding: "8px 10px", border: `1px solid ${t.cardBorder}` }}>
                <div style={{ fontSize: 10, color: t.textMuted, marginBottom: 2 }}>BSR Trend</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: t.green }}>↗ Improving</div>
              </div>
              <div style={{ background: t.bg, borderRadius: 8, padding: "8px 10px", border: `1px solid ${t.cardBorder}` }}>
                <div style={{ fontSize: 10, color: t.textMuted, marginBottom: 2 }}>Lowest (90d)</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: t.text }}>$98.50</div>
              </div>
              <div style={{ background: t.bg, borderRadius: 8, padding: "8px 10px", border: `1px solid ${t.cardBorder}` }}>
                <div style={{ fontSize: 10, color: t.textMuted, marginBottom: 2 }}>Highest (90d)</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: t.text }}>$145.00</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "ebay" && (
          <div style={{ padding: "8px 12px 12px" }}>
            <SectionHeader icon="🔄" title="Cross-Marketplace" t={t} />

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 8,
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  background: t.bg,
                  borderRadius: 8,
                  padding: "10px",
                  border: `1px solid ${t.cardBorder}`,
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: 10, color: t.textMuted, fontWeight: 600, marginBottom: 6 }}>AMAZON FBA</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: t.green }}>$42.18</div>
                <div style={{ fontSize: 10, color: t.textMuted, marginTop: 2 }}>81% ROI</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: t.text, marginTop: 4 }}>$129.99</div>
                <div style={{ fontSize: 10, color: t.textDim }}>sell price</div>
              </div>
              <div
                style={{
                  background: t.bg,
                  borderRadius: 8,
                  padding: "10px",
                  border: `1px solid ${t.cardBorder}`,
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: 10, color: t.textMuted, fontWeight: 600, marginBottom: 6 }}>EBAY</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: t.green }}>$53.40</div>
                <div style={{ fontSize: 10, color: t.textMuted, marginTop: 2 }}>103% ROI</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: t.text, marginTop: 4 }}>$119.95</div>
                <div style={{ fontSize: 10, color: t.textDim }}>avg sold price</div>
              </div>
            </div>

            <div
              style={{
                background: t.greenBg,
                border: `1px solid ${t.green}30`,
                borderRadius: 8,
                padding: "10px 12px",
                marginBottom: 10,
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 700, color: t.green, marginBottom: 4 }}>✦ AI Recommendation</div>
              <div style={{ fontSize: 11, color: t.text, lineHeight: 1.5 }}>
                Sell on eBay for higher profit (+$11.22/unit). Lower sell price but significantly lower fees (13.25% vs 17% + FBA). 47 sold in last 90 days on eBay.
              </div>
            </div>

            <div style={{ background: t.bg, borderRadius: 8, padding: "8px 10px", border: `1px solid ${t.cardBorder}` }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: t.textMuted, marginBottom: 6, letterSpacing: "0.04em" }}>EBAY DETAILS</div>
              {[
                ["Avg Sold Price (90d)", "$119.95"],
                ["Sold Count (90d)", "47"],
                ["Active Listings", "23"],
                ["eBay FVF (13.25%)", "$15.89"],
                ["Processing Fee", "$3.12"],
                ["Shipping Est.", "$0.00"],
              ].map(([label, val]) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "2px 0", fontSize: 11 }}>
                  <span style={{ color: t.textMuted }}>{label}</span>
                  <span style={{ color: t.text, fontWeight: 500, fontFamily: "monospace", fontSize: 11 }}>{val}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        style={{
          padding: "6px 14px",
          borderTop: `1px solid ${t.divider}`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: t.bg,
        }}
      >
        <span style={{ fontSize: 9, color: t.textDim }}>Last updated 12s ago</span>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <div style={{ width: 5, height: 5, borderRadius: "50%", background: t.green }} />
          <span style={{ fontSize: 9, color: t.textDim }}>Live data</span>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [isDark, setIsDark] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const t = isDark ? DARK : LIGHT;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: isDark ? "#08090c" : "#e8eaee",
        padding: "24px",
        fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 20,
      }}
    >
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

      {/* Mode Toggle */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 13, color: t.textMuted, fontWeight: 600 }}>CHROME EXTENSION OVERLAY — WIREFRAME</span>
        <button
          onClick={() => setIsDark(!isDark)}
          style={{
            padding: "6px 16px",
            fontSize: 12,
            fontWeight: 700,
            background: isDark ? "#fff" : "#1a1d27",
            color: isDark ? "#1a1d27" : "#fff",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
            fontFamily: "inherit",
            letterSpacing: "0.02em",
          }}
        >
          {isDark ? "☀ Light Mode" : "🌙 Dark Mode"}
        </button>
      </div>

      {/* Context Label */}
      <div
        style={{
          background: t.surface,
          borderRadius: 10,
          padding: "8px 16px",
          border: `1px solid ${t.border}`,
          fontSize: 11,
          color: t.textMuted,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <span style={{ fontWeight: 600 }}>Simulated context:</span>
        <span>This overlay appears on Amazon product pages as a floating panel</span>
      </div>

      {/* The Overlay Panel */}
      <OverlayPanel t={t} expanded={expanded} setExpanded={setExpanded} />

      {/* Annotation */}
      <div
        style={{
          maxWidth: 380,
          background: t.surface,
          borderRadius: 10,
          padding: "12px 16px",
          border: `1px solid ${t.border}`,
          fontSize: 11,
          color: t.textMuted,
          lineHeight: 1.6,
        }}
      >
        <div style={{ fontWeight: 700, color: t.text, marginBottom: 6 }}>📐 Layout Notes</div>
        <div>
          <strong>Tabs:</strong> Overview · Offers · Alerts · History · eBay — click each to see different wireframe sections.
          <br />
          <strong>Expand:</strong> Click the arrow button in the header to toggle width.
          <br />
          <strong>Deal Score:</strong> Circular badge (0–100) with BUY/MAYBE/RISKY/PASS labels.
          <br />
          <strong>eBay tab:</strong> Side-by-side marketplace comparison with AI recommendation — the key differentiator vs SellerAmp.
        </div>
      </div>
    </div>
  );
}
