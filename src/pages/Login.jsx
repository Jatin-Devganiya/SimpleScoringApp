import React, { useState } from 'react';
import { authService } from '../services/AuthService';
import { ShieldCheck, User, Lock, AlertCircle, Radio, UserPlus, LogIn, ArrowRight } from 'lucide-react';
import StorageStatus from '../components/StorageStatus';
import { ROLES } from '../config/authConfig';

export default function Login({ onLoginSuccess }) {
  const [mode, setMode] = useState('signin'); // 'signin' | 'register'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState(ROLES.UMPIRE);
  const [error, setError] = useState('');
  const [canTakeover, setCanTakeover] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setCanTakeover(false);
    setLoading(true);

    try {
      let session;
      if (mode === 'register') {
        session = await authService.register(username, password, role);
      } else {
        session = await authService.login(username, password);
      }
      onLoginSuccess(session);
    } catch (err) {
      setError(err.message || 'Authentication failed.');
      if (err.canForceTakeover) {
        setCanTakeover(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForceTakeover = async () => {
    setError('');
    setLoading(true);
    try {
      const session = await authService.login(username, password, { force: true });
      onLoginSuccess(session);
    } catch (err) {
      setError(err.message || 'Takeover failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '440px', margin: '40px auto', padding: '0 16px' }}>
      <div className="card" style={{ padding: '32px 24px', boxShadow: '0 12px 36px rgba(0, 0, 0, 0.6)' }}>
        {/* Header Branding */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div
            className="logo-icon"
            style={{ width: '48px', height: '48px', margin: '0 auto 12px', borderRadius: '12px' }}
          >
            <Radio size={24} />
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff', marginBottom: '6px' }}>
            LiveCricket
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            {mode === 'signin' ? 'Sign in with your credentials' : 'Create a new account'}
          </p>
          <div style={{ marginTop: '10px' }}>
            <StorageStatus />
          </div>
        </div>

        {/* Tab Switcher: Sign In vs Register */}
        <div
          style={{
            display: 'flex',
            background: 'var(--bg-surface-elevated)',
            padding: '4px',
            borderRadius: 'var(--radius-md)',
            marginBottom: '20px'
          }}
        >
          <button
            type="button"
            style={{
              flex: 1,
              padding: '8px 12px',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              background: mode === 'signin' ? 'var(--bg-surface)' : 'transparent',
              color: mode === 'signin' ? 'var(--text-primary)' : 'var(--text-muted)',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.2s ease'
            }}
            onClick={() => {
              setMode('signin');
              setError('');
              setCanTakeover(false);
            }}
          >
            <LogIn size={15} /> Sign In
          </button>
          <button
            type="button"
            style={{
              flex: 1,
              padding: '8px 12px',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              background: mode === 'register' ? 'var(--bg-surface)' : 'transparent',
              color: mode === 'register' ? 'var(--text-primary)' : 'var(--text-muted)',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.2s ease'
            }}
            onClick={() => {
              setMode('register');
              setError('');
              setCanTakeover(false);
            }}
          >
            <UserPlus size={15} /> Register
          </button>
        </div>

        {error && (
          <div className="alert-box alert-error" style={{ marginBottom: '20px' }}>
            <AlertCircle size={20} style={{ flexShrink: 0 }} />
            <div style={{ width: '100%' }}>
              <div>{error}</div>
              {canTakeover && (
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ marginTop: '10px', width: '100%', fontSize: '0.85rem', padding: '8px 12px' }}
                  onClick={handleForceTakeover}
                  disabled={loading}
                >
                  <ArrowRight size={14} /> Take Over Session & Sign In
                </button>
              )}
            </div>
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
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoFocus
              />
              <User size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: mode === 'register' ? '16px' : '24px' }}>
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                className="form-input"
                style={{ paddingLeft: '38px' }}
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <Lock size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
            </div>
          </div>

          {/* Role selection only on Register */}
          {mode === 'register' && (
            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label className="form-label">Account Role</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{
                    padding: '10px 8px',
                    flexDirection: 'column',
                    borderColor: role === ROLES.UMPIRE ? 'var(--accent-green)' : 'var(--border-color)',
                    background: role === ROLES.UMPIRE ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-surface)'
                  }}
                  onClick={() => setRole(ROLES.UMPIRE)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: 'var(--accent-green)' }}>
                    <ShieldCheck size={16} /> UMPIRE
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Full Scorer (Own Data)
                  </span>
                </button>

                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{
                    padding: '10px 8px',
                    flexDirection: 'column',
                    borderColor: role === ROLES.USER ? 'var(--accent-blue)' : 'var(--border-color)',
                    background: role === ROLES.USER ? 'rgba(59, 130, 246, 0.1)' : 'var(--bg-surface)'
                  }}
                  onClick={() => setRole(ROLES.USER)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: '#60a5fa' }}>
                    <User size={16} /> USER
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Spectator (View only)
                  </span>
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', height: '46px', fontSize: '1rem' }}
            disabled={loading}
          >
            {loading ? 'Please wait...' : mode === 'signin' ? 'Sign In' : 'Create Account & Sign In'}
          </button>
        </form>

        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          {mode === 'signin' ? (
            <button
              type="button"
              style={{ background: 'none', border: 'none', color: 'var(--accent-green)', cursor: 'pointer', fontSize: '0.85rem' }}
              onClick={() => {
                setMode('register');
                setError('');
              }}
            >
              Don't have an account? <strong>Register now</strong>
            </button>
          ) : (
            <button
              type="button"
              style={{ background: 'none', border: 'none', color: 'var(--accent-blue)', cursor: 'pointer', fontSize: '0.85rem' }}
              onClick={() => {
                setMode('signin');
                setError('');
              }}
            >
              Already have an account? <strong>Sign In</strong>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

