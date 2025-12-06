import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useQuizStore } from '../quizStore';
import { act } from '@testing-library/react';

const mockConfig = {
  id: 'test-quiz',
  title: 'Test Quiz',
  description: 'A test quiz',
  questions: [
    {
      id: 'q1',
      content: 'Question 1',
      type: 'single_choice' as const,
      options: [{ id: 'opt1', content: 'Option 1', isCorrect: true }],
      points: 1
    },
    {
        id: 'q2',
        content: 'Question 2',
        type: 'single_choice' as const,
        options: [{ id: 'opt2', content: 'Option 2', isCorrect: true }],
        timeLimit: 10
    }
  ],
  globalTimeLimit: 60
};

describe('quizStore', () => {
  beforeEach(() => {
    act(() => {
        useQuizStore.getState().clearState();
    });
  });

  it('should initialize with initial state', () => {
    const state = useQuizStore.getState();
    expect(state.status).toBe('idle');
    expect(state.config).toBeNull();
  });

  it('should set config and switch to intro status', () => {
    act(() => {
        useQuizStore.getState().setConfig(mockConfig);
    });
    const state = useQuizStore.getState();
    expect(state.config).toEqual(mockConfig);
    expect(state.status).toBe('intro');
    expect(state.timeRemaining).toBe(60);
    expect(state.questionTimeRemaining['q2']).toBe(10);
  });

  it('should start quiz', () => {
    act(() => {
        useQuizStore.getState().setConfig(mockConfig);
        useQuizStore.getState().startQuiz();
    });
    expect(useQuizStore.getState().status).toBe('active');
  });

  it('should answer question', () => {
    act(() => {
        useQuizStore.getState().setConfig(mockConfig);
        useQuizStore.getState().startQuiz();
        useQuizStore.getState().answerQuestion('q1', ['opt1']);
    });
    expect(useQuizStore.getState().answers['q1']).toEqual(['opt1']);
  });

  it('should not answer question if time is up', () => {
      act(() => {
        useQuizStore.getState().setConfig(mockConfig);
        useQuizStore.getState().startQuiz();
        // Manually set time to 0 for q2
        useQuizStore.setState({ questionTimeRemaining: { q2: 0 } });
        useQuizStore.getState().answerQuestion('q2', ['opt2']);
      });
      expect(useQuizStore.getState().answers['q2']).toBeUndefined();
  });

  it('should navigate questions', () => {
      act(() => {
          useQuizStore.getState().setConfig(mockConfig);
          useQuizStore.getState().startQuiz();
      });
      
      expect(useQuizStore.getState().currentQuestionIndex).toBe(0);

      act(() => {
          useQuizStore.getState().nextQuestion();
      });
      expect(useQuizStore.getState().currentQuestionIndex).toBe(1);

      act(() => {
          useQuizStore.getState().prevQuestion();
      });
      expect(useQuizStore.getState().currentQuestionIndex).toBe(0);
  });

  it('should complete quiz on last nextQuestion', () => {
      act(() => {
        useQuizStore.getState().setConfig(mockConfig);
        useQuizStore.getState().startQuiz();
        useQuizStore.getState().jumpToQuestion(1); // Last question
        useQuizStore.getState().nextQuestion();
      });
      expect(useQuizStore.getState().status).toBe('completed');
  });

  it('should toggle flag', () => {
      act(() => {
        useQuizStore.getState().toggleFlag('q1');
      });
      expect(useQuizStore.getState().flaggedQuestions).toContain('q1');

      act(() => {
        useQuizStore.getState().toggleFlag('q1');
      });
      expect(useQuizStore.getState().flaggedQuestions).not.toContain('q1');
  });

  it('should tick timer', () => {
    vi.useFakeTimers();
    act(() => {
        useQuizStore.getState().setConfig(mockConfig);
        useQuizStore.getState().startQuiz();
    });

    act(() => {
        useQuizStore.getState().tick();
    });
    
    const state = useQuizStore.getState();
    expect(state.timeRemaining).toBe(59);
    expect(state.questionTimeTaken['q1']).toBe(1);

    vi.useRealTimers();
  });

  it('should complete quiz when global time runs out', () => {
      act(() => {
          useQuizStore.getState().setConfig({ ...mockConfig, globalTimeLimit: 1 });
          useQuizStore.getState().startQuiz();
          useQuizStore.getState().tick(); // 0
      });
      expect(useQuizStore.getState().status).toBe('completed');
  });
  
  it('should decrement question timer', () => {
      act(() => {
          useQuizStore.getState().setConfig(mockConfig);
          useQuizStore.getState().startQuiz();
          useQuizStore.getState().jumpToQuestion(1); // q2 has timer
          useQuizStore.getState().tick();
      });
      expect(useQuizStore.getState().questionTimeRemaining['q2']).toBe(9);
  });
});
