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
  questions: Question[];
}

export interface Question {
  id: string;
  type: 'single_choice' | 'multiple_choice';
  content: string; // Markdown supported
  timeLimit?: number; // in seconds, specific to this question
  options: Option[];
  imageUrl?: string; // Optional image
  justification?: string; // Explanation for the answer
}

export interface Option {
  id: string;
  content: string; // Markdown supported
  isCorrect: boolean;
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
  tick: () => void; // Called every second
  tick: () => void; // Called every second
  resetQuiz: () => void;
  clearState: () => void; // Reset everything including config
}
