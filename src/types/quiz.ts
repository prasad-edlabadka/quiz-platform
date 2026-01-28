export interface QuizSection {
  id: string;
  title?: string;
  content: string; // Markdown background info
}

export interface QuizConfig {
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
  sections?: QuizSection[];
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
}

export interface Option {
  id: string;
  content: string; // Markdown supported
  isCorrect: boolean;
  imageUrl?: string; // Optional image for the option
}

export interface QuizState {
  config: QuizConfig | null;
  status: 'idle' | 'intro' | 'active' | 'completed';
  currentQuestionIndex: number;
  answers: Record<string, string[]>; // questionId -> selectedOptionIds
  flaggedQuestions: string[]; // ids of flagged questions
  timeRemaining: number; // For global timer
  questionTimeRemaining: Record<string, number>; // For per-question timer
  questionTimeTaken: Record<string, number>; // Actual seconds spent on each question
  
  setConfig: (config: QuizConfig) => void;
  startQuiz: () => void;
  answerQuestion: (questionId: string, optionIds: string[]) => void;
  toggleFlag: (questionId: string) => void;
  jumpToQuestion: (index: number) => void;
  nextQuestion: () => void;
  prevQuestion: () => void;
  finishQuiz: () => void;
  tick: () => void; // Called every second
  resetQuiz: () => void;
  clearState: () => void; // Reset everything including config
  themeMode: 'light' | 'dark';
  toggleTheme: () => void;
}
