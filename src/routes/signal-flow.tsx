// src/routes/signal-flow.tsx
// Plume Studios — Signal Flow™ authenticated dashboard route
import React, { useEffect, useState } from 'react';
import { SignalFlowUnified } from '../lib/SignalFlowUnified';

const T = {
  bg: '#0a0a0a', card: '#0f0f0f', border: '#1a1a1a', border2: '#2a2a2a',
  text: '#e8e0d5', faint: '#555', muted: '#888', gold: '#C8A882', red: '#B87C7C',
  font: "'DM Sans','Helvetica Neue',sans-serif",
};

// ---------------------------------------------------------------------------
// Auth helpers
// ---------------------------------------------------------------------------

function getStoredSession(): { brandId: string; token: string } | null {
  try {
    const raw = sessionStorage.getItem('sf_session') || localStorage.getItem('sf_session');
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function clearSession() {
  sessionStorage.removeItem('sf_session');
  localStorage.removeItem('sf_session');
}

// ---------------------------------------------------------------------------
// Login form
// ---------------------------------------------------------------------------

const LoginForm: React.FC<{ onLogin: (brandId: string, token: string) => void }> = ({ onLogin }) => {
  const [brandId, setBrandId] = useState('');
  const [token, setToken]     = useState('');
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const inp: React.CSSProperties = {
    width: '100%', background: '#141414', border: `1px solid ${T.border2}`,
    borderRadius: 8, padding: '11px 14px', fontSize: 13, color: T.text,
    outline: 'none', fontFamily: T.font, boxSizing: 'border-box',
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!brandId.trim()) { setError('Brand ID is required.'); return; }
    setLoading(true);
    try {
      // Lightweight validation: confirm the API is reachable for this brand.
      const res = await fetch(`/api/signalflow/insights?brandId=${encodeURIComponent(brandId.trim())}&module=outcome`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok && res.status === 401) {
        setError('Invalid credentials. Please check your Brand ID and access token.');
        setLoading(false);
        return;
      }
      // Accept 200 or any non-401 response as valid for demo purposes.
      const session = { brandId: brandId.trim(), token: token.trim() };
      localStorage.setItem('sf_session', JSON.stringify(session));
      onLogin(session.brandId, session.token);
    } catch {
      // If the API is unreachable, allow demo access with brandId only.
      const session = { brandId: brandId.trim(), token: token.trim() };
      localStorage.setItem('sf_session', JSON.stringify(session));
      onLogin(session.brandId, session.token);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      background: T.bg, minHeight: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center', fontFamily: T.font,
    }}>
      <div style={{
        width: '100%', maxWidth: 400, background: T.card,
        border: `1px solid ${T.border}`, borderRadius: 16, padding: '36px 32px',
        color: T.text,
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 16 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: T.gold, display: 'inline-block' }} />
            <span style={{ fontSize: 10, letterSpacing: '0.2em', color: T.gold }}>PLUME STUDIOS</span>
          </div>
          <div style={{ fontSize: 26, fontWeight: 400, letterSpacing: -0.5, marginBottom: 8 }}>Signal Flow™</div>
          <div style={{ fontSize: 12, color: T.muted, lineHeight: 1.6 }}>
            Enter your Brand ID to access your intelligence dashboard.
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 10, letterSpacing: 1.5, color: T.faint, marginBottom: 8 }}>BRAND ID *</div>
            <input
              value={brandId}
              onChange={e => setBrandId(e.target.value)}
              placeholder="e.g. medik8"
              autoFocus
              style={inp}
            />
          </div>
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 10, letterSpacing: 1.5, color: T.faint, marginBottom: 8 }}>ACCESS TOKEN (optional)</div>
            <input
              type="password"
              value={token}
              onChange={e => setToken(e.target.value)}
              placeholder="Leave blank for demo access"
              style={inp}
            />
          </div>
          {error && (
            <div style={{ fontSize: 12, color: T.red, marginBottom: 16, lineHeight: 1.5 }}>{error}</div>
          )}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', background: loading ? T.border2 : T.gold,
              color: loading ? T.faint : '#0a0a0a', border: 'none',
              borderRadius: 8, padding: '13px 0', fontSize: 13, fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer', fontFamily: T.font,
              transition: 'background 0.15s',
            }}
          >
            {loading ? 'Connecting…' : 'Enter Signal Flow →'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <a href="/signalflow" style={{ fontSize: 11, color: T.faint, textDecoration: 'none' }}>
            ← Learn about Signal Flow
          </a>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Auth guard wrapper
// ---------------------------------------------------------------------------

export default function SignalFlowRoute() {
  const [session, setSession] = useState<{ brandId: string; token: string } | null | undefined>(undefined);

  useEffect(() => {
    setSession(getStoredSession());
  }, []);

  // Still resolving stored session
  if (session === undefined) {
    return (
      <div style={{
        background: T.bg, minHeight: '100vh', display: 'flex',
        alignItems: 'center', justifyContent: 'center', fontFamily: T.font,
      }}>
        <div style={{ fontSize: 11, color: T.faint, letterSpacing: 1 }}>LOADING…</div>
      </div>
    );
  }

  if (!session) {
    return (
      <LoginForm
        onLogin={(brandId, token) => setSession({ brandId, token })}
      />
    );
  }

  return (
    <div style={{ position: 'relative' }}>
      {/* Sign-out affordance */}
      <button
        onClick={() => { clearSession(); setSession(null); }}
        style={{
          position: 'fixed', bottom: 20, right: 20, zIndex: 999,
          background: T.card, border: `1px solid ${T.border2}`,
          borderRadius: 8, padding: '8px 14px', fontSize: 11,
          color: T.faint, cursor: 'pointer', fontFamily: T.font,
        }}
      >
        Sign out
      </button>
      <SignalFlowUnified brandId={session.brandId} />
    </div>
  );
}
