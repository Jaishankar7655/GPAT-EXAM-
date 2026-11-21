import React, { useState, useEffect } from 'react';
import LoadingSkeleton from '../components/LoadingSkeleton';
import EmptyState from '../components/EmptyState';
import {
  BookOpen,
  CheckCircle,
  Clock,
  RotateCw,
  Search,
  Star,
  ChevronDown,
  ChevronRight,
  Filter
} from 'lucide-react';

export default function SyllabusPage({ onSelectTopicForTimer }) {
  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedChapters, setExpandedChapters] = useState({});
  const [updatingTopicId, setUpdatingTopicId] = useState(null);

  const fetchSyllabus = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/syllabus');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setSubjects(data.subjects || []);
          // Expand first chapter by default
          const initialExpand = {};
          data.subjects.forEach((s) => {
            s.chapters.forEach((c, idx) => {
              if (idx === 0) initialExpand[`${s._id}_${c.chapterName}`] = true;
            });
          });
          setExpandedChapters(initialExpand);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSyllabus();
  }, []);

  const toggleChapter = (key) => {
    setExpandedChapters((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleUpdateStatus = async (topicId, newStatus) => {
    setUpdatingTopicId(topicId);
    try {
      const res = await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topicId, status: newStatus })
      });
      if (res.ok) {
        // Update local state optimistically
        setSubjects((prev) =>
          prev.map((sub) => ({
            ...sub,
            chapters: sub.chapters.map((ch) => ({
              ...ch,
              topics: ch.topics.map((top) => {
                if (top._id === topicId) {
                  return {
                    ...top,
                    userProgress: {
                      ...top.userProgress,
                      status: newStatus
                    }
                  };
                }
                return top;
              })
            }))
          }))
        );
      }
    } catch (e) {
      console.error('Failed to update topic status', e);
    } finally {
      setUpdatingTopicId(null);
    }
  };

  const handleUpdateConfidence = async (topicId, newConfidence) => {
    setUpdatingTopicId(topicId);
    try {
      const res = await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topicId, confidence: newConfidence })
      });
      if (res.ok) {
        setSubjects((prev) =>
          prev.map((sub) => ({
            ...sub,
            chapters: sub.chapters.map((ch) => ({
              ...ch,
              topics: ch.topics.map((top) => {
                if (top._id === topicId) {
                  return {
                    ...top,
                    userProgress: {
                      ...top.userProgress,
                      confidence: newConfidence
                    }
                  };
                }
                return top;
              })
            }))
          }))
        );
      }
    } catch (e) {
      console.error('Failed to update confidence', e);
    } finally {
      setUpdatingTopicId(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <LoadingSkeleton lines={8} />
      </div>
    );
  }

  // Filter subjects and topics
  const filteredSubjects = subjects
    .filter((s) => (selectedSubjectId === 'all' ? true : s._id === selectedSubjectId))
    .map((s) => {
      const filteredChapters = s.chapters
        .map((ch) => {
          const filteredTopics = ch.topics.filter((t) => {
            const matchesSearch =
              searchQuery === '' ||
              t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
              ch.chapterName.toLowerCase().includes(searchQuery.toLowerCase());

            const status = t.userProgress?.status || 'not_started';
            const matchesStatus = statusFilter === 'all' || status === statusFilter;

            return matchesSearch && matchesStatus;
          });

          return {
            ...ch,
            topics: filteredTopics
          };
        })
        .filter((ch) => ch.topics.length > 0);

      return {
        ...s,
        chapters: filteredChapters
      };
    })
    .filter((s) => s.chapters.length > 0);

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'not_started', label: 'Not Started' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
    { value: 'revised', label: 'Revised' }
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            GPAT Syllabus Tracker
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Track completion, schedule revisions, and set confidence ratings (1–5) for every chapter.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Search box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search topics or chapters..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#1e4d3b]"
            />
          </div>

          {/* Subject Filter */}
          <div>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#1e4d3b]"
            >
              <option value="all">All Subjects</option>
              {subjects.map((sub) => (
                <option key={sub._id} value={sub._id}>
                  {sub.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#1e4d3b]"
            >
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Syllabus Tree */}
      {filteredSubjects.length === 0 ? (
        <EmptyState
          title="No topics match your filter"
          description="Try clearing your search keyword or switching the status filter back to 'All'."
          actionLabel="Reset Filters"
          onAction={() => {
            setSearchQuery('');
            setSelectedSubjectId('all');
            setStatusFilter('all');
          }}
        />
      ) : (
        <div className="space-y-6">
          {filteredSubjects.map((sub) => (
            <div
              key={sub._id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden shadow-xs"
            >
              {/* Subject Title Bar */}
              <div
                className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between"
                style={{ borderLeft: `5px solid ${sub.color || '#1e4d3b'}` }}
              >
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                    <span>{sub.name}</span>
                  </h2>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {sub.description}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {sub.completedTopics + sub.revisedTopics} / {sub.totalTopics} completed
                  </span>
                </div>
              </div>

              {/* Chapters & Topics */}
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {sub.chapters.map((ch) => {
                  const chKey = `${sub._id}_${ch.chapterName}`;
                  const isExpanded = !!expandedChapters[chKey];

                  return (
                    <div key={ch.chapterName} className="p-4">
                      {/* Chapter Row Header */}
                      <div
                        onClick={() => toggleChapter(chKey)}
                        className="flex items-center justify-between cursor-pointer py-1 text-slate-800 dark:text-slate-200 select-none hover:text-[#1e4d3b]"
                      >
                        <div className="flex items-center space-x-2">
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-slate-400" />
                          )}
                          <span className="text-xs font-bold uppercase tracking-wider">
                            {ch.chapterName}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400">
                          {ch.topics.length} {ch.topics.length === 1 ? 'topic' : 'topics'}
                        </span>
                      </div>

                      {/* Topic Rows */}
                      {isExpanded && (
                        <div className="mt-3 space-y-2.5 pl-6 border-l-2 border-slate-100 dark:border-slate-800 ml-2">
                          {ch.topics.map((t) => {
                            const p = t.userProgress || {};
                            const status = p.status || 'not_started';
                            const confidence = p.confidence || 1;

                            return (
                              <div
                                key={t._id}
                                className="p-3 rounded border border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                              >
                                <div>
                                  <div className="flex items-center space-x-2">
                                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                                      {t.title}
                                    </span>
                                    {t.importance === 'high' && (
                                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
                                        High Yield
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center space-x-3">
                                    <span>Est: {t.estimatedHours || 2} hrs</span>
                                    {p.revisionCount > 0 && (
                                      <span>Revised: {p.revisionCount}x</span>
                                    )}
                                    {onSelectTopicForTimer && (
                                      <button
                                        onClick={() => onSelectTopicForTimer(t)}
                                        className="text-[#1e4d3b] dark:text-emerald-400 hover:underline font-medium"
                                      >
                                        Study this now →
                                      </button>
                                    )}
                                  </div>
                                </div>

                                {/* Controls: Status Selector & 5-Star Confidence */}
                                <div className="flex items-center space-x-3 shrink-0">
                                  {/* Confidence 1-5 */}
                                  <div className="flex items-center space-x-0.5" title="Confidence rating (1 to 5)">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <button
                                        key={star}
                                        onClick={() => handleUpdateConfidence(t._id, star)}
                                        className="p-0.5 focus:outline-none"
                                      >
                                        <Star
                                          className={`w-3.5 h-3.5 ${
                                            star <= confidence
                                              ? 'fill-amber-400 text-amber-400'
                                              : 'text-slate-300 dark:text-slate-600'
                                          }`}
                                        />
                                      </button>
                                    ))}
                                  </div>

                                  {/* Status Selector */}
                                  <select
                                    value={status}
                                    disabled={updatingTopicId === t._id}
                                    onChange={(e) => handleUpdateStatus(t._id, e.target.value)}
                                    className={`px-2 py-1 text-xs rounded border font-medium focus:outline-none ${
                                      status === 'completed'
                                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                                        : status === 'revised'
                                        ? 'bg-blue-50 text-blue-800 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800'
                                        : status === 'in_progress'
                                        ? 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
                                        : 'bg-white text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                                    }`}
                                  >
                                    <option value="not_started">Not Started</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="completed">Completed</option>
                                    <option value="revised">Revised</option>
                                  </select>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

