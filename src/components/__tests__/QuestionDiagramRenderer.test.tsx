import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QuestionDiagramRenderer } from '../QuestionDiagramRenderer';

// Mock the sub-renderers
vi.mock('../MermaidRenderer', () => ({
  MermaidRenderer: ({ chart, forceLightMode }: any) => (
    <div data-testid="mock-mermaid" data-chart={chart} data-light={forceLightMode}>
      Mermaid: {chart}
    </div>
  ),
  default: ({ chart }: any) => <div>Mermaid: {chart}</div>
}));

vi.mock('../DrawingCanvas', () => ({
  DrawingCanvas: ({ value, readOnly }: any) => (
    <div data-testid="mock-canvas" data-value={value} data-readonly={readOnly}>
      Canvas Drawing
    </div>
  )
}));

// Mock store usage if any
vi.mock('../../store/testStore', () => ({
  useTestStore: () => ({ themeMode: 'light' })
}));

describe('QuestionDiagramRenderer', () => {
  it('should render an img tag when given a base64 image data URL', () => {
    const base64Str = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA';
    render(<QuestionDiagramRenderer diagram={base64Str} />);

    const img = screen.getByRole('img');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', base64Str);
    expect(img).toHaveAttribute('alt', 'Question Diagram (Freeform)');
  });

  it('should render an img tag when given an HTTP URL', () => {
    const urlStr = 'https://example.com/diagram.jpg';
    render(<QuestionDiagramRenderer diagram={urlStr} />);

    const img = screen.getByRole('img');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', urlStr);
  });

  it('should render a read-only DrawingCanvas when given a Fabric JSON state', () => {
    const fabricJson = JSON.stringify({
      version: '5.3.0',
      objects: [
        { type: 'rect', left: 10, top: 20, width: 100, height: 50, fill: 'red' }
      ]
    });
    render(<QuestionDiagramRenderer diagram={fabricJson} />);

    const canvas = screen.getByTestId('mock-canvas');
    expect(canvas).toBeInTheDocument();
    expect(canvas).toHaveAttribute('data-value', fabricJson);
    expect(canvas).toHaveAttribute('data-readonly', 'true');
  });

  it('should fallback to MermaidRenderer when given standard text chart code', () => {
    const mermaidCode = 'graph TD\n  A --> B';
    render(<QuestionDiagramRenderer diagram={mermaidCode} forceLightMode={true} />);

    const mermaid = screen.getByTestId('mock-mermaid');
    expect(mermaid).toBeInTheDocument();
    expect(mermaid).toHaveAttribute('data-chart', mermaidCode);
    expect(mermaid).toHaveAttribute('data-light', 'true');
  });

  it('should render raw SVG markup with svg-diagram-container class', () => {
    const svgMarkup = '<svg viewBox="0 0 100 100" data-testid="raw-svg"><circle cx="50" cy="50" r="40" fill="blue"/></svg>';
    const { container } = render(<QuestionDiagramRenderer diagram={svgMarkup} />);

    expect(container.querySelector('.svg-diagram-container')).toBeInTheDocument();
    expect(container.querySelector('svg')).toBeInTheDocument();
    expect(container.querySelector('circle')).toHaveAttribute('fill', 'blue');
  });
});
