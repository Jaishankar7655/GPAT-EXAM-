import React, { useState, useEffect } from 'react';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { BookOpen, FileText, ExternalLink, Calculator, ShieldCheck } from 'lucide-react';

export default function RevisionSheetsPage() {
  const [activeTab, setActiveTab] = useState('drugs'); // 'drugs' | 'formulas' | 'acts' | 'links'
  const [loading, setLoading] = useState(true);
  const [resources, setResources] = useState(null);

  useEffect(() => {
    const fetchResources = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/resources');
        if (res.ok) {
          const d = await res.json();
          if (d.success) setResources(d.resources);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchResources();
  }, []);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <LoadingSkeleton lines={8} />
      </div>
    );
  }

  const drugClasses = resources?.drugClasses || [];
  const formulas = resources?.formulas || [];
  const actsAndSchedules = resources?.actsAndSchedules || [];
  const resourceLinks = resources?.resourceLinks || [];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">
          High-Yield GPAT Revision Sheets
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Quick-glance tables for fast morning and evening revision before taking quizzes.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-6 overflow-x-auto text-xs font-semibold">
        <button
          onClick={() => setActiveTab('drugs')}
          className={`pb-3 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'drugs'
              ? 'border-[#1e4d3b] text-[#1e4d3b] dark:border-emerald-400 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Drug Classes & MOAs
        </button>
        <button
          onClick={() => setActiveTab('formulas')}
          className={`pb-3 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'formulas'
              ? 'border-[#1e4d3b] text-[#1e4d3b] dark:border-emerald-400 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Formulas & Calculations
        </button>
        <button
          onClick={() => setActiveTab('acts')}
          className={`pb-3 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'acts'
              ? 'border-[#1e4d3b] text-[#1e4d3b] dark:border-emerald-400 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Pharmacy Acts & Schedules
        </button>
        <button
          onClick={() => setActiveTab('links')}
          className={`pb-3 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'links'
              ? 'border-[#1e4d3b] text-[#1e4d3b] dark:border-emerald-400 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Resource Links
        </button>
      </div>

      {/* 1. Drug Classes */}
      {activeTab === 'drugs' && (
        <div className="space-y-6">
          {drugClasses.map((cat, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden shadow-xs"
            >
              <div className="bg-slate-50 dark:bg-slate-800/60 px-5 py-3 border-b border-slate-200 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  {cat.category} — {cat.subCategory}
                </span>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {cat.classes.map((cls, i) => (
                  <div key={i} className="p-4 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-white">
                        {cls.name}
                      </span>
                      <span className="font-mono text-[11px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[#1e4d3b] dark:text-emerald-400 font-semibold">
                        Suffix: {cls.suffix}
                      </span>
                    </div>
                    <div className="text-slate-700 dark:text-slate-300">
                      <strong>Examples:</strong> {cls.examples}
                    </div>
                    <div className="text-slate-600 dark:text-slate-400">
                      <strong>Mechanism:</strong> {cls.moa}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 2. Formulas & Calculations */}
      {activeTab === 'formulas' && (
        <div className="space-y-4">
          {formulas.map((item, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-xs space-y-3"
            >
              <div className="flex items-center space-x-2">
                <Calculator className="w-4 h-4 text-[#1e4d3b] dark:text-emerald-400" />
                <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                  {item.name}
                </h3>
              </div>

              <div className="p-3 rounded bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 font-mono text-xs font-semibold text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
                {item.formula}
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-400">
                <strong>Parameters:</strong> {item.parameters}
              </p>

              <div className="p-2.5 rounded bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-[11px] text-emerald-900 dark:text-emerald-200">
                <strong>GPAT High-Yield Point:</strong> {item.highYieldPoint}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 3. Acts & Schedules */}
      {activeTab === 'acts' && (
        <div className="space-y-6">
          {actsAndSchedules.map((actItem, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden shadow-xs"
            >
              <div className="bg-slate-50 dark:bg-slate-800/60 px-5 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-[#1e4d3b] dark:text-emerald-400" />
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  {actItem.act}
                </span>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {actItem.keySchedules.map((sch, i) => (
                  <div key={i} className="p-4 flex flex-col sm:flex-row sm:items-baseline gap-2 text-xs">
                    <span className="font-bold text-slate-900 dark:text-white sm:w-36 shrink-0">
                      {sch.code}
                    </span>
                    <span className="text-slate-600 dark:text-slate-300">
                      {sch.description}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 4. Resource Links */}
      {activeTab === 'links' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-xs">
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {resourceLinks.map((link, idx) => (
              <div key={idx} className="py-3.5 flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                    {link.name}
                  </span>
                  <span className="text-[11px] text-slate-400">{link.category}</span>
                </div>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1 rounded border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-[#1e4d3b] dark:text-emerald-400 font-semibold flex items-center space-x-1"
                >
                  <span>Open</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
