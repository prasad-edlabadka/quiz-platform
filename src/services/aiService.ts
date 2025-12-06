import { GoogleGenerativeAI } from '@google/generative-ai';
import type { QuizConfig } from '../types/quiz';

const QUIZ_SCHEMA = `
{
  "title": "string",
  "description": "string",
  "globalTimeLimit": "number (in seconds, optional)",
  "shuffleQuestions": "boolean (optional)",
  "theme": {
    "primaryColor": "string (hex)",
    "backgroundColor": "string (hex)"
  },
  "questions": [
    {
      "content": "string (Markdown supported, can include LaTeX)",
      "type": "single_choice" | "multiple_choice",
      "options": [
        {
          "content": "string",
          "isCorrect": boolean
        }
      ],
      "timeLimit": "number (seconds, optional)",
      "justification": "string (explanation for the answer)"
    }
  ]
}
`;

export const generateQuizFromSyllabus = async (apiKey: string, syllabus: string, questionCount: number = 5): Promise<QuizConfig> => {
  if (!apiKey) {
    throw new Error('API Key is required');
  }
  if (!syllabus) {
    throw new Error('Syllabus content is required');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `
    You are an expert educational content creator. Create a quiz based on the following syllabus/topic list.
    
    SYLLABUS:
    "${syllabus}"
    
    REQUIREMENTS:
    1. Create exactly ${questionCount} high-quality questions relevant to the syllabus.
    2. Questions should vary in difficulty.
    3. Include at least one question involving math/logic if applicable to the topic, using LaTeX format (e.g. $x^2$).
    4. Provide detailed justifications for the correct answers.
    5. Suggest a modern, clean color theme (primary and background colors) suitable for the topic.
    
    OUTPUT FORMAT:
    Return ONLY a valid JSON object matching the following structure. Do not include markdown code fence blocks (like \`\`\`json). Return just the raw JSON string.
    
    STRUCTURE:
    ${QUIZ_SCHEMA}
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Clean up potential markdown formatting if the model adds it despite instructions
    const cleanJson = text.replace(/```json\n?|\n?```/g, '').trim();
    
    const quizData = JSON.parse(cleanJson);
    
    // Auto-generate IDs if missing (model might skip them to save tokens)
    return {
      ...quizData,
      id: quizData.id || `gen-quiz-${Date.now()}`,
      questions: quizData.questions.map((q: any, i: number) => ({
        ...q,
        id: q.id || `q-${i + 1}`,
        options: q.options.map((opt: any, j: number) => ({
          ...opt,
          id: opt.id || `opt-${i}-${j}`
        }))
      }))
    } as QuizConfig;

  } catch (error: any) {
    console.error("AI Generation Error:", error);
    throw new Error(error.message || "Failed to generate quiz. Please check your API key and try again.");
  }
};
