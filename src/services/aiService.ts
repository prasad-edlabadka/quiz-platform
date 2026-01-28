import { GoogleGenerativeAI } from '@google/generative-ai';
import type { QuizConfig } from '../types/quiz';



export type QuestionTypeFilter = 'mixed' | 'mcq' | 'text';
export type StructureMode = 'flat' | 'sections';

  // Fallback models in order of preference (based on available quota)
  const MODELS = ["gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-3-flash"];

  const generateWithFallback = async (apiKey: string, prompt: string): Promise<string> => {
      const genAI = new GoogleGenerativeAI(apiKey);
      
      let lastError: any;
      for (const modelName of MODELS) {
          try {
              console.log(`Attempting generation with model: ${modelName}`);
              const model = genAI.getGenerativeModel({ model: modelName });
              const result = await model.generateContent(prompt);
              const response = await result.response;
              return response.text();
          } catch (error: any) {
              console.warn(`Model ${modelName} failed:`, error.message);
              lastError = error;
              // Continue to next model if available
          }
      }
      throw new Error(lastError?.message || "All models failed to generate content.");
  };

  export const generateQuizFromSyllabus = async (
    apiKey: string, 
    syllabus: string, 
    questionCount: number = 5,
    structure: StructureMode = 'flat',
    questionType: QuestionTypeFilter = 'mixed'
): Promise<QuizConfig> => {
  if (!apiKey) throw new Error('API Key is required');
  if (!syllabus) throw new Error('Syllabus content is required');

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
    You are an expert International Baccalaureate (IB) Examiner and educational content creator. Create a quiz based on the following syllabus.
    
    SYLLABUS:
    "${syllabus}"
    
    REQUIREMENTS:
    1. Create exactly ${questionCount} high-quality questions.
    2. ${typeInstruction}
    3. ${structureInstruction}
    4. IB STYLE: Use IB command terms (e.g., Define, Explain, Calculate, Discuss, Evaluate, Justify) in the questions. Ensure rigor matches IB Diploma Programme (DP) or Middle Years Programme (MYP) standards.
    5. Include at least one math/logic question if relevant (use LaTeX $x^2$).
    6. Double-escape backslashes in LaTeX (e.g. \\\\frac).
    7. CRITICAL: Do NOT include any 'imageUrl' fields or references to images. Use descriptive text or ASCII diagrams if needed.
    
    OUTPUT FORMAT:
    Return ONLY a valid JSON object matching the detailed structure below.
    
    STRUCTURE:
    ${FINAL_SCHEMA}
  `;



  try {
    const text = await generateWithFallback(apiKey, prompt);
    
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
    throw new Error(error.message || "Failed to generate quiz. Please check your API key and try again.");
  }
};




export const evaluateTextAnswer = async (
    apiKey: string,
    question: any,
    userAnswer: string,
    studentComments?: string // New optional parameter
): Promise<{ score: number; feedback: string; maxScore: number }> => {
    if (!apiKey) throw new Error('API Key is required for grading');
    if (!userAnswer || !userAnswer.trim()) return { score: 0, feedback: "No answer provided.", maxScore: question.points || 1 };

    // Specialized prompt for Appeals vs Initial Grading
    const isAppeal = !!studentComments;
    const instructionPrefix = isAppeal 
        ? "You are reviewing a grade appeal from a student." 
        : "You are an expert International Baccalaureate (IB) Examiner grading a student's answer.";

    const appealContext = isAppeal 
        ? `\nSTUDENT APPEAL COMMENT: "${studentComments}"\n\nINSTRUCTION: The student disagrees with the previous assessment or wants to clarify their answer. Re-evaluate the answer carefully. If the student's explanation justifies a higher mark based on IB criteria, adjust the score. If not, explain clearly why.` 
        : "";

    const prompt = `
      ${instructionPrefix}
      
      QUESTION:
      "${question.content}"
      
      CONTEXT/SECTION CONTENT (if any):
      "${question.sectionContent || 'N/A'}"
      
      EXPECTED ANSWER / JUSTIFICATION:
      "${question.justification || 'N/A'}"
      
      STUDENT ANSWER:
      "${userAnswer}"
      
      MAX POINTS: ${question.points || 1}
      ${appealContext}
      
      STANDARD INSTRUCTIONS:
      Evaluate the student's answer based on IB assessment criteria (Knowledge & Understanding, Application, Communication).
      Give a score between 0 and ${question.points || 1}.
      Provide concise, constructive feedback in the style of an IB Markscheme.
      CRITICAL: If the answer is incorrect or incomplete, EXPLICITLY state what the correct answer should be.
      
      OUTPUT JSON ONLY:
      {
        "score": number,
        "feedback": "string"
      }
    `;



    try {
        const text = await generateWithFallback(apiKey, prompt);
        
        let cleanJson = text.replace(/```json\n?|\n?```/g, '').trim();
        const firstBrace = cleanJson.indexOf('{');
        const lastBrace = cleanJson.lastIndexOf('}');
        if (firstBrace >= 0 && lastBrace > firstBrace) {
            cleanJson = cleanJson.substring(firstBrace, lastBrace + 1);
        }

        const data = JSON.parse(cleanJson);
        return {
            score: typeof data.score === 'number' ? data.score : 0,
            feedback: data.feedback || "Evaluated.",
            maxScore: question.points || 1
        };
    } catch (error: any) {
        console.error("AI Grading Error:", error);
        return {
            score: 0,
            feedback: "Error evaluating answer. Please try again.",
            maxScore: question.points || 1
        };
    }
};

export const evaluateBatchAnswers = async (
    apiKey: string,
    items: { question: any; userAnswer: string }[]
): Promise<Record<string, { score: number; feedback: string; maxScore: number }>> => {
    if (!apiKey) throw new Error('API Key is required for grading');
    if (!items || items.length === 0) return {};

    // Construct a structured prompt for multiple items
    const questionsPayload = items.map((item, index) => `
    [ITEM ${index + 1}]
    ID: "${item.question.id}"
    QUESTION: "${item.question.content}"
    CONTEXT: "${item.question.sectionContent || 'N/A'}"
    EXPECTED ANSWER/JUSTIFICATION: "${item.question.justification || 'N/A'}"
    STUDENT ANSWER: "${item.userAnswer}"
    MAX POINTS: ${item.question.points || 1}
    `).join('\n-----------------------------------\n');

    const prompt = `
      You are an expert International Baccalaureate (IB) Examiner grading a set of student answers.
      
      INSTRUCTIONS:
      1. Evaluate EACH student answer based on IB assessment criteria (Knowledge & Understanding, Application, Communication).
      2. Give a score between 0 and MAX POINTS.
      3. Provide concise, constructive feedback in the style of an IB Markscheme (e.g., "Award [1] for...").
      4. CRITICAL: If the answer is incorrect or incomplete, EXPLICITLY state what the correct answer should be.
      
      INPUT DATA:
      ${questionsPayload}
      
      OUTPUT FORMAT:
      Return ONLY a valid JSON object mapping Question IDs to their evaluation.
      
      Structure:
      {
        "evaluations": {
          "question_id_1": { "score": number, "feedback": "string" },
          "question_id_2": { "score": number, "feedback": "string" }
        }
      }
    `;

    try {
        const text = await generateWithFallback(apiKey, prompt);
        
        let cleanJson = text.replace(/```json\n?|\n?```/g, '').trim();
        const firstBrace = cleanJson.indexOf('{');
        const lastBrace = cleanJson.lastIndexOf('}');
        if (firstBrace >= 0 && lastBrace > firstBrace) {
            cleanJson = cleanJson.substring(firstBrace, lastBrace + 1);
        }

        const data = JSON.parse(cleanJson);
        const evaluations = data.evaluations || {};
        
        // Normalize result
        const finalResults: Record<string, any> = {};
        items.forEach(item => {
            const evalData = evaluations[item.question.id];
            finalResults[item.question.id] = {
                score: typeof evalData?.score === 'number' ? evalData.score : 0,
                feedback: evalData?.feedback || "Evaluation failed or not provided.",
                maxScore: item.question.points || 1
            };
        });

        return finalResults;

    } catch (error: any) {
        console.error("Batch Grading Error:", error);
        // Return empty or error states for all
        return {};
    }
};
