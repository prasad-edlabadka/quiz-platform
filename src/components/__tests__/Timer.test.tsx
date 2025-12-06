import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Timer } from '../Timer';

describe('Timer', () => {
    it('should format time correctly', () => {
        render(<Timer seconds={65} />);
        expect(screen.getByText('1:05')).toBeInTheDocument();
    });

    it('should show label if provided', () => {
        render(<Timer seconds={10} label="Time Left" />);
        expect(screen.getByText('Time Left:')).toBeInTheDocument();
    });

    it('should apply urgent styles when time is low', () => {
        render(<Timer seconds={5} />);
        const timeText = screen.getByText('0:05');
        // Check for urgent class (red text)
        expect(timeText).toHaveClass('text-red-600');
    });

    it('should apply urgent styles based on variant prop', () => {
        render(<Timer seconds={100} variant="urgent" />);
        const timeText = screen.getByText('1:40');
        expect(timeText).toHaveClass('text-red-600');
    });
});
