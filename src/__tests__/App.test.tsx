import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '../App';


// Partial mock for store to control state
const initialStoreState = {
    config: null,
    status: 'idle',
    currentQuestionIndex: 0,
    answers: {},
    flaggedQuestions: [],
    questionTimeRemaining: {},
    questionTimeTaken: {},
    setConfig: vi.fn(),
    startQuiz: vi.fn(),
    clearState: vi.fn()
};

let storeState = { ...initialStoreState };

// We need to support implementation of useQuizStore
vi.mock('../store/quizStore', async () => {
    const actual = await vi.importActual('../store/quizStore');
    return {
        ...actual,
        useQuizStore: (selector: any) => {
           if(selector) return selector(storeState);
           return storeState;
        }
    };
});

// Mock dependencies
vi.mock('../components/QuizRenderer', () => ({
    QuizRenderer: () => <div data-testid="quiz-renderer">Quiz Renderer Active</div>
}));

vi.mock('../components/SyllabusInput', () => ({
    SyllabusInput: ({ onCancel }: any) => (
        <div>
            Syllabus Input
            <button onClick={onCancel}>Cancel</button>
        </div>
    )
}));

describe('App Integration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        storeState = { ...initialStoreState };
    });

    it('should render loading/intro screen initially', () => {
        render(<App />);
        expect(screen.getByText(/Quiz Platform/i)).toBeInTheDocument();
        expect(screen.getByText(/Create and take quizzes/i)).toBeInTheDocument();
    });

    it('should switch to syllabus mode', () => {
        render(<App />);
        fireEvent.click(screen.getByText(/Generate from Syllabus/i));
        expect(screen.getByText('Syllabus Input')).toBeInTheDocument();
        
        fireEvent.click(screen.getByText('Cancel'));
        expect(screen.getByText(/Quiz Platform/i)).toBeInTheDocument();
    });

    it('should load sample quiz', () => {
        // We mock setConfig to update our local state so re-render shows changes?
        // Or simply checking if setConfig was called is enough for unit test.
        // Since we mocked useQuizStore to return dynamic `storeState`, we can update it.

        storeState.setConfig = vi.fn((config) => {
            storeState.config = config;
        });

        render(<App />);
        
        fireEvent.click(screen.getByText(/Load Sample Math Quiz/i));
        
        expect(storeState.setConfig).toHaveBeenCalled();
        // Since we updated storeState.config, re-render should show QuizRenderer?
        // React auto-re-render on store update might rely on the actual store mechanism.
        // Our mock is simplistic. But `useQuizStore` is a hook.
        // If we want full integration, we shouldn't mock the store internals too much OR use a real store instance.
        
        // For this test, verifying the action trigger is good.
    });

    it('should render QuizRenderer when config is present', () => {
        storeState.config = { id: 'test', questions: [] } as any;
        render(<App />);
        expect(screen.getByTestId('quiz-renderer')).toBeInTheDocument();
    });

    it('should open reset modal', () => {
         storeState.config = { id: 'test', questions: [] } as any;
         render(<App />);
         
         const trashBtn = screen.getByTitle('Reset App / Clear Data');
         fireEvent.click(trashBtn);
         
         expect(screen.getByText(/Reset Application\?/i)).toBeInTheDocument();
    });
});
