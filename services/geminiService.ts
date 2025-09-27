// services/geminiService.ts

import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold, Content } from '@google/generative-ai';
import { ExamOptions, Question, Language, Subject, Difficulty } from '../types';
import { EXAM_TOPICS } from '../constants';

// Use Vite's standard import.meta.env and fail early if the key is missing.
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
if (!apiKey) {
    throw new Error("VITE_GEMINI_API_KEY environment variable not set.");
}

// Initialize the client once.
const genAI = new GoogleGenerativeAI(apiKey);

// This is the detailed prompt you created. It's excellent.
const getPrompt = (options: ExamOptions, questionCount: number): string => {
    const { subject, difficulty, language, topic } = options;
    // ... [Your full, detailed prompt logic from before goes here] ...
    // For brevity, I'm assuming the full prompt text you provided earlier is here.
    // The main point is to generate a detailed prompt string.
    return `
      You are an expert professor setting an exam for the BUET admission test...
      Generate ${questionCount} questions for the subject: ${subject}.
      Difficulty: ${difficulty}.
      Language: ${language}.
      Topics: ${topic.join(', ')}.
      Strictly return a valid JSON array of question objects.
      // ... The rest of your detailed formatting rules ...
  `;
};

// This function parses the JSON response from the AI.
const parseAIResponse = (response: any, expectedCount: number): Question[] => {
    let questions: Question[];
    try {
        const responseText = response.response.text();
        let jsonString = responseText.trim();
        const match = jsonString.match(/```json\s*([\s\S]*?)\s*```/);
        if (match && match[1]) {
            jsonString = match[1];
        }
        if (!jsonString) throw new Error("AI returned an empty response.");
        questions = JSON.parse(jsonString) as Question[];
    } catch (parseError) {
        console.error('Failed to parse AI response:', parseError, "Raw response:", response.response.text());
        throw new Error('RESPONSE_FORMAT_ERROR');
    }
    if (!Array.isArray(questions) || questions.length === 0) throw new Error('RESPONSE_FORMAT_ERROR');
    return questions;
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// This is the main function your app will call.
export const generateQuestions = async (options: ExamOptions, questionCount: number): Promise<Question[]> => {
    const MAX_RETRIES = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            const promptText = getPrompt(options, questionCount);
            const model = genAI.getGenerativeModel({ model: "gemini-pro" }); // Using the stable gemini-pro model

            const safetySettings = [
                { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
                { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
                { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
                { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
            ];

            const contents: Content[] = [{ role: "user", parts: [{ text: promptText }] }];

            const response = await model.generateContent({ contents, safetySettings });

            return parseAIResponse(response, questionCount);

        } catch (error) {
            lastError = error as Error;
            console.error(`Error generating questions (Attempt ${attempt}/${MAX_RETRIES}):`, error);
            if (attempt < MAX_RETRIES) await sleep(2000); // Wait 2 seconds before retrying
        }
    }
    console.error('All retries failed.');
    throw lastError || new Error('GENERATION_FAILED');
};
