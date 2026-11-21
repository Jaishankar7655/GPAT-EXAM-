import React, { useState, useEffect } from 'react';
import LoadingSkeleton from '../components/LoadingSkeleton';
import EmptyState from '../components/EmptyState';
import { AlertCircle, CheckCircle, Search, Trash2, Edit3, Save } from 'lucide-react';

export default function MistakeNotebookPage() {
  const [loading, setLoading] = useState(true);
  const [mistakes, setMistakes] = useState([]);
  const [filter, setFilter] = useState('unreviewed'); // 'unreviewed' | 'reviewed' | 'all'
  const [search, setSearch] = useState('');
  const [reflectionInputs, setReflectionInputs] = useState({});
  const [savingId, setSavingId] = useState(null);

  const fetchMistakes = async (f = filter) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/mistakes?filter=${f}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setMistakes(data.mistakes || []);
          const reflections = {};
          data.mistakes.forEach((m) => {
            reflections[m._id] = m.userReflection || '';
          });
          setReflectionInputs(reflections);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMistakes(filter);
  }, [filter]);

  const handleToggleReviewed = async (id, currentReviewed) => {
    try {
      const res = await fetch(`/api/mistakes?id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isReviewed: !currentReviewed })
      });
      if (res.ok) {
        fetchMistakes(filter);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveReflection = async (id) => {
    setSavingId(id);
    try {
      const res = await fetch(`/api/mistakes?id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userReflection: reflectionInputs[id] })
      });
      if (res.ok) {
        alert('Reflection saved in your mistake notebook!');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingId(null);
    }
  };

  const handleDeleteMistake = async (id) => {
    if (!window.confirm('Delete this mistake entry?')) return;
    try {
      const res = await fetch(`/api/mistakes?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setMistakes((prev) => prev.filter((m) => m._id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredList = mistakes.filter((m) => {
    if (!search.trim()) return true;
    return (
      m.questionText.toLowerCase().includes(search.toLowerCase()) ||
      m.subjectName.toLowerCase().includes(search.toLowerCase()) ||
      m.topicTitle.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <span>Mistake Notebook</span>
            <span className="text-xs px-2 py-0.5 rounded bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 font-semibold">
              Auto-Saved
            </span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Wrong answers from practice tests are automatically recorded here so you can analyze why you made the mistake.
          </p>
        </div>

        {/* Filter Switcher */}
        <div className="inline-flex rounded-md border border-slate-200 dark:border-slate-800 p-1 bg-white dark:bg-slate-900 self-start sm:self-auto">
          {['unreviewed', 'reviewed', 'all'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1 text-xs font-semibold rounded capitalize transition-colors ${
                filter === tab
                  ? 'bg-[#1e4d3b] text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by question, subject, or chapter..."
          className="w-full pl-9 pr-3 py-2 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
        />
      </div>

      {/* Mistakes List */}
      {loading ? (
        <LoadingSkeleton lines={6} />
      ) : filteredList.length === 0 ? (
        <EmptyState
          title="No mistakes found"
          description={
            filter === 'unreviewed'
              ? 'Awesome! You have no pending unreviewed mistakes. Keep practicing questions.'
              : 'No mistake records match the current filter.'
          }
        />
      ) : (
        <div className="space-y-4">
          {filteredList.map((item) => (
            <div
              key={item._id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-xs space-y-4"
            >
              {/* Question Top Header */}
              <div className="flex items-start justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {item.subjectName} • {item.topicTitle}
                  </span>
                  <span className="text-[11px] text-slate-400 block mt-0.5">
                    Logged on {new Date(item.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <label className="flex items-center space-x-1.5 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={item.isReviewed}
                      onChange={() => handleToggleReviewed(item._id, item.isReviewed)}
                      className="w-3.5 h-3.5 accent-[#1e4d3b] rounded cursor-pointer"
                    />
                    <span>Reviewed</span>
                  </label>
                  <button
                    onClick={() => handleDeleteMistake(item._id)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded"
                    title="Delete entry"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Question Text */}
              <p className="text-xs font-semibold text-slate-900 dark:text-white leading-relaxed">
                {item.questionText}
              </p>

              {/* Answers Comparison */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 rounded bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300">
                  <span className="font-bold block text-[11px] uppercase tracking-wider mb-1">
                    Your Choice (Incorrect):
                  </span>
                  <span>Option {item.userSelected}</span>
                </div>

                <div className="p-2.5 rounded bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300">
                  <span className="font-bold block text-[11px] uppercase tracking-wider mb-1">
                    Correct Option:
                  </span>
                  <span>Option {item.correctOption}</span>
                </div>
              </div>

              {/* Explanation */}
              {item.explanation && (
                <div className="p-3 rounded bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300">
                  <strong className="block text-slate-900 dark:text-white mb-0.5">Solution:</strong>
                  <p>{item.explanation}</p>
                </div>
              )}

              {/* Personal Reflection & Learning Note */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  My Reflection (Why did I make this mistake? e.g. Misread wording, forgot formula):
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={reflectionInputs[item._id] || ''}
                    onChange={(e) =>
                      setReflectionInputs({ ...reflectionInputs, [item._id]: e.target.value })
                    }
                    placeholder="e.g. Confused Stokes' equation diameter with radius."
                    className="flex-1 px-3 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#1e4d3b]"
                  />
                  <button
                    onClick={() => handleSaveReflection(item._id)}
                    disabled={savingId === item._id}
                    className="px-3 py-1.5 text-xs font-semibold rounded bg-[#1e4d3b] text-white hover:bg-[#163a2c] flex items-center space-x-1 shrink-0"
                  >
                    <Save className="w-3 h-3" />
                    <span>Save</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
