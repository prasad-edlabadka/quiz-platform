import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useTestStore } from '../testStore';
import { act } from '@testing-library/react';

const mockConfig = {
  id: 'test-test',
  title: 'Test Test',
  description: 'A test test',
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

describe('testStore', () => {
  beforeEach(() => {
    act(() => {
        useTestStore.getState().clearState();
    });
  });

  it('should initialize with initial state', () => {
    const state = useTestStore.getState();
    expect(state.status).toBe('idle');
    expect(state.config).toBeNull();
  });

  it('should set config and switch to intro status', () => {
    act(() => {
        useTestStore.getState().setConfig(mockConfig);
    });
    const state = useTestStore.getState();
    expect(state.config).toEqual(mockConfig);
    expect(state.status).toBe('intro');
    expect(state.timeRemaining).toBe(60);
    expect(state.questionTimeRemaining['q2']).toBe(10);
  });

  it('should start test', () => {
    act(() => {
        useTestStore.getState().setConfig(mockConfig);
        useTestStore.getState().startTest();
    });
    expect(useTestStore.getState().status).toBe('active');
  });

  it('should answer question', () => {
    act(() => {
        useTestStore.getState().setConfig(mockConfig);
        useTestStore.getState().startTest();
        useTestStore.getState().answerQuestion('q1', ['opt1']);
    });
    expect(useTestStore.getState().answers['q1']).toEqual(['opt1']);
  });

  it('should not answer question if time is up', () => {
      act(() => {
        useTestStore.getState().setConfig(mockConfig);
        useTestStore.getState().startTest();
        // Manually set time to 0 for q2
        useTestStore.setState({ questionTimeRemaining: { q2: 0 } });
        useTestStore.getState().answerQuestion('q2', ['opt2']);
      });
      expect(useTestStore.getState().answers['q2']).toBeUndefined();
  });

  it('should navigate questions', () => {
      act(() => {
          useTestStore.getState().setConfig(mockConfig);
          useTestStore.getState().startTest();
      });
      
      expect(useTestStore.getState().currentQuestionIndex).toBe(0);

      act(() => {
          useTestStore.getState().nextQuestion();
      });
      expect(useTestStore.getState().currentQuestionIndex).toBe(1);

      act(() => {
          useTestStore.getState().prevQuestion();
      });
      expect(useTestStore.getState().currentQuestionIndex).toBe(0);
  });

  it('should complete test on last nextQuestion', () => {
      act(() => {
        useTestStore.getState().setConfig(mockConfig);
        useTestStore.getState().startTest();
        useTestStore.getState().jumpToQuestion(1); // Last question
        useTestStore.getState().nextQuestion();
      });
      expect(useTestStore.getState().status).toBe('completed');
  });

  it('should toggle flag', () => {
      act(() => {
        useTestStore.getState().toggleFlag('q1');
      });
      expect(useTestStore.getState().flaggedQuestions).toContain('q1');

      act(() => {
        useTestStore.getState().toggleFlag('q1');
      });
      expect(useTestStore.getState().flaggedQuestions).not.toContain('q1');
  });

  it('should tick timer', () => {
    vi.useFakeTimers();
    act(() => {
        useTestStore.getState().setConfig(mockConfig);
        useTestStore.getState().startTest();
    });

    act(() => {
        useTestStore.getState().tick();
    });
    
    const state = useTestStore.getState();
    expect(state.timeRemaining).toBe(59);
    expect(state.questionTimeTaken['q1']).toBe(1);

    vi.useRealTimers();
  });

  it('should complete test when global time runs out', () => {
      act(() => {
          useTestStore.getState().setConfig({ ...mockConfig, globalTimeLimit: 1 });
          useTestStore.getState().startTest();
          useTestStore.getState().tick(); // 0
      });
      expect(useTestStore.getState().status).toBe('completed');
  });
  
  it('should decrement question timer', () => {
      act(() => {
          useTestStore.getState().setConfig(mockConfig);
          useTestStore.getState().startTest();
          useTestStore.getState().jumpToQuestion(1); // q2 has timer
          useTestStore.getState().tick();
      });
      expect(useTestStore.getState().questionTimeRemaining['q2']).toBe(9);
  });
});
