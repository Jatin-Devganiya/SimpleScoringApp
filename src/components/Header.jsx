import React from 'react';
import { Trophy, Users, Settings as SettingsIcon, Radio } from 'lucide-react';
import StorageStatus from './StorageStatus';

export default function Header({ activeTab, onTabChange }) {
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
            <span>Matches</span>
          </button>

          <button
            className={`nav-link ${activeTab === 'teams' ? 'active' : ''}`}
            onClick={() => onTabChange('teams')}
          >
            <Users size={16} />
            <span>Teams</span>
          </button>

          <button
            className={`nav-link ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => onTabChange('settings')}
          >
            <SettingsIcon size={16} />
            <span>Settings</span>
          </button>

          <StorageStatus />
        </nav>
      </div>
    </header>
  );
}
