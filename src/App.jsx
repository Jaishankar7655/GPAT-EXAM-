import React, { useState, lazy, Suspense } from 'react';
import { useAuth } from './context/AuthContext';
import { useTheme } from './context/ThemeContext';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import Modal from './components/Modal';
import LoadingSkeleton from './components/LoadingSkeleton';

import AuthPage from './pages/AuthPage';
import SetupPage from './pages/SetupPage';

// Lazy-load heavy pages for better initial load time
const DashboardPage      = lazy(() => import('./pages/DashboardPage'));
const DailyPlanPage      = lazy(() => import('./pages/DailyPlanPage'));
const SyllabusPage       = lazy(() => import('./pages/SyllabusPage'));
const TimerPage          = lazy(() => import('./pages/TimerPage'));
const QuizPage           = lazy(() => import('./pages/QuizPage'));
const MistakeNotebookPage = lazy(() => import('./pages/MistakeNotebookPage'));
const RevisionSheetsPage = lazy(() => import('./pages/RevisionSheetsPage'));
const SettingsPage       = lazy(() => import('./pages/SettingsPage'));

import {
  FileText,
  Settings,
  AlertCircle,
  BookOpen,
  ListTodo,
  Clock,
  HelpCircle,
  CheckCircle2,
  LogOut
} from 'lucide-react';

export default function App() {
  const { user, profile, loading, logout } = useAuth();
  const { darkMode } = useTheme();

  // Active tab state
  const [activeTab, setActiveTab] = useState('dashboard');

  // Cross-page state: topic selected in Syllabus → Timer
  const [timerTopic, setTimerTopic] = useState(null);
  // Cross-page state: task selected in Plan → Timer
  const [timerTask, setTimerTask] = useState(null);

  // Mobile "More" drawer
  const [moreDrawerOpen, setMoreDrawerOpen] = useState(false);

  // Streak count passed down from score api (lifted to avoid re-fetching)
  const [streakCount, setStreakCount] = useState(0);

  // Handler: navigate to timer with pre-selected topic (from Syllabus)
  const handleSelectTopicForTimer = (topic) => {
    setTimerTopic({ _id: topic._id, title: topic.title });
    setActiveTab('timer');
  };

  // Handler: navigate to timer with pre-selected task (from Daily Plan)
  const handleStartTimerForTask = (task) => {
    if (task.topicId) {
      setTimerTopic({ _id: task.topicId, title: task.title });
    } else {
      setTimerTopic({ _id: null, title: task.title });
    }
    setActiveTab('timer');
  };

  // Show full-page loading placeholder
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-400 dark:text-slate-500 space-y-3">
        <div className="w-10 h-10 rounded bg-[#1e4d3b] flex items-center justify-center text-white font-bold text-xl animate-pulse">
          G
        </div>
        <p className="text-xs font-medium">Loading your planner...</p>
      </div>
    );
  }

  // Not logged in → Auth Page
  if (!user) {
    return <AuthPage />;
  }

  // First-time setup not done → Setup page
  if (!profile?.isSetupCompleted) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <div className="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 h-14 flex items-center justify-between shadow-xs">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded bg-[#1e4d3b] text-white flex items-center justify-center font-bold text-base">G</div>
            <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">GPAT Study Planner</span>
          </div>
          <button
            onClick={logout}
            className="text-xs text-slate-500 hover:text-rose-600 flex items-center space-x-1"
          >
            <LogOut className="w-4 h-4" />
            <span>Log out</span>
          </button>
        </div>
        <SetupPage onFinish={() => window.location.reload()} />
      </div>
    );
  }

  // Mobile "More" menu tabs
  const moreMenuLinks = [
    { id: 'mistakes', label: 'Mistake Notebook', icon: AlertCircle },
    { id: 'revision', label: 'Quick Revision Sheets', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  // Render the active page
  const renderPage = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardPage
            setActiveTab={setActiveTab}
            onStreakLoaded={setStreakCount}
          />
        );
      case 'plan':
        return (
          <DailyPlanPage
            onStartTimerForTask={handleStartTimerForTask}
          />
        );
      case 'syllabus':
        return (
          <SyllabusPage
            onSelectTopicForTimer={handleSelectTopicForTimer}
          />
        );
      case 'timer':
        return (
          <TimerPage
            initialTopic={timerTopic || timerTask}
          />
        );
      case 'quiz':
        return (
          <QuizPage
            onNavigateToMistakes={() => setActiveTab('mistakes')}
          />
        );
      case 'mistakes':
        return <MistakeNotebookPage />;
      case 'revision':
        return <RevisionSheetsPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return (
          <DashboardPage
            setActiveTab={setActiveTab}
            onStreakLoaded={setStreakCount}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Top Navigation (desktop + mobile top bar) */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        streakCount={streakCount}
      />

  {/* Page content - add padding at bottom for mobile nav */}
      <main className="pb-20 lg:pb-6 min-h-[calc(100vh-64px)]">
        <Suspense fallback={
          <div className="max-w-4xl mx-auto px-4 py-10">
            <LoadingSkeleton lines={6} />
          </div>
        }>
          {renderPage()}
        </Suspense>
      </main>

      {/* Mobile Bottom Navigation */}
      <BottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenMore={() => setMoreDrawerOpen(true)}
      />

      {/* Mobile "More" Drawer */}
      <Modal
        isOpen={moreDrawerOpen}
        onClose={() => setMoreDrawerOpen(false)}
        title="More Options"
        maxWidth="max-w-sm"
      >
        <div className="space-y-1 -mx-2">
          {moreMenuLinks.map((link) => {
            const Icon = link.icon;
            const isActive = activeTab === link.id;
            return (
              <button
                key={link.id}
                onClick={() => {
                  setActiveTab(link.id);
                  setMoreDrawerOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-slate-100 text-[#1e4d3b] dark:bg-slate-800 dark:text-emerald-400'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                <span>{link.label}</span>
              </button>
            );
          })}

          <div className="pt-3 mt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              onClick={() => {
                logout();
                setMoreDrawerOpen(false);
              }}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-md text-sm font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
