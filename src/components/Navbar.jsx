import React, { useState, useEffect } from 'react';
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
  Settings,
  Menu,
  X,
  Target,
  ChevronRight
} from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, streakCount = 0 }) {
  const { user, profile, logout } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen]);

  // Calculate days remaining
  const examDate = profile?.examDate ? new Date(profile.examDate) : null;
  const daysLeft = examDate
    ? Math.max(0, Math.ceil((examDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
    : null;

  const navLinks = [
    { id: 'dashboard', label: 'Dashboard', icon: CheckCircle2, desc: 'Overview, stats & pace check' },
    { id: 'plan', label: 'Daily Plan', icon: ListTodo, desc: 'Smart schedule & backlog' },
    { id: 'syllabus', label: 'Syllabus', icon: BookOpen, desc: '34 topics & confidence ratings' },
    { id: 'timer', label: 'Study Timer', icon: Clock, desc: 'Pomodoro & continuous stopwatch' },
    { id: 'quiz', label: 'Practice Quiz', icon: HelpCircle, desc: '15-Q daily & full 125-Q mock' },
    { id: 'mistakes', label: 'Mistake Book', icon: AlertCircle, desc: 'Auto-saved incorrect answers' },
    { id: 'revision', label: 'Quick Notes', icon: FileText, desc: 'Drug classes, formulas & acts' },
    { id: 'settings', label: 'Settings', icon: Settings, desc: 'Goals, reminders & exports' }
  ];

  const handleNavClick = (tabId) => {
    setActiveTab(tabId);
    setMobileMenuOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: Hamburger Button (Mobile) + Logo & Title */}
            <div className="flex items-center space-x-3">
              {/* Hamburger Button for Mobile */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Open navigation menu"
                className="lg:hidden p-2 -ml-2 rounded-md text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1e4d3b]"
              >
                <Menu className="w-5 h-5" />
              </button>

              <div
                className="flex items-center space-x-2.5 cursor-pointer select-none"
                onClick={() => handleNavClick('dashboard')}
              >
                <div className="w-9 h-9 rounded bg-[#1e4d3b] flex items-center justify-center text-white font-bold text-lg shadow-xs shrink-0">
                  G
                </div>
                <div>
                  <div className="font-semibold text-slate-900 dark:text-slate-100 text-sm sm:text-base leading-tight tracking-tight">
                    GPAT Study Planner
                  </div>
                  <div className="hidden sm:block text-[11px] text-slate-500 dark:text-slate-400">
                    125 Qs • 500 Marks • Target: {profile?.targetScore || 350}
                  </div>
                </div>
              </div>
            </div>

            {/* Center: Desktop Navigation Links */}
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
                        ? 'bg-slate-100 text-[#1e4d3b] dark:bg-slate-800 dark:text-emerald-400 font-semibold'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{link.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Right: Quick Stats & Controls */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              {/* Days Left Badge (Desktop and Tablet) */}
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

              {/* User Initials & Desktop Logout */}
              <div className="hidden sm:flex items-center pl-1 border-l border-slate-200 dark:border-slate-700 space-x-2">
                <span className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center justify-center">
                  {user?.name?.slice(0, 2).toUpperCase() || 'ST'}
                </span>
                <button
                  onClick={logout}
                  title="Log out"
                  className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Slide-Out Drawer Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer Panel */}
          <div className="relative w-full max-w-xs bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200">
            {/* Drawer Top Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded bg-[#1e4d3b] text-white flex items-center justify-center font-bold text-sm">
                  G
                </div>
                <div>
                  <div className="font-bold text-slate-900 dark:text-white text-sm">
                    GPAT Planner
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Target: {profile?.targetScore || 350}/500
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* User Quick Info Box */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center space-x-3 mb-2.5">
                <div className="w-9 h-9 rounded-full bg-[#1e4d3b] text-white font-bold text-xs flex items-center justify-center">
                  {user?.name?.slice(0, 2).toUpperCase() || 'ST'}
                </div>
                <div className="overflow-hidden">
                  <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {user?.name || 'Aspirant'}
                  </div>
                  <div className="text-[11px] text-slate-500 truncate">
                    {user?.email}
                  </div>
                </div>
              </div>

              {/* Status badges row */}
              <div className="flex items-center gap-2 pt-1">
                {daysLeft !== null && (
                  <div className="flex items-center space-x-1 px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-medium text-slate-700 dark:text-slate-300">
                    <Calendar className="w-3 h-3 text-slate-500" />
                    <span>{daysLeft} days left</span>
                  </div>
                )}
                <div className="flex items-center space-x-1 px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-[11px] font-semibold text-amber-800 dark:text-amber-300">
                  <Flame className="w-3 h-3 fill-amber-500 text-amber-500" />
                  <span>{streakCount} day streak</span>
                </div>
              </div>
            </div>

            {/* Navigation Links List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3 py-1">
                Menu
              </div>
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = activeTab === link.id;
                return (
                  <button
                    key={link.id}
                    onClick={() => handleNavClick(link.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-[#1e4d3b] text-white font-semibold shadow-xs'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500'}`} />
                      <span>{link.label}</span>
                    </div>
                    <ChevronRight className={`w-3.5 h-3.5 ${isActive ? 'text-white/80' : 'text-slate-300 dark:text-slate-600'}`} />
                  </button>
                );
              })}
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
              <button
                type="button"
                onClick={toggleDarkMode}
                className="w-full flex items-center justify-between px-3 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300"
              >
                <div className="flex items-center space-x-2">
                  {darkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-slate-500" />}
                  <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
                </div>
                <span className="text-[11px] text-slate-400">{darkMode ? 'On' : 'Off'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  logout();
                }}
                className="w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-md text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
