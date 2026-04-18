export interface IBCriterion {
  criterion: string; // e.g., "A", "B", "C", "D"
  points: number;
  expectation: string;
}

export interface TestSection {
  id: string;
  title?: string;
  content: string; // Markdown background info
}

export interface TestConfig {
  id: string;
  title: string;
  description?: string;
  globalTimeLimit?: number; // in seconds
  shuffleQuestions?: boolean;
  theme?: {
    primaryColor: string;
    backgroundColor: string;
    fontFamily?: string;
  };
  sections?: TestSection[];
  questions: Question[];
}

export interface Question {
  id: string;
  type: 'single_choice' | 'multiple_choice' | 'text';
  content: string; // Markdown supported
  sectionId?: string; // Link to a section
  timeLimit?: number; // in seconds, specific to this question
  options?: Option[];
  imageUrl?: string; // Optional image
  justification?: string; // Explanation for the answer
  points?: number; // Score value for this question (default: 1)
  ibCriteria?: IBCriterion[]; // Dynamically assigned IB Criteria
  requiresDiagram?: boolean; // If true, rendering will include a drawing canvas
}

export interface Option {
  id: string;
  content: string; // Markdown supported
  isCorrect: boolean;
  imageUrl?: string; // Optional image for the option
}

export interface PastTestResult {
  attemptId: string;
  date: string;
  config: TestConfig;
  answers: Record<string, string[]>;
  drawnAnswers: Record<string, string>;
  evaluations: Record<string, { score: number; feedback: string; maxScore: number }>;
  timeRemaining: number;
  questionTimeTaken: Record<string, number>;
  isOffline?: boolean;
  uploadedSheets?: string[]; // Array of base64 images
}

export interface TestState {
  config: TestConfig | null;
  status: 'idle' | 'intro' | 'active' | 'completed' | 'printable';
  pastResults: PastTestResult[];
  isViewingPastResult: boolean;

  currentQuestionIndex: number;
  answers: Record<string, string[]>; // questionId -> selectedOptionIds
  drawnAnswers: Record<string, string>; // questionId -> base64 Image string
  flaggedQuestions: string[]; // ids of flagged questions
  timeRemaining: number; // For global timer
  questionTimeRemaining: Record<string, number>; // For per-question timer
  questionTimeTaken: Record<string, number>; // Actual seconds spent on each question
  apiKey: string | null;
  evaluations: Record<string, { score: number; feedback: string; maxScore: number }>;

  setConfig: (config: TestConfig) => void;
  setApiKey: (key: string) => void;
  addEvaluation: (questionId: string, evaluation: { score: number; feedback: string; maxScore: number }) => void;
  addBatchEvaluations: (evaluations: Record<string, { score: number; feedback: string; maxScore: number }>) => void;
  startTest: () => void;
  printTest: () => void;
  answerQuestion: (questionId: string, optionIds: string[]) => void;
  answerDrawing: (questionId: string, base64: string) => void;
  toggleFlag: (questionId: string) => void;
  jumpToQuestion: (index: number) => void;
  nextQuestion: () => void;
  prevQuestion: () => void;
  finishTest: () => void;
  tick: () => void; // Called every second
  resetTest: () => void;
  clearState: () => void; // Reset everything including config
  
  // History actions
  saveCurrentResult: () => void;
  saveOfflineResult: (config: TestConfig, evaluations: Record<string, { score: number; feedback: string; maxScore: number }>, uploadedSheets: string[]) => void;
  loadPastResult: (attemptId: string) => void;
  deletePastResult: (attemptId: string) => void;

  themeMode: 'light' | 'dark';
  toggleTheme: () => void;
}
