import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SyllabusInput } from '../SyllabusInput';
import * as aiService from '../../services/aiService';

// Mock the AI service
vi.mock('../../services/aiService', () => ({
    generateQuizFromSyllabus: vi.fn()
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    clear: () => {
      store = {};
    }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('SyllabusInput', () => {
    const mockOnQuizGenerated = vi.fn();
    const mockOnCancel = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        localStorageMock.clear();
    });

    it('should render input fields', () => {
        render(<SyllabusInput onQuizGenerated={mockOnQuizGenerated} onCancel={mockOnCancel} />);
        
        expect(screen.getByPlaceholderText(/Enter your Gemini API Key/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/Paste your syllabus/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Generate Quiz/i })).toBeInTheDocument();
    });

    it('should show error if inputs are empty', async () => {
        render(<SyllabusInput onQuizGenerated={mockOnQuizGenerated} onCancel={mockOnCancel} />);
        
        fireEvent.click(screen.getByRole('button', { name: /Generate Quiz/i }));
        
        // First it checks API key
        expect(await screen.findByText(/Please provide a valid Google Gemini API Key/i)).toBeInTheDocument();
        expect(mockOnQuizGenerated).not.toHaveBeenCalled();
    });

    it('should call generateQuizFromSyllabus with correct args', async () => {
        const mockQuiz = { id: '1', questions: [] };
        (aiService.generateQuizFromSyllabus as any).mockResolvedValue(mockQuiz);

        render(<SyllabusInput onQuizGenerated={mockOnQuizGenerated} onCancel={mockOnCancel} />);
        
        const keyInput = screen.getByPlaceholderText(/Enter your Gemini API Key/i);
        const syllabusInput = screen.getByPlaceholderText(/Paste your syllabus/i);
        const countInput = screen.getByRole('spinbutton'); // Number input

        fireEvent.change(keyInput, { target: { value: 'test-key' } });
        fireEvent.change(syllabusInput, { target: { value: 'Mathematics' } });
        fireEvent.change(countInput, { target: { value: '10' } });

        fireEvent.click(screen.getByRole('button', { name: /Generate Quiz/i }));

        expect(screen.getByText(/Generating/i)).toBeInTheDocument();

        await waitFor(() => {
            expect(aiService.generateQuizFromSyllabus).toHaveBeenCalledWith('test-key', 'Mathematics', 10);
            expect(mockOnQuizGenerated).toHaveBeenCalledWith(mockQuiz);
        });
    });

    it('should handle API error', async () => {
         (aiService.generateQuizFromSyllabus as any).mockRejectedValue(new Error('API Failed'));

         render(<SyllabusInput onQuizGenerated={mockOnQuizGenerated} onCancel={mockOnCancel} />);

        const keyInput = screen.getByPlaceholderText(/Enter your Gemini API Key/i);
        const syllabusInput = screen.getByPlaceholderText(/Paste your syllabus/i);

        fireEvent.change(keyInput, { target: { value: 'test-key' } });
        fireEvent.change(syllabusInput, { target: { value: 'Math' } });
        
        fireEvent.click(screen.getByRole('button', { name: /Generate Quiz/i }));

        expect(await screen.findByText(/API Failed/i)).toBeInTheDocument();
    });

    it('should persist API key', () => {
        render(<SyllabusInput onQuizGenerated={mockOnQuizGenerated} onCancel={mockOnCancel} />);
        
        const keyInput = screen.getByPlaceholderText(/Enter your Gemini API Key/i);
        const syllabusInput = screen.getByPlaceholderText(/Paste your syllabus/i);

        fireEvent.change(keyInput, { target: { value: 'saved-key' } });
        fireEvent.change(syllabusInput, { target: { value: 'Topics' } }); // Required
        
        // Mock successful generation to allow save
        (aiService.generateQuizFromSyllabus as any).mockResolvedValue({ questions: [] });

        fireEvent.click(screen.getByRole('button', { name: /Generate Quiz/i }));
        
        expect(localStorage.getItem('gemini_api_key')).toBe('saved-key');
    });

    it('should toggle help modal', async () => {
        render(<SyllabusInput onQuizGenerated={mockOnQuizGenerated} onCancel={mockOnCancel} />);
        
        const helpBtn = screen.getByText(/How do I get a key?/i);
        fireEvent.click(helpBtn);
        
        expect(await screen.findByText(/What is an API Key?/i)).toBeInTheDocument();
        
        // Find close button by aria-label we just added
        const closeBtn = screen.getByRole('button', { name: /Close/i });
        fireEvent.click(closeBtn);
        
        await waitFor(() => {
             expect(screen.queryByText(/What is an API Key?/i)).not.toBeInTheDocument();
        });
    });
});
