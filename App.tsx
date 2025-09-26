// Implementing the main App component for state management and screen routing.
import React, { useState, useEffect } from 'react';
import HomeScreen from './components/HomeScreen';
import ExamScreen from './components/ExamScreen';
import ResultsScreen from './components/ResultsScreen';
import { ExamOptions, ExamResult, Language, Question, Subject } from './types';
import { NEGATIVE_MARKING_PER_WRONG_ANSWER, LOCALIZATIONS, FULL_MOCK_TOTAL_QUESTIONS } from './constants';
import Spinner from './components/Spinner';
import ThemeToggle from './components/ThemeToggle';

const getInitialTheme = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') {
    return 'light';
  }
  try {
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme === 'dark' || storedTheme === 'light') {
      return storedTheme;
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  } catch (_) {
    return 'light';
  }
};

const App: React.FC = () => {
  const [examOptions, setExamOptions] = useState<ExamOptions | null>(null);
  const [examResult, setExamResult] = useState<ExamResult | null>(null);
  const [language, setLanguage] = useState<Language>(Language.English);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(getInitialTheme);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove(theme === 'dark' ? 'light' : 'dark');
    root.classList.add(theme);
    try {
      localStorage.setItem('theme', theme);
    } catch (_) {
        // localStorage may not be available
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  const handleStartExam = (options: ExamOptions) => {
    setExamOptions(options);
    setExamResult(null);
  };

  const handleFinishExam = async (
    userAnswers: (string | null)[],
    questions: Question[],
    timeTaken: number
  ) => {
    setIsAnalyzing(true);
    // Use a short timeout to allow the UI to re-render to the loading state
    await new Promise(resolve => setTimeout(resolve, 100));

    let correctCount = 0;
    let incorrectCount = 0;
    const incorrectAnswers: (Question & { userAnswer: string | null })[] = [];
    const skippedQuestions: Question[] = [];

    questions.forEach((q, index) => {
        let userAnswer = userAnswers[index];
        // Defensive cleaning: remove prefixes from user answer just in case
        if (typeof userAnswer === 'string') {
            userAnswer = userAnswer.replace(/^[A-D]\.\s*/, '');
        }
        
        if (userAnswer === null) {
            skippedQuestions.push(q);
        } else if (userAnswer === q.answer) {
            correctCount++;
        } else {
            incorrectCount++;
            incorrectAnswers.push({ ...q, userAnswer });
        }
    });

    const totalQuestionsInExam = examOptions?.subject === Subject.FullMock ? FULL_MOCK_TOTAL_QUESTIONS : questions.length;
    const answeredCount = correctCount + incorrectCount;
    const skippedCount = totalQuestionsInExam - answeredCount;
    
    const score = correctCount - incorrectCount * NEGATIVE_MARKING_PER_WRONG_ANSWER;
    const accuracy = answeredCount > 0 ? (correctCount / answeredCount) * 100 : 0;

    setExamResult({
        score: score,
        total: totalQuestionsInExam,
        incorrectAnswers,
        skippedQuestions,
        timeTaken,
        accuracy: accuracy,
        correctCount,
        incorrectCount,
        skippedCount,
    });
    
    setIsAnalyzing(false);
  };

  const handleGoHome = () => {
    setExamOptions(null);
    setExamResult(null);
  };

  const selectLanguage = (lang: Language) => {
    setLanguage(lang);
    if (examOptions) {
        setExamOptions({ ...examOptions, language: lang });
    }
  };

  const renderContent = () => {
    if (isAnalyzing) {
      const T = LOCALIZATIONS[language];
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4">
          <Spinner />
          <p className="text-slate-600 dark:text-slate-400 mt-6 text-lg">{T.analyzingResults}</p>
        </div>
      );
    }
    
    if (examResult && examOptions) {
      return (
        <ResultsScreen
          result={examResult}
          examOptions={examOptions}
          onGoHome={handleGoHome}
        />
      );
    }

    if (examOptions) {
      return (
        <ExamScreen
          options={examOptions}
          onFinishExam={handleFinishExam}
          onGoHome={handleGoHome}
        />
      );
    }

    return <HomeScreen onStartExam={handleStartExam} language={language} setLanguage={selectLanguage} />;
  }
  
  return (
    <div className="text-slate-900 dark:text-slate-200">
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle theme={theme} onToggle={toggleTheme} />
      </div>
      {renderContent()}
    </div>
  )
};

export default App;