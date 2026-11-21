import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Check, Calendar, Target, Clock, AlertCircle } from 'lucide-react';

export default function SetupPage({ onFinish }) {
  const { profile, updateProfile } = useAuth();

  const [examDate, setExamDate] = useState(() => {
    if (profile?.examDate) {
      return new Date(profile.examDate).toISOString().split('T')[0];
    }
    const d = new Date();
    d.setMonth(d.getMonth() + 5);
    return d.toISOString().split('T')[0];
  });

  const [targetScore, setTargetScore] = useState(profile?.targetScore || 350);
  const [weekdayHours, setWeekdayHours] = useState(profile?.weekdayHours || 4);
  const [weekendHours, setWeekendHours] = useState(profile?.weekendHours || 6);

  const [subjectStrengths, setSubjectStrengths] = useState(() => {
    if (profile?.subjectStrengths) {
      return typeof profile.subjectStrengths === 'object'
        ? { ...profile.subjectStrengths }
        : {};
    }
    return {
      pharmaceutics: 'medium',
      pharmacology: 'weak',
      chemistry: 'weak',
      pharmacognosy: 'medium',
      other: 'strong'
    };
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const subjects = [
    { key: 'pharmaceutics', label: 'Pharmaceutics (Dosage Forms, Physical, NDDS)' },
    { key: 'pharmacology', label: 'Pharmacology (ANS, CVS, Chemotherapy, MOAs)' },
    { key: 'chemistry', label: 'Pharmaceutical Chemistry (Organic, Medicinal, Analysis)' },
    { key: 'pharmacognosy', label: 'Pharmacognosy (Alkaloids, Glycosides, Quality)' },
    { key: 'other', label: 'Jurisprudence & Other (Acts, Schedules, Ethics)' }
  ];

  const handleStrengthChange = (key, level) => {
    setSubjectStrengths((prev) => ({
      ...prev,
      [key]: level
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      await updateProfile({
        examDate,
        targetScore: Number(targetScore),
        weekdayHours: Number(weekdayHours),
        weekendHours: Number(weekendHours),
        subjectStrengths,
        isSetupCompleted: true
      });
      if (onFinish) onFinish();
    } catch (err) {
      setError(err.message || 'Failed to save setup. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 sm:p-8 shadow-xs">
        <div className="border-b border-slate-200 dark:border-slate-800 pb-4 mb-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Set Up Your GPAT Study Plan
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Answer a few quick questions so the app can suggest daily topics and keep your study pace on track.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* 1. Exam Date & Target Score */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center space-x-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Target Exam Date</span>
              </label>
              <input
                type="date"
                required
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#1e4d3b]"
              />
              <span className="text-[11px] text-slate-400 mt-0.5 block">National GPAT usually occurs in May/June</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center space-x-1.5">
                <Target className="w-3.5 h-3.5 text-slate-400" />
                <span>Target Score (Out of 500)</span>
              </label>
              <input
                type="number"
                min="100"
                max="500"
                required
                value={targetScore}
                onChange={(e) => setTargetScore(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#1e4d3b]"
              />
              <span className="text-[11px] text-slate-400 mt-0.5 block">Typical qualification cutoff: 140–165 marks</span>
            </div>
          </div>

          {/* 2. Daily Study Hours */}
          <div className="border-t border-slate-100 dark:border-slate-800 pt-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3 flex items-center space-x-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Available Study Hours</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Weekdays (Monday to Friday)
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="range"
                    min="1"
                    max="12"
                    step="0.5"
                    value={weekdayHours}
                    onChange={(e) => setWeekdayHours(e.target.value)}
                    className="w-full accent-[#1e4d3b]"
                  />
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200 w-16 text-right">
                    {weekdayHours} hrs
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Weekends (Saturday & Sunday)
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="range"
                    min="2"
                    max="14"
                    step="0.5"
                    value={weekendHours}
                    onChange={(e) => setWeekendHours(e.target.value)}
                    className="w-full accent-[#1e4d3b]"
                  />
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200 w-16 text-right">
                    {weekendHours} hrs
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Subject Strengths */}
          <div className="border-t border-slate-100 dark:border-slate-800 pt-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
              Subject Confidence Assessment
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              The daily study planner will prioritize your weak subjects first.
            </p>

            <div className="space-y-3">
              {subjects.map((sub) => {
                const current = subjectStrengths[sub.key] || 'medium';
                return (
                  <div
                    key={sub.key}
                    className="p-3 rounded border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
                  >
                    <span className="text-xs font-medium text-slate-800 dark:text-slate-200">
                      {sub.label}
                    </span>
                    <div className="flex items-center space-x-1.5 self-start sm:self-auto">
                      {['weak', 'medium', 'strong'].map((level) => {
                        const isSelected = current === level;
                        return (
                          <button
                            key={level}
                            type="button"
                            onClick={() => handleStrengthChange(sub.key, level)}
                            className={`px-2.5 py-1 text-xs font-medium rounded capitalize transition-colors ${
                              isSelected
                                ? level === 'weak'
                                  ? 'bg-rose-100 text-rose-800 border border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800'
                                  : level === 'medium'
                                  ? 'bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
                                  : 'bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
                            }`}
                          >
                            {level}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800 pt-5">
            <button
              type="submit"
              disabled={saving}
              className="w-full py-2.5 px-4 rounded bg-[#1e4d3b] hover:bg-[#163a2c] text-white font-medium text-sm transition-colors shadow-xs disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save & Start Studying'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

