// Populating the 'types.ts' file with necessary type definitions for the application.

export enum Subject {
  Physics = 'Physics',
  Chemistry = 'Chemistry',
  Math = 'Math',
  English = 'English',
  FullMock = 'Full Mock Test',
}

export enum Difficulty {
  Easy = 'Easy',
  Medium = 'Medium',
  Hard = 'Hard',
  Mixed = 'Mixed',
}

export enum Language {
  English = 'en',
  Bengali = 'bn',
}

export interface ExamOptions {
  subject: Subject;
  difficulty: Difficulty;
  language: Language;
  topic: string[];
}

export interface Question {
  question: string;
  options: string[];
  answer: string;
  explanation: string;
  topic: string;
  difficulty: string;
}

export interface ExamResult {
  score: number;
  total: number;
  incorrectAnswers: (Question & { userAnswer: string | null })[];
  skippedQuestions: Question[];
  timeTaken: number; // in seconds
  accuracy: number; // percentage
  correctCount: number;
  incorrectCount: number;
  skippedCount: number;
}