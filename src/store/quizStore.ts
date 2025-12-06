import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { QuizState, QuizConfig } from '../types/quiz';

export const useQuizStore = create<QuizState>()(
  persist(
    (set, get) => ({
      config: null,
      status: 'idle',
      currentQuestionIndex: 0,
      answers: {},
      flaggedQuestions: [],
      timeRemaining: 0,
      questionTimeRemaining: {},
      questionTimeTaken: {},

      setConfig: (config: QuizConfig) => set({ 
        config, 
        status: 'intro',
        timeRemaining: config.globalTimeLimit || 0,
        flaggedQuestions: [], // Reset flags
        questionTimeTaken: {}, // Reset time taken
        // Initialize question timers if they exist
        questionTimeRemaining: config.questions.reduce((acc, q) => {
          if (q.timeLimit) acc[q.id] = q.timeLimit;
          return acc;
        }, {} as Record<string, number>)
      }),

      startQuiz: () => set({ status: 'active' }),

      answerQuestion: (questionId, optionIds) => set((state) => ({
        answers: { ...state.answers, [questionId]: optionIds }
      })),

      toggleFlag: (questionId) => set((state) => ({
        flaggedQuestions: state.flaggedQuestions.includes(questionId) 
          ? state.flaggedQuestions.filter(id => id !== questionId)
          : [...state.flaggedQuestions, questionId]
      })),

      jumpToQuestion: (index) => set({ currentQuestionIndex: index }),

      nextQuestion: () => {
        const { currentQuestionIndex, config } = get();
        if (!config) return;

        if (currentQuestionIndex < config.questions.length - 1) {
          set({ currentQuestionIndex: currentQuestionIndex + 1 });
        } else {
          set({ status: 'completed' });
        }
      },

      prevQuestion: () => {
        const { currentQuestionIndex } = get();
        if (currentQuestionIndex > 0) {
          set({ currentQuestionIndex: currentQuestionIndex - 1 });
        }
      },

      tick: () => set((state) => {
        if (state.status !== 'active' || !state.config) return {};

        const updates: Partial<QuizState> = {};

        // Global Timer
        if (state.config.globalTimeLimit && state.timeRemaining > 0) {
          updates.timeRemaining = state.timeRemaining - 1;
          if (updates.timeRemaining === 0) {
            updates.status = 'completed';
          }
        }

        // Per Question Time
        const currentQ = state.config.questions[state.currentQuestionIndex];
        
        // Track time taken for current question regardless of limit
        const currentTaken = state.questionTimeTaken[currentQ.id] || 0;
        updates.questionTimeTaken = {
            ...state.questionTimeTaken,
            [currentQ.id]: currentTaken + 1
        };

        if (currentQ.timeLimit) {
            const currentQTime = state.questionTimeRemaining[currentQ.id];
             if (currentQTime !== undefined && currentQTime > 0) {
                 const newTime = currentQTime - 1;
                 updates.questionTimeRemaining = {
                     ...state.questionTimeRemaining,
                     [currentQ.id]: newTime
                 };
                 // Auto advance if time runs out? or just stop? 
                 // Requirement: "Each question ... timed". Usually implies auto-advance.
                 if (newTime === 0) {
                      // Logic to auto advance
                      if (state.currentQuestionIndex < state.config.questions.length - 1) {
                          updates.currentQuestionIndex = state.currentQuestionIndex + 1;
                      } else {
                          updates.status = 'completed';
                      }
                 }
             }
        }

        return updates;
      }),

      resetQuiz: () => set((state) => {
         if(!state.config) return {};
         return {
            status: 'intro',
            currentQuestionIndex: 0,
            answers: {},
            flaggedQuestions: [],
            questionTimeTaken: {},
            timeRemaining: state.config.globalTimeLimit || 0,
            questionTimeRemaining: state.config.questions.reduce((acc, q) => {
                if (q.timeLimit) acc[q.id] = q.timeLimit;
                return acc;
            }, {} as Record<string, number>)
         }
      }),
    }),
    {
      name: 'quiz-storage',
    }
  )
);
