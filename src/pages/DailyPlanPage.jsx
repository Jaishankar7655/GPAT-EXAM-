import React, { useState, useEffect } from 'react';
import LoadingSkeleton from '../components/LoadingSkeleton';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Plus,
  RotateCcw,
  Trash2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ListTodo
} from 'lucide-react';

export default function DailyPlanPage({ onStartTimerForTask }) {
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [plan, setPlan] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskSubject, setNewTaskSubject] = useState('Pharmaceutics');
  const [newTaskMinutes, setNewTaskMinutes] = useState(60);
  const [submitting, setSubmitting] = useState(false);

  const fetchPlan = async (dateStr) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/plan?date=${dateStr}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setPlan(data.plan);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlan(currentDate);
  }, [currentDate]);

  const handleDateChange = (offset) => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + offset);
    setCurrentDate(d.toISOString().split('T')[0]);
  };

  const handleToggleTask = async (taskId, currentStatus) => {
    try {
      const res = await fetch(`/api/plan?date=${currentDate}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId,
          completed: !currentStatus
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setPlan(data.plan);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      const res = await fetch(`/api/plan?date=${currentDate}&taskId=${taskId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setPlan(data.plan);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRegenerate = async () => {
    if (!window.confirm('Regenerate plan? This will suggest fresh tasks based on your weak subjects and free hours.')) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/plan?date=${currentDate}&action=regenerate`, {
        method: 'POST'
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setPlan(data.plan);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/plan?date=${currentDate}&action=add-task`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTaskTitle.trim(),
          subjectName: newTaskSubject,
          estimatedMinutes: Number(newTaskMinutes)
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setPlan(data.plan);
          setIsAddModalOpen(false);
          setNewTaskTitle('');
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const tasks = plan?.tasks || [];
  const completedCount = tasks.filter((t) => t.completed).length;
  const isToday = currentDate === new Date().toISOString().split('T')[0];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Date Header Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <span>Daily Study Plan</span>
            {isToday && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                Today
              </span>
            )}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Smart schedule balancing weak subjects, backlog, and daily practice quiz.
          </p>
        </div>

        {/* Date Navigation Buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleDateChange(-1)}
            className="p-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50"
            title="Previous Day"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="px-3 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200">
            {new Date(currentDate + 'T00:00:00').toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric'
            })}
          </div>
          <button
            onClick={() => handleDateChange(1)}
            className="p-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50"
            title="Next Day"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          {!isToday && (
            <button
              onClick={() => setCurrentDate(new Date().toISOString().split('T')[0])}
              className="text-xs text-[#1e4d3b] dark:text-emerald-400 font-medium hover:underline ml-2"
            >
              Today
            </button>
          )}
        </div>
      </div>

      {/* Plan Summary Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-6">
            <div>
              <span className="text-xs text-slate-500 dark:text-slate-400 block">Progress</span>
              <span className="text-lg font-bold text-slate-900 dark:text-white">
                {completedCount} / {tasks.length} <span className="text-xs font-normal text-slate-500">tasks</span>
              </span>
            </div>

            <div>
              <span className="text-xs text-slate-500 dark:text-slate-400 block">Study Hours</span>
              <span className="text-lg font-bold text-slate-900 dark:text-white">
                {plan?.completedHours || 0}h / {plan?.plannedHours || 4}h
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-3 py-1.5 rounded bg-[#1e4d3b] hover:bg-[#163a2c] text-white text-xs font-medium flex items-center space-x-1.5 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Custom Task</span>
            </button>
            <button
              onClick={handleRegenerate}
              title="Regenerate plan based on available hours and weak subjects"
              className="p-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full mt-4 overflow-hidden">
          <div
            className="bg-[#1e4d3b] h-full rounded-full transition-all duration-300"
            style={{
              width: `${tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0}%`
            }}
          ></div>
        </div>
      </div>

      {/* Task List */}
      {loading ? (
        <LoadingSkeleton lines={5} />
      ) : tasks.length === 0 ? (
        <EmptyState
          title="No tasks scheduled for this day"
          description="Click 'Regenerate' to automatically generate a study plan, or add a custom task."
          actionLabel="Generate Plan Now"
          onAction={handleRegenerate}
        />
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <div
              key={task.id}
              className={`p-4 rounded-lg border transition-all ${
                task.completed
                  ? 'bg-slate-50/70 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-70'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => handleToggleTask(task.id, task.completed)}
                    className="mt-1 w-4 h-4 accent-[#1e4d3b] rounded cursor-pointer"
                  />
                  <div>
                    <div className="flex items-center space-x-2">
                      <span
                        className={`text-sm font-semibold ${
                          task.completed
                            ? 'line-through text-slate-400 dark:text-slate-500'
                            : 'text-slate-900 dark:text-white'
                        }`}
                      >
                        {task.title}
                      </span>
                      {task.isBacklog && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                          Backlog
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
                      <span>{task.subjectName}</span>
                      <span>•</span>
                      <span className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{task.estimatedMinutes} mins</span>
                      </span>
                      {task.notes && (
                        <>
                          <span>•</span>
                          <span className="italic">{task.notes}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  {onStartTimerForTask && !task.completed && (
                    <button
                      onClick={() => onStartTimerForTask(task)}
                      className="px-2 py-1 text-xs rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium"
                    >
                      Study with Timer
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteTask(task.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded"
                    title="Remove Task"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Task Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Custom Study Task"
      >
        <form onSubmit={handleAddTask} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Task Title
            </label>
            <input
              type="text"
              required
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="e.g. Solve 30 MCQs on Belladonna alkaloids"
              className="w-full px-3 py-2 text-sm rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#1e4d3b]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Subject
              </label>
              <select
                value={newTaskSubject}
                onChange={(e) => setNewTaskSubject(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
              >
                <option value="Pharmaceutics">Pharmaceutics</option>
                <option value="Pharmacology">Pharmacology</option>
                <option value="Pharmaceutical Chemistry">Pharmaceutical Chemistry</option>
                <option value="Pharmacognosy">Pharmacognosy</option>
                <option value="Jurisprudence">Jurisprudence</option>
                <option value="General Revision">General Revision</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Estimated Duration
              </label>
              <select
                value={newTaskMinutes}
                onChange={(e) => setNewTaskMinutes(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
              >
                <option value={30}>30 minutes</option>
                <option value={45}>45 minutes</option>
                <option value={60}>60 minutes (1 hr)</option>
                <option value={90}>90 minutes (1.5 hrs)</option>
                <option value={120}>120 minutes (2 hrs)</option>
              </select>
            </div>
          </div>

          <div className="pt-2 flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-3.5 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-3.5 py-1.5 text-xs rounded bg-[#1e4d3b] text-white hover:bg-[#163a2c] font-medium disabled:opacity-50"
            >
              {submitting ? 'Adding...' : 'Add Task'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

