import React from 'react';
import { Trophy, Users, User, Settings as SettingsIcon, Radio, ShieldCheck, LogOut } from 'lucide-react';
import StorageStatus from './StorageStatus';
import { ROLES } from '../config/authConfig';

export default function Header({ activeTab, onTabChange, currentUser, onLogout }) {
  const isUmpire = currentUser?.role === ROLES.UMPIRE;

  return (
    <header className="app-header">
      <div className="header-content">
        <div className="logo-area" onClick={() => onTabChange('matches')}>
          <div className="logo-icon">
            <Radio size={18} />
          </div>
          <div className="logo-text">LiveCricket</div>
        </div>

        <nav className="header-nav">
          <button
            className={`nav-link ${activeTab === 'matches' || activeTab === 'live' || activeTab === 'scorecard' ? 'active' : ''}`}
            onClick={() => onTabChange('matches')}
          >
            <Trophy size={16} />
            <span className="nav-label">Matches</span>
          </button>

          <button
            className={`nav-link ${activeTab === 'teams' ? 'active' : ''}`}
            onClick={() => onTabChange('teams')}
          >
            <Users size={16} />
            <span className="nav-label">Teams</span>
          </button>

          <button
            className={`nav-link ${activeTab === 'players' ? 'active' : ''}`}
            onClick={() => onTabChange('players')}
          >
            <User size={16} />
            <span className="nav-label">Players</span>
          </button>

          {isUmpire && (
            <button
              className={`nav-link ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => onTabChange('settings')}
            >
              <SettingsIcon size={16} />
              <span className="nav-label">Settings</span>
            </button>
          )}
        </nav>

        <div className="header-actions">
          <StorageStatus />

          {/* User Session Info & Logout */}
          {currentUser && (
            <div className="header-user-section">
              <span className={`user-role-badge ${isUmpire ? 'role-umpire' : 'role-user'}`} title={`Logged in as ${currentUser.username}`}>
                {isUmpire ? <ShieldCheck size={13} /> : <User size={13} />}
                <span>{currentUser.role}</span>
              </span>

              <button
                className="btn-logout"
                onClick={onLogout}
                title="Logout"
              >
                <LogOut size={14} />
                <span className="logout-text">Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
