import React, { useState, useEffect } from 'react';
import { teamService } from '../services/TeamService';
import TeamList from '../components/TeamList';
import TeamForm from '../components/TeamForm';
import { Plus } from 'lucide-react';

export default function Teams() {
  const [teams, setTeams] = useState([]);
  const [editingTeam, setEditingTeam] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);

  const loadTeams = async () => {
    try {
      setLoading(true);
      const data = await teamService.getTeams();
      setTeams(data);
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to load teams.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeams();
  }, []);

  const handleSaveTeam = async (teamData) => {
    try {
      if (teamData.id) {
        await teamService.updateTeam(teamData.id, teamData);
        setFeedback({ type: 'success', message: 'Team updated successfully.' });
      } else {
        await teamService.createTeam(teamData.name, teamData.players);
        setFeedback({ type: 'success', message: 'Team created successfully.' });
      }
      setShowForm(false);
      setEditingTeam(null);
      await loadTeams();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Error saving team.' });
    }
  };

  const handleDeleteTeam = async (teamId) => {
    if (window.confirm('Are you sure you want to delete this team?')) {
      try {
        await teamService.deleteTeam(teamId);
        setFeedback({ type: 'success', message: 'Team deleted.' });
        await loadTeams();
      } catch (err) {
        setFeedback({ type: 'error', message: err.message || 'Error deleting team.' });
      }
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Teams Management</h1>
        {!showForm && (
          <button
            className="btn btn-primary"
            onClick={() => {
              setEditingTeam(null);
              setShowForm(true);
            }}
          >
            <Plus size={16} /> New Team
          </button>
        )}
      </div>

      {feedback && (
        <div className={`alert-box alert-${feedback.type}`}>
          <span>{feedback.message}</span>
        </div>
      )}

      {showForm ? (
        <TeamForm
          initialTeam={editingTeam}
          onSave={handleSaveTeam}
          onCancel={() => {
            setShowForm(false);
            setEditingTeam(null);
          }}
        />
      ) : loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
          Loading teams...
        </div>
      ) : (
        <TeamList
          teams={teams}
          onEdit={(team) => {
            setEditingTeam(team);
            setShowForm(true);
          }}
          onDelete={handleDeleteTeam}
        />
      )}
    </div>
  );
}
