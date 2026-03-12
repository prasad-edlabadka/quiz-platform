import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ResultsView } from '../ResultsView';
import { useTestStore } from '../../store/testStore';

// Mock the store
vi.mock('../../store/testStore', () => ({
    useTestStore: vi.fn()
}));

// Mock react-to-print
vi.mock('react-to-print', () => ({
    useReactToPrint: vi.fn(() => vi.fn())
}));

// Mock MarkdownRenderer
vi.mock('../MarkdownRenderer', () => ({
    MarkdownRenderer: ({ content }: { content: string }) => <div data-testid="markdown">{content}</div>
}));

// Mock Framer Motion
vi.mock('framer-motion', () => ({
    motion: {
        div: ({ children, className }: any) => <div className={className}>{children}</div>
    }
}));

// Mock React PDF
vi.mock('@react-pdf/renderer', () => ({
    PDFDownloadLink: ({ children }: any) => <div>{children({ loading: false })}</div>,
    Document: () => <div>Document</div>,
    Page: () => <div>Page</div>,
    Text: () => <div>Text</div>,
    View: () => <div>View</div>,
    StyleSheet: { create: (s: any) => s },
    Font: { register: vi.fn() }
}));

describe('ResultsView', () => {
    const mockConfig = {
        title: 'Test',
        questions: [
            {
                id: 'q1',
                content: 'Q1 Content',
                points: 1,
                options: [
                    { id: 'opt1', content: 'Correct', isCorrect: true },
                    { id: 'opt2', content: 'Wrong', isCorrect: false }
                ]
            },
            {
                id: 'q2',
                content: 'Q2 Content',
                points: 2,
                options: [
                    { id: 'opt3', content: 'Correct', isCorrect: true },
                    { id: 'opt4', content: 'Wrong', isCorrect: false }
                ]
            }
        ]
    };

    const mockStore = {
        config: mockConfig,
        answers: {
            'q1': ['opt1'], // Correct
            'q2': ['opt4']  // Wrong
        },
        resetTest: vi.fn(),
        questionTimeTaken: { 'q1': 10, 'q2': 20 },
        evaluations: {}
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (useTestStore as any).mockReturnValue(mockStore);
    });

    it('should calculate and display score correctly', () => {
        render(<ResultsView />);
        
        // Total Score: 1 (q1) + 0 (q2) = 1 out of 3
        // Percentage: (1/3)*100 = 33%
        
        expect(screen.getByText('33%')).toBeInTheDocument();
        expect(screen.getByText('1')).toBeInTheDocument(); // Score
        // Use a more specific text match or regex for "out of 3"
        expect(screen.getByText('3')).toBeInTheDocument(); // Max Score
    });

    it('should display total time', () => {
        render(<ResultsView />);
        // 10 + 20 = 30s
        expect(screen.getByText(/30s/)).toBeInTheDocument();
    });

    it('should show correct and incorrect indicators for questions', () => {
        render(<ResultsView />);
        
        // Q1 is correct -> CheckCircle (green)
        // Q2 is incorrect -> XCircle (red)
        // Since we render icons, we can check for text "Question 1" and "Question 2"
        expect(screen.getByText('Question 1')).toBeInTheDocument();
        expect(screen.getByText('Question 2')).toBeInTheDocument();
        
        // We can check if specific classes are present on icons if we want deep verification
        // Or check "Your Answer" section appearance
        expect(screen.getByText('Your Answer:')).toBeInTheDocument();
        expect(screen.getByText('Correct Answer:')).toBeInTheDocument();
    });

    it('should call resetTest on restart', () => {
        render(<ResultsView />);
        fireEvent.click(screen.getByText('Restart Test'));
        expect(mockStore.resetTest).toHaveBeenCalled();
    });

    it('should handle missing config', () => {
        (useTestStore as any).mockReturnValue({ ...mockStore, config: null });
        const { container } = render(<ResultsView />);
        expect(container).toBeEmptyDOMElement();
    });
});
