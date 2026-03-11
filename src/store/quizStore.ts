import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { QuizState, QuizConfig } from '../types/quiz';

export const useQuizStore = create<QuizState>()(
  persist(
    (set, get) => ({
      config: null,
      status: 'idle',
      pastResults: [],
      isViewingPastResult: false,
      currentQuestionIndex: 0,
      answers: {},
      flaggedQuestions: [],
      timeRemaining: 0,
      questionTimeRemaining: {},
      questionTimeTaken: {},
      apiKey: null,
      evaluations: {},

      setApiKey: (key: string) => set({ apiKey: key }),

      addEvaluation: (questionId, evaluation) => set((state) => ({
        evaluations: {
          ...state.evaluations,
          [questionId]: evaluation
        }
      })),

      addBatchEvaluations: (newEvaluations) => set((state) => ({
        evaluations: {
          ...state.evaluations,
          ...newEvaluations
        }
      })),

      setConfig: (config: QuizConfig) => set({ 
        config, 
        status: 'intro',
        isViewingPastResult: false,
        timeRemaining: config.globalTimeLimit || 0,
        flaggedQuestions: [], // Reset flags
        questionTimeTaken: {}, // Reset time taken
        evaluations: {}, // Reset evaluations
        // Initialize question timers if they exist
        questionTimeRemaining: config.questions.reduce((acc, q) => {
          if (q.timeLimit) acc[q.id] = q.timeLimit;
          return acc;
        }, {} as Record<string, number>)
      }),

      startQuiz: () => set({ status: 'active' }),

      printQuiz: () => set({ status: 'printable' }),

      answerQuestion: (questionId, optionIds) => set((state) => {
        // Enforce timer: Cannot answer if time runs out for this question
        const qTime = state.questionTimeRemaining[questionId];
        if (qTime !== undefined && qTime <= 0) {
            return {}; // No op
        }
        return { answers: { ...state.answers, [questionId]: optionIds } };
      }),

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

      finishQuiz: () => {
        set({ status: 'completed' });
        get().saveCurrentResult();
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
             }
        }

        return updates;
      }),

      resetQuiz: () => {
         const state = get();
         if(!state.config) return;
         
         // Only save if there's actually a completed or partially completed attempt AND it's not a viewing of a past result
         if (Object.keys(state.answers).length > 0 && !state.isViewingPastResult) {
           state.saveCurrentResult();
         }

         set({
            status: 'intro',
            isViewingPastResult: false,
            currentQuestionIndex: 0,
            answers: {},
            flaggedQuestions: [],
            questionTimeTaken: {},
            evaluations: {}, // Reset evaluations
            timeRemaining: state.config.globalTimeLimit || 0,
            questionTimeRemaining: state.config.questions.reduce((acc, q) => {
                if (q.timeLimit) acc[q.id] = q.timeLimit;
                return acc;
            }, {} as Record<string, number>)
         });
      },

      clearState: () => set({
          config: null,
          status: 'idle',
          isViewingPastResult: false,
          currentQuestionIndex: 0,
          answers: {},
          flaggedQuestions: [],
          questionTimeRemaining: {},
          questionTimeTaken: {},
          evaluations: {},
          timeRemaining: 0
       }),

      themeMode: 'dark', // Default to dark mode for the premium feel
      
      toggleTheme: () => set((state) => ({ 
        themeMode: state.themeMode === 'light' ? 'dark' : 'light' 
      })),

      saveCurrentResult: () => set((state) => {
        if (!state.config || state.isViewingPastResult) return state;
        
        // Don't save empty attempts
        if (Object.keys(state.answers).length === 0) return state;

        const attemptId = `attempt-${Date.now()}`;
        const newResult = {
          attemptId,
          date: new Date().toISOString(),
          config: state.config,
          answers: state.answers,
          evaluations: state.evaluations,
          timeRemaining: state.timeRemaining,
          questionTimeTaken: state.questionTimeTaken,
        };

        return {
          pastResults: [newResult, ...state.pastResults]
        };
      }),

      loadPastResult: (attemptId: string) => set((state) => {
        const result = state.pastResults.find(r => r.attemptId === attemptId);
        if (!result) return state;

        return {
          config: result.config,
          status: 'completed', // Immediately jump to results view
          isViewingPastResult: true,
          answers: result.answers,
          evaluations: result.evaluations,
          timeRemaining: result.timeRemaining,
          questionTimeTaken: result.questionTimeTaken,
          currentQuestionIndex: 0,
          flaggedQuestions: [],
        };
      }),

      deletePastResult: (attemptId: string) => set((state) => ({
        pastResults: state.pastResults.filter(r => r.attemptId !== attemptId)
      })),
    }),
    {
      name: 'quiz-storage',
      partialize: (state) => ({ 
        config: state.config,
        status: state.status,
        pastResults: state.pastResults,
        isViewingPastResult: state.isViewingPastResult,
        currentQuestionIndex: state.currentQuestionIndex,
        answers: state.answers,
        flaggedQuestions: state.flaggedQuestions,
        timeRemaining: state.timeRemaining,
        questionTimeRemaining: state.questionTimeRemaining,
        questionTimeTaken: state.questionTimeTaken,
        evaluations: state.evaluations,
        apiKey: state.apiKey,
        themeMode: state.themeMode 
      }),
    }
  )
);
