// Implementing the ExamScreen component.
import React, { useState, useEffect, useCallback } from 'react';
import { ExamOptions, Question, Subject, Difficulty, Language } from '../types';
import { generateQuestions } from '../services/geminiService';
import Spinner from './Spinner';
import Card from './Card';
import { LOCALIZATIONS, EXAM_TOPICS, EXAM_DURATION_SECONDS, FULL_MOCK_DURATION_SECONDS, TOTAL_QUESTIONS, FULL_MOCK_PHYSICS_QUESTIONS, FULL_MOCK_CHEMISTRY_QUESTIONS, FULL_MOCK_MATH_QUESTIONS, FULL_MOCK_ENGLISH_QUESTIONS, FULL_MOCK_TOTAL_QUESTIONS } from '../constants';
import QuestionPalette from './QuestionPalette';

interface ExamScreenProps {
  options: ExamOptions;
  onFinishExam: (userAnswers: (string | null)[], questions: Question[], timeTaken: number) => void;
  onGoHome: () => void;
}

const ExamScreen: React.FC<ExamScreenProps> = ({ options, onFinishExam, onGoHome }) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<(string | null)[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const T = LOCALIZATIONS[options.language];
  const [loadingMessage, setLoadingMessage] = useState(options.subject === Subject.FullMock ? T.generatingFullMock : T.generatingQuestions);
  
  const examDuration = options.subject === Subject.FullMock ? FULL_MOCK_DURATION_SECONDS : EXAM_DURATION_SECONDS;
  const [timeLeft, setTimeLeft] = useState(examDuration);

  const [isPaletteOpen, setIsPaletteOpen] = useState(false);

  useEffect(() => {
    if (isLoading) {
      const messages = [
        options.subject === Subject.FullMock ? T.generatingFullMock : T.generatingQuestions,
        T.generatingQuestions1,
        T.generatingQuestions2,
        T.generatingQuestions3,
        T.generatingQuestions4,
      ];
      let messageIndex = 0;
      const intervalId = setInterval(() => {
        messageIndex = (messageIndex + 1) % messages.length;
        setLoadingMessage(messages[messageIndex]);
      }, 3000); // Change message every 3 seconds

      return () => clearInterval(intervalId);
    }
  }, [isLoading, T, options.subject]);


  const finishExam = useCallback(() => {
      const timeTaken = examDuration - timeLeft;
      onFinishExam(userAnswers, questions, timeTaken);
  }, [onFinishExam, userAnswers, questions, timeLeft, examDuration]);

  useEffect(() => {
    if (isLoading || questions.length === 0) return;

    if (timeLeft <= 0) {
      finishExam();
      return;
    }

    const timerId = setInterval(() => {
      setTimeLeft(prevTime => prevTime - 1);
    }, 1000);

    return () => clearInterval(timerId);
  }, [timeLeft, isLoading, questions.length, finishExam]);

  const loadExamQuestions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setLoadingMessage(options.subject === Subject.FullMock ? T.generatingFullMock : T.generatingQuestions);
    try {
      let fetchedQuestions: Question[] = [];
      if (options.subject === Subject.FullMock) {
        const subjectsToLoad: { subject: Subject; count: number; language?: Language }[] = [
            { subject: Subject.Physics, count: FULL_MOCK_PHYSICS_QUESTIONS },
            { subject: Subject.Chemistry, count: FULL_MOCK_CHEMISTRY_QUESTIONS },
            { subject: Subject.Math, count: FULL_MOCK_MATH_QUESTIONS },
            { subject: Subject.English, count: FULL_MOCK_ENGLISH_QUESTIONS, language: Language.English },
        ];

        const questionPromises = subjectsToLoad.map(s => {
            const subjectOptions: ExamOptions = {
                ...options,
                subject: s.subject,
                difficulty: Difficulty.Mixed,
                topic: ['All'],
                language: s.language || options.language,
            };
            return generateQuestions(subjectOptions, s.count);
        });
        
        const questionSets = await Promise.all(questionPromises);
        fetchedQuestions = questionSets.flat();

      } else {
        // Regular single-subject test
        fetchedQuestions = await generateQuestions(options, TOTAL_QUESTIONS);
      }
      setQuestions(fetchedQuestions);
      setUserAnswers(new Array(fetchedQuestions.length).fill(null));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'GENERATION_FAILED');
    } finally {
      setIsLoading(false);
    }
  }, [options, T]);

  useEffect(() => {
    loadExamQuestions();
  }, [loadExamQuestions]);

  useEffect(() => {
    if (questions.length > 0 && (window as any).MathJax) {
      (window as any).MathJax.typesetPromise().catch((err: unknown) => {
          console.error("MathJax failed to render equations:", err);
      });
    }
  }, [currentQuestionIndex, questions]);

  const handleOptionSelect = (option: string) => {
    if (userAnswers[currentQuestionIndex] !== null) return; // Already answered

    const newAnswers = [...userAnswers];
    newAnswers[currentQuestionIndex] = option;
    setUserAnswers(newAnswers);
  };

  const handleNavigation = (direction: 'next' | 'prev') => {
    if (direction === 'next' && currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else if (direction === 'prev' && currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleJumpToQuestion = (index: number) => {
    setCurrentQuestionIndex(index);
    setIsPaletteOpen(false);
  };
  
  const totalQuestionsInExam = options.subject === Subject.FullMock ? FULL_MOCK_TOTAL_QUESTIONS : TOTAL_QUESTIONS;

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <Spinner />
        <p className="text-slate-600 dark:text-slate-400 mt-6 text-lg text-center transition-opacity duration-500 ease-in-out w-64">
          {loadingMessage}
        </p>
      </div>
    );
  }

  if (error) {
    let errorTitle = T.errorGeneric;
    let errorMessage = T.errorGenericMessage;

    if (error.startsWith('API_KEY_ERROR')) {
        errorTitle = T.errorApi;
        errorMessage = T.errorApiMessage;
    } else if (error.startsWith('NETWORK_ERROR')) {
        errorTitle = T.errorNetwork;
        errorMessage = T.errorNetworkMessage;
    } else if (error.startsWith('RESPONSE_FORMAT_ERROR')) {
        errorTitle = T.errorResponse;
        errorMessage = T.errorResponseMessage;
    }

    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
        <p className="text-2xl font-bold text-rose-600 dark:text-rose-500 mb-2">{errorTitle}</p>
        <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-md">{errorMessage}</p>
        <div className="flex space-x-4">
          <button onClick={onGoHome} className="bg-slate-200 text-slate-700 font-semibold py-2 px-4 rounded-lg shadow-sm hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600 transition-colors">
            {T.backToHome}
          </button>
           <button onClick={loadExamQuestions} className="bg-sky-500 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-sky-600 transition-colors">
            {T.retry}
          </button>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
        <p className="text-slate-600 dark:text-slate-300 text-xl">No questions were generated.</p>
        <button onClick={onGoHome} className="mt-6 bg-sky-500 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-sky-600">
          {T.backToHome}
        </button>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const answeredOption = userAnswers[currentQuestionIndex];
  const isAnswered = answeredOption !== null;
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  
  const progressPercentage = (userAnswers.filter(a => a !== null).length / totalQuestionsInExam) * 100;
  
  const isAllTopics = options.topic.includes('All') || options.topic.length === 0;
  const difficultyColors: Record<Difficulty, string> = {
    [Difficulty.Easy]: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300',
    [Difficulty.Medium]: 'bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-300',
    [Difficulty.Hard]: 'bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300',
    [Difficulty.Mixed]: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300',
  };


  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <Card className="w-full max-w-3xl">
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 mb-5">
              <div 
                className="bg-sky-500 h-2 rounded-full transition-all duration-300 ease-out" 
                style={{ width: `${progressPercentage}%` }}
                aria-valuenow={progressPercentage}
                aria-valuemin={0}
                aria-valuemax={100}
                role="progressbar"
                aria-label="Exam progress"
              ></div>
            </div>

            <div className="flex justify-between items-center mb-6">
                 <button 
                    onClick={() => setIsPaletteOpen(true)}
                    className="text-sm font-bold bg-slate-100 text-slate-700 px-3 py-1 rounded-full hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600 transition-colors flex items-center space-x-2"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                    <span>{T.allQuestions}</span>
                </button>
                <div className="text-sm font-bold bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300 px-3 py-1 rounded-full">{T.timeLeft}: {minutes}:{seconds < 10 ? `0${seconds}` : seconds}</div>
                <div className="text-slate-500 dark:text-slate-400 font-semibold">{T.question} {currentQuestionIndex + 1} {T.of} {questions.length}</div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 mb-6 border-b border-slate-200 dark:border-slate-700 pb-4">
                <span className="bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200 px-3 py-1 rounded-full text-sm font-semibold">{options.subject}</span>
                <span className={`${difficultyColors[options.difficulty]} px-3 py-1 rounded-full text-sm font-semibold`}>{options.difficulty}</span>
                {isAllTopics ? (
                <span className="bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200 px-3 py-1 rounded-full text-sm font-semibold">{T.allTopics}</span>
                ) : (
                options.topic.map(key => {
                    const topicDetails = EXAM_TOPICS[options.subject as Exclude<Subject, Subject.FullMock>]?.[key];
                    const topicName = (options.language === Language.Bengali && options.subject !== Subject.English)
                        ? topicDetails?.bn
                        : topicDetails?.en;
                    return (
                        <span key={key} className="bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200 px-3 py-1 rounded-full text-sm font-semibold">
                            {topicName || key}
                        </span>
                    );
                })
                )}
            </div>

            <div className="mb-8">
                <p className="text-lg md:text-xl text-slate-800 dark:text-slate-100 leading-loose break-words">{currentQuestion.question}</p>
            </div>

            <div className="space-y-4 mb-8">
                {currentQuestion.options.map((option, index) => {
                    const isCorrect = option === currentQuestion.answer;
                    const isSelected = option === answeredOption;
                    let feedbackClasses = '';

                    if (isAnswered) {
                        if (isCorrect) {
                            feedbackClasses = 'bg-green-100 border-green-500 dark:bg-green-500/10 dark:border-green-500 ring-2 ring-green-200 dark:ring-green-500/20';
                        } else if (isSelected) {
                            feedbackClasses = 'bg-red-100 border-red-500 dark:bg-red-500/10 dark:border-red-500 ring-2 ring-red-200 dark:ring-red-500/20';
                        } else {
                            feedbackClasses = 'border-slate-200 dark:border-slate-700 opacity-60';
                        }
                    } else {
                        feedbackClasses = 'border-slate-300 dark:border-slate-600 hover:bg-sky-50 dark:hover:bg-sky-900/20 hover:border-sky-400 dark:hover:border-sky-500';
                    }

                    return (
                        <button
                            key={index}
                            onClick={() => handleOptionSelect(option)}
                            disabled={isAnswered}
                            className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-300 ease-in-out disabled:cursor-not-allowed flex items-center space-x-4 ${feedbackClasses}`}
                            aria-pressed={isSelected}
                        >
                            <span className="flex-shrink-0 font-bold text-slate-500 dark:text-slate-400">{String.fromCharCode(65 + index)}</span>
                            <span className="flex-1 font-medium leading-loose break-words text-slate-800 dark:text-slate-200">{option}</span>
                        </button>
                    );
                })}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                  onClick={() => handleNavigation('prev')}
                  disabled={currentQuestionIndex === 0}
                  className="w-full sm:flex-1 bg-slate-200 text-slate-700 font-semibold py-3 px-4 rounded-lg shadow-sm hover:bg-slate-300 transition-colors disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600 dark:disabled:bg-slate-800 dark:disabled:text-slate-500"
              >
                  {T.previous}
              </button>
              {currentQuestionIndex < questions.length - 1 ? (
                <button
                    onClick={() => handleNavigation('next')}
                    className="w-full sm:flex-1 bg-sky-500 text-white font-semibold py-3 px-4 rounded-lg shadow-md hover:bg-sky-600 transition-colors"
                >
                    {T.next}
                </button>
              ) : (
                <button
                    onClick={finishExam}
                    className="w-full sm:flex-1 bg-emerald-500 text-white font-semibold py-3 px-4 rounded-lg shadow-md hover:bg-emerald-600 transition-colors"
                >
                    {T.submit}
                </button>
              )}
            </div>
        </Card>
        <button onClick={onGoHome} className="text-slate-500 dark:text-slate-400 mt-8 hover:underline">
            {T.backToHome}
        </button>
        {isPaletteOpen && (
            <QuestionPalette
                totalQuestions={totalQuestionsInExam}
                loadedQuestionsCount={questions.length}
                userAnswers={userAnswers}
                currentIndex={currentQuestionIndex}
                onJumpToQuestion={handleJumpToQuestion}
                onClose={() => setIsPaletteOpen(false)}
                title={T.questionOverview}
                language={options.language}
            />
        )}
    </div>
  );
};

export default ExamScreen;