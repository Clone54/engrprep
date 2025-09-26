// Implementing the Gemini API service to generate exam questions.
import { GoogleGenAI, GenerateContentResponse, HarmCategory, HarmBlockThreshold } from '@google/genai';
import { ExamOptions, Question, Language, Subject, Difficulty } from '../types';
import { EXAM_TOPICS } from '../constants';

// Initialize the GoogleGenAI client with the API key from environment variables.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

const getPrompt = (options: ExamOptions, questionCount: number): string => {
    const { subject, difficulty, language, topic } = options;

    let languageInstruction = language === Language.Bengali
        ? 'The entire response, including questions, options, answers, and explanations, must be in Bengali.'
        : 'The entire response must be in English.';

    // The English subject test must always be in English.
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
        const topicNames = topic.map(tKey => EXAM_TOPICS[subject as Subject][tKey]?.en || tKey).join(', ');
        topicInstruction = `**Strict Topic Adherence:** Generate questions ONLY from the specified list of topics: **${topicNames}**. All questions must belong to one of these topics within the subject of ${subject}.`;
    }

    return `
      You are an expert professor setting an exam for the BUET (Bangladesh University of Engineering and Technology) admission test.
      Generate ${questionCount} multiple-choice questions for a practice exam.

      **Standard & Style:**
      The questions must be of a very high engineering standard. They must be analytical and require deep conceptual understanding and problem-solving skills, typical for a highly competitive engineering university admission test like the BUET exam. 
      
      **Non-Negotiable Rules for Question Quality:**
      1.  **NO simple recall questions.** Do not ask for simple definitions or facts.
      2.  **ALL questions must involve calculation, deep conceptual analysis, or multi-step problem-solving (for science subjects).**
      3.  **The context must be strictly related to engineering principles and applications.**
      4.  Avoid simple, fact-based, or medical-style recall questions. Questions should challenge the student's ability to apply formulas and concepts to complex scenarios.

      **Strict Subject Adherence (Crucial):**
      Generate questions ONLY for the specified subject: **${subject}**.
      DO NOT include questions from other subjects. For example, if the subject is Physics, every single question must be a Physics question.

      ${topicInstruction}

      **Subject Specifics:**
      - For ${subject}: Focus on application of principles, numerical problems, and conceptual analysis relevant to engineering curricula. For example, for Physics, focus on mechanics, electromagnetism, thermodynamics, and modern physics. For Chemistry, focus on physical chemistry problems, reaction mechanisms, and stoichiometry. For Math, focus on complex problem-solving, calculus, mechanics, and analytical geometry.
      - For English: Focus on advanced grammar, nuanced vocabulary (synonyms, antonyms, analogies), sentence completion, error detection, and short reading comprehension passages. The standard should be high, suitable for top-tier engineering university admission tests. Questions should test analytical language skills, not just rote memorization.

      ${difficultyInstruction}

      **JSON Formatting and Content Rules (ABSOLUTELY CRITICAL):**
      Your entire output must be a single, valid JSON array of question objects. Follow these rules perfectly. Any error will make the entire response unusable.

      **1. Internal Correction & Explanation Purity (MANDATORY):**
          - Your internal process: First, generate a question, options, answer, and a step-by-step explanation.
          - Second, INTERNALLY and SILENTLY verify that your explanation's final result perfectly matches the chosen 'answer' from the 'options' array.
          - If you find ANY discrepancy, you MUST fix it internally before generating the final JSON. Modify the question, options, or your own calculation until they are all consistent.
          - **CRITICAL OUTPUT RULE:** The "explanation" string in the final JSON must be a clean, direct, step-by-step derivation for the student. It MUST NOT contain ANY of your internal monologue, self-correction narrative (e.g., "Wait, I made a mistake..."), or discussions about ambiguity. Just provide the final, correct explanation.

      **2. "options" Array Formatting (MANDATORY):**
          - The "options" value must be an array of exactly 4 strings.
          - Each string must contain ONLY the option text itself.
          - DO NOT include prefixes like "A.", "B.", "1)".
          - **Correct:** '["$10\\\\\\\\mathrm{ N}$", "$20\\\\\\\\mathrm{ N}$", "$30\\\\\\\\mathrm{ N}$", "$40\\\\\\\\mathrm{ N}$"]'
          - **INCORRECT:** '["A. $10\\\\\\\\mathrm{ N}$", "B. $20\\\\\\\\mathrm{ N}$", "C. $30\\\\\\\\mathrm{ N}$", "D. $40\\\\\\\\mathrm{ N}$"]'

      **3. "answer" Field Formatting (MANDATORY):**
          - The "answer" string must be an EXACT, case-sensitive match to one of the strings in the "options" array.
          - It must NOT contain any prefix.
          - **Correct:** If an option is '"$10\\\\\\\\mathrm{ N}$"', the answer must be '"$10\\\\\\\\mathrm{ N}$"'.
          - **INCORRECT:** '"A. $10\\\\\\\\mathrm{ N}$"'

      **4. LaTeX Backslash Escaping (MANDATORY):**
          - Inside ALL JSON strings, every single backslash '\\' character used in a LaTeX command must be escaped with another backslash.
          - '\\command' MUST be written as '\\\\command' in the JSON.
          - **Correct:** '"$\\\\\\\\frac{a}{b}$"'
          - **INCORRECT:** '"$\\\\frac{a}{b}$"'
          
      **5. LaTeX Number and Unit Formatting (MANDATORY):**
          - When writing a number followed by a unit in LaTeX, there MUST be a space between the number and the unit command.
          - Use '\\\\mathrm{...}' for units to ensure they are rendered in an upright font, which is standard for scientific notation. Do NOT use '\\\\text{...}' for units.
          - **Correct Example:** '"A force of $10 \\\\mathrm{ N}$"'
          - **INCORRECT:** '"A force of $10\\\\mathrm{N}$"' (missing space)
          - **INCORRECT:** '"A force of $10 \\\\text{N}$"' (missing backslash, space, and using wrong command)

      **6. Newlines in Explanations (MANDATORY):**
          - To create a line break within the "explanation" string, you MUST use the '\\\\n' sequence.
          - **INCORRECT (will break the JSON):** A literal newline character inside the string.
          - **Correct:** '"First line.\\\\\\\\nSecond line."'

      **Complete Example of a PERFECTLY Formatted Question Object:**
      \`\`\`json
      {
        "question": "একটি $2 \\\\\\\\mathrm{ kg}$ ভরের বস্তু $10 \\\\\\\\mathrm{ m/s}$ বেগে চলছে। এর গতিশক্তি কত?",
        "options": [
          "$50 \\\\\\\\mathrm{ J}$",
          "$100 \\\\\\\\mathrm{ J}$",
          "$150 \\\\\\\\mathrm{ J}$",
          "$200 \\\\\\\\mathrm{ J}$"
        ],
        "answer": "$100 \\\\\\\\mathrm{ J}$",
        "explanation": "গতিশক্তির সূত্র হলো $K = \\\\\\\\frac{1}{2}mv^2$।\\\\\\\\nপ্রদত্ত মানগুলি হলো:\\\\\\\\n$m = 2 \\\\\\\\mathrm{ kg}$\\\\\\\\n$v = 10 \\\\\\\\mathrm{ m/s}$\\\\\\\\n$K = \\\\\\\\frac{1}{2} \\\\\\\\times 2 \\\\\\\\times (10)^2 = 100 \\\\\\\\mathrm{ J}$।",
        "topic": "কাজ, শক্তি ও ক্ষমতা",
        "difficulty": "Easy"
      }
      \`\`\`

      ${languageInstruction}

      Return the response as a valid JSON array of question objects, enclosed in a single JSON code block.
  `;
};

const parseAIResponse = (response: GenerateContentResponse, expectedCount: number): Question[] => {
    let questions: Question[];
    try {
        let jsonString = response.text.trim();
        // The AI might wrap the JSON in ```json ... ```. We extract it.
        const match = jsonString.match(/```json\s*([\s\S]*?)\s*```/);
        if (match && match[1]) {
            jsonString = match[1];
        }

        if (!jsonString) {
            throw new Error("AI returned an empty response.");
        }
        questions = JSON.parse(jsonString) as Question[];
    } catch (parseError) {
        console.error('Failed to parse AI response:', parseError, "Raw response:", response.text);
        throw new Error('RESPONSE_FORMAT_ERROR');
    }

    if (!Array.isArray(questions) || questions.length === 0) {
        console.warn('AI returned a non-array or empty array for questions.', questions);
        throw new Error('RESPONSE_FORMAT_ERROR');
    }
    
    if (questions.length > expectedCount) {
        questions = questions.slice(0, expectedCount);
    }

    const firstQ = questions[0];
    if (!firstQ.question || !firstQ.options || !firstQ.answer || !firstQ.explanation || !firstQ.difficulty) {
        console.warn('AI returned incomplete question data.', firstQ);
        throw new Error('RESPONSE_FORMAT_ERROR');
    }

    // Clean up prefixes from options and answer if the model still includes them
    return questions.map(q => {
        const cleanedOptions = q.options.map(opt => 
            typeof opt === 'string' ? opt.replace(/^[A-D]\.\s*/, '') : opt
        );
        const cleanedAnswer = typeof q.answer === 'string' ? q.answer.replace(/^[A-D]\.\s*/, '') : q.answer;
        
        return { ...q, options: cleanedOptions, answer: cleanedAnswer };
    });
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const generateQuestions = async (options: ExamOptions, questionCount: number): Promise<Question[]> => {
    const MAX_RETRIES = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            const prompt = getPrompt(options, questionCount);
            
            const safetySettings = [
                {
                    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
                    threshold: HarmBlockThreshold.BLOCK_NONE,
                },
                {
                    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                    threshold: HarmBlockThreshold.BLOCK_NONE,
                },
                {
                    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
                    threshold: HarmBlockThreshold.BLOCK_NONE,
                },
                {
                    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                    threshold: HarmBlockThreshold.BLOCK_NONE,
                },
            ];

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                safetySettings,
            });
            return parseAIResponse(response, questionCount);

        } catch (error) {
            lastError = error as Error;
            console.error(`Error generating questions (Attempt ${attempt}/${MAX_RETRIES}):`, error);

            // Do not retry for specific client-side or persistent errors that won't resolve.
            if (lastError.message.startsWith('RESPONSE_FORMAT_ERROR') || lastError.message.toLowerCase().includes('api key')) {
                break; 
            }

            if (attempt < MAX_RETRIES) {
                const delay = Math.pow(2, attempt) * 1000; // Exponential backoff: 2s, 4s
                console.log(`Retrying in ${delay / 1000} seconds...`);
                await sleep(delay);
            }
        }
    }

    // If all retries fail, throw a categorized error based on the last one seen.
    console.error('All retries failed. Throwing last captured error.');
    if (lastError) {
        if (lastError.message.startsWith('RESPONSE_FORMAT_ERROR')) {
            throw new Error('RESPONSE_FORMAT_ERROR');
        }
        if (lastError.message.toLowerCase().includes('api key')) {
            throw new Error('API_KEY_ERROR');
        }
        if (lastError.name === 'AbortError' || lastError.message.toLowerCase().includes('network') || lastError.message.toLowerCase().includes('failed to fetch') || lastError.message.toLowerCase().includes('rpc failed')) {
            throw new Error('NETWORK_ERROR');
        }
    }
    
    // Generic fallback for any other error after retries (e.g., a 500 server error).
    throw new Error('GENERATION_FAILED');
};