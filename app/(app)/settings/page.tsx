'use client';

import { useState, useEffect } from 'react';
import { User, Settings as SettingsIcon, MapPin, Bell, HardDrive, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSurveyStore } from '@/lib/store';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('profile');
  const profile = useSurveyStore(state => state.profile);
  const preferences = useSurveyStore(state => state.preferences);
  const updateProfile = useSurveyStore(state => state.updateProfile);
  const updatePreferences = useSurveyStore(state => state.updatePreferences);

  // Local state for profile form
  const [profileForm, setProfileForm] = useState(profile);
  const [lastProfile, setLastProfile] = useState(profile);
  
  if (profile !== lastProfile) {
    setLastProfile(profile);
    setProfileForm(profile);
  }

  const handleProfileSave = () => {
    updateProfile(profileForm);
  };

  const handleProfileDiscard = () => {
    setProfileForm(profile);
  };

  const pInitials = ((profile.firstName?.[0] || '') + (profile.lastName?.[0] || '')).toUpperCase() || 'U';

  return (
    <div className="w-full">
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 600, letterSpacing: '-0.3px', color: 'var(--text-primary)' }}>Settings</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>Manage your profile, preferences, and application settings</p>
      </div>
      
      <div className="settings-layout">
        <div className="settings-nav">
          <div 
            className={cn("settings-nav-item", activeTab === 'profile' && "active")}
            onClick={() => setActiveTab('profile')}
          >
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="6" r="3"/><path d="M2 14c0-3.3 2.7-6 6-6s6 2.7 6 6"/></svg>
            Profile
          </div>
          <div 
            className={cn("settings-nav-item", activeTab === 'preferences' && "active")}
            onClick={() => setActiveTab('preferences')}
          >
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 4h12M4 8h8M6 12h4"/></svg>
            Preferences
          </div>
          <div 
            className={cn("settings-nav-item", activeTab === 'gps' && "active")}
            onClick={() => setActiveTab('gps')}
          >
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 1l2 4H14l-3.5 3 1.5 4.5L8 10l-4 2.5 1.5-4.5L2 5h4z"/></svg>
            GPS & Location
          </div>
          <div 
            className={cn("settings-nav-item", activeTab === 'notifications' && "active")}
            onClick={() => setActiveTab('notifications')}
          >
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="3" width="14" height="10" rx="1.5"/><path d="M5 7h6M5 10h4"/></svg>
            Notifications
          </div>
          <div 
            className={cn("settings-nav-item", activeTab === 'data' && "active")}
            onClick={() => setActiveTab('data')}
          >
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 1v14M1 8h14"/></svg>
            Data & Storage
          </div>
        </div>
        
        <div className="settings-content">
          {activeTab === 'profile' && (
            <div className="settings-card">
              <div className="settings-card-header">
                <div className="settings-card-title">Researcher Profile</div>
                <div className="settings-card-desc">Your professional identity and credentials</div>
              </div>
              <div className="settings-body">
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                  <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'var(--color-forest)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 600, color: '#fff', flexShrink: 0 }}>{pInitials}</div>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>{profile.title} {profile.firstName} {profile.lastName}</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>{profile.role} · {profile.institution}</div>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">First name</label>
                    <input type="text" className="form-input" value={profileForm.firstName} onChange={e => setProfileForm({...profileForm, firstName: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Last name</label>
                    <input type="text" className="form-input" value={profileForm.lastName} onChange={e => setProfileForm({...profileForm, lastName: e.target.value})} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Title</label>
                    <select className="form-select" value={profileForm.title} onChange={e => setProfileForm({...profileForm, title: e.target.value})}>
                      <option>Dr.</option>
                      <option>Prof.</option>
                      <option>MSc.</option>
                      <option>BSc.</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Role</label>
                    <input type="text" className="form-input" value={profileForm.role} onChange={e => setProfileForm({...profileForm, role: e.target.value})} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group full">
                    <label className="form-label">Institution</label>
                    <input type="text" className="form-input" value={profileForm.institution} onChange={e => setProfileForm({...profileForm, institution: e.target.value})} />
                  </div>
                </div>
                <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  <button className="btn-ghost" onClick={handleProfileDiscard}>Discard</button>
                  <button className="btn-primary" onClick={handleProfileSave}>Save changes</button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'preferences' && (
            <div className="settings-card">
              <div className="settings-card-header">
                <div className="settings-card-title">Application Preferences</div>
                <div className="settings-card-desc">Customize how Bioveg Monitoring behaves</div>
              </div>
              <div className="settings-body">
                <div className="toggle-row">
                  <div>
                    <div className="toggle-label">Auto-sync on Wi-Fi</div>
                    <div className="toggle-desc">Automatically upload surveys when connected to Wi-Fi</div>
                  </div>
                  <Toggle checked={preferences.autoSync} onChange={(v) => updatePreferences({ autoSync: v })} />
                </div>
                <div className="toggle-row">
                  <div>
                    <div className="toggle-label">GPS continuous tracking</div>
                    <div className="toggle-desc">Keep GPS active during surveys for path recording</div>
                  </div>
                  <Toggle checked={preferences.gpsTracking} onChange={(v) => updatePreferences({ gpsTracking: v })} />
                </div>
                <div className="toggle-row">
                  <div>
                    <div className="toggle-label">Auto-sync on mobile data</div>
                    <div className="toggle-desc">Automatically upload surveys when connected to mobile networks</div>
                  </div>
                  <Toggle checked={preferences.autoSyncMobile} onChange={(v) => updatePreferences({ autoSyncMobile: v })} />
                </div>
                <div className="toggle-row">
                  <div>
                    <div className="toggle-label">Scientific name suggestions</div>
                    <div className="toggle-desc">Show auto-complete for taxonomic names during entry</div>
                  </div>
                  <Toggle checked={preferences.scientificNameSuggestions} onChange={(v) => updatePreferences({ scientificNameSuggestions: v })} />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'gps' && (
            <div className="settings-card">
              <div className="settings-card-header">
                <div className="settings-card-title">GPS & Location</div>
                <div className="settings-card-desc">Manage location tracking and accuracy</div>
              </div>
              <div className="settings-body">
                <div className="toggle-row">
                  <div>
                    <div className="toggle-label">High Accuracy Mode</div>
                    <div className="toggle-desc">Use extra battery for precise geolocation</div>
                  </div>
                  <Toggle checked={preferences.highAccuracyMode} onChange={(v) => updatePreferences({ highAccuracyMode: v })} />
                </div>
                <div className="toggle-row">
                  <div>
                    <div className="toggle-label">Background Tracking</div>
                    <div className="toggle-desc">Continue tracking position when app is minimized</div>
                  </div>
                  <Toggle checked={preferences.backgroundTracking} onChange={(v) => updatePreferences({ backgroundTracking: v })} />
                </div>
                <div className="toggle-row" style={{ alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div className="toggle-label">Coordinate Format</div>
                    <div className="toggle-desc">Choose how latitude and longitude are displayed</div>
                    <div className="mt-3">
                      <select 
                        className="form-select w-full"
                        value={preferences.coordinateFormat} 
                        onChange={e => updatePreferences({ coordinateFormat: e.target.value })}
                        title="coordinate-format"
                      >
                        <option value="DD">Decimal Degrees (DD)</option>
                        <option value="DMS">Degrees, Minutes, Seconds (DMS)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="settings-card">
              <div className="settings-card-header">
                <div className="settings-card-title">Notifications</div>
                <div className="settings-card-desc">Manage alerts and sync updates</div>
              </div>
              <div className="settings-body">
                <div style={{ padding: '20px 0', color: 'var(--text-muted)', fontSize: '13px' }}>Notification settings coming soon.</div>
              </div>
            </div>
          )}

          {activeTab === 'data' && (
            <div className="settings-card">
              <div className="settings-card-header">
                <div className="settings-card-title">Data & Storage</div>
                <div className="settings-card-desc">Manage your local storage footprint</div>
              </div>
              <div className="settings-body">
                <div className="toggle-row">
                  <div>
                    <div className="toggle-label">Backup Data</div>
                    <div className="toggle-desc">Download a complete backup of all your cached survey data locally.</div>
                  </div>
                  <button 
                    className="btn-primary" 
                    onClick={() => {
                      const data = JSON.stringify(useSurveyStore.getState().surveys, null, 2);
                      const blob = new Blob([data], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `bioveg-monitoring-backup-${new Date().toISOString().split('T')[0]}.json`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                    }}
                  >
                    Download Backup
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Toggle({ checked = false, onChange }: { checked?: boolean, onChange?: (v: boolean) => void }) {
  return (
    <div className={cn("toggle", checked && "on")} onClick={() => onChange?.(!checked)}>
      <div className="toggle-thumb" />
    </div>
  );
}
