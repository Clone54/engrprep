// Implementing the ResultsScreen component.
import React, { useEffect } from 'react';
import { ExamResult, ExamOptions, Difficulty } from '../types';
import Card from './Card';
import { LOCALIZATIONS, EXAM_TOPICS } from '../constants';

interface ResultsScreenProps {
  result: ExamResult;
  examOptions: ExamOptions;
  onGoHome: () => void;
}

const ResultsScreen: React.FC<ResultsScreenProps> = ({ result, examOptions, onGoHome }) => {
  const { score, total, incorrectAnswers, skippedQuestions, timeTaken, accuracy, correctCount, incorrectCount, skippedCount } = result;
  const { subject, difficulty, topic, language } = examOptions;
  const T = LOCALIZATIONS[language];

  useEffect(() => {
    if ((window as any).MathJax) {
        (window as any).MathJax.typesetPromise().catch((err: unknown) => {
          console.error("MathJax failed to render equations on results screen:", err);
      });
    }
  }, [result]);

  const difficultyColors: Record<Difficulty, string> = {
    [Difficulty.Easy]: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300',
    [Difficulty.Medium]: 'bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-300',
    [Difficulty.Hard]: 'bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300',
    [Difficulty.Mixed]: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300',
  };
  
  const isAllTopics = topic.includes('All') || topic.length === 0;

  return (
    <div className="min-h-screen flex flex-col items-center p-4 md:p-8 pt-20">
      <header className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-bold text-slate-800 dark:text-slate-100">{T.resultsTitle}</h1>
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 mt-4 text-sm font-semibold">
          <span className="bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200 px-3 py-1 rounded-full">{subject}</span>
          <span className={`${difficultyColors[difficulty]} px-3 py-1 rounded-full`}>{difficulty}</span>
          {isAllTopics ? (
            <span className="bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200 px-3 py-1 rounded-full">{T.allTopics}</span>
          ) : (
            topic.map(key => (
              <span key={key} className="bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200 px-3 py-1 rounded-full">
                {EXAM_TOPICS[subject]?.[key]?.[language] || key}
              </span>
            ))
          )}
        </div>
      </header>

      <main className="w-full max-w-4xl">
        <Card className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-slate-700 text-center">
            <div className="py-4 md:py-0">
              <p className="text-lg text-slate-600 dark:text-slate-400">{T.score}</p>
              <p className="text-5xl font-bold text-sky-600 dark:text-sky-400">{score.toFixed(2)} / {total}</p>
            </div>
            <div className="py-4 md:py-0">
              <p className="text-lg text-slate-600 dark:text-slate-400">{T.accuracy}</p>
              <p className="text-5xl font-bold text-emerald-600 dark:text-emerald-400">{accuracy.toFixed(2)}<span className="text-3xl">%</span></p>
            </div>
            <div className="py-4 md:py-0">
              <p className="text-lg text-slate-600 dark:text-slate-400">{T.timeTaken}</p>
              <p className="text-5xl font-bold text-slate-700 dark:text-slate-300">{timeTaken} <span className="text-2xl">{T.seconds}</span></p>
            </div>
          </div>
        </Card>

        <Card className="mb-8">
            <div className="grid grid-cols-3 divide-x divide-slate-200 dark:divide-slate-700 text-center">
                <div className="px-2">
                    <p className="text-lg text-slate-600 dark:text-slate-400">{T.correct}</p>
                    <p className="text-4xl font-bold text-emerald-600 dark:text-emerald-400">{correctCount}</p>
                </div>
                <div className="px-2">
                    <p className="text-lg text-slate-600 dark:text-slate-400">{T.wrong}</p>
                    <p className="text-4xl font-bold text-rose-600 dark:text-rose-400">{incorrectCount}</p>
                </div>
                <div className="px-2">
                    <p className="text-lg text-slate-600 dark:text-slate-400">{T.skipped}</p>
                    <p className="text-4xl font-bold text-slate-500 dark:text-slate-400">{skippedCount}</p>
                </div>
            </div>
        </Card>

        <h2 className="text-2xl font-bold text-slate-700 dark:text-slate-200 mb-4">{T.incorrectAnswers}</h2>
        {incorrectAnswers.length > 0 ? (
          <div className="space-y-6">
            {incorrectAnswers.map((item, index) => (
              <Card key={index}>
                <p className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4 leading-loose break-words">{item.question}</p>
                <div className="space-y-3 text-slate-800 dark:text-slate-200">
                  <div className="flex items-start">
                    <span className="font-semibold text-red-600 dark:text-red-400 w-32 flex-shrink-0">{T.yourAnswer}:</span>
                    <span className="leading-loose break-words min-w-0">{item.userAnswer}</span>
                  </div>
                   <div className="flex items-start">
                    <span className="font-semibold text-green-600 dark:text-green-400 w-32 flex-shrink-0">{T.correctAnswer}:</span>
                    <span className="leading-loose break-words min-w-0">{item.answer}</span>
                  </div>
                  <details className="pt-2 text-sm">
                      <summary className="cursor-pointer text-slate-600 dark:text-slate-400 font-semibold">{T.explanation}</summary>
                      <p className="mt-2 text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700/50 p-3 rounded-lg leading-loose break-words">{item.explanation}</p>
                  </details>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <p className="text-center text-lg text-green-600 dark:text-green-400 font-semibold">{T.noIncorrectAnswers}</p>
          </Card>
        )}
        
        {skippedQuestions.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-slate-700 dark:text-slate-200 mb-4">{T.skippedQuestionsTitle}</h2>
            <div className="space-y-6">
              {skippedQuestions.map((item, index) => (
                <Card key={index}>
                  <p className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4 leading-loose break-words">{item.question}</p>
                  <div className="space-y-3 text-slate-800 dark:text-slate-200">
                     <div className="flex items-start">
                      <span className="font-semibold text-green-600 dark:text-green-400 w-32 flex-shrink-0">{T.correctAnswer}:</span>
                      <span className="leading-loose break-words min-w-0">{item.answer}</span>
                    </div>
                    <details open className="pt-2 text-sm">
                        <summary className="cursor-pointer text-slate-600 dark:text-slate-400 font-semibold">{T.explanation}</summary>
                        <p className="mt-2 text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700/50 p-3 rounded-lg leading-loose break-words">{item.explanation}</p>
                    </details>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        <div className="text-center mt-12">
          <button onClick={onGoHome} className="bg-sky-500 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:bg-sky-600 transition-colors">
            {T.backToHome}
          </button>
        </div>
      </main>
    </div>
  );
};

export default ResultsScreen;