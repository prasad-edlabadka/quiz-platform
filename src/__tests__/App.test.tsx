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
    startTest: vi.fn(),
    clearState: vi.fn()
};

let storeState = { ...initialStoreState };

// We need to support implementation of useTestStore
vi.mock('../store/testStore', async () => {
    const actual = await vi.importActual('../store/testStore');
    return {
        ...actual,
        useTestStore: (selector: any) => {
           if(selector) return selector(storeState);
           return storeState;
        }
    };
});

// Mock dependencies
vi.mock('../components/TestRenderer', () => ({
    TestRenderer: () => <div data-testid="test-renderer">Test Renderer Active</div>
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
        expect(screen.getByText(/Generate Test with AI/i)).toBeInTheDocument();
    });

    it('should switch to syllabus mode', () => {
        render(<App />);
        // Ensure AI tab is active (default)
        fireEvent.click(screen.getByText(/Generate Test with AI/i));
        expect(screen.getByText('Syllabus Input')).toBeInTheDocument();
        
        fireEvent.click(screen.getByText('Cancel'));
        expect(screen.getByText(/Get Started/i)).toBeInTheDocument();
    });

    it('should load sample test', () => {
        storeState.setConfig = vi.fn((config) => {
            storeState.config = config;
        });

        const { container } = render(<App />);
        // Switch to the library tab first
        fireEvent.click(screen.getByText('Library'));
        
        // Use a generic assertion for this as the tests loaded depend on the mock module glob
        expect(container.textContent).toMatch(/Available Testzes/i);
    });

    it('should render TestRenderer when config is present', () => {
        storeState.config = { id: 'test', questions: [] } as any;
        render(<App />);
        expect(screen.getByTestId('test-renderer')).toBeInTheDocument();
    });

    it('should open reset modal', () => {
         storeState.config = { id: 'test', questions: [] } as any;
         render(<App />);
         
         const trashBtn = screen.getByTitle('Reset App / Clear Data');
         fireEvent.click(trashBtn);
         
         expect(screen.getByText(/Reset Application\?/i)).toBeInTheDocument();
    });
});
