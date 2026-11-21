import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  BookOpen,
  Calendar,
  Flame,
  Moon,
  Sun,
  LogOut,
  Clock,
  CheckCircle2,
  ListTodo,
  FileText,
  AlertCircle,
  HelpCircle,
  Settings
} from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, paceData, streakCount = 0 }) {
  const { user, profile, logout } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();

  // Calculate days remaining
  const examDate = profile?.examDate ? new Date(profile.examDate) : null;
  const daysLeft = examDate
    ? Math.max(0, Math.ceil((examDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
    : null;

  const navLinks = [
    { id: 'dashboard', label: 'Dashboard', icon: CheckCircle2 },
    { id: 'plan', label: 'Daily Plan', icon: ListTodo },
    { id: 'syllabus', label: 'Syllabus', icon: BookOpen },
    { id: 'timer', label: 'Study Timer', icon: Clock },
    { id: 'quiz', label: 'Practice Quiz', icon: HelpCircle },
    { id: 'mistakes', label: 'Mistake Book', icon: AlertCircle },
    { id: 'revision', label: 'Quick Notes', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <header className="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-9 h-9 rounded bg-[#1e4d3b] flex items-center justify-center text-white font-bold text-lg shadow-sm">
              G
            </div>
            <div>
              <div className="font-semibold text-slate-900 dark:text-slate-100 text-base leading-tight tracking-tight">
                GPAT Study Planner
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                125 Qs • 500 Marks • Target: {profile?.targetScore || 350}
              </div>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = activeTab === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => setActiveTab(link.id)}
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-colors flex items-center space-x-1.5 ${
                    isActive
                      ? 'bg-slate-100 text-[#1e4d3b] dark:bg-slate-800 dark:text-emerald-400'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Header Controls */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Days Left Badge */}
            {daysLeft !== null && (
              <div className="hidden sm:flex items-center space-x-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 px-2.5 py-1 rounded text-xs font-medium border border-slate-200 dark:border-slate-700">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span><strong>{daysLeft}</strong> days left</span>
              </div>
            )}

            {/* Streak Badge */}
            <div className="flex items-center space-x-1 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 px-2.5 py-1 rounded text-xs font-semibold border border-amber-200 dark:border-amber-800">
              <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
              <span>{streakCount} {streakCount === 1 ? 'day' : 'days'}</span>
            </div>

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              title="Toggle color mode"
              className="p-1.5 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* User Initials & Logout */}
            <div className="flex items-center pl-1 border-l border-slate-200 dark:border-slate-700 space-x-2">
              <span className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center justify-center">
                {user?.name?.slice(0, 2).toUpperCase() || 'ST'}
              </span>
              <button
                onClick={logout}
                title="Log out"
                className="hidden sm:block p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

