import React, { useState, useEffect, useRef } from 'react';
import Modal from '../components/Modal';
import {
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Clock,
  PlusCircle,
  BookOpen,
  Calendar
} from 'lucide-react';

export default function TimerPage({ initialTopic }) {
  const [mode, setMode] = useState('pomodoro'); // 'stopwatch' | 'pomodoro'
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [pomodoroPhase, setPomodoroPhase] = useState('work'); // 'work' (25m) | 'break' (5m)

  // Stopwatch state
  const [stopwatchSeconds, setStopwatchSeconds] = useState(0);

  // Selected topic for tracking
  const [topics, setTopics] = useState([]);
  const [selectedTopicId, setSelectedTopicId] = useState(initialTopic?._id || '');
  const [selectedTopicTitle, setSelectedTopicTitle] = useState(initialTopic?.title || '');
  const [sessionNotes, setSessionNotes] = useState('');

  // Manual entry modal
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualMinutes, setManualMinutes] = useState(45);
  const [manualNotes, setManualNotes] = useState('');

  // Daily summary
  const [todaySummary, setTodaySummary] = useState({ todayHours: 0, todayMinutes: 0, sessions: [] });
  const [saving, setSaving] = useState(false);

  const timerRef = useRef(null);

  // Fetch topics and today's sessions on mount
  const fetchInitialData = async () => {
    try {
      const [resSyllabus, resSessions] = await Promise.all([
        fetch('/api/syllabus'),
        fetch('/api/sessions?limit=10')
      ]);

      if (resSyllabus.ok) {
        const d = await resSyllabus.json();
        const allT = [];
        d.subjects?.forEach((s) => {
          s.chapters?.forEach((ch) => {
            ch.topics?.forEach((t) => {
              allT.push({ id: t._id, title: t.title, subjectName: s.name });
            });
          });
        });
        setTopics(allT);
        if (!selectedTopicId && allT.length > 0) {
          setSelectedTopicId(allT[0].id);
          setSelectedTopicTitle(allT[0].title);
        }
      }

      if (resSessions.ok) {
        const s = await resSessions.json();
        if (s.success) {
          setTodaySummary({
            todayHours: s.todayHours || 0,
            todayMinutes: s.todayMinutes || 0,
            sessions: s.sessions || []
          });
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  // Timer Tick
  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(() => {
        if (mode === 'pomodoro') {
          setSecondsLeft((prev) => {
            if (prev <= 1) {
              // Switch pomodoro phase
              if (pomodoroPhase === 'work') {
                alert('Great job! 25-minute Pomodoro finished. Take a 5-minute break.');
                setPomodoroPhase('break');
                return 5 * 60;
              } else {
                alert('Break finished! Ready for next 25-minute focus session?');
                setPomodoroPhase('work');
                return 25 * 60;
              }
            }
            return prev - 1;
          });
        } else {
          setStopwatchSeconds((prev) => prev + 1);
        }
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isActive, mode, pomodoroPhase]);

  const handleToggleTimer = () => {
    setIsActive(!isActive);
  };

  const handleResetTimer = () => {
    setIsActive(false);
    if (mode === 'pomodoro') {
      setSecondsLeft(pomodoroPhase === 'work' ? 25 * 60 : 5 * 60);
    } else {
      setStopwatchSeconds(0);
    }
  };

  const handleSaveSession = async (minsToSave, sessionType) => {
    if (minsToSave < 1) {
      alert('Session duration must be at least 1 minute.');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topicId: selectedTopicId || undefined,
          durationMinutes: Math.round(minsToSave),
          type: sessionType,
          notes: sessionNotes || `Studied ${selectedTopicTitle || 'general topics'}`
        })
      });

      if (res.ok) {
        alert(`Logged ${Math.round(minsToSave)} minutes successfully!`);
        handleResetTimer();
        setSessionNotes('');
        fetchInitialData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (manualMinutes < 1) return;

    setSaving(true);
    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topicId: selectedTopicId || undefined,
          durationMinutes: Number(manualMinutes),
          type: 'manual',
          notes: manualNotes || 'Manual study entry'
        })
      });

      if (res.ok) {
        setIsManualModalOpen(false);
        setManualNotes('');
        fetchInitialData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  // Format MM:SS
  const formatTime = (totalSecs) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const currentDisplayTime = mode === 'pomodoro' ? formatTime(secondsLeft) : formatTime(stopwatchSeconds);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            Study Timer
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Focus without distractions. Log sessions to increase your daily preparation score.
          </p>
        </div>

        <button
          onClick={() => setIsManualModalOpen(true)}
          className="px-3.5 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-50 flex items-center space-x-1.5 self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4 text-slate-500" />
          <span>Manual Entry (Forgot timer?)</span>
        </button>
      </div>

      {/* Main Timer Display Box */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 sm:p-10 shadow-xs text-center space-y-6">
        {/* Mode Switcher */}
        <div className="inline-flex rounded-md border border-slate-200 dark:border-slate-800 p-1 bg-slate-50 dark:bg-slate-800/60">
          <button
            onClick={() => {
              setIsActive(false);
              setMode('pomodoro');
              setSecondsLeft(25 * 60);
            }}
            className={`px-4 py-1.5 text-xs font-medium rounded transition-colors ${
              mode === 'pomodoro'
                ? 'bg-white dark:bg-slate-700 text-[#1e4d3b] dark:text-emerald-300 shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
            }`}
          >
            Pomodoro (25m / 5m)
          </button>
          <button
            onClick={() => {
              setIsActive(false);
              setMode('stopwatch');
              setStopwatchSeconds(0);
            }}
            className={`px-4 py-1.5 text-xs font-medium rounded transition-colors ${
              mode === 'stopwatch'
                ? 'bg-white dark:bg-slate-700 text-[#1e4d3b] dark:text-emerald-300 shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
            }`}
          >
            Continuous Stopwatch
          </button>
        </div>

        {/* Selected Topic Picker */}
        <div className="max-w-md mx-auto text-left">
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
            Current Topic Being Studied
          </label>
          <select
            value={selectedTopicId}
            onChange={(e) => {
              setSelectedTopicId(e.target.value);
              const found = topics.find((t) => t.id === e.target.value);
              if (found) setSelectedTopicTitle(found.title);
            }}
            className="w-full px-3 py-2 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
          >
            {topics.map((t) => (
              <option key={t.id} value={t.id}>
                {t.subjectName} — {t.title}
              </option>
            ))}
          </select>
        </div>

        {/* Big Digital Display */}
        <div className="py-4 font-mono font-bold text-6xl sm:text-7xl tracking-tight text-slate-900 dark:text-white">
          {currentDisplayTime}
        </div>

        {mode === 'pomodoro' && (
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {pomodoroPhase === 'work' ? '🎯 Focus Session (25 mins)' : '☕ Short Break (5 mins)'}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-center space-x-3 pt-2">
          <button
            onClick={handleToggleTimer}
            className={`px-6 py-2.5 rounded text-sm font-semibold text-white flex items-center space-x-2 shadow-xs transition-colors ${
              isActive ? 'bg-amber-600 hover:bg-amber-700' : 'bg-[#1e4d3b] hover:bg-[#163a2c]'
            }`}
          >
            {isActive ? (
              <>
                <Pause className="w-4 h-4" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>Start Focus</span>
              </>
            )}
          </button>

          <button
            onClick={handleResetTimer}
            className="p-2.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50"
            title="Reset timer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* If stopwatch has time, allow saving */}
          {mode === 'stopwatch' && stopwatchSeconds >= 60 && (
            <button
              onClick={() => handleSaveSession(stopwatchSeconds / 60, 'timer')}
              disabled={saving}
              className="px-4 py-2.5 rounded bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-xs"
            >
              Save ({Math.round(stopwatchSeconds / 60)}m)
            </button>
          )}

          {/* If pomodoro finished or partial */}
          {mode === 'pomodoro' && secondsLeft < 24 * 60 && (
            <button
              onClick={() => handleSaveSession((25 * 60 - secondsLeft) / 60, 'pomodoro')}
              disabled={saving}
              className="px-4 py-2.5 rounded border border-emerald-600 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-xs font-semibold"
            >
              Log Elapsed Time
            </button>
          )}
        </div>
      </div>

      {/* Planned vs Actual Hours Comparison */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-xs">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-2">
          Today's Study Progress
        </h2>
        <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 mb-2">
          <span>Actual Logged: <strong>{todaySummary.todayHours}h</strong> ({todaySummary.todayMinutes} mins)</span>
          <span>Target: <strong>4.0h</strong></span>
        </div>
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
          <div
            className="bg-[#1e4d3b] h-full rounded-full transition-all duration-300"
            style={{ width: `${Math.min(100, (todaySummary.todayHours / 4.0) * 100)}%` }}
          ></div>
        </div>
      </div>

      {/* Today's Logged Sessions List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-xs">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
          Recent Study Sessions
        </h2>

        {todaySummary.sessions.length === 0 ? (
          <p className="text-xs text-slate-500 py-4 text-center">
            No study sessions recorded yet today. Click 'Start Focus' above to begin!
          </p>
        ) : (
          <div className="space-y-2">
            {todaySummary.sessions.map((s) => (
              <div
                key={s._id}
                className="p-3 rounded border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                    {s.topicId?.title || 'General GPAT Study'}
                  </span>
                  <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                    {s.type.toUpperCase()} • {s.notes || 'Focused study'}
                  </span>
                </div>
                <div className="font-bold text-slate-900 dark:text-white">
                  {s.durationMinutes} mins
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Manual Entry Modal */}
      <Modal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        title="Log Offline Study Session"
      >
        <form onSubmit={handleManualSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Select Topic
            </label>
            <select
              value={selectedTopicId}
              onChange={(e) => setSelectedTopicId(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              {topics.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.subjectName} — {t.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Duration Studied (Minutes)
            </label>
            <input
              type="number"
              min="5"
              max="600"
              required
              value={manualMinutes}
              onChange={(e) => setManualMinutes(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Notes (What chapters or problems did you solve?)
            </label>
            <textarea
              rows={3}
              value={manualNotes}
              onChange={(e) => setManualNotes(e.target.value)}
              placeholder="e.g. Read Physical Pharmacy chapter on Micromeritics from Martin's"
              className="w-full px-3 py-2 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div className="pt-2 flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsManualModalOpen(false)}
              className="px-3 py-1.5 text-xs rounded border border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-3.5 py-1.5 text-xs rounded bg-[#1e4d3b] text-white hover:bg-[#163a2c] font-medium"
            >
              {saving ? 'Logging...' : 'Log Time'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
