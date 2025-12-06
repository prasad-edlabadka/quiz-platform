import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CompactNavigation } from '../CompactNavigation';
import { useQuizStore } from '../../store/quizStore';

// Mock store
vi.mock('../../store/quizStore', () => ({
    useQuizStore: vi.fn()
}));

// Mock Framer Motion
vi.mock('framer-motion', () => ({
    motion: {
        div: ({ children, className, onClick }: any) => (
            <div className={className} onClick={onClick}>{children}</div>
        )
    },
    AnimatePresence: ({ children }: any) => <>{children}</>
}));

describe('CompactNavigation', () => {
    const mockStore = {
        config: {
            questions: [
                { id: 'q1' }, { id: 'q2' }, { id: 'q3' }
            ]
        },
        currentQuestionIndex: 0,
        answers: {},
        flaggedQuestions: [],
        jumpToQuestion: vi.fn()
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (useQuizStore as any).mockReturnValue(mockStore);
    });

    it('should render mini map dots', () => {
        render(<CompactNavigation />);
        // 3 questions -> 3 dots. Dots are divs with title "Q1...", etc.
        expect(screen.getByTitle(/Q1/)).toBeInTheDocument();
        expect(screen.getByTitle(/Q2/)).toBeInTheDocument();
        expect(screen.getByTitle(/Q3/)).toBeInTheDocument();
    });

    it('should open drawer on click', () => {
        render(<CompactNavigation />);
        
        fireEvent.click(screen.getByText('Question Map'));
        
        // Drawer content
        expect(screen.getByText('Legend')).toBeInTheDocument();
        expect(screen.getByText('1')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument();
        expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('should jump to question when clicked in drawer', () => {
        render(<CompactNavigation />);
        
        fireEvent.click(screen.getByText('Question Map'));
        fireEvent.click(screen.getByText('3')); // Question 3
        
        expect(mockStore.jumpToQuestion).toHaveBeenCalledWith(2); // Index 2
    });

    it('should indicate current, attempted, and flagged states', () => {
         (useQuizStore as any).mockReturnValue({
            ...mockStore,
            currentQuestionIndex: 1, // Q2 is current
            answers: { 'q1': ['opt'] }, // Q1 attempted
            flaggedQuestions: ['q3'] // Q3 flagged
        });

        render(<CompactNavigation />);
        fireEvent.click(screen.getByText('Question Map'));

        const q1Btn = screen.getByText('1');
        const q2Btn = screen.getByText('2');
        const q3Btn = screen.getByText('3');

        // We can check classes for indication
        expect(q1Btn).toHaveClass('bg-indigo-100'); // Attempted
        expect(q2Btn).toHaveClass('bg-indigo-600'); // Current
        expect(q3Btn).toHaveClass('bg-orange-500'); // Flagged
    });
});
