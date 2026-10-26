import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import API from '../services/api';
import toast from 'react-hot-toast';
import {
  Settings as SettingsIcon,
  Bell,
  Lock,
  Moon,
  Sun,
  Shield,
  Save,
} from 'lucide-react';

export const SettingsPage = () => {
  const { user, updateUser } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  // Notification preferences
  const [notifPrefs, setNotifPrefs] = useState({
    email: user?.notificationPreferences?.email ?? true,
    matches: user?.notificationPreferences?.matches ?? true,
    messages: user?.notificationPreferences?.messages ?? true,
    sessions: user?.notificationPreferences?.sessions ?? true,
    community: user?.notificationPreferences?.community ?? true,
  });

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPass, setChangingPass] = useState(false);

  const handleSavePreferences = async () => {
    try {
      const res = await API.put('/profile', {
        notificationPreferences: notifPrefs,
      });
      updateUser(res.data.user);
      toast.success('Preferences updated!');
    } catch (err) {
      toast.error('Failed to update preferences');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    setChangingPass(true);
    try {
      await API.post('/profile/change-password', {
        currentPassword,
        newPassword,
      });
      toast.success('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Password update failed');
    } finally {
      setChangingPass(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Settings | Connect Skill</title>
      </Helmet>

      <div className="pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center space-x-2">
            <SettingsIcon className="w-7 h-7 text-brand-500" />
            <span>Account & Preferences</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage your account security, notification alerts, and theme preferences.
          </p>
        </div>

        {/* Theme Settings Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
          <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center space-x-2">
            {isDark ? <Moon className="w-4 h-4 text-amber-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
            <span>Appearance & Theme</span>
          </h3>
          <p className="text-xs text-slate-500">
            Choose between crisp daylight styling or high-contrast night aesthetics.
          </p>
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => {
                if (isDark) toggleTheme();
              }}
              className={`flex-1 py-3 rounded-2xl border text-xs font-bold flex items-center justify-center space-x-2 ${
                !isDark
                  ? 'border-brand-500 bg-brand-50/50 text-brand-700 shadow-sm'
                  : 'border-slate-200 dark:border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Sun className="w-4 h-4" />
              <span>Light Mode</span>
            </button>
            <button
              onClick={() => {
                if (!isDark) toggleTheme();
              }}
              className={`flex-1 py-3 rounded-2xl border text-xs font-bold flex items-center justify-center space-x-2 ${
                isDark
                  ? 'border-brand-500 bg-brand-950/60 text-brand-400 shadow-sm'
                  : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-900'
              }`}
            >
              <Moon className="w-4 h-4" />
              <span>Dark Mode</span>
            </button>
          </div>
        </div>

        {/* Notification Preferences */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center space-x-2">
                <Bell className="w-4 h-4 text-brand-500" />
                <span>Notification Preferences</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Control which notifications trigger alerts</p>
            </div>
            <button
              onClick={handleSavePreferences}
              className="px-4 py-1.5 rounded-full bg-slate-900 text-white dark:bg-brand-500 font-bold text-xs shadow-sm flex items-center space-x-1"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save</span>
            </button>
          </div>

          <div className="space-y-3 pt-2 divide-y divide-slate-100 dark:divide-slate-800">
            {[
              { key: 'matches', label: 'New AI Match Recommendations', desc: 'Alert when a high-compatibility peer registers' },
              { key: 'messages', label: 'Direct Messages & Chat Alerts', desc: 'Real-time notifications for incoming peer chats' },
              { key: 'sessions', label: 'Session Confirmations & Reminders', desc: 'Reminders 1 hour before scheduled video rooms' },
              { key: 'community', label: 'Community Guild Activity', desc: 'Replies to your posts and challenge announcements' },
              { key: 'email', label: 'Email Digest', desc: 'Weekly summary of progress and earned Skill Points' },
            ].map((item) => (
              <div key={item.key} className="pt-3 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200">{item.label}</h4>
                  <p className="text-[11px] text-slate-400">{item.desc}</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifPrefs[item.key]}
                  onChange={(e) =>
                    setNotifPrefs({ ...notifPrefs, [item.key]: e.target.checked })
                  }
                  className="w-4 h-4 rounded text-brand-500 focus:ring-brand-500 cursor-pointer"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Change Password */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
          <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center space-x-2">
            <Lock className="w-4 h-4 text-brand-500" />
            <span>Security & Password</span>
          </h3>

          <form onSubmit={handleChangePassword} className="space-y-3 max-w-md text-xs">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Current Password
              </label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                New Password (min 6 chars)
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={changingPass}
              className="px-5 py-2 rounded-pill bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-bold shadow-sm"
            >
              {changingPass ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
};
export default SettingsPage;
