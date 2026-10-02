import React, { useState } from 'react';
import { authService } from '../services/AuthService';
import { ShieldCheck, User, Lock, AlertCircle, Radio } from 'lucide-react';
import StorageStatus from '../components/StorageStatus';

export default function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState('umpire');
  const [password, setPassword] = useState('umpire123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const session = await authService.login(username, password);
      onLoginSuccess(session);
    } catch (err) {
      setError(err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (u, p) => {
    setUsername(u);
    setPassword(p);
    setError('');
  };

  return (
    <div style={{ maxWidth: '440px', margin: '40px auto', padding: '0 16px' }}>
      <div className="card" style={{ padding: '32px 24px', boxShadow: '0 12px 36px rgba(0, 0, 0, 0.6)' }}>
        {/* Header Branding */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div
            className="logo-icon"
            style={{ width: '48px', height: '48px', margin: '0 auto 12px', borderRadius: '12px' }}
          >
            <Radio size={24} />
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff', marginBottom: '6px' }}>
            LiveCricket Login
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Choose an authorized role to access the scoring console
          </p>
          <div style={{ marginTop: '10px' }}>
            <StorageStatus />
          </div>
        </div>

        {error && (
          <div className="alert-box alert-error" style={{ marginBottom: '20px' }}>
            <AlertCircle size={20} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Username</label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: '38px' }}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
              <User size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                className="form-input"
                style={{ paddingLeft: '38px' }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <Lock size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', height: '46px', fontSize: '1rem' }}
            disabled={loading}
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        {/* Quick Role Selection Presets */}
        <div style={{ marginTop: '28px', paddingTop: '20px', borderTop: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '12px', textAlign: 'center', letterSpacing: '0.04em' }}>
            Quick Predefined Roles
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              style={{
                flexDirection: 'column',
                padding: '10px 8px',
                textAlign: 'center',
                borderColor: username === 'umpire' ? 'var(--accent-green)' : 'var(--border-color)',
                background: username === 'umpire' ? 'rgba(16, 185, 129, 0.08)' : 'var(--bg-surface)'
              }}
              onClick={() => handleQuickLogin('umpire', 'umpire123')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: 'var(--accent-green)' }}>
                <ShieldCheck size={16} /> UMPIRE
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Full Scorer (Single lock)
              </span>
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              style={{
                flexDirection: 'column',
                padding: '10px 8px',
                textAlign: 'center',
                borderColor: username === 'user' ? 'var(--accent-blue)' : 'var(--border-color)',
                background: username === 'user' ? 'rgba(59, 130, 246, 0.08)' : 'var(--bg-surface)'
              }}
              onClick={() => handleQuickLogin('user', 'user123')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: '#60a5fa' }}>
                <User size={16} /> USER
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Read-only viewer
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
