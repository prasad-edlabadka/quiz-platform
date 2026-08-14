import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SyllabusInput } from '../SyllabusInput';
import * as aiService from '../../services/aiService';

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
global.ResizeObserver = ResizeObserverMock;

// Mock the AI service
vi.mock('../../services/aiService', () => ({
    generateTestFromSyllabus: vi.fn()
}));

// Mock the store to return an active API key
vi.mock('../../store/testStore', () => ({
  useTestStore: () => ({ apiKey: 'test-key' })
}));

describe('SyllabusInput', () => {
    const mockOnTestGenerated = vi.fn();
    const mockOnCancel = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should render input fields', () => {
        render(<SyllabusInput onTestGenerated={mockOnTestGenerated} onCancel={mockOnCancel} />);
        
        expect(screen.getByPlaceholderText(/Paste your syllabus/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Generate Test/i })).toBeInTheDocument();
    });

    it('should show error if syllabus is empty', async () => {
        render(<SyllabusInput onTestGenerated={mockOnTestGenerated} onCancel={mockOnCancel} />);
        
        fireEvent.click(screen.getByRole('button', { name: /Generate Test/i }));
        
        expect(await screen.findByText(/Please enter a syllabus or topic/i)).toBeInTheDocument();
        expect(mockOnTestGenerated).not.toHaveBeenCalled();
    });

    it('should call generateTestFromSyllabus with correct args', async () => {
        const mockTest = { id: '1', questions: [] };
        (aiService.generateTestFromSyllabus as any).mockResolvedValue(mockTest);

        render(<SyllabusInput onTestGenerated={mockOnTestGenerated} onCancel={mockOnCancel} />);
        
        const syllabusInput = screen.getByPlaceholderText(/Paste your syllabus/i);
        const countInput = screen.getByRole('spinbutton'); // Number input

        fireEvent.change(syllabusInput, { target: { value: 'Mathematics' } });
        fireEvent.change(countInput, { target: { value: '10' } });

        fireEvent.click(screen.getByRole('button', { name: /Generate Test/i }));

        expect(screen.getByText(/Generating/i)).toBeInTheDocument();

        await waitFor(() => {
            expect(aiService.generateTestFromSyllabus).toHaveBeenCalledWith('test-key', 'Mathematics', 10, 'flat', 'mixed', 'none');
            expect(mockOnTestGenerated).toHaveBeenCalledWith(mockTest);
        });
    });

    it('should handle API error', async () => {
         (aiService.generateTestFromSyllabus as any).mockRejectedValue(new Error('API Failed'));

         render(<SyllabusInput onTestGenerated={mockOnTestGenerated} onCancel={mockOnCancel} />);

        const syllabusInput = screen.getByPlaceholderText(/Paste your syllabus/i);

        fireEvent.change(syllabusInput, { target: { value: 'Math' } });
        
        fireEvent.click(screen.getByRole('button', { name: /Generate Test/i }));

        expect(await screen.findByText(/API Failed/i)).toBeInTheDocument();
    });
});
