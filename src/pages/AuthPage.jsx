import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { BookOpen, Check, AlertCircle, ArrowRight } from 'lucide-react';

export default function AuthPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login, register } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      if (isRegister) {
        if (!name.trim()) throw new Error('Please enter your full name');
        await register(name.trim(), email.trim(), password);
      } else {
        await login(email.trim(), password);
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickDemo = async () => {
    setEmail('aspirant@gpat.edu');
    setPassword('aspirant123');
    setError('');
    setSubmitting(true);
    try {
      // Try login first
      await login('aspirant@gpat.edu', 'aspirant123');
    } catch {
      // If demo user doesn't exist yet, auto-register
      try {
        await register('GPAT Aspirant', 'aspirant@gpat.edu', 'aspirant123');
      } catch (err) {
        setError(err.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col justify-center items-center px-4 py-8 sm:py-12 bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
      <div className="w-full max-w-md">
        {/* App Title Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded bg-[#1e4d3b] text-white flex items-center justify-center font-bold text-xl mx-auto mb-3 shadow-xs">
            G
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            GPAT Study Planner
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Exam preparation, syllabus tracking, and daily mock test practice
          </p>
        </div>

        {/* Auth Box styled like a neat notebook */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 sm:p-8 shadow-xs">
          {/* Mode Switcher */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 mb-6">
            <button
              type="button"
              onClick={() => {
                setIsRegister(false);
                setError('');
              }}
              className={`pb-3 text-sm font-medium border-b-2 mr-6 transition-colors ${
                !isRegister
                  ? 'border-[#1e4d3b] text-[#1e4d3b] dark:border-emerald-500 dark:text-emerald-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
              }`}
            >
              Log In
            </button>
            <button
              type="button"
              onClick={() => {
                setIsRegister(true);
                setError('');
              }}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                isRegister
                  ? 'border-[#1e4d3b] text-[#1e4d3b] dark:border-emerald-500 dark:text-emerald-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
              }`}
            >
              Create Account
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full px-3 py-2 text-sm rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#1e4d3b]"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@pharmacy.edu"
                className="w-full px-3 py-2 text-sm rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#1e4d3b]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full px-3 py-2 text-sm rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#1e4d3b]"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 px-4 rounded bg-[#1e4d3b] hover:bg-[#163a2c] text-white font-medium text-sm transition-colors shadow-xs flex items-center justify-center space-x-2 disabled:opacity-50 mt-2"
            >
              <span>{submitting ? 'Checking...' : isRegister ? 'Get Started' : 'Sign In to Planner'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Login Option */}
          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
            <button
              type="button"
              onClick={handleQuickDemo}
              disabled={submitting}
              className="text-xs text-slate-500 hover:text-[#1e4d3b] dark:hover:text-emerald-400 font-medium underline"
            >
              Quick Test: Sign in with 1-click Aspirant Demo Account
            </button>
          </div>
        </div>

        {/* GPAT Exam Guidelines Footer Note */}
        <div className="mt-8 text-center text-xs text-slate-400 dark:text-slate-500 space-y-1">
          <p>National GPAT Exam Pattern: 125 Questions • 500 Marks • 180 Minutes</p>
          <p>Scoring: +4 for Correct • -1 for Wrong • 0 for Unattempted</p>
        </div>
      </div>
    </div>
  );
}

