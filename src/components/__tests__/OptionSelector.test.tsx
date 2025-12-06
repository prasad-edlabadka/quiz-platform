import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { OptionSelector } from '../OptionSelector';

// Mock Markdown
vi.mock('../MarkdownRenderer', () => ({
    MarkdownRenderer: ({ content }: { content: string }) => <span>{content}</span>
}));

describe('OptionSelector', () => {
    const mockOptions = [
        { id: '1', content: 'Option A', isCorrect: false },
        { id: '2', content: 'Option B', isCorrect: true }
    ];
    const mockOnChange = vi.fn();

    beforeEach(() => {
        mockOnChange.mockClear();
    });

    it('should render options', () => {
        render(
            <OptionSelector 
                options={mockOptions} 
                selectedOptionIds={[]} 
                type="single_choice" 
                onSelectionChange={mockOnChange} 
            />
        );
        expect(screen.getByText('Option A')).toBeInTheDocument();
        expect(screen.getByText('Option B')).toBeInTheDocument();
    });

    it('should handle single selection', () => {
        render(
            <OptionSelector 
                options={mockOptions} 
                selectedOptionIds={[]} 
                type="single_choice" 
                onSelectionChange={mockOnChange} 
            />
        );
        
        fireEvent.click(screen.getByText('Option A'));
        expect(mockOnChange).toHaveBeenCalledWith(['1']);
    });

    it('should handle multiple selection (add)', () => {
        render(
            <OptionSelector 
                options={mockOptions} 
                selectedOptionIds={['1']} 
                type="multiple_choice" 
                onSelectionChange={mockOnChange} 
            />
        );
        
        fireEvent.click(screen.getByText('Option B'));
        expect(mockOnChange).toHaveBeenCalledWith(['1', '2']);
    });

    it('should handle multiple selection (remove)', () => {
        render(
            <OptionSelector 
                options={mockOptions} 
                selectedOptionIds={['1', '2']} 
                type="multiple_choice" 
                onSelectionChange={mockOnChange} 
            />
        );
        
        fireEvent.click(screen.getByText('Option A'));
        expect(mockOnChange).toHaveBeenCalledWith(['2']);
    });

    it('should not fire change if disabled', () => {
        render(
            <OptionSelector 
                options={mockOptions} 
                selectedOptionIds={[]} 
                type="single_choice" 
                onSelectionChange={mockOnChange}
                disabled={true}
            />
        );
        
        fireEvent.click(screen.getByText('Option A'));
        expect(mockOnChange).not.toHaveBeenCalled();
    });
});
