import React from 'react';
import {
  CheckCircle2,
  ListTodo,
  BookOpen,
  Clock,
  HelpCircle,
  MoreHorizontal
} from 'lucide-react';

export default function BottomNav({ activeTab, setActiveTab, onOpenMore }) {
  const tabs = [
    { id: 'dashboard', label: 'Home', icon: CheckCircle2 },
    { id: 'plan', label: 'Plan', icon: ListTodo },
    { id: 'syllabus', label: 'Syllabus', icon: BookOpen },
    { id: 'timer', label: 'Timer', icon: Clock },
    { id: 'quiz', label: 'Quiz', icon: HelpCircle },
    { id: 'more', label: 'More', icon: MoreHorizontal }
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 pb-safe">
      <div className="grid grid-cols-6 h-16">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                if (tab.id === 'more') {
                  onOpenMore();
                } else {
                  setActiveTab(tab.id);
                }
              }}
              className={`flex flex-col items-center justify-center space-y-1 ${
                isActive
                  ? 'text-[#1e4d3b] dark:text-emerald-400 font-semibold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[11px] leading-none">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

