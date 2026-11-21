import React, { useState, useEffect, useRef } from 'react';
import LoadingSkeleton from '../components/LoadingSkeleton';
import EmptyState from '../components/EmptyState';
import {
  HelpCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  Flag,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Zap,
  BookOpen
} from 'lucide-react';

export default function QuizPage({ onNavigateToMistakes }) {
  const [testType, setTestType] = useState('daily'); // 'daily' | 'subject' | 'mock'
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // User state during quiz
  const [userAnswers, setUserAnswers] = useState({}); // { [qId]: 'A'|'B'|'C'|'D' }
  const [markedForReview, setMarkedForReview] = useState({}); // { [qId]: boolean }
  const [visited, setVisited] = useState({}); // { [qId]: boolean }
  const [secondsRemaining, setSecondsRemaining] = useState(20 * 60);
  const [quizActive, setQuizActive] = useState(false);
  const [showMobilePalette, setShowMobilePalette] = useState(false);

  // Result state
  const [submitted, setSubmitted] = useState(false);
  const [resultSummary, setResultSummary] = useState(null);
  const [reviewList, setReviewList] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const timerRef = useRef(null);

  // Start Quiz
  const startQuiz = async (type) => {
    setLoading(true);
    setTestType(type);
    setSubmitted(false);
    setUserAnswers({});
    setMarkedForReview({});
    setVisited({});
    setCurrentIndex(0);

    try {
      const res = await fetch(`/api/quiz?type=${type}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.questions.length > 0) {
          setQuestions(data.questions);
          setSecondsRemaining((data.durationMinutes || 20) * 60);
          setQuizActive(true);
          setVisited({ [data.questions[0]._id]: true });
        } else {
          alert('No questions found for this quiz type yet.');
        }
      }
    } catch (e) {
      console.error(e);
      alert('Error loading quiz questions.');
    } finally {
      setLoading(false);
    }
  };

  // Timer countdown
  useEffect(() => {
    if (quizActive && !submitted) {
      timerRef.current = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            handleSubmitQuiz(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [quizActive, submitted]);

  const handleSelectOption = (optionKey) => {
    const qId = questions[currentIndex]._id;
    setUserAnswers((prev) => ({
      ...prev,
      [qId]: optionKey
    }));
  };

  const handleClearAnswer = () => {
    const qId = questions[currentIndex]._id;
    setUserAnswers((prev) => {
      const copy = { ...prev };
      delete copy[qId];
      return copy;
    });
  };

  const handleToggleMarkReview = () => {
    const qId = questions[currentIndex]._id;
    setMarkedForReview((prev) => ({
      ...prev,
      [qId]: !prev[qId]
    }));
  };

  const goToQuestion = (index) => {
    if (index >= 0 && index < questions.length) {
      setCurrentIndex(index);
      setVisited((prev) => ({
        ...prev,
        [questions[index]._id]: true
      }));
    }
  };

  const handleSubmitQuiz = async (isAutoSubmit = false) => {
    if (!isAutoSubmit) {
      const answeredCount = Object.keys(userAnswers).length;
      const confirmSubmit = window.confirm(
        `Submit test? You answered ${answeredCount} of ${questions.length} questions.`
      );
      if (!confirmSubmit) return;
    }

    setSubmitting(true);
    clearInterval(timerRef.current);

    const payload = {
      type: testType,
      durationSeconds: 20 * 60 - secondsRemaining,
      answers: questions.map((q) => ({
        questionId: q._id,
        selectedOption: userAnswers[q._id] || null,
        markedForReview: !!markedForReview[q._id],
        timeSpentSeconds: 30
      }))
    };

    try {
      const res = await fetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setResultSummary(data.summary);
          setReviewList(data.review || []);
          setSubmitted(true);
          setQuizActive(false);
        }
      }
    } catch (e) {
      console.error(e);
      alert('Error submitting quiz.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTimer = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // If Quiz is not active and not submitted, show Quiz selection launch screen
  if (!quizActive && !submitted) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            GPAT Practice & Mock Tests
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real GPAT marking: +4 for correct, -1 for wrong, 0 for unattempted.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 1. Daily Practice Quiz */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-[#1e4d3b] dark:text-emerald-400 flex items-center justify-center mb-4">
                <Zap className="w-5 h-5" />
              </div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                Daily Practice Quiz
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                15 questions tailored to your weak topics, recent subjects, and revisions.
              </p>
              <div className="text-[11px] text-slate-600 dark:text-slate-400 space-y-1 mb-6 border-t border-slate-100 dark:border-slate-800 pt-3">
                <div className="flex justify-between"><span>Questions:</span> <strong>15 MCQs</strong></div>
                <div className="flex justify-between"><span>Duration:</span> <strong>20 Minutes</strong></div>
                <div className="flex justify-between"><span>Marks:</span> <strong>60 Marks</strong></div>
              </div>
            </div>
            <button
              onClick={() => startQuiz('daily')}
              disabled={loading}
              className="w-full py-2 px-3 rounded bg-[#1e4d3b] hover:bg-[#163a2c] text-white text-xs font-semibold shadow-xs transition-colors"
            >
              Start Daily Quiz
            </button>
          </div>

          {/* 2. Subject Test */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 flex items-center justify-center mb-4">
                <BookOpen className="w-5 h-5" />
              </div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                Weekly Subject Test
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                Deep dive into a specific core subject like Pharmacology or Pharmaceutics.
              </p>
              <div className="text-[11px] text-slate-600 dark:text-slate-400 space-y-1 mb-6 border-t border-slate-100 dark:border-slate-800 pt-3">
                <div className="flex justify-between"><span>Questions:</span> <strong>30 MCQs</strong></div>
                <div className="flex justify-between"><span>Duration:</span> <strong>45 Minutes</strong></div>
                <div className="flex justify-between"><span>Marks:</span> <strong>120 Marks</strong></div>
              </div>
            </div>
            <button
              onClick={() => startQuiz('subject')}
              disabled={loading}
              className="w-full py-2 px-3 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold"
            >
              Start Subject Test
            </button>
          </div>

          {/* 3. Full 125-Question Mock */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center mb-4">
                <Clock className="w-5 h-5" />
              </div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                Full GPAT Mock Test
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                Full-length exam simulation covering all 5 sections under exam conditions.
              </p>
              <div className="text-[11px] text-slate-600 dark:text-slate-400 space-y-1 mb-6 border-t border-slate-100 dark:border-slate-800 pt-3">
                <div className="flex justify-between"><span>Questions:</span> <strong>125 MCQs</strong></div>
                <div className="flex justify-between"><span>Duration:</span> <strong>180 Minutes (3 hrs)</strong></div>
                <div className="flex justify-between"><span>Total Marks:</span> <strong>500 Marks</strong></div>
              </div>
            </div>
            <button
              onClick={() => startQuiz('mock')}
              disabled={loading}
              className="w-full py-2 px-3 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold"
            >
              Start Full Mock
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If Submitted: Show Results and Explanations
  if (submitted && resultSummary) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Results Overview Box */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-5 gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Test Performance Report
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Evaluation based on official GPAT markings (+4 correct, -1 wrong)
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  setSubmitted(false);
                  setQuizActive(false);
                }}
                className="px-3 py-1.5 rounded border border-slate-300 dark:border-slate-700 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Back to Tests
              </button>
              {resultSummary.wrongAnswers > 0 && onNavigateToMistakes && (
                <button
                  onClick={onNavigateToMistakes}
                  className="px-3 py-1.5 rounded bg-rose-700 text-white text-xs font-semibold shadow-xs"
                >
                  View Mistake Book ({resultSummary.wrongAnswers})
                </button>
              )}
            </div>
          </div>

          {/* Score Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center mb-6">
            <div className="p-3 rounded bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] text-slate-500 block">Total Score</span>
              <span className="text-xl font-bold text-[#1e4d3b] dark:text-emerald-400">
                {resultSummary.score}
              </span>
            </div>
            <div className="p-3 rounded bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
              <span className="text-[11px] text-emerald-700 dark:text-emerald-300 block">Correct (+4)</span>
              <span className="text-xl font-bold text-emerald-800 dark:text-emerald-200">
                {resultSummary.correctAnswers}
              </span>
            </div>
            <div className="p-3 rounded bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800">
              <span className="text-[11px] text-rose-700 dark:text-rose-300 block">Wrong (-1)</span>
              <span className="text-xl font-bold text-rose-800 dark:text-rose-200">
                {resultSummary.wrongAnswers}
              </span>
            </div>
            <div className="p-3 rounded bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] text-slate-500 block">Skipped (0)</span>
              <span className="text-xl font-bold text-slate-700 dark:text-slate-300">
                {resultSummary.skippedAnswers}
              </span>
            </div>
            <div className="p-3 rounded bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] text-slate-500 block">Accuracy</span>
              <span className="text-xl font-bold text-slate-800 dark:text-slate-200">
                {resultSummary.accuracyPercent}%
              </span>
            </div>
          </div>
        </div>

        {/* Detailed Solutions & Explanations */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Question Explanations & Review
          </h3>

          {reviewList.map((item, index) => {
            const isSkipped = !item.selectedOption;
            const isCorrect = item.isCorrect;

            return (
              <div
                key={item.questionId}
                className={`p-5 rounded-lg border bg-white dark:bg-slate-900 shadow-xs ${
                  isCorrect
                    ? 'border-emerald-200 dark:border-emerald-900/60'
                    : isSkipped
                    ? 'border-slate-200 dark:border-slate-800'
                    : 'border-rose-200 dark:border-rose-900/60'
                }`}
              >
                <div className="flex items-center justify-between mb-3 text-xs">
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    Question {index + 1}
                  </span>
                  <span
                    className={`font-semibold px-2 py-0.5 rounded text-[11px] ${
                      isCorrect
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                        : isSkipped
                        ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                    }`}
                  >
                    {isCorrect ? '+4 Correct' : isSkipped ? '0 Skipped' : '-1 Wrong'}
                  </span>
                </div>

                <p className="text-sm font-medium text-slate-900 dark:text-white mb-4">
                  {item.questionText}
                </p>

                {/* Options List */}
                <div className="space-y-2 mb-4">
                  {item.options.map((opt) => {
                    const isUserChoice = item.selectedOption === opt.key;
                    const isRightOption = item.correctOption === opt.key;

                    let rowStyle = 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300';
                    if (isRightOption) {
                      rowStyle = 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 font-medium';
                    } else if (isUserChoice && !isRightOption) {
                      rowStyle = 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200 line-through';
                    }

                    return (
                      <div
                        key={opt.key}
                        className={`p-2.5 rounded border text-xs flex items-center justify-between ${rowStyle}`}
                      >
                        <div className="flex items-center space-x-2">
                          <span className="font-bold">{opt.key}.</span>
                          <span>{opt.text}</span>
                        </div>
                        {isRightOption && (
                          <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase">
                            Correct Answer
                          </span>
                        )}
                        {isUserChoice && !isRightOption && (
                          <span className="text-[10px] font-bold text-rose-700 dark:text-rose-300 uppercase">
                            Your Choice
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Explanation Box */}
                {item.explanation && (
                  <div className="p-3 rounded bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs text-slate-700 dark:text-slate-300">
                    <span className="font-bold block text-slate-900 dark:text-white mb-1">
                      Explanation:
                    </span>
                    <p>{item.explanation}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Active Quiz View: Question + Palette + Timer
  const currentQ = questions[currentIndex];
  if (!currentQ) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Quiz Top Bar: Subject name, Countdown timer, Submit button */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 shadow-xs mb-6 flex items-center justify-between">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#1e4d3b] dark:text-emerald-400 block">
            {testType === 'mock' ? 'Full GPAT Mock' : testType === 'subject' ? 'Subject Practice' : 'Daily Practice Quiz'}
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {currentQ.subjectName || 'Pharmacy'} • {currentQ.chapter || 'Core Chapter'}
          </span>
        </div>

        {/* Timer Display */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1.5 px-3 py-1 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-sm font-bold text-slate-800 dark:text-slate-100">
            <Clock className="w-4 h-4 text-slate-400" />
            <span>{formatTimer(secondsRemaining)}</span>
          </div>

          <button
            onClick={() => handleSubmitQuiz(false)}
            disabled={submitting}
            className="px-4 py-1.5 rounded bg-[#1e4d3b] hover:bg-[#163a2c] text-white text-xs font-semibold shadow-xs"
          >
            {submitting ? 'Submitting...' : 'Submit Test'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left 3 cols: Question Area */}
        <div className="lg:col-span-3 space-y-5">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 shadow-xs space-y-6">
            {/* Question Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Question {currentIndex + 1} of {questions.length}
              </span>
              <div className="flex items-center space-x-2">
                {currentQ.year && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    {currentQ.year}
                  </span>
                )}
                <button
                  onClick={handleToggleMarkReview}
                  className={`px-2.5 py-1 text-xs rounded border flex items-center space-x-1 font-medium ${
                    markedForReview[currentQ._id]
                      ? 'bg-purple-100 border-purple-300 text-purple-900 dark:bg-purple-950/60 dark:text-purple-300'
                      : 'border-slate-300 text-slate-600 dark:border-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Flag className="w-3.5 h-3.5" />
                  <span>{markedForReview[currentQ._id] ? 'Marked' : 'Mark for Review'}</span>
                </button>
              </div>
            </div>

            {/* Question Text */}
            <p className="text-sm font-semibold text-slate-900 dark:text-white leading-relaxed">
              {currentQ.questionText}
            </p>

            {/* Options List */}
            <div className="space-y-3 pt-2">
              {currentQ.options.map((opt) => {
                const isSelected = userAnswers[currentQ._id] === opt.key;
                return (
                  <label
                    key={opt.key}
                    onClick={() => handleSelectOption(opt.key)}
                    className={`p-3.5 rounded-lg border text-xs flex items-center space-x-3 cursor-pointer transition-colors ${
                      isSelected
                        ? 'border-[#1e4d3b] bg-emerald-50/50 dark:bg-emerald-950/30 text-[#1e4d3b] dark:text-emerald-200 font-semibold shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center font-bold text-[11px] shrink-0 ${
                        isSelected
                          ? 'border-[#1e4d3b] bg-[#1e4d3b] text-white'
                          : 'border-slate-300 dark:border-slate-600 text-slate-600'
                      }`}
                    >
                      {opt.key}
                    </div>
                    <span>{opt.text}</span>
                  </label>
                );
              })}
            </div>

            {/* Footer Question Nav buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={handleClearAnswer}
                disabled={!userAnswers[currentQ._id]}
                className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 disabled:opacity-40"
              >
                Clear Response
              </button>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => goToQuestion(currentIndex - 1)}
                  disabled={currentIndex === 0}
                  className="px-3 py-1.5 rounded border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 disabled:opacity-40 flex items-center space-x-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </button>

                <button
                  onClick={() => goToQuestion(currentIndex + 1)}
                  disabled={currentIndex === questions.length - 1}
                  className="px-4 py-1.5 rounded bg-[#1e4d3b] hover:bg-[#163a2c] text-white text-xs font-semibold shadow-xs disabled:opacity-40 flex items-center space-x-1"
                >
                  <span>Next</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right 1 col: Question Palette */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 mb-3">
              Question Palette
            </h3>

            {/* Palette Grid */}
            <div className="grid grid-cols-5 gap-2 mb-4">
              {questions.map((q, idx) => {
                const isCurrent = idx === currentIndex;
                const isAnswered = !!userAnswers[q._id];
                const isMarked = !!markedForReview[q._id];

                let btnStyle = 'border-slate-200 text-slate-600 bg-slate-50 dark:bg-slate-800 dark:border-slate-700';
                if (isMarked) {
                  btnStyle = 'border-purple-400 bg-purple-600 text-white font-bold';
                } else if (isAnswered) {
                  btnStyle = 'border-emerald-600 bg-emerald-600 text-white font-bold';
                } else if (isCurrent) {
                  btnStyle = 'border-slate-800 dark:border-white font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-700';
                }

                return (
                  <button
                    key={q._id}
                    onClick={() => goToQuestion(idx)}
                    className={`w-9 h-9 rounded text-xs font-semibold border flex items-center justify-center transition-all ${btnStyle}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="space-y-1.5 text-[11px] text-slate-500 dark:text-slate-400 pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-emerald-600 inline-block"></span>
                <span>Answered ({Object.keys(userAnswers).length})</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-purple-600 inline-block"></span>
                <span>Marked for Review ({Object.values(markedForReview).filter(Boolean).length})</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-slate-200 dark:bg-slate-700 inline-block"></span>
                <span>Unanswered ({questions.length - Object.keys(userAnswers).length})</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
