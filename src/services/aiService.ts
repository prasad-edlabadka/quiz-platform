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

export type QuestionTypeFilter = 'mixed' | 'mcq' | 'text';
export type StructureMode = 'flat' | 'sections';

export const generateQuizFromSyllabus = async (
    apiKey: string, 
    syllabus: string, 
    questionCount: number = 5,
    structure: StructureMode = 'flat',
    questionType: QuestionTypeFilter = 'mixed'
): Promise<QuizConfig> => {
  if (!apiKey) throw new Error('API Key is required');
  if (!syllabus) throw new Error('Syllabus content is required');

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  // Dynamic Schema Construction
  const QUESTION_SCHEMA = `
    {
      "content": "string (Markdown supported, can include LaTeX)",
      "type": "${questionType === 'mixed' ? 'single_choice OR multiple_choice OR text' : questionType === 'text' ? 'text' : 'single_choice OR multiple_choice'}",
      ${questionType !== 'text' ? `"options": [
        { "content": "string", "isCorrect": boolean }
      ],` : ''}
      "justification": "string (explanation)"
    }
  `;

  let FINAL_SCHEMA;
  if (structure === 'sections') {
      FINAL_SCHEMA = `
      {
        "title": "string",
        "description": "string",
        "globalTimeLimit": "number (seconds)",
        "theme": { "primaryColor": "hex", "backgroundColor": "hex" },
        "sections": [
            {
                "id": "string",
                "title": "string",
                "content": "string (Background info/Passage for this section)",
                "questions": [ ${QUESTION_SCHEMA} ]
            }
        ]
      }
      `;
  } else {
      FINAL_SCHEMA = `
      {
        "title": "string",
        "description": "string",
        "globalTimeLimit": "number (seconds)",
        "theme": { "primaryColor": "hex", "backgroundColor": "hex" },
        "questions": [ ${QUESTION_SCHEMA} ]
      }
      `;
  }

  const typeInstruction = questionType === 'text' 
    ? 'Create ONLY open-ended text questions (no options).' 
    : questionType === 'mcq' 
        ? 'Create ONLY multiple-choice questions with options.' 
        : 'Create a mix of multiple-choice and text questions.';

  const structureInstruction = structure === 'sections'
    ? 'Group questions into logical Sections. Each section MUST have "content" (a reading passage, case study, or context) and a set of related questions.'
    : 'Create a flat list of questions.';

  const prompt = `
    You are an expert educational content creator. Create a quiz based on the following syllabus.
    
    SYLLABUS:
    "${syllabus}"
    
    REQUIREMENTS:
    1. Create exactly ${questionCount} high-quality questions.
    2. ${typeInstruction}
    3. ${structureInstruction}
    4. Include at least one math/logic question if relevant (use LaTeX $x^2$).
    5. Double-escape backslashes in LaTeX (e.g. \\\\frac).
    
    OUTPUT FORMAT:
    Return ONLY a valid JSON object matching the detailed structure below.
    
    STRUCTURE:
    ${FINAL_SCHEMA}
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Extract valid JSON using brace counting
    let startIndex = text.indexOf('{');
    let endIndex = -1;
    let cleanJson = '';
    
    if (startIndex >= 0) {
        let braceCount = 0;
        let inString = false;
        let isEscaped = false;
        
        for (let i = startIndex; i < text.length; i++) {
            const char = text[i];
            
            if (inString) {
                if (isEscaped) {
                    isEscaped = false;
                } else if (char === '\\') {
                    isEscaped = true;
                } else if (char === '"') {
                    inString = false;
                }
            } else {
                if (char === '"') {
                    inString = true;
                } else if (char === '{') {
                    braceCount++;
                } else if (char === '}') {
                    braceCount--;
                    if (braceCount === 0) {
                        endIndex = i;
                        break;
                    }
                }
            }
        }
        
        if (endIndex >= 0) {
           cleanJson = text.substring(startIndex, endIndex + 1);
        } else {
           // Fallback to simple cleanup if counting failed (e.g. malformed JSON)
           cleanJson = text.replace(/```json\n?|\n?```/g, '').trim();
           const lastBrace = cleanJson.lastIndexOf('}');
           if (lastBrace > 0) cleanJson = cleanJson.substring(0, lastBrace + 1);
        }
    } else {
       cleanJson = text.replace(/```json\n?|\n?```/g, '').trim();
    }
    
    const quizData = JSON.parse(cleanJson);
    
    // Auto-generate IDs if missing (model might skip them to save tokens)
    // Auto-generate IDs if missing
    const processedQuiz: any = {
      ...quizData,
      id: quizData.id || `gen-quiz-${Date.now()}`
    };

    const processQuestions = (questions: any[], prefix: string = '') => {
        return questions?.map((q: any, i: number) => ({
            ...q,
            id: q.id || `${prefix}q-${i + 1}`,
            options: q.options?.map((opt: any, j: number) => ({
                ...opt,
                id: opt.id || `${prefix}opt-${i}-${j}`
            })) || []
        })) || [];
    };

    if (quizData.sections) {
        const flattenedBroadQuestions: any[] = [];
        
        processedQuiz.sections = quizData.sections.map((section: any, i: number) => {
            const sectionId = section.id || `section-${i + 1}`;
            
            // Process questions for this section
            const sectionQuestions = processQuestions(section.questions, `s${i + 1}-`).map(q => ({
                ...q,
                sectionId: sectionId
            }));

            // Add to flattened list
            flattenedBroadQuestions.push(...sectionQuestions);

            return {
                ...section,
                id: sectionId,
                questions: sectionQuestions // Keep them nested too if needed by schema, but app uses flat
            };
        });

        // Merge flattened section questions with any existing top-level questions
        // CRITICAL FIX: If sections are present, ignore top-level 'questions' to prevent duplicates 
        // (LLM sometimes duplicates content in both places).
        // Only if we explicitly requested mixed content would we merge, but for now, assume Sections > Questions
        processedQuiz.questions = [...flattenedBroadQuestions];
        
    } else if (quizData.questions) {
        processedQuiz.questions = processQuestions(quizData.questions);
    } else {
        processedQuiz.questions = [];
    }

    return processedQuiz as QuizConfig;

  } catch (error: any) {
    console.error("AI Generation Error:", error);
    throw new Error(error.message || "Failed to generate quiz. Please check your API key and try again.");
  }
};
