import { GoogleGenerativeAI } from '@google/generative-ai';
import type { TestConfig } from '../types/test';



export type QuestionTypeFilter = 'mixed' | 'mcq' | 'text';
export type StructureMode = 'flat' | 'sections';
export type TimeBoundMode = 'none' | 'overall' | 'per_question' | 'both';
export type ApiKeyStatus = 'unknown' | 'checking' | 'valid' | 'invalid';

/**
 * Fixes invalid JSON escape sequences produced by LLMs (e.g. \{ \+ \l from LaTeX)
 * without corrupting already-valid escape sequences like \\ or \n.
 *
 * The previous regex approach was broken: it would match the second \ in a valid
 * \\\ pair and then process \{ as a single invalid escape, turning \\ { into \\\{ which
 * is itself invalid on re-parse. This state machine processes \  characters in order,
 * treating every valid two-char escape as a single atomic unit.
 */
const fixJsonEscapes = (json: string): string => {
  const validSingleEscapes = new Set(['"', '\\', '/', 'b', 'f', 'n', 'r', 't']);
  let result = '';
  let i = 0;
  while (i < json.length) {
    if (json[i] === '\\') {
      const next = json[i + 1];
      if (next === undefined) {
        // Trailing lone backslash - discard it
        i++;
      } else if (validSingleEscapes.has(next)) {
        // Valid single-char escape (includes \\) — keep as-is and skip both chars
        result += json[i] + next;
        i += 2;
      } else if (next === 'u' && /^[0-9a-fA-F]{4}$/.test(json.slice(i + 2, i + 6))) {
        // Valid unicode escape \uXXXX — keep as-is
        result += json.slice(i, i + 6);
        i += 6;
      } else {
        // Invalid escape (e.g. \{ \l \+ \R) — double the backslash to make it valid
        result += '\\\\' + next;
        i += 2;
      }
    } else {
      result += json[i];
      i++;
    }
  }
  return result;
};

/**
 * Pings the Gemini API with a minimal prompt to verify the API key is active and valid.
 */
export const validateApiKey = async (apiKey: string): Promise<ApiKeyStatus> => {
  if (!apiKey || !apiKey.trim()) return 'invalid';
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    await model.generateContent('ping');
    return 'valid';
  } catch (error: any) {
    const msg: string = (error.message || '').toLowerCase();
    // Only flag as INVALID for clear authentication failures
    const isAuthError =
      msg.includes('api_key_invalid') ||
      msg.includes('api key not valid') ||
      msg.includes('invalid api key') ||
      msg.includes('unauthorized') ||
      (msg.includes('401') && (msg.includes('key') || msg.includes('auth'))) ||
      (msg.includes('403') && !msg.includes('quota'));
    if (isAuthError) return 'invalid';
    // Everything else (quota, model not found, network, etc.) → key is fine
    return 'valid';
  }
};

  // Fallback models in order of preference (based on available quota)
  const MODELS = [
    "gemini-1.5-flash", 
    "gemini-2.0-flash", 
    "gemini-1.5-pro",
    "gemini-2.5-flash", 
    "gemini-2.5-flash-lite", 
    "gemini-3-flash"
  ];

  const runWithFallback = async (apiKey: string, parts: any[] | string): Promise<string> => {
      const genAI = new GoogleGenerativeAI(apiKey);
      const promptParts = typeof parts === 'string' ? [{ text: parts }] : parts;
      
      let lastError: any;
      for (const modelName of MODELS) {
          try {
              console.log(`[AI] Attempting task with model: ${modelName}`);
              const model = genAI.getGenerativeModel({ model: modelName });
              const result = await model.generateContent(promptParts);
              const response = await result.response;
              const text = response.text();
              
              if (text) {
                  console.log(`[AI] Success with ${modelName}. Response length: ${text.length}`);
                  return text;
              }
          } catch (error: any) {
              const isQuotaError = error.message?.toLowerCase().includes('quota') || error.message?.includes('429');
              console.warn(`[AI] Model ${modelName} failed ${isQuotaError ? '(QUOTA)' : ''}:`, error.message);
              lastError = error;
              // If it's not a quota error or transient error, we might want to still try others
          }
      }
      
      const FinalErrorMessage = lastError?.message || "All AI models failed to respond.";
      console.error(`[AI] Final Failure: ${FinalErrorMessage}`);
      throw new Error(FinalErrorMessage);
  };

  const generateWithFallback = async (apiKey: string, prompt: string): Promise<string> => {
      return runWithFallback(apiKey, prompt);
  };

  export const generateTestFromSyllabus = async (
    apiKey: string, 
    syllabus: string, 
    questionCount: number = 5,
    structure: StructureMode = 'flat',
    questionType: QuestionTypeFilter = 'mixed',
    timeBoundMode: TimeBoundMode = 'none'
): Promise<TestConfig> => {
  if (!apiKey) throw new Error('API Key is required');
  if (!syllabus) throw new Error('Syllabus content is required');

  // Dynamic Schema Construction
  const includeQuestionTime = timeBoundMode === 'per_question' || timeBoundMode === 'both';
  const includeGlobalTime = timeBoundMode === 'overall' || timeBoundMode === 'both';

  const QUESTION_SCHEMA = `
    {
      "content": "string (Markdown supported, can include LaTeX)",
      "type": "${questionType === 'mixed' ? 'single_choice OR multiple_choice OR text' : questionType === 'text' ? 'text' : 'single_choice OR multiple_choice'}",
      ${questionType !== 'text' ? `"options": [
        { "content": "string", "isCorrect": boolean }
      ],` : ''}
      "justification": "string (explanation)"${includeQuestionTime ? `,
      "timeLimit": "number (seconds, based on difficulty/complexity of this question)"` : ''}
    }
  `;

  let FINAL_SCHEMA;
  if (structure === 'sections') {
      FINAL_SCHEMA = `
      {
        "title": "string",
        "description": "string",${includeGlobalTime ? `
        "globalTimeLimit": "number (seconds, sum of estimated time across all questions/sections)",` : ''}
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
        "description": "string",${includeGlobalTime ? `
        "globalTimeLimit": "number (seconds, sum of estimated time across all questions)",` : ''}
        "questions": [ ${QUESTION_SCHEMA} ]
      }
      `;
  }

  const timeInstruction = timeBoundMode !== 'none' 
    ? 'If time limits are requested in the schema, analyze the difficulty, required cognitive steps, and reading length of each question/topic to assign a realistic number of seconds.'
    : '';

  const typeInstruction = questionType === 'text' 
    ? 'Create ONLY open-ended text questions (no options).' 
    : questionType === 'mcq' 
        ? 'Create ONLY multiple-choice questions with options.' 
        : 'Create a mix of multiple-choice and text questions.';

  const structureInstruction = structure === 'sections'
    ? 'Group questions into logical Sections. Each section MUST have "content" (a reading passage, case study, or context) and a set of related questions.'
    : 'Create a flat list of questions.';

  const prompt = `
    You are an expert International Baccalaureate (IB) Examiner and educational content creator. Create a test based on the following syllabus.
    
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
    ${timeInstruction ? `8. ${timeInstruction}` : ''}
    
    CONTENT SAFETY:
    If the syllabus content is offensive, illegal, promotes self-harm, sexually explicit, related to sex, pornography or is otherwise inappropriate for an educational tool, you MUST NOT generate questions. Instead, return ONLY the following JSON object:
    { "error": "safety_violation", "message": "This content is inappropriate for study practice. Please provide a different topic." }

    OUTPUT FORMAT:
    Return ONLY a valid JSON object matching the detailed structure below (or the safety rejection object above).
    
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
    
    // Sanitize JSON
    cleanJson = fixJsonEscapes(cleanJson);

    console.log("Cleaned JSON: ", cleanJson);
    
    const testData = JSON.parse(cleanJson);

    // Handle safety rejection
    if (testData.error === 'safety_violation') {
      throw new Error(testData.message || "This content is not allowed.");
    }
    
    // Auto-generate IDs if missing (model might skip them to save tokens)
    // Auto-generate IDs if missing
    const processedTest: any = {
      ...testData,
      id: testData.id || `gen-test-${Date.now()}`
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

    if (testData.sections) {
        const flattenedBroadQuestions: any[] = [];
        
        processedTest.sections = testData.sections.map((section: any, i: number) => {
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
        processedTest.questions = [...flattenedBroadQuestions];
        
    } else if (testData.questions) {
        processedTest.questions = processQuestions(testData.questions);
    } else {
        processedTest.questions = [];
    }

    return processedTest as TestConfig;

  } catch (error: any) {
    throw new Error(error.message || "Failed to generate test. Please check your API key and try again.");
  }
};

/**
 * Extracts a structured TestConfig from a supplied PDF file using Gemini's multimodal capabilities.
 */
export const extractTestConfigFromPDF = async (
    apiKey: string,
    pdfBase64: string
): Promise<TestConfig> => {
    if (!apiKey) throw new Error('API Key is required');
    if (!pdfBase64) throw new Error('PDF content is required');

    // Similar schema as generation but strictly for extraction
    const EXTRACT_SCHEMA = `
    {
      "title": "string (extract from pdf title if possible, else 'Extracted Test')",
      "description": "string",
      "questions": [
        {
          "content": "string (Markdown supported, can include LaTeX)",
          "type": "single_choice OR multiple_choice OR text",
          "options": [
            { "content": "string", "isCorrect": boolean }
          ],
          "justification": "string (explanation/markscheme of correct answer)"
        }
      ]
    }
    `;

    const prompt = `
      You are an expert International Baccalaureate (IB) Examiner and educational content creator.
      Your task is to carefully read the provided PDF test paper/worksheet and extract EVERY question exactly as it appears.
      
      INSTRUCTIONS:
      1. Extract ALL questions from the PDF.
      2. If a question is multiple choice, extract all options and mark the correct one if possible (otherwise guess intelligently or mark first as true).
      3. If a question is open-ended, set type to "text" and omit options.
      4. Auto-generate a "justification" (markscheme/explanation) for every question to help with automated grading later.
      5. Include math equations using LaTeX formats where appropriate (use $x^2$ and double escape backslashes e.g. \\\\frac).
      6. Do NOT invent new questions. ONLY extract what is in the document.
      
      CONTENT SAFETY:
      If the PDF content is offensive, illegal, promotes self-harm, or is otherwise inappropriate for an educational tool, you MUST NOT extract questions. Instead, return ONLY the following JSON object:
      { "error": "safety_violation", "message": "This PDF contains content that is inappropriate for study practice. Please upload a different file." }

      OUTPUT FORMAT:
      Return ONLY a valid JSON object matching this schema (or the safety rejection object above):
      ${EXTRACT_SCHEMA}
    `;

    const parts = [
        { text: prompt },
        {
            inlineData: {
                data: pdfBase64,
                mimeType: "application/pdf"
            }
        }
    ];

    try {
        const text = await runWithFallback(apiKey, parts);


        let cleanJson = text.replace(/```json\n?|\n?```/g, '').trim();
        const firstBrace = cleanJson.indexOf('{');
        const lastBrace = cleanJson.lastIndexOf('}');
        if (firstBrace >= 0 && lastBrace > firstBrace) {
            cleanJson = cleanJson.substring(firstBrace, lastBrace + 1);
        }

        // Sanitize JSON using state-machine (handles properly double-escaped LaTeX correctly)
        cleanJson = fixJsonEscapes(cleanJson);

        const testData = JSON.parse(cleanJson);

        // Handle safety rejection
        if (testData.error === 'safety_violation') {
          throw new Error(testData.message || "This content is not allowed.");
        }

        const processedTest: any = {
            ...testData,
            id: `extracted-${Date.now()}`,
            questions: testData.questions?.map((q: any, i: number) => ({
                ...q,
                id: `eq-${i + 1}`,
                points: q.points || 1,
                options: q.options?.map((opt: any, j: number) => ({
                    ...opt,
                    id: `eopt-${i}-${j}`
                })) || []
            })) || []
        };

        return processedTest as TestConfig;
    } catch (error: any) {
        throw new Error(error.message || "Failed to extract test from PDF.");
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

        // Sanitize JSON
        cleanJson = fixJsonEscapes(cleanJson);

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

        // Sanitize JSON
        cleanJson = fixJsonEscapes(cleanJson);

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

/**
 * Evaluates student's handwritten work from uploaded images against the provided test configuration.
 * Uses Gemini's vision capabilities.
 */
export const evaluateOfflineImages = async (
    apiKey: string,
    testConfig: TestConfig,
    imagesBase64: string[] // Array of base64 data URLs: "data:image/jpeg;base64,..."
): Promise<Record<string, { score: number; feedback: string; maxScore: number }>> => {
    if (!apiKey) throw new Error('API Key is required for grading');
    if (!imagesBase64 || imagesBase64.length === 0) throw new Error('At least one image is required');
    if (!testConfig || !testConfig.questions) throw new Error('Test configuration is required');

    // Build parts array for the Gemini model
    const parts: any[] = [];
    
    const promptText = `
      You are an expert International Baccalaureate (IB) Examiner grading a student's handwritten test submission.
      
      INSTRUCTIONS:
      1. Review the provided images of the student's handwritten work.
      2. Match the handwritten answers to the corresponding questions from the test paper provided below.
      3. Evaluate EACH identified student answer based on IB assessment criteria (Knowledge & Understanding, Application, Communication).
      4. Give a score between 0 and the MAX POINTS for that question. If the answer is completely missing, give 0.
      5. Provide concise, constructive feedback in the style of an IB Markscheme (e.g., "Award [1] for...").
      6. CRITICAL: If the answer is incorrect or incomplete, EXPLICITLY state what the correct answer should be.
      
      TEST PAPER CONFIGURATION (JSON):
      ${JSON.stringify({ 
        title: testConfig.title, 
        questions: testConfig.questions.map(q => ({
            id: q.id,
            content: q.content,
            justification: q.justification,
            points: q.points || 1,
            options: q.options?.map(o => ({ content: o.content, isCorrect: o.isCorrect }))
        }))
      })}
      
      OUTPUT FORMAT:
      Return ONLY a valid JSON object mapping Question IDs to their evaluation.
      If you cannot find an answer for a specific question, omit it from the evaluations or give it a score of 0 with feedback "No answer found in the uploaded sheets".
      
      Structure:
      {
        "evaluations": {
          "question_id_1": { "score": number, "feedback": "string" },
          "question_id_2": { "score": number, "feedback": "string" }
        }
      }
    `;

    parts.push({ text: promptText });

    // Assuming imagesBase64 are in format "data:image/jpeg;base64,..."
    for (const dataUrl of imagesBase64) {
        // Extract mime type and base64 data
        const matches = dataUrl.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
            const mimeType = matches[1];
            const base64Data = matches[2];
            parts.push({
                inlineData: {
                    data: base64Data,
                    mimeType: mimeType
                }
            });
        } else {
             console.warn("Invalid image data URL format encountered, skipping.");
        }
    }

    try {
        const text = await runWithFallback(apiKey, parts);


        let cleanJson = text.replace(/```json\n?|\n?```/g, '').trim();
        const firstBrace = cleanJson.indexOf('{');
        const lastBrace = cleanJson.lastIndexOf('}');
        if (firstBrace >= 0 && lastBrace > firstBrace) {
            cleanJson = cleanJson.substring(firstBrace, lastBrace + 1);
        }

        // Sanitize JSON
        cleanJson = fixJsonEscapes(cleanJson);

        const data = JSON.parse(cleanJson);
        const evaluations = data.evaluations || {};
        
        // Normalize result against testConfig to ensure maxScore is correct
        const finalResults: Record<string, any> = {};
        testConfig.questions.forEach(q => {
            if (evaluations[q.id]) {
                const evalData = evaluations[q.id];
                finalResults[q.id] = {
                    score: typeof evalData?.score === 'number' ? evalData.score : 0,
                    feedback: evalData?.feedback || "Evaluation failed or not provided.",
                    maxScore: q.points || 1
                };
            }
        });

        return finalResults;

    } catch (error: any) {
        console.error("Offline Grading Error:", error);
        throw new Error("Failed to evaluate uploaded sheets. " + error.message);
    }
};
