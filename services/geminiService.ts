import { ExamOptions, Question } from '../types';

// IMPORTANT: Replace this with your actual Cloudflare Worker URL
const WORKER_URL = 'https://engrprep-proxy.engrprep.workers.dev';

// Helper function to clean up the response, as the model might still return it in a markdown block
const parseJsonResponse = (text: string): Question[] => {
    let jsonString = text.trim();
    const match = jsonString.match(/```json\s*([\s\S]*?)\s*```/);
    if (match && match[1]) {
        jsonString = match[1];
    }
    return JSON.parse(jsonString) as Question[];
};

export const generateQuestions = async (options: ExamOptions, questionCount: number): Promise<Question[]> => {
    try {
        const response = await fetch(WORKER_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                options: options,
                questionCount: questionCount,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Error from Cloudflare Worker:", errorText);
            throw new Error('NETWORK_ERROR');
        }

        const responseText = await response.text();
        return parseJsonResponse(responseText);

    } catch (error) {
        console.error("Failed to fetch from worker:", error);
        throw new Error('NETWORK_ERROR');
    }
};
