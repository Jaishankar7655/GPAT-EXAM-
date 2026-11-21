import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  Bell,
  Download,
  Calendar,
  Clock,
  Target,
  Moon,
  Sun,
  Shield,
  Save,
  Check
} from 'lucide-react';

export default function SettingsPage() {
  const { profile, updateProfile } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();

  const [examDate, setExamDate] = useState(() => {
    if (profile?.examDate) {
      return new Date(profile.examDate).toISOString().split('T')[0];
    }
    return '';
  });

  const [targetScore, setTargetScore] = useState(profile?.targetScore || 350);
  const [weekdayHours, setWeekdayHours] = useState(profile?.weekdayHours || 4);
  const [weekendHours, setWeekendHours] = useState(profile?.weekendHours || 6);

  const [morningReminder, setMorningReminder] = useState(profile?.reminderTimes?.morning || '07:30');
  const [eveningReminder, setEveningReminder] = useState(profile?.reminderTimes?.evening || '20:30');

  const [pushStatus, setPushStatus] = useState('unknown'); // 'unknown' | 'subscribed' | 'unsupported' | 'denied'
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Check push notification status
  useEffect(() => {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      setPushStatus('unsupported');
      return;
    }
    if (Notification.permission === 'denied') {
      setPushStatus('denied');
      return;
    }
    fetch('/api/push')
      .then((r) => r.json())
      .then((data) => {
        if (data.isSubscribed) setPushStatus('subscribed');
        else setPushStatus('not_subscribed');
      })
      .catch(() => setPushStatus('unknown'));
  }, []);

  const handleEnablePush = async () => {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      alert('Push notifications are not supported on this browser.');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setPushStatus('denied');
        alert('Notification permission was not granted.');
        return;
      }

      const resKey = await fetch('/api/push');
      const dataKey = await resKey.json();
      const registration = await navigator.serviceWorker.ready;

      // Subscribe to PushManager
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlB64ToUint8Array(dataKey.publicKey)
      });

      // Save to backend
      const resSave = await fetch('/api/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription)
      });

      if (resSave.ok) {
        setPushStatus('subscribed');
        alert('Push notifications enabled! You will receive daily plan & streak reminders.');
      }
    } catch (e) {
      console.error(e);
      alert('Could not enable push notifications: ' + e.message);
    }
  };

  const handleDisablePush = async () => {
    try {
      await fetch('/api/push', { method: 'DELETE' });
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) await sub.unsubscribe();
      setPushStatus('not_subscribed');
      alert('Push notifications disabled.');
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);

    try {
      await updateProfile({
        examDate,
        targetScore: Number(targetScore),
        weekdayHours: Number(weekdayHours),
        weekendHours: Number(weekendHours),
        reminderTimes: {
          morning: morningReminder,
          evening: eveningReminder
        }
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      alert('Error updating settings: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Export CSV Helper
  const handleExportCSV = async (type) => {
    try {
      if (type === 'sessions') {
        const res = await fetch('/api/sessions?limit=500');
        const d = await res.json();
        const rows = [
          ['Date', 'Topic', 'Duration (Mins)', 'Type', 'Notes'],
          ...d.sessions.map((s) => [
            s.date,
            `"${s.topicId?.title || 'General'}"`,
            s.durationMinutes,
            s.type,
            `"${(s.notes || '').replace(/"/g, '""')}"`
          ])
        ];
        downloadCSV(rows, 'gpat_study_sessions.csv');
      } else if (type === 'syllabus') {
        const res = await fetch('/api/syllabus');
        const d = await res.json();
        const rows = [['Subject', 'Chapter', 'Topic', 'Status', 'Confidence', 'Revision Count']];
        d.subjects.forEach((s) => {
          s.chapters.forEach((ch) => {
            ch.topics.forEach((t) => {
              rows.push([
                `"${s.name}"`,
                `"${ch.chapterName}"`,
                `"${t.title}"`,
                t.userProgress?.status || 'not_started',
                t.userProgress?.confidence || 1,
                t.userProgress?.revisionCount || 0
              ]);
            });
          });
        });
        downloadCSV(rows, 'gpat_syllabus_progress.csv');
      }
    } catch (e) {
      alert('Export failed: ' + e.message);
    }
  };

  const downloadCSV = (rows, filename) => {
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">
          Settings & Preferences
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Manage exam goals, reminder schedules, browser push alerts, and data exports.
        </p>
      </div>

      {savedSuccess && (
        <div className="p-3 rounded bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center space-x-2">
          <Check className="w-4 h-4" />
          <span>Settings saved successfully!</span>
        </div>
      )}

      {/* 1. Exam Target Settings */}
      <form onSubmit={handleSaveSettings} className="space-y-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <Target className="w-4 h-4 text-[#1e4d3b] dark:text-emerald-400" />
            <span>Target Goals</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Target Exam Date
              </label>
              <input
                type="date"
                required
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Target Score (Out of 500)
              </label>
              <input
                type="number"
                min="100"
                max="500"
                required
                value={targetScore}
                onChange={(e) => setTargetScore(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Weekday Study Hours: {weekdayHours} hrs/day
              </label>
              <input
                type="range"
                min="1"
                max="12"
                step="0.5"
                value={weekdayHours}
                onChange={(e) => setWeekdayHours(e.target.value)}
                className="w-full accent-[#1e4d3b]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Weekend Study Hours: {weekendHours} hrs/day
              </label>
              <input
                type="range"
                min="2"
                max="14"
                step="0.5"
                value={weekendHours}
                onChange={(e) => setWeekendHours(e.target.value)}
                className="w-full accent-[#1e4d3b]"
              />
            </div>
          </div>
        </div>

        {/* 2. Reminders & Push Notifications */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <Bell className="w-4 h-4 text-[#1e4d3b] dark:text-emerald-400" />
            <span>Reminders & Push Notifications</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Morning Plan Alert Time
              </label>
              <input
                type="time"
                value={morningReminder}
                onChange={(e) => setMorningReminder(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Evening Check & Quiz Alert Time
              </label>
              <input
                type="time"
                value={eveningReminder}
                onChange={(e) => setEveningReminder(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="p-3 rounded border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                Browser Push Notifications
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Receive notifications when your morning plan is ready or when your streak is at risk.
              </span>
            </div>

            {pushStatus === 'subscribed' ? (
              <button
                type="button"
                onClick={handleDisablePush}
                className="px-3 py-1.5 text-xs font-medium rounded border border-rose-300 text-rose-700 hover:bg-rose-50"
              >
                Disable
              </button>
            ) : (
              <button
                type="button"
                onClick={handleEnablePush}
                className="px-3.5 py-1.5 text-xs font-semibold rounded bg-[#1e4d3b] text-white hover:bg-[#163a2c]"
              >
                Enable Push
              </button>
            )}
          </div>
        </div>

        {/* Save Changes Button */}
        <button
          type="submit"
          disabled={saving}
          className="w-full py-2.5 rounded bg-[#1e4d3b] hover:bg-[#163a2c] text-white font-medium text-xs shadow-xs flex items-center justify-center space-x-1.5 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving...' : 'Save All Preferences'}</span>
        </button>
      </form>

      {/* 3. Export to CSV */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-xs space-y-3">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
          <Download className="w-4 h-4 text-slate-500" />
          <span>Export Study Records</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Download your complete study log or syllabus checklist for offline review in Excel/Google Sheets.
        </p>

        <div className="flex flex-wrap gap-2 pt-1">
          <button
            type="button"
            onClick={() => handleExportCSV('sessions')}
            className="px-3 py-1.5 rounded border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            Export Study Sessions (CSV)
          </button>
          <button
            type="button"
            onClick={() => handleExportCSV('syllabus')}
            className="px-3 py-1.5 rounded border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            Export Syllabus Progress (CSV)
          </button>
        </div>
      </div>
    </div>
  );
}

// Convert VAPID key
function urlB64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
