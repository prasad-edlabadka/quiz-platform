import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MarkdownRenderer } from '../MarkdownRenderer';

// We do NOT mock ReactMarkdown here because we want to test that it actually renders something.
// However, JSDOM doesn't fully support layout-dependent things.
// We mainly check tag presence.

describe('MarkdownRenderer', () => {
    it('should render plain text', () => {
        render(<MarkdownRenderer content="Hello World" />);
        expect(screen.getByText('Hello World')).toBeInTheDocument();
    });

    it('should render headers', () => {
        render(<MarkdownRenderer content="# Header 1" />);
        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Header 1');
    });

    it('should calculate latex (mock check)', () => {
        // Since we didn't mock remarkMath/katex, they should run.
        // Katex output is complex HTML. We usually verify class names or structure.
        const { container } = render(<MarkdownRenderer content="$E=mc^2$" />);
        
        // Katex usually renders a span with class "katex"
        // Note: Use querySelector for classes
        expect(container.querySelector('.katex')).toBeInTheDocument();
    });

    it('should render images with custom class', () => {
        render(<MarkdownRenderer content="![Alt](http://test.com/img.png)" />);
        
        const img = screen.getByRole('img');
        expect(img).toHaveAttribute('src', 'http://test.com/img.png');
        expect(img).toHaveClass('shadow-md');
    });
});
