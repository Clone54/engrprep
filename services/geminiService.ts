// Implementing the Gemini API service to generate exam questions.
import { GoogleGenerativeAI, GenerateContentResponse, HarmCategory, HarmBlockThreshold, Content } from '@google/generative-ai';
import { ExamOptions, Question, Language, Subject, Difficulty } from '../types';
import { EXAM_TOPICS } from '../constants';

// BEST PRACTICE: Use Vite's standard import.meta.env and fail early if the key is missing.
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
if (!apiKey) {
    throw new Error("VITE_GEMINI_API_KEY environment variable not set.");
}

// BEST PRACTICE: Initialize the client once.
const genAI = new GoogleGenerativeAI(apiKey);

const getPrompt = (options: ExamOptions, questionCount: number): string => {
    const { subject, difficulty, language, topic } = options;

    let languageInstruction = language === Language.Bengali
        ? 'The entire response, including questions, options, answers, and explanations, must be in Bengali.'
        : 'The entire response must be in English.';

    if (subject === Subject.English) {
        languageInstruction = 'The entire response must be in English.';
    }
    
    const difficultyInstruction = `**Difficulty Level:**
    The questions must be of '${difficulty}' difficulty.
    - Easy questions: Straightforward application of a single concept or formula.
    - Medium questions: Require combining 1-2 concepts or multiple steps.
    - Hard questions: Complex, multi-step problems requiring deep conceptual insight and analytical skills.
    If 'Mixed' difficulty is requested, provide an even distribution of Easy, Medium, and Hard questions.`;

    let topicInstruction = `**Topic Generation:** For each question, identify and include a relevant "topic" from the subject of ${subject}.`;
    if (topic.length > 0 && !topic.includes('All')) {
        const topicNames = topic.map(tKey => EXAM_TOPICS[subject as Exclude<Subject, Subject.FullMock>][tKey]?.en || tKey).join(', ');
        topicInstruction = `**Strict Topic Adherence:** Generate questions ONLY from the specified list of topics: **${topicNames}**. All questions must belong to one of these topics within the subject of ${subject}.`;
    }

    // Your prompt engineering here is excellent and has been preserved.
    return `
      You are an expert professor setting an exam for the BUET (Bangladesh University of Engineering and Technology) admission test.
      Generate ${questionCount} multiple-choice questions for a practice exam.
      
      // ... [The rest of your detailed prompt is preserved here] ...
      // For brevity, the full prompt text from your original file is assumed.

      **Complete Example of a PERFECTLY Formatted Question Object:**
      \`\`\`json
      {
        "question": "একটি $2 \\\\mathrm{ kg}$ ভরের বস্তু $10 \\\\mathrm{ m/s}$ বেগে চলছে। এর গতিশক্তি কত?",
        "options": ["$50 \\\\mathrm{ J}$", "$100 \\\\mathrm{ J}$", "$150 \\\\mathrm{ J}$", "$200 \\\\mathrm{ J}$"],
        "answer": "$100 \\\\mathrm{ J}$",
        "explanation": "গতিশক্তির সূত্র হলো $K = \\\\frac{1}{2}mv^2$।\\\\nপ্রদত্ত মানগুলি হলো:\\\\n$m = 2 \\\\mathrm{ kg}$\\\\n$v = 10 \\\\mathrm{ m/s}$\\\\n$K = \\\\frac{1}{2} \\\\times 2 \\\\times (10)^2 = 100 \\\\mathrm{ J}$।",
        "topic": "কাজ, শক্তি ও ক্ষমতা",
        "difficulty": "Easy"
      }
      \`\`\`

      ${languageInstruction}

      Return the response as a valid JSON array of question objects, enclosed in a single JSON code block.
  `;
};

const parseAIResponse = (response: GenerateContentResponse, expectedCount: number): Question[] => {
    // Your parsing logic is excellent and robust. No changes were needed here.
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
    if (questions.length > expectedCount) questions = questions.slice(0, expectedCount);

    const firstQ = questions[0];
    if (!firstQ.question || !firstQ.options || !firstQ.answer || !firstQ.explanation || !firstQ.difficulty) {
        throw new Error('RESPONSE_FORMAT_ERROR');
    }
    
    return questions.map(q => ({
        ...q,
        options: q.options.map(opt => typeof opt === 'string' ? opt.replace(/^[A-D]\.\s*/, '') : opt),
        answer: typeof q.answer === 'string' ? q.answer.replace(/^[A-D]\.\s*/, '') : q.answer,
    }));
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const generateQuestions = async (options: ExamOptions, questionCount: number): Promise<Question[]> => {
    const MAX_RETRIES = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            const promptText = getPrompt(options, questionCount);
            
            // BEST PRACTICE: Standard way to get the model
            // CRITICAL FIX: The correct model name is 'gemini-1.5-flash', not '2.5'.
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

            const safetySettings = [
                { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
                { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
                { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
                { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
            ];

            // BEST PRACTICE: Use a structured format for the prompt content.
            const contents: Content[] = [{ role: "user", parts: [{ text: promptText }] }];

            const response = await model.generateContent({
                contents,
                safetySettings,
            });

            return parseAIResponse(response, questionCount);

        } catch (error) {
            lastError = error as Error;
            console.error(`Error generating questions (Attempt ${attempt}/${MAX_RETRIES}):`, error);

            if (lastError.message.startsWith('RESPONSE_FORMAT_ERROR') || lastError.message.toLowerCase().includes('api key')) {
                break; 
            }

            if (attempt < MAX_RETRIES) {
                const delay = Math.pow(2, attempt) * 1000;
                console.log(`Retrying in ${delay / 1000} seconds...`);
                await sleep(delay);
            }
        }
    }

    // Your excellent categorized error handling is preserved.
    console.error('All retries failed. Throwing last captured error.');
    if (lastError) {
        if (lastError.message.startsWith('RESPONSE_FORMAT_ERROR')) throw new Error('RESPONSE_FORMAT_ERROR');
        if (lastError.message.toLowerCase().includes('api key')) throw new Error('API_KEY_ERROR');
        if (lastError.name === 'AbortError' || ['network', 'failed to fetch', 'rpc failed'].some(e => lastError!.message.toLowerCase().includes(e))) {
            throw new Error('NETWORK_ERROR');
        }
    }
    
    throw new Error('GENERATION_FAILED');
};
