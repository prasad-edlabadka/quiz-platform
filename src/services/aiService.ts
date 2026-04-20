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
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
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
  "gemini-3.1-pro-preview",      // Top-tier reasoning & agentic tasks
  "gemini-3-flash-preview",      // High speed with frontier-class logic
  "gemini-3.1-flash-lite-preview",// Cost-optimized version of the Flash series
  "gemini-2.5-pro",              // Stable high-reasoning legacy model
  "gemini-2.5-flash",            // Stable high-speed legacy model
  "gemini-2.5-flash-lite"        // Ultra-low latency for simple tasks
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
      "timeLimit": "number (seconds, based on difficulty/complexity of this question)"` : ''},
      "points": "number (total points for the question)",
      "ibCriteria": [
        {
          "criterion": "string (e.g., 'Criterion A: Knowledge and Understanding')",
          "points": "number",
          "expectation": "string (Specific expectation for these points based on IB criteria)"
        }
      ],
      "requiresDiagram": "boolean (true ONLY if the student needs to draw a diagram, graph, or shape to answer)"
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
    
    IB CRITERIA DEFINITIONS:
    - Criterion A (Knowledge/Understanding): Focuses on "what you know." This often involves recalling facts, identifying concepts, and demonstrating fundamental understanding.
    - Criterion B (Investigation/Planning): Focuses on "how you prepare." In sciences, this might be lab design; in math, it’s finding patterns; in design, it’s brainstorming.
    - Criterion C (Communication/Production): Focuses on "how you express it." This measures the quality of your final product, whether it’s a written essay, a math explanation, or a physical performance.
    - Criterion D (Reflection/Application): Focuses on "why it matters." This covers real-world application, critical thinking, and evaluating your own performance or the impact of your work.
    
    REQUIREMENTS:
    1. Create exactly ${questionCount} high-quality questions.
    2. ${typeInstruction}
    3. ${structureInstruction}
    4. IB STYLE: Use IB command terms (e.g., Define, Explain, Calculate, Discuss, Evaluate, Justify) in the questions. Ensure rigor matches IB Diploma Programme (DP) or Middle Years Programme (MYP) standards.
    5. CRITERIA & POINTS: Assign points dynamically based on complexity, answer length, and IB criteria. Include the 'ibCriteria' array mapping specific expectations to their point values. Total 'points' should equal the sum of 'ibCriteria' points.
    6. Include at least one math/logic question if syllabus is related to mathematics. Otherwise, do not generate any math question. (use LaTeX $x^2$).
    7. FORMATTING: Use $...$ for inline math equations and $$...$$ for block math. Double-escape all LaTeX backslashes (e.g. \\\\frac, \\\\lim). DO NOT use \\( ... \\) or \\[ ... \\].
    8. CRITICAL: Do NOT include any 'imageUrl' fields or references to images. Use descriptive text or ASCII diagrams if needed.
    ${timeInstruction ? `9. ${timeInstruction}` : ''}
    
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
          "justification": "string (explanation/markscheme of correct answer)",
          "points": "number (total points for the question)",
          "ibCriteria": [
            {
              "criterion": "string",
              "points": "number",
              "expectation": "string"
            }
          ]
        }
      ]
    }
    `;

  const prompt = `
      You are an expert International Baccalaureate (IB) Examiner and educational content creator.
      Your task is to carefully read the provided PDF test paper/worksheet and extract EVERY question exactly as it appears.
      
      IB CRITERIA DEFINITIONS:
      - Criterion A (Knowledge/Understanding): Focuses on "what you know." This often involves recalling facts, identifying concepts, and demonstrating fundamental understanding.
      - Criterion B (Investigation/Planning): Focuses on "how you prepare." In sciences, this might be lab design; in math, it’s finding patterns; in design, it’s brainstorming.
      - Criterion C (Communication/Production): Focuses on "how you express it." This measures the quality of your final product, whether it’s a written essay, a math explanation, or a physical performance.
      - Criterion D (Reflection/Application): Focuses on "why it matters." This covers real-world application, critical thinking, and evaluating your own performance or the impact of your work.
      
      INSTRUCTIONS:
      1. Extract ALL questions from the PDF.
      2. If a question is multiple choice, extract all options and mark the correct one if possible (otherwise guess intelligently or mark first as true).
      3. If a question is open-ended, set type to "text" and omit options.
      4. Auto-generate a "justification" (markscheme/explanation) for every question to help with automated grading later.
      5. CRITERIA & POINTS: Extract points if available. Infer and populate the 'ibCriteria' array mapping specific expectations to their point values based on standard IB criteria. The total 'points' should equal the sum of 'ibCriteria' points.
      6. FORMATTING: Use $...$ for inline math equations and $$...$$ for block math. Double-escape all LaTeX backslashes (e.g. \\\\frac, \\\\lim). DO NOT use \\( ... \\) or \\[ ... \\].
      7. Do NOT invent new questions. ONLY extract what is in the document.
      
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
      
      IB CRITERIA / EXPECTATIONS:
      ${question.ibCriteria ? JSON.stringify(question.ibCriteria, null, 2) : 'Not specified.'}
      
      EXPECTED ANSWER / JUSTIFICATION:
      "${question.justification || 'N/A'}"
      
      STUDENT ANSWER:
      "${userAnswer}"
      
      MAX POINTS: ${question.points || 1}
      ${appealContext}
      
      STANDARD INSTRUCTIONS:
      - Evaluate the student's answer based on IB assessment criteria (Knowledge & Understanding, Application, Communication).
      - Apply following guidelines for command terms. If the answer does not meet command term requirement, provide feedback as mentioned below.
        - Analyze: Break down into components and show relationships, patterns, or trends using data, quotes, or models.
        - Annotate: Provide brief explanatory notes on a diagram or text referencing specific features.
        - Assess: Measure the value or impact of something relative to specific criteria and provide a conclusion.
        - Calculate: Provide a numerical result with clear working and correct units.
        - Comment: Provide a reasoned statement based on given material like data, a passage, or a diagram.
        - Compare: Focus on similarities only between two or more items.
        - Contrast: Focus on differences only between two or more items.
        - Compare and contrast: Provide both similarities and differences, organized by specific dimensions (e.g., cost, ethics).
        - Construct: Produce a diagram, model, or logical structure (like a flowchart).
        - Deduce: Draw a logical conclusion from the information or principles provided.
        - Define: Give the precise meaning of a concept, including essential characteristics only; avoid examples unless requested.
        - Derive: Manipulate known relationships to reach a new expression through clear algebraic or logical steps.
        - Describe: Give a detailed account of characteristics, sequences, or processes without explaining "why."
        - Design: Propose a plan or method that satisfies specific constraints (variables, ethics, etc.).
        - Determine: Obtain the only possible answer, often requiring a specific method.
        - Discuss: Offer a balanced, considered review of range of arguments supported by evidence, ending in a reasoned judgment.
        - Distinguish: Make clear the differences between items using side-by-side contrasting features.
        - Draw: Create an accurate diagram or graph, to scale where relevant, and include labels.
        - Estimate: Provide an approximate value while showing the method or assumptions used.
        - Evaluate: Appraise the value or validity of something using criteria; include strengths, limits, and a conclusion.
        - Examine: Consider an argument or concept to uncover hidden assumptions, implications, and interrelationships.
        - Explain: Give a detailed account including reasons, mechanisms, or cause-effect relationships (Claim → Because → Evidence).
        - Hence (or otherwise): Use a previous result efficiently to reach the next answer (or use an alternative valid method).
        - Identify: Recognize and state a specific factor or item with minimal elaboration.
        - Justify: Provide valid reasons and evidence to support a specific choice or conclusion.
        - Label: Add identifying text to specific features on a provided diagram.
        - List: Provide a series of brief points or items with no additional details.
        - Measure: Read an instrument or graph and record the value with units and uncertainties.
        - Outline: Give a brief account of the main points or ideas; used for breadth rather than depth.
        - Plot: Mark points on suitable scales and add a best-fit line or curve where appropriate.
        - Predict: State an expected result based on trends or theory, including brief reasoning.
        - Show that: Demonstrate how a result is reached from given info; no credit is given for the result alone.
        - Sketch: Provide a diagram or graph showing essential shapes and features (like intercepts) without necessarily being to scale.
        - State: Give a single, concise answer or value without any explanation or commentary.
        - Suggest: Propose a plausible idea or solution grounded in your knowledge of the course.
        - To what extent: Weigh different arguments to reach a degree-qualified conclusion (e.g., "to a large extent").
        - Write down: Provide a direct answer (often from a diagram or identity) with minimal to no working required.
      - Analyze if the length of the answer matches the command term requirement. If the student writes too much (redundant sentences/steps, poor time management) or too little, explicitly point this out in the feedback.
      - Give a score between 0 and ${question.points || 1}.
      - Provide concise, constructive feedback in the style of an IB Markscheme, including comments on answer length if necessary.
      - FORMATTING: Use $...$ for inline math equations and $$...$$ for block math. Double-escape all LaTeX backslashes (e.g. \\\\frac, \\\\lim). DO NOT use \\( ... \\) or \\[ ... \\].
      - CRITICAL: Provide a clear "Model Answer:" at the end of the feedback. This must be an ideal, full-marks answer constructed strictly according to IB assessment criteria for the given command term.
      
      OUTPUT JSON ONLY:
      {
        "score": number,
        "feedback": "string"
      }
    `;

  const parts: any[] = [{ text: prompt }];
  if (question.drawnAnswer) {
    let b64 = question.drawnAnswer;
    if (b64.startsWith('{')) {
      try { b64 = JSON.parse(b64).base64 || b64; } catch { }
    }
    const matches = b64.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
    if (matches && matches.length === 3) {
      parts.push({ text: `STUDENT DRAWED THIS DIAGRAM AS PART OF THE ANSWER:` });
      parts.push({
        inlineData: {
          data: matches[2],
          mimeType: matches[1]
        }
      });
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
  items: { question: any; userAnswer: string; drawnAnswer?: string }[]
): Promise<Record<string, { score: number; feedback: string; maxScore: number }>> => {
  if (!apiKey) throw new Error('API Key is required for grading');
  if (!items || items.length === 0) return {};

  // Construct a structured prompt for multiple items
  // Construct a structured prompt for multiple items
  // (Old string payload removed in favor of multipart payload with images)

  const promptText = `
      You are an expert International Baccalaureate (IB) Examiner grading a set of student answers.
      
      INSTRUCTIONS:
      1. Evaluate EACH student answer based on IB assessment criteria (Knowledge & Understanding, Application, Communication).
      2. Analyze if the length of the answer matches the command term requirement. If the student writes too much (redundant sentences/steps, poor time management) or too little, explicitly point this out in the feedback.
      3. Give a score between 0 and MAX POINTS.
      4. Provide concise, constructive feedback in the style of an IB Markscheme, including comments on answer length if necessary.
      5. FORMATTING: Use $...$ for inline math equations and $$...$$ for block math. Double-escape all LaTeX backslashes (e.g. \\\\frac, \\\\lim). DO NOT use \\( ... \\) or \\[ ... \\].
      6. CRITICAL: Include a clear "Model Answer:" at the end of the feedback. This must be an ideal, full-marks answer constructed strictly according to IB assessment criteria for the given command term.
      
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

  const parts: any[] = [{ text: promptText }];
  items.forEach((item, index) => {
    parts.push({ text: `\n[ITEM ${index + 1}]\nID: "${item.question.id}"\nQUESTION: "${item.question.content}"\nCONTEXT: "${item.question.sectionContent || 'N/A'}"\nIB CRITERIA: ${item.question.ibCriteria ? JSON.stringify(item.question.ibCriteria) : 'N/A'}\nEXPECTED ANSWER/JUSTIFICATION: "${item.question.justification || 'N/A'}"\nSTUDENT TEXT ANSWER: "${item.userAnswer}"\nMAX POINTS: ${item.question.points || 1}\n` });
    if (item.drawnAnswer) {
      let b64 = item.drawnAnswer;
      if (b64.startsWith('{')) {
        try { b64 = JSON.parse(b64).base64 || b64; } catch { }
      }
      const matches = b64?.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        parts.push({ text: `STUDENT DRAWING FOR ITEM ${index + 1}:` });
        parts.push({
          inlineData: {
            data: matches[2],
            mimeType: matches[1]
          }
        });
      }
    }
  });

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
      4. Analyze if the length of the answer matches the command term requirement. If the student writes too much (redundant sentences/steps, poor time management) or too little, explicitly point this out in the feedback.
      5. Give a score between 0 and the MAX POINTS for that question. If the answer is completely missing, give 0.
      6. Provide concise, constructive feedback in the style of an IB Markscheme, including comments on answer length if necessary.
      7. FORMATTING: Use $...$ for inline math equations and $$...$$ for block math. Double-escape all LaTeX backslashes (e.g. \\\\frac, \\\\lim). DO NOT use \\( ... \\) or \\[ ... \\].
      8. CRITICAL: Include a clear "Model Answer:" at the end of the feedback. This must be an ideal, full-marks answer constructed strictly according to IB assessment criteria for the given command term.
      
      TEST PAPER CONFIGURATION (JSON):
      ${JSON.stringify({
    title: testConfig.title,
    questions: testConfig.questions.map(q => ({
      id: q.id,
      content: q.content,
      justification: q.justification,
      points: q.points || 1,
      ibCriteria: q.ibCriteria,
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
