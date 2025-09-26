

import React, { useState, useEffect, useRef } from 'react';
import { Subject, Difficulty, ExamOptions, Language } from '../types';
import { EXAM_SUBJECTS, EXAM_DIFFICULTIES, LOCALIZATIONS, EXAM_TOPICS } from '../constants';
import Card from './Card';

interface HomeScreenProps {
  onStartExam: (options: ExamOptions) => void;
  language: Language;
  setLanguage: (language: Language) => void;
}

const SubjectIcon: React.FC<{ subject: Subject }> = ({ subject }) => {
  const iconMap: Record<Subject, React.ReactElement> = {
    [Subject.Physics]: <>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 13a8 8 0 0 1 7 7 6 6 0 0 0 3-5 9 9 0 0 0 6-8 3 3 0 0 0-3-3 9 9 0 0 0-8 6 6 6 0 0 0-5 3" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 14a6 6 0 0 0-3 6 6 6 0 0 0 6-3" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 9m-1 0a1 1 0 1 0 2 0a1 1 0 1 0-2 0" />
    </>,
    [Subject.Chemistry]: <>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 3v7.5L8 20h8l-2-9.5V3H10z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 3h6" />
    </>,
    [Subject.Math]: <>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 4C6.5 8,6.5 16,9 20" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 18l3-7 3 7h-6z" />
    </>,
    [Subject.English]: <>
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
    </>,
    [Subject.FullMock]: <></>, // No icon for mock test card
  };
  return <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-sky-500 dark:text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>{iconMap[subject]}</svg>;
};

const HomeScreen: React.FC<HomeScreenProps> = ({ onStartExam, language, setLanguage }) => {
  const T = LOCALIZATIONS[language];
  const [selectedTopics, setSelectedTopics] = useState<Record<Subject, string[]>>(
    () => EXAM_SUBJECTS.reduce((acc, subject) => {
        acc[subject] = [];
        return acc;
    }, {} as Record<Subject, string[]>)
  );
  const [openDropdown, setOpenDropdown] = useState<Subject | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTopicChange = (subject: Subject, topicKey: string) => {
    setSelectedTopics(prev => {
      const currentTopics = prev[subject];
      const newTopics = currentTopics.includes(topicKey)
        ? currentTopics.filter(t => t !== topicKey)
        : [...currentTopics, topicKey];
      return { ...prev, [subject]: newTopics };
    });
  };

  const handleSelectAll = (subject: Subject, select: boolean) => {
    setSelectedTopics(prev => ({
      ...prev,
      [subject]: select ? Object.keys(EXAM_TOPICS[subject]) : []
    }));
  };

  const handleStartMockTest = () => {
    onStartExam({
        subject: Subject.FullMock,
        difficulty: Difficulty.Mixed, // Mock tests are always mixed difficulty
        language: language,
        topic: ['All'], // Mock tests cover all topics
    });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 pt-20">
      <header className="text-center mb-6">
        <h1 className="text-4xl md:text-5xl font-bold text-slate-800 dark:text-slate-100">{T.homeTitle}</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-2 text-lg">{T.homeSubtitle}</p>
      </header>
      
      <div className="mb-8 p-1 bg-slate-200 dark:bg-slate-700 rounded-lg shadow-inner flex space-x-1">
        <button
          onClick={() => setLanguage(Language.English)}
          className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${language === Language.English ? 'bg-white text-sky-600 shadow dark:bg-slate-900 dark:text-sky-400' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'}`}
        >
          English
        </button>
        <button
          onClick={() => setLanguage(Language.Bengali)}
          className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${language === Language.Bengali ? 'bg-white text-sky-600 shadow dark:bg-slate-900 dark:text-sky-400' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'}`}
        >
          বাংলা
        </button>
      </div>

      <main className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <div className="md:col-span-2 lg:col-span-4">
            <Card className="bg-gradient-to-br from-sky-50 to-indigo-100 dark:from-sky-900/50 dark:to-indigo-900/50">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="text-center md:text-left">
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{T.fullMockTitle}</h2>
                        <p className="text-slate-600 dark:text-slate-400 mt-1">{T.fullMockDescription}</p>
                        <div className="mt-2 text-sm font-semibold bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300 px-3 py-1 rounded-full inline-block">{T.fullMockTime}</div>
                    </div>
                    <button
                        onClick={handleStartMockTest}
                        className="w-full md:w-auto flex-shrink-0 bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 px-8 rounded-lg shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-opacity-75 transition-transform transform hover:scale-105"
                    >
                        {T.startMockTest}
                    </button>
                </div>
            </Card>
        </div>
        
        {EXAM_SUBJECTS.map((subject) => (
          <Card key={subject} className="flex flex-col items-center text-center">
            <div className="mb-4">
              <SubjectIcon subject={subject} />
            </div>
            <h2 className="text-2xl font-bold text-slate-700 dark:text-slate-200 mb-4">{subject}</h2>
            
            <div className="w-full mb-6" ref={openDropdown === subject ? dropdownRef : null}>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">{T.topic}</label>
              <div className="relative">
                <button
                  onClick={() => setOpenDropdown(openDropdown === subject ? null : subject)}
                  className="w-full bg-slate-100 border border-slate-300 dark:bg-slate-700 dark:border-slate-600 rounded-md shadow-sm p-2 text-slate-700 dark:text-slate-300 focus:ring-sky-500 focus:border-sky-500 flex justify-between items-center text-left"
                >
                  <span className="truncate pr-2">
                    {selectedTopics[subject].length > 0
                      ? `${selectedTopics[subject].length} ${T.chaptersSelected}`
                      : T.selectTopics}
                  </span>
                   <svg className="h-5 w-5 text-slate-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                </button>
                {openDropdown === subject && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-slate-300 dark:bg-slate-800 dark:border-slate-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    <div className="p-2 border-b border-slate-200 dark:border-slate-700 flex justify-between">
                        <button onClick={() => handleSelectAll(subject, true)} className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline">{T.selectAll}</button>
                        <button onClick={() => handleSelectAll(subject, false)} className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline">{T.deselectAll}</button>
                    </div>
                    {Object.entries(EXAM_TOPICS[subject]).map(([key, value]) => (
                      <label key={key} className="flex items-center space-x-3 p-2 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedTopics[subject].includes(key)}
                          onChange={() => handleTopicChange(subject, key)}
                          className="h-4 w-4 rounded border-slate-300 dark:border-slate-500 bg-slate-100 dark:bg-slate-700 text-sky-600 focus:ring-sky-500"
                        />
                        <span className="text-slate-700 dark:text-slate-300 text-sm">{(language === Language.Bengali && subject !== Subject.English) ? value.bn : value.en}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3 w-full mt-auto">
              {EXAM_DIFFICULTIES.map((difficulty) => {
                  const colors: Record<Difficulty, string> = {
                      [Difficulty.Easy]: 'bg-emerald-500 hover:bg-emerald-600 focus:ring-emerald-400',
                      [Difficulty.Medium]: 'bg-sky-500 hover:bg-sky-600 focus:ring-sky-400',
                      [Difficulty.Hard]: 'bg-rose-500 hover:bg-rose-600 focus:ring-rose-400',
                      [Difficulty.Mixed]: 'bg-indigo-500 hover:bg-indigo-600 focus:ring-indigo-400',
                  };
                  return (
                      <button
                          key={difficulty}
                          onClick={() => onStartExam({ subject, difficulty, language, topic: selectedTopics[subject].length > 0 ? selectedTopics[subject] : ['All'] })}
                          className={`w-full text-white font-semibold py-2 px-4 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-opacity-75 transition-transform transform hover:scale-105 ${colors[difficulty]}`}
                      >
                          {difficulty}
                      </button>
                  );
              })}
            </div>
          </Card>
        ))}
      </main>
      <footer className="text-slate-500 dark:text-slate-400 mt-12 text-center text-sm">
        <p>{T.footerText}</p>
      </footer>
    </div>
  );
};

export default HomeScreen;