import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RichTextEditor } from './RichTextEditor';

// Mock CKEditor to avoid complex DOM requirements in JSDOM
vi.mock('@ckeditor/ckeditor5-react', () => ({
  CKEditor: vi.fn(() => <div data-testid="mock-ckeditor">CKEditor Instance</div>)
}));

// Mock Wiris plugin to avoid import errors in test environment
vi.mock('@wiris/mathtype-ckeditor5/dist/browser/index.js', () => ({
  default: {}
}));

describe('RichTextEditor', () => {
  it('renders without crashing', () => {
    render(<RichTextEditor value="Initial content" onChange={() => {}} />);
    expect(screen.getByTestId('mock-ckeditor')).toBeInTheDocument();
  });

  it('renders with placeholder', () => {
    render(<RichTextEditor value="" onChange={() => {}} placeholder="Type here..." />);
    expect(screen.getByTestId('mock-ckeditor')).toBeInTheDocument();
  });
});
