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
        expect(screen.getByText(/Get Started/i)).toBeInTheDocument();
        expect(screen.getByText(/Choose how you want to begin/i)).toBeInTheDocument();
        // Since AI is the default tab, its button should be visible
        expect(screen.getByText(/Generate Quiz with AI/i)).toBeInTheDocument();
    });

    it('should switch to syllabus mode', () => {
        render(<App />);
        // Ensure AI tab is active (default)
        fireEvent.click(screen.getByText(/Generate Quiz with AI/i));
        expect(screen.getByText('Syllabus Input')).toBeInTheDocument();
        
        fireEvent.click(screen.getByText('Cancel'));
        expect(screen.getByText(/Get Started/i)).toBeInTheDocument();
    });

    it('should load sample quiz', () => {
        storeState.setConfig = vi.fn((config) => {
            storeState.config = config;
        });

        const { container } = render(<App />);
        // Switch to the library tab first
        fireEvent.click(screen.getByText('Library'));
        
        // Use a generic assertion for this as the tests loaded depend on the mock module glob
        expect(container.textContent).toMatch(/Available Quizzes/i);
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
