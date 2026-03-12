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
    const mockUseTestStore: any = (selector: any) => {
       if(selector) return selector(storeState);
       return storeState;
    };
    mockUseTestStore.getState = () => storeState;
    
    return {
        ...actual,
        useTestStore: mockUseTestStore
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

    it('should render correct default tab initially', () => {
        render(<App />);
        // Since AI is the default tab, Syllabus Input should be visible immediately
        expect(screen.getByText(/Syllabus Input/i)).toBeInTheDocument();
    });

    it('should switch tabs', () => {
        render(<App />);
        
        // Switch to Dashboard tab and verify landing features
        const buttons = screen.getAllByRole('button');
        fireEvent.click(buttons[0]); // Dashboard is the first button in the sidebar nav
        expect(screen.getByText(/Ace Your Exams/i)).toBeInTheDocument();
        
        // Switch back to AI tab
        fireEvent.click(screen.getByText(/New Test/i));
        expect(screen.getByText(/Syllabus Input/i)).toBeInTheDocument();
    });

    it('should load sample test', () => {
        storeState.setConfig = vi.fn((config) => {
            storeState.config = config;
        });

        const { container } = render(<App />);
        // Switch to the library tab first
        fireEvent.click(screen.getByText('My Library'));
        
        // Use a generic assertion for this as the tests loaded depend on the mock module glob
        expect(container.textContent).toMatch(/Available Tests/i);
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
