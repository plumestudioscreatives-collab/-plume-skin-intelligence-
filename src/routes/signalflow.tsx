// src/routes/signalflow.tsx
// Plume Studios — Signal Flow™ info / marketing page
import React from 'react';

const T = {
  bg: '#0a0a0a', card: '#0f0f0f', border: '#1a1a1a', border2: '#2a2a2a',
  text: '#e8e0d5', faint: '#555', muted: '#888', gold: '#C8A882',
  green: '#7CB87C', blue: '#7C9CB8', purple: '#9C7CB8',
  font: "'DM Sans','Helvetica Neue',sans-serif",
};

const MODULES = [
  { icon: '🧬', name: 'Outcome Intelligence',   desc: 'See which treatment + product combinations drive the highest skin improvement scores across your network.' },
  { icon: '💉', name: 'Treatment Intelligence',  desc: 'Track retention, satisfaction, and rebooking rates for every treatment in your clinic.' },
  { icon: '🧴', name: 'Product Intelligence',    desc: 'Surface repurchase rates, sentiment trends, and clinical pairings for every product.' },
  { icon: '📊', name: 'Trend Intelligence',       desc: 'Identify rising concerns, declining treatments, and seasonal demand shifts before they peak.' },
  { icon: '✦',  name: 'Consumer Intelligence',   desc: 'Follow each client\'s skin journey — scans, treatments, reviews, and milestone improvements.' },
  { icon: '🔮', name: 'Predictive Intelligence', desc: 'AI-generated forecasts built from your real outcome data, not generic benchmarks.' },
  { icon: '🪞', name: 'Skin Intelligence',        desc: 'A living skin profile per client — concerns, progress scores, and protocol history.' },
  { icon: '📍', name: 'Regional Performance',    desc: 'Compare outcomes and demand signals across locations and markets.' },
  { icon: '🔁', name: 'Retention Intelligence',  desc: 'Identify churn risk, loyalty drivers, and lifetime value patterns.' },
  { icon: '🍂', name: 'Seasonal Intelligence',   desc: 'Align treatment scheduling and product stocking with seasonal skin cycles.' },
];

const Pill: React.FC<{ label: string; color?: string }> = ({ label, color = T.gold }) => (
  <span style={{
    display: 'inline-block', fontSize: 10, letterSpacing: 1.5, padding: '4px 10px',
    borderRadius: 20, border: `1px solid ${color}40`, color, background: `${color}10`,
    fontFamily: T.font,
  }}>
    {label}
  </span>
);

const ModuleCard: React.FC<{ icon: string; name: string; desc: string }> = ({ icon, name, desc }) => (
  <div style={{
    background: T.card, border: `1px solid ${T.border}`, borderRadius: 14,
    padding: '22px 24px', transition: 'border-color 0.2s',
  }}
    onMouseEnter={e => (e.currentTarget.style.borderColor = T.border2)}
    onMouseLeave={e => (e.currentTarget.style.borderColor = T.border)}
  >
    <div style={{ fontSize: 24, marginBottom: 12 }}>{icon}</div>
    <div style={{ fontSize: 13, color: T.text, fontWeight: 500, marginBottom: 8 }}>{name}</div>
    <div style={{ fontSize: 12, color: T.muted, lineHeight: 1.7 }}>{desc}</div>
  </div>
);

export default function SignalFlowInfoPage() {
  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: T.font, color: T.text }}>

      {/* Header */}
      <div style={{
        borderBottom: `1px solid ${T.border}`, padding: '18px 48px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: T.gold, display: 'inline-block' }} />
          <span style={{ fontSize: 11, letterSpacing: '0.2em', color: T.gold }}>PLUME STUDIOS</span>
        </div>
        <a
          href="/signal-flow"
          style={{
            fontSize: 12, color: '#0a0a0a', background: T.gold, border: 'none',
            borderRadius: 8, padding: '9px 20px', fontWeight: 600, cursor: 'pointer',
            textDecoration: 'none', fontFamily: T.font, letterSpacing: 0.3,
          }}
        >
          Open Signal Flow →
        </a>
      </div>

      {/* Hero */}
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '80px 48px 60px', textAlign: 'center' }}>
        <div style={{ marginBottom: 20, display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Pill label="LIVING DATA" color={T.gold} />
          <Pill label="AI-POWERED" color={T.purple} />
          <Pill label="CLINIC · BRAND · CONSUMER" color={T.blue} />
        </div>
        <h1 style={{
          fontSize: 52, fontWeight: 400, letterSpacing: -1.5, lineHeight: 1.1,
          color: T.text, marginBottom: 24,
          fontFamily: "'Playfair Display', Georgia, serif",
        }}>
          Signal Flow™
        </h1>
        <p style={{ fontSize: 16, color: T.muted, lineHeight: 1.8, maxWidth: 560, margin: '0 auto 40px' }}>
          The intelligence layer connecting treatment outcomes, product performance,
          and consumer skin journeys — powered by real clinical data and AI.
        </p>
        <a
          href="/signal-flow"
          style={{
            display: 'inline-block', fontSize: 13, color: '#0a0a0a', background: T.gold,
            borderRadius: 10, padding: '14px 32px', fontWeight: 600, cursor: 'pointer',
            textDecoration: 'none', fontFamily: T.font, letterSpacing: 0.3,
          }}
        >
          Launch Dashboard
        </a>
      </div>

      {/* Divider */}
      <div style={{ borderTop: `1px solid ${T.border}`, maxWidth: 900, margin: '0 auto' }} />

      {/* Modules grid */}
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '60px 48px' }}>
        <div style={{ fontSize: 10, letterSpacing: 2, color: T.gold, marginBottom: 10, textAlign: 'center' }}>THE 10 MODULES</div>
        <div style={{ fontSize: 26, color: T.text, fontWeight: 400, marginBottom: 40, textAlign: 'center', letterSpacing: -0.5 }}>
          Every signal, in one place.
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: 16,
        }}>
          {MODULES.map(m => <ModuleCard key={m.name} {...m} />)}
        </div>
      </div>

      {/* How it works */}
      <div style={{ borderTop: `1px solid ${T.border}` }}>
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '60px 48px', textAlign: 'center' }}>
          <div style={{ fontSize: 10, letterSpacing: 2, color: T.gold, marginBottom: 10 }}>HOW IT WORKS</div>
          <div style={{ fontSize: 26, color: T.text, fontWeight: 400, marginBottom: 40, letterSpacing: -0.5 }}>
            Three signals. One intelligence layer.
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24 }}>
            {[
              { icon: '💉', color: T.blue,   label: 'Clinic',    desc: 'Treatment outcomes, rebooking rates, and product prescriptions logged by clinicians.' },
              { icon: '🧴', color: T.green,  label: 'Brand',     desc: 'Product sentiment, repurchase rates, and clinical pairing intelligence.' },
              { icon: '✦',  color: T.gold,   label: 'Consumer',  desc: 'Real beauty lover reviews and skin journey data, verified at the point of purchase.' },
            ].map(item => (
              <div key={item.label} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: '28px 22px' }}>
                <div style={{ fontSize: 28, marginBottom: 14 }}>{item.icon}</div>
                <div style={{ fontSize: 13, color: item.color, fontWeight: 600, letterSpacing: 1, marginBottom: 10 }}>{item.label.toUpperCase()}</div>
                <div style={{ fontSize: 12, color: T.muted, lineHeight: 1.7 }}>{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <div style={{ borderTop: `1px solid ${T.border}`, textAlign: 'center', padding: '48px 48px 64px' }}>
        <div style={{ fontSize: 13, color: T.faint, marginBottom: 20 }}>Ready to explore your data?</div>
        <a
          href="/signal-flow"
          style={{
            display: 'inline-block', fontSize: 13, color: '#0a0a0a', background: T.gold,
            borderRadius: 10, padding: '14px 32px', fontWeight: 600, cursor: 'pointer',
            textDecoration: 'none', fontFamily: T.font, letterSpacing: 0.3,
          }}
        >
          Open Signal Flow →
        </a>
        <div style={{ fontSize: 11, color: T.faint, marginTop: 24 }}>
          © {new Date().getFullYear()} Plume Studios. All rights reserved.
        </div>
      </div>
    </div>
  );
}
