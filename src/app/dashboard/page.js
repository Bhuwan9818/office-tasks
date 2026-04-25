'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

const USER_COLORS = {
  aman: { color: '#5b8dee', dim: 'rgba(91,141,238,0.12)', dark: 'rgba(91,141,238,0.08)' },
  anjali: { color: '#3ecf8e', dim: 'rgba(62,207,142,0.12)', dark: 'rgba(62,207,142,0.08)' },
  bhuwan: { color: '#f5a623', dim: 'rgba(245,166,35,0.12)', dark: 'rgba(245,166,35,0.08)' },
};

function UserBadge({ name, size = 'md', pulse = false }) {
  const c = USER_COLORS[name] || { color: '#888', dim: 'rgba(136,136,136,0.12)' };
  const sz = size === 'lg' ? { w: 60, h: 60, f: 14 } : size === 'sm' ? { w: 40, h: 40, f: 12 } : { w: 50, h: 50, f: 10 };
  return (
    <div
      style={{
        width: sz.w,
        height: sz.h,
        borderRadius: '50%',
        background: c.dim,
        border: `2px solid ${c.color}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: sz.f,
        fontWeight: '700',
        color: c.color,
        flexShrink: 0,
        animation: pulse ? 'pulse-ring 2s infinite' : 'none',
        fontFamily: 'DM Mono, monospace',
      }}
    >
      {name}
    </div>
  );
}

function Notification({ n }) {
  const styles = {
    warning: { bg: 'var(--amber-dim)', border: 'var(--amber)', color: 'var(--amber)' },
    info: { bg: 'rgba(107,107,128,0.1)', border: 'var(--border)', color: 'var(--text-muted)' },
    action: { bg: 'var(--accent-dim)', border: 'var(--accent)', color: 'var(--accent)' },
  };
  const s = styles[n.type] || styles.info;
  return (
    <div
      className="fade-in"
      style={{
        background: s.bg,
        border: `1px solid ${s.border}`,
        borderRadius: '10px',
        padding: '10px 14px',
        fontSize: '13px',
        color: s.color,
        fontWeight: '500',
      }}
    >
      {n.message}
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [toast, setToast] = useState(null);
  const [error, setError] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchStatus = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch('/api/status');
      if (res.status === 401) {
        router.push('/');
        return;
      }
      if (!res.ok) throw new Error('Failed to load status');
      const data = await res.json();
      setStatus(data);
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchStatus();
    // Poll every 15 seconds
    const interval = setInterval(() => fetchStatus(true), 15000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  async function handleWash() {
    setActionLoading('wash');
    try {
      const res = await fetch('/api/wash', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Failed to mark washed', 'error');
      } else {
        showToast('✅ Bottle marked as washed!');
        fetchStatus(true);
      }
    } catch {
      showToast('Network error', 'error');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleFill() {
    setActionLoading('fill');
    try {
      const res = await fetch('/api/fill', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Failed to log fill', 'error');
      } else {
        showToast(`💧 Fill #${data.orderIndex} logged!`);
        fetchStatus(true);
      }
    } catch {
      showToast('Network error', 'error');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleLogout() {
    await fetch('/api/logout', { method: 'POST' });
    router.push('/');
  }

  if (loading && !status) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <div
          style={{
            width: '40px',
            height: '40px',
            border: '3px solid var(--border)',
            borderTopColor: 'var(--accent)',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }}
        />
        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Loading...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error && !status) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: 'var(--red)' }}>Error: {error}</p>
          <button className="btn btn-ghost" onClick={() => fetchStatus()} style={{ marginTop: '12px' }}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (status?.isSundayOff) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'var(--bg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: '0',
          padding: '20px',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: '80px',
            height: '80px',
            borderRadius: '20px',
            background: 'rgba(245,166,35,0.1)',
            border: '1px solid rgba(245,166,35,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '36px',
            marginBottom: '24px',
          }}
        >
          🌴
        </div>
        <h1 style={{ fontSize: '28px', fontWeight: '800', margin: '0 0 8px', letterSpacing: '-0.02em' }}>
          Sunday Off!
        </h1>
        <p style={{ color: 'var(--text-muted)', margin: '0 0 32px', fontSize: '15px' }}>
          No tasks today. The app resumes Monday.
        </p>
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '14px 24px',
            marginBottom: '24px',
          }}
        >
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace' }}>
            Logged in as{' '}
            <span style={{ color: USER_COLORS[status.currentUser?.name]?.color, fontWeight: '700' }}>
              {status.currentUser?.name}
            </span>
            {' '}· {status.today}
          </p>
        </div>
        <button onClick={handleLogout} className="btn btn-ghost" style={{ fontSize: '14px' }}>
          Sign Out
        </button>
      </div>
    );
  }


  const isMyTurnToWash = status?.currentUser?.name === status?.washer?.name;
  const isMyTurnToFill = status?.currentUser?.name === status?.nextFillUser;
  const currentUserName = status?.currentUser?.name;
  const uc = USER_COLORS[currentUserName] || {};

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        padding: '0',
        position: 'relative',
      }}
    >
      {/* Background grid */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(91,141,238,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(91,141,238,0.025) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
          pointerEvents: 'none',
        }}
      />

      {/* Toast */}
      {toast && (
        <div
          className="fade-in"
          style={{
            position: 'fixed',
            top: '16px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 999,
            background: toast.type === 'error' ? 'var(--red)' : '#1e2a1a',
            border: `1px solid ${toast.type === 'error' ? '#f24c4c' : 'var(--green)'}`,
            color: toast.type === 'error' ? 'white' : 'var(--green)',
            padding: '10px 20px',
            borderRadius: '100px',
            fontSize: '14px',
            fontWeight: '600',
            boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
            whiteSpace: 'nowrap',
          }}
        >
          {toast.msg}
        </div>
      )}

      <div style={{ maxWidth: '480px', margin: '0 auto', padding: '16px', position: 'relative' }}>
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '20px',
            padding: '4px 0',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <UserBadge name={currentUserName} size="md" />
            <div>
              <p style={{ margin: 0, fontWeight: '700', fontSize: '16px' }}>{currentUserName}</p>
              <p
                style={{
                  margin: 0,
                  fontSize: '11px',
                  color: 'var(--text-muted)',
                  fontFamily: 'DM Mono, monospace',
                }}
              >
                {status?.dayName} · {status?.today}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              onClick={() => fetchStatus(true)}
              className="btn btn-ghost"
              style={{ padding: '8px 12px', fontSize: '13px' }}
              disabled={loading}
            >
              ↻
            </button>
            <button
              onClick={handleLogout}
              className="btn btn-ghost"
              style={{ padding: '8px 14px', fontSize: '13px' }}
            >
              Out
            </button>
          </div>
        </div>

        {/* Notifications */}
        {status?.notifications?.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
            {status.notifications.map((n, i) => (
              <Notification key={i} n={n} />
            ))}
          </div>
        )}

        {/* Wash Card */}
        <div
          className="card slide-up"
          style={{
            marginBottom: '12px',
            background: status?.isWashed ? 'var(--green-dim)' : 'var(--surface)',
            borderColor: status?.isWashed ? 'rgba(62,207,142,0.3)' : 'var(--border)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: status?.isWashed ? 'var(--green-dim)' : 'var(--surface-2)',
                  border: `1px solid ${status?.isWashed ? 'rgba(62,207,142,0.3)' : 'var(--border)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '22px',
                }}
              >
                {status?.isWashed ? '✅' : '🧼'}
              </div>
              <div>
                <p
                  style={{
                    margin: 0,
                    fontWeight: '700',
                    fontSize: '15px',
                    color: status?.isWashed ? 'var(--green)' : 'var(--text)',
                  }}
                >
                  Bottle Wash
                </p>
                <p
                  style={{
                    margin: 0,
                    fontSize: '12px',
                    color: 'var(--text-muted)',
                    fontFamily: 'DM Mono, monospace',
                    marginTop: '2px',
                  }}
                >
                  {status?.isWashed
                    ? `Washed by ${status.washer?.name}`
                    : `Assigned to ${status?.washer?.name}`}
                </p>
              </div>
            </div>

            <button
              className="btn btn-green"
              onClick={handleWash}
              disabled={!isMyTurnToWash || status?.isWashed || actionLoading === 'wash'}
              style={{
                padding: '10px 16px',
                fontSize: '13px',
                opacity: status?.isWashed ? 0.5 : isMyTurnToWash ? 1 : 0.35,
              }}
            >
              {actionLoading === 'wash' ? '...' : status?.isWashed ? 'Done ✓' : 'Washed'}
            </button>
          </div>

          {!isMyTurnToWash && !status?.isWashed && (
            <p
              style={{
                margin: '12px 0 0',
                fontSize: '12px',
                color: 'var(--text-muted)',
                padding: '8px 12px',
                background: 'var(--surface-2)',
                borderRadius: '8px',
              }}
            >
              Waiting for <strong style={{ color: USER_COLORS[status?.washer?.name]?.color }}>{status?.washer?.name}</strong> to wash the bottle
            </p>
          )}
        </div>

        {/* Fill Turn Card */}
        <div className="card slide-up" style={{ marginBottom: '12px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px',
            }}
          >
            <div>
              <p style={{ margin: 0, fontWeight: '700', fontSize: '15px' }}>Water Filling</p>
              <p
                style={{
                  margin: 0,
                  fontSize: '12px',
                  color: 'var(--text-muted)',
                  fontFamily: 'DM Mono, monospace',
                  marginTop: '2px',
                }}
              >
                {status?.fillCount || 0} fills today
              </p>
            </div>
            <div
              style={{
                background: 'var(--accent-dim)',
                border: '1px solid rgba(91,141,238,0.3)',
                borderRadius: '8px',
                padding: '6px 12px',
                fontSize: '12px',
                color: 'var(--accent)',
                fontFamily: 'DM Mono, monospace',
                fontWeight: '600',
              }}
            >
              Next: {status?.nextFillUser}
            </div>
          </div>

          {/* Rotation display */}
          <div
            style={{
              display: 'flex',
              gap: '8px',
              marginBottom: '16px',
              padding: '12px',
              background: 'var(--surface-2)',
              borderRadius: '10px',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {['aman', 'anjali', 'bhuwan'].map((name, i) => {
              const isNext = name === status?.nextFillUser;
              const c = USER_COLORS[name];
              return (
                <div key={name} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <UserBadge name={name} size={isNext ? 'lg' : 'md'} pulse={isNext} />
                    {isNext && (
                      <span
                        style={{
                          fontSize: '10px',
                          color: c.color,
                          fontFamily: 'DM Mono, monospace',
                          fontWeight: '600',
                        }}
                      >
                        NEXT
                      </span>
                    )}
                  </div>
                  {i < 2 && (
                    <span style={{ color: 'var(--border)', fontSize: '18px', marginBottom: isNext ? '18px' : '0' }}>→</span>
                  )}
                </div>
              );
            })}
          </div>

          <button
            className="btn btn-primary"
            onClick={handleFill}
            disabled={!isMyTurnToFill || actionLoading === 'fill'}
            style={{ width: '100%' }}
          >
            {actionLoading === 'fill' ? (
              'Logging...'
            ) : isMyTurnToFill ? (
              '💧 Fill Water — It\'s My Turn!'
            ) : (
              `💧 Waiting for ${status?.nextFillUser}`
            )}
          </button>
        </div>

        {/* Fill History */}
        <div className="card slide-up">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '14px',
            }}
          >
            <p style={{ margin: 0, fontWeight: '700', fontSize: '15px' }}>Fill History</p>
            <span
              style={{
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                borderRadius: '100px',
                padding: '3px 10px',
                fontSize: '12px',
                color: 'var(--text-muted)',
                fontFamily: 'DM Mono, monospace',
              }}
            >
              {status?.fillCount || 0} total
            </span>
          </div>

          {!status?.fills || status.fills.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '24px',
                color: 'var(--text-muted)',
                fontSize: '14px',
                background: 'var(--surface-2)',
                borderRadius: '10px',
              }}
            >
              <span style={{ fontSize: '24px', display: 'block', marginBottom: '8px' }}>🫗</span>
              No fills yet today
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              {status.fills.map((fill, i) => {
                const c = USER_COLORS[fill.userName] || {};
                const time = new Date(fill.filledAt).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                });
                const isMe = fill.userName === currentUserName;
                return (
                  <div
                    key={fill.orderIndex}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px 0',
                      borderBottom: i < status.fills.length - 1 ? '1px solid var(--border)' : 'none',
                    }}
                  >
                    {/* Timeline dot */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          background: c.dim,
                          border: `2px solid ${c.color}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '11px',
                          fontWeight: '700',
                          color: c.color,
                          fontFamily: 'DM Mono, monospace',
                          flexShrink: 0,
                        }}
                      >
                        {fill.orderIndex}
                      </div>
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          margin: 0,
                          fontWeight: '600',
                          fontSize: '14px',
                          color: isMe ? c.color : 'var(--text)',
                        }}
                      >
                        {fill.userName}
                        {isMe && (
                          <span
                            style={{
                              marginLeft: '6px',
                              fontSize: '10px',
                              color: c.color,
                              fontFamily: 'DM Mono, monospace',
                            }}
                          >
                            (you)
                          </span>
                        )}
                      </p>
                    </div>

                    <p
                      style={{
                        margin: 0,
                        fontSize: '12px',
                        color: 'var(--text-muted)',
                        fontFamily: 'DM Mono, monospace',
                        flexShrink: 0,
                      }}
                    >
                      {time}
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          {/* Upcoming fills preview */}
          {status?.fills && status.fills.length > 0 && (
            <div
              style={{
                marginTop: '14px',
                padding: '10px 12px',
                background: 'var(--surface-2)',
                borderRadius: '8px',
              }}
            >
              <p
                style={{
                  margin: '0 0 8px',
                  fontSize: '11px',
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  fontFamily: 'DM Mono, monospace',
                  fontWeight: '600',
                }}
              >
                Upcoming rotation
              </p>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {[0, 1, 2].map((offset) => {
                  const users = ['aman', 'anjali', 'bhuwan'];
                  const washerIdx = users.indexOf(status.washer?.name);
                  const nextIdx = (washerIdx + status.fillCount + offset) % 3;
                  const name = users[nextIdx];
                  const c = USER_COLORS[name];
                  return (
                    <span
                      key={offset}
                      style={{
                        padding: '3px 10px',
                        borderRadius: '100px',
                        background: offset === 0 ? c.dim : 'transparent',
                        border: `1px solid ${offset === 0 ? c.color : 'var(--border)'}`,
                        color: offset === 0 ? c.color : 'var(--text-muted)',
                        fontSize: '12px',
                        fontFamily: 'DM Mono, monospace',
                        fontWeight: '600',
                      }}
                    >
                      {offset === 0 ? '→ ' : ''}{name}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <p
          style={{
            textAlign: 'center',
            fontSize: '11px',
            color: 'var(--text-muted)',
            marginTop: '20px',
            fontFamily: 'DM Mono, monospace',
          }}
        >
          Auto-refreshes every 15s · {status?.today}
        </p>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse-ring {
          0% { box-shadow: 0 0 0 0 rgba(91,141,238,0.5); }
          70% { box-shadow: 0 0 0 10px rgba(91,141,238,0); }
          100% { box-shadow: 0 0 0 0 rgba(91,141,238,0); }
        }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slide-up { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
