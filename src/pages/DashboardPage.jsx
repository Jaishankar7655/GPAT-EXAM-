import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/StatCard';
import LoadingSkeleton from '../components/LoadingSkeleton';
import EmptyState from '../components/EmptyState';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  Flame,
  TrendingUp,
  Target,
  ArrowRight,
  BookOpen,
  Award,
  Zap
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid
} from 'recharts';

export default function DashboardPage({ setActiveTab }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [scoreData, setScoreData] = useState(null);
  const [error, setError] = useState('');

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [resAnalytics, resScore] = await Promise.all([
        fetch('/api/analytics'),
        fetch('/api/score')
      ]);

      if (resAnalytics.ok) {
        const d = await resAnalytics.json();
        if (d.success) setAnalytics(d);
      }

      if (resScore.ok) {
        const s = await resScore.json();
        if (s.success) setScoreData(s);
      }
    } catch (err) {
      setError('Could not load dashboard data. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <LoadingSkeleton lines={6} />
      </div>
    );
  }

  const summary = analytics?.summary || {};
  const pace = analytics?.pace || {};
  const subjectProgress = analytics?.subjectProgress || [];
  const studyHoursTrend = analytics?.studyHoursTrend || [];
  const quizAccuracyTrend = analytics?.quizAccuracyTrend || [];
  const weakTopics = analytics?.weakTopics || [];
  const consistencyMap = analytics?.consistencyMap || {};
  const badges = scoreData?.badges || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* 1. Header greeting & Pace Check Alert Banner */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Welcome back, {user?.name?.split(' ')[0] || 'Aspirant'}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Exam Target: {summary.targetScore || 350}/500 marks • {summary.daysRemaining || 180} days until GPAT
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveTab('timer')}
              className="px-3.5 py-1.5 rounded bg-[#1e4d3b] hover:bg-[#163a2c] text-white text-xs font-semibold flex items-center space-x-1.5 shadow-xs"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Start Timer</span>
            </button>
            <button
              onClick={() => setActiveTab('quiz')}
              className="px-3.5 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center space-x-1.5"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Daily Quiz</span>
            </button>
          </div>
        </div>

        {/* Pace Check Alert */}
        <div
          className={`p-4 rounded-lg border flex items-start space-x-3 ${
            pace.status === 'ahead'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
              : pace.status === 'on_track'
              ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200'
              : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200'
          }`}
        >
          <div className="mt-0.5">
            {pace.status === 'behind' ? (
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            ) : (
              <TrendingUp className="w-5 h-5 text-emerald-700 shrink-0" />
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider">
                Pace Check: {pace.status === 'ahead' ? 'Ahead of Schedule' : pace.status === 'on_track' ? 'On Track' : 'Action Needed'}
              </span>
              <span className="text-xs font-semibold">
                Target: {pace.requiredHoursPerDay || 4} hrs/day
              </span>
            </div>
            <p className="text-xs mt-0.5 opacity-90">
              {pace.message || 'Complete scheduled topics daily to finish syllabus on time.'}
            </p>
          </div>
        </div>
      </div>

      {/* 2. Key Metrics 4-Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Today's Hours Left"
          value={`${summary.todayHoursLeft || 0}h`}
          subtext={`Logged ${summary.todayLoggedHours || 0}h of ${summary.plannedHours || 4}h planned`}
          icon={Clock}
          badge={summary.todayHoursLeft === 0 ? 'Goal Met' : 'In Progress'}
        />

        <StatCard
          title="Tasks Completed"
          value={`${summary.tasksDone || 0} / ${(summary.tasksDone || 0) + (summary.tasksPending || 0)}`}
          subtext={`${summary.tasksPending || 0} pending today`}
          icon={CheckCircle2}
        />

        <StatCard
          title="Syllabus Finished"
          value={`${summary.overallSyllabusPercent || 0}%`}
          subtext={`${summary.completedTopicsCount || 0} of ${summary.totalTopicsCount || 34} topics done`}
          icon={BookOpen}
        />

        <StatCard
          title="Daily Score"
          value={`${scoreData?.todayScore || 0} / 100`}
          subtext={`Streak: ${scoreData?.streak || 1} day • Avg: ${scoreData?.weeklyAverage || 0}`}
          icon={Flame}
        />
      </div>

      {/* 3. Daily Score Breakdown (Weights: Time 30, Topics 25, Quiz 30, Revision 15) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Today's Score Breakdown
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Formula: Study Time (30) + Topics (25) + Quiz (30) + Revision (15)
            </p>
          </div>
          <div className="text-right">
            <span className="text-lg font-bold text-[#1e4d3b] dark:text-emerald-400">
              {scoreData?.todayScore || 0}
            </span>
            <span className="text-xs text-slate-400"> / 100 pts</span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-3 rounded border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
            <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Study Time (Max 30)</span>
            <div className="text-base font-bold text-slate-800 dark:text-slate-200">
              {scoreData?.breakdown?.studyTime?.points || 0} <span className="text-xs text-slate-400">pts</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-[#1e4d3b] h-full rounded-full"
                style={{ width: `${Math.min(100, ((scoreData?.breakdown?.studyTime?.points || 0) / 30) * 100)}%` }}
              ></div>
            </div>
          </div>

          <div className="p-3 rounded border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
            <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Topics Done (Max 25)</span>
            <div className="text-base font-bold text-slate-800 dark:text-slate-200">
              {scoreData?.breakdown?.topicsCompleted?.points || 0} <span className="text-xs text-slate-400">pts</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-[#1e4d3b] h-full rounded-full"
                style={{ width: `${Math.min(100, ((scoreData?.breakdown?.topicsCompleted?.points || 0) / 25) * 100)}%` }}
              ></div>
            </div>
          </div>

          <div className="p-3 rounded border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
            <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Quiz Accuracy (Max 30)</span>
            <div className="text-base font-bold text-slate-800 dark:text-slate-200">
              {scoreData?.breakdown?.quizScore?.points || 0} <span className="text-xs text-slate-400">pts</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-[#1e4d3b] h-full rounded-full"
                style={{ width: `${Math.min(100, ((scoreData?.breakdown?.quizScore?.points || 0) / 30) * 100)}%` }}
              ></div>
            </div>
          </div>

          <div className="p-3 rounded border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
            <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Revision (Max 15)</span>
            <div className="text-base font-bold text-slate-800 dark:text-slate-200">
              {scoreData?.breakdown?.revision?.points || 0} <span className="text-xs text-slate-400">pts</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-[#1e4d3b] h-full rounded-full"
                style={{ width: `${Math.min(100, ((scoreData?.breakdown?.revision?.points || 0) / 15) * 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Charts Row: Study Hours Trend & Subject Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Study Hours Trend (Last 14 Days) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Study Hours (Past 14 Days)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Daily actual logged study hours
              </p>
            </div>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={studyHoursTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(val) => [`${val} hrs`, 'Study Time']}
                  contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '12px' }}
                />
                <Bar dataKey="hours" fill="#1e4d3b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Subject Breakdown Bars */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Subject Syllabus Progress
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Topics completed by GPAT subject
              </p>
            </div>
            <button
              onClick={() => setActiveTab('syllabus')}
              className="text-xs font-medium text-[#1e4d3b] dark:text-emerald-400 hover:underline flex items-center space-x-1"
            >
              <span>View full list</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3.5">
            {subjectProgress.map((sub) => (
              <div key={sub.id}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {sub.name}
                  </span>
                  <span className="text-slate-500 dark:text-slate-400">
                    {sub.completed}/{sub.total} topics ({sub.percentage}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${sub.percentage}%`,
                      backgroundColor: sub.color || '#1e4d3b'
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 5. Consistency Calendar & Weak Topics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Consistency Activity Grid (Last 60 Days) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-xs">
          <div className="mb-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Consistency Calendar
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Active days in the last 60 days (darker green = higher daily score)
            </p>
          </div>

          <div className="grid grid-cols-10 sm:grid-cols-12 gap-1.5 pt-2">
            {Array.from({ length: 60 }).map((_, i) => {
              const d = new Date();
              d.setDate(d.getDate() - (59 - i));
              const str = d.toISOString().split('T')[0];
              const entry = consistencyMap[str];
              const score = entry ? entry.score : 0;

              let bgClass = 'bg-slate-100 dark:bg-slate-800';
              if (score >= 75) bgClass = 'bg-[#1e4d3b] text-white';
              else if (score >= 40) bgClass = 'bg-emerald-600/70 text-white';
              else if (score > 0) bgClass = 'bg-emerald-200 dark:bg-emerald-900/60';

              return (
                <div
                  key={str}
                  title={`${str}: Score ${score}/100`}
                  className={`w-6 h-6 rounded-xs flex items-center justify-center text-[9px] font-mono transition-transform hover:scale-110 cursor-pointer ${bgClass}`}
                >
                  {d.getDate()}
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-end space-x-2 mt-4 text-[11px] text-slate-500">
            <span>Inactive</span>
            <div className="w-3 h-3 bg-slate-100 dark:bg-slate-800 rounded-xs"></div>
            <div className="w-3 h-3 bg-emerald-200 rounded-xs"></div>
            <div className="w-3 h-3 bg-emerald-600/70 rounded-xs"></div>
            <div className="w-3 h-3 bg-[#1e4d3b] rounded-xs"></div>
            <span>Goal Reached</span>
          </div>
        </div>

        {/* Weak Topics to Focus On */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Needs Attention (Weak Topics)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Confidence rating 1 or 2 stars
              </p>
            </div>
            {summary.unreviewedMistakesCount > 0 && (
              <button
                onClick={() => setActiveTab('mistakes')}
                className="text-xs bg-rose-50 text-rose-700 px-2.5 py-1 rounded border border-rose-200 font-semibold"
              >
                {summary.unreviewedMistakesCount} Mistake Review Pending
              </button>
            )}
          </div>

          {weakTopics.length === 0 ? (
            <EmptyState
              title="No weak topics identified yet"
              description="As you study and rate your confidence from 1 to 5, topics that need extra revision will appear here."
              actionLabel="Go to Syllabus"
              onAction={() => setActiveTab('syllabus')}
            />
          ) : (
            <div className="space-y-2.5">
              {weakTopics.map((topic) => (
                <div
                  key={topic.id}
                  className="p-3 rounded border border-slate-200 dark:border-slate-800 flex items-center justify-between"
                >
                  <div>
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                      {topic.title}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Chapter: {topic.chapter} • Confidence: {topic.confidence}/5
                    </span>
                  </div>
                  <button
                    onClick={() => setActiveTab('plan')}
                    className="px-2.5 py-1 text-xs rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium"
                  >
                    Add to Plan
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 6. Badges & Milestones */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-xs">
        <div className="mb-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            Badges & Milestones
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Earn badges by staying consistent, taking tests, and finishing chapters
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {badges.map((badge) => (
            <div
              key={badge.id}
              className={`p-3 rounded border text-center transition-all ${
                badge.unlocked
                  ? 'border-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/20 dark:border-emerald-800'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 opacity-40'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center ${
                  badge.unlocked
                    ? 'bg-[#1e4d3b] text-white shadow-xs'
                    : 'bg-slate-200 text-slate-400 dark:bg-slate-700'
                }`}
              >
                <Award className="w-4 h-4" />
              </div>
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                {badge.name}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                {badge.description}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

