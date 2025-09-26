import React from 'react';
import { Language } from '../types';
import { LOCALIZATIONS } from '../constants';

interface QuestionPaletteProps {
  totalQuestions: number;
  loadedQuestionsCount: number;
  userAnswers: (string | null)[];
  currentIndex: number;
  onJumpToQuestion: (index: number) => void;
  onClose: () => void;
  title: string;
  language: Language;
}

const QuestionPalette: React.FC<QuestionPaletteProps> = ({
  totalQuestions,
  loadedQuestionsCount,
  userAnswers,
  currentIndex,
  onJumpToQuestion,
  onClose,
  title,
  language
}) => {
  const T = LOCALIZATIONS[language];
  const answeredCount = userAnswers.filter(a => a !== null).length;
  const progressPercentage = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" 
      onClick={onClose} 
      role="dialog"
      aria-modal="true"
      aria-labelledby="question-palette-title"
    >
      <div 
        className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-6 w-full max-w-md max-h-[90vh] flex flex-col" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
            <h2 id="question-palette-title" className="text-xl font-bold text-slate-800 dark:text-slate-100">{title}</h2>
            <button 
                onClick={onClose} 
                className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 transition-colors"
                aria-label="Close question palette"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>

        <div className="mb-4">
            <div className="flex justify-between items-center text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1">
                <span>{T.progress}</span>
                <span>{answeredCount} / {totalQuestions}</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5">
                <div 
                    className="bg-emerald-500 h-2.5 rounded-full transition-all duration-300" 
                    style={{ width: `${progressPercentage}%` }}
                ></div>
            </div>
        </div>

        <div className="flex items-center justify-around text-xs text-slate-600 dark:text-slate-400 mb-5 border-t border-b border-slate-200 dark:border-slate-700 py-2">
            <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-sky-500"></div>
                <span>{T.current}</span>
            </div>
            <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                <span>{T.answered}</span>
            </div>
            <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full border-2 border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700"></div>
                <span>{T.unanswered}</span>
            </div>
        </div>
        
        <div className="overflow-y-auto pr-2 flex-1">
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
            {Array.from({ length: totalQuestions }, (_, i) => {
                const isLoaded = i < loadedQuestionsCount;
                if (!isLoaded) {
                    return (
                        <div key={i} className="h-12 w-12 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700/50 text-slate-400 dark:text-slate-500 font-bold text-lg cursor-wait">
                            {i + 1}
                        </div>
                    );
                }

                const isAnswered = userAnswers[i] !== null;
                const isCurrent = i === currentIndex;
                
                let buttonClasses = 'h-12 w-12 flex items-center justify-center rounded-lg font-bold text-lg transition-all transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 ';

                if (isCurrent) {
                    buttonClasses += 'bg-sky-500 text-white ring-sky-500';
                } else if (isAnswered) {
                    buttonClasses += 'bg-emerald-500 text-white hover:bg-emerald-600 focus:ring-emerald-400';
                } else {
                    buttonClasses += 'bg-white border-2 border-slate-300 text-slate-600 hover:bg-slate-100 focus:ring-sky-400 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-600';
                }

                return (
                <button
                    key={i}
                    onClick={() => onJumpToQuestion(i)}
                    className={buttonClasses}
                    aria-label={`Go to question ${i + 1}`}
                >
                    {i + 1}
                </button>
                );
            })}
            </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionPalette;