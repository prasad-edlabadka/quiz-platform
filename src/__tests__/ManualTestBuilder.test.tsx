import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  createDefaultTestConfig,
  createEmptyQuestion,
  createEmptySection,
  createEmptyIBCriterion,
  validateTestConfig,
  sanitizeAndCleanTestConfig,
} from '../components/ManualTestBuilder/builderUtils';
import { ManualTestBuilder } from '../components/ManualTestBuilder/ManualTestBuilder';
import type { TestConfig } from '../types/test';

// Mock zustand store for test component
vi.mock('../store/testStore', () => ({
  useTestStore: () => ({
    themeMode: 'dark',
    setConfig: vi.fn(),
  }),
}));

// Mock mermaid and markdown renderers
vi.mock('../components/MarkdownRenderer', () => ({
  MarkdownRenderer: ({ content }: { content: string }) => <div data-testid="markdown-content">{content}</div>,
}));

vi.mock('../components/QuestionDiagramRenderer', () => ({
  QuestionDiagramRenderer: ({ diagram }: { diagram: string }) => <div data-testid="diagram-content">{diagram}</div>,
}));

describe('Manual Test Builder - builderUtils', () => {
  it('should generate a valid default test configuration', () => {
    const defaultConfig = createDefaultTestConfig();
    expect(defaultConfig.title).toBe('New Custom Test');
    expect(defaultConfig.questions.length).toBe(1);
    expect(defaultConfig.questions[0].options?.length).toBe(4);
    expect(defaultConfig.questions[0].options?.[0].isCorrect).toBe(true);

    const issues = validateTestConfig(defaultConfig);
    const errors = issues.filter(i => i.type === 'error');
    expect(errors.length).toBe(0);
  });

  it('should generate valid empty sections and questions', () => {
    const section = createEmptySection(0);
    expect(section.id).toBe('section-1');
    expect(section.title).toContain('Section 1');
    expect(section.content).toContain('Passage');

    const question = createEmptyQuestion(1, 'section-1');
    expect(question.id).toBe('q2');
    expect(question.sectionId).toBe('section-1');
    expect(question.type).toBe('single_choice');

    const criterion = createEmptyIBCriterion('A');
    expect(criterion.criterion).toContain('Criterion A');
    expect(criterion.points).toBeGreaterThan(0);
  });

  it('should detect validation errors for invalid configs', () => {
    const invalidConfig: TestConfig = {
      id: 'test-invalid',
      title: '',
      questions: [
        {
          id: 'q1',
          type: 'single_choice',
          content: '',
          options: [
            { id: 'opt1', content: 'A', isCorrect: false },
            { id: 'opt2', content: 'B', isCorrect: false },
          ],
        },
      ],
    };

    const issues = validateTestConfig(invalidConfig);
    const errors = issues.filter(i => i.type === 'error');

    // Expected errors: Missing title, empty question content, no correct option marked
    expect(errors.some(e => e.message.includes('title is required'))).toBe(true);
    expect(errors.some(e => e.message.includes('empty content'))).toBe(true);
    expect(errors.some(e => e.message.includes('does not have any correct option'))).toBe(true);
  });

  it('should properly sanitize and clean configurations with all supported features', () => {
    const rawConfig: TestConfig = {
      id: 'sample-quiz',
      title: ' Advanced Physics & Math ',
      description: '  Comprehensive test on motion and calculus.  ',
      globalTimeLimit: 1200,
      shuffleQuestions: true,
      theme: {
        primaryColor: '#6366f1',
        backgroundColor: '#0f172a',
      },
      sections: [
        {
          id: 'sec-1',
          title: ' Reading Passage ',
          content: ' Quantum Mechanics background context ',
        },
      ],
      questions: [
        {
          id: 'q1',
          type: 'single_choice',
          content: ' What is the derivative of $x^2$? ',
          points: 2,
          sectionId: 'sec-1',
          timeLimit: 45,
          justification: ' Power rule: $2x$ ',
          imageUrl: ' https://example.com/math.png ',
          options: [
            { id: 'o1', content: ' $2x$ ', isCorrect: true },
            { id: 'o2', content: ' $x$ ', isCorrect: false },
          ],
        },
        {
          id: 'q2',
          type: 'text',
          content: ' Draw the block diagram and explain. ',
          points: 5,
          requiresDiagram: true,
          diagram: ' graph TD; A-->B ',
          diagramType: 'mermaid',
          ibCriteria: [
            { criterion: ' Criterion A ', points: 3, expectation: ' Theory ' },
            { criterion: ' Criterion B ', points: 2, expectation: ' Application ' },
          ],
        },
      ],
    };

    const cleaned = sanitizeAndCleanTestConfig(rawConfig);
    expect(cleaned.title).toBe('Advanced Physics & Math');
    expect(cleaned.description).toBe('Comprehensive test on motion and calculus.');
    expect(cleaned.sections?.[0].title).toBe('Reading Passage');
    expect(cleaned.questions[0].content).toBe('What is the derivative of $x^2$?');
    expect(cleaned.questions[0].justification).toBe('Power rule: $2x$');
    expect(cleaned.questions[0].imageUrl).toBe('https://example.com/math.png');
    expect(cleaned.questions[1].requiresDiagram).toBe(true);
    expect(cleaned.questions[1].diagram).toBe('graph TD; A-->B');
    expect(cleaned.questions[1].diagramType).toBe('mermaid');
    expect(cleaned.questions[1].ibCriteria?.length).toBe(2);
    expect(cleaned.questions[1].ibCriteria?.[0].criterion).toBe('Criterion A');
  });
});

describe('ManualTestBuilder Component', () => {
  it('should render the builder with default questions and tabs', () => {
    render(<ManualTestBuilder />);
    expect(screen.getByText('New Custom Test')).toBeInTheDocument();
    expect(screen.getByText(/Questions \(1\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Passages \/ Sections/i)).toBeInTheDocument();
    expect(screen.getByText(/Test Settings & Theme/i)).toBeInTheDocument();
    expect(screen.getByText(/Live Exam Preview/i)).toBeInTheDocument();
    expect(screen.getByText(/Raw JSON Code/i)).toBeInTheDocument();
  });

  it('should allow adding questions', () => {
    render(<ManualTestBuilder />);
    const addBtn = screen.getByTestId('add-question-btn');
    fireEvent.click(addBtn);
    expect(screen.getByText(/Questions \(2\)/i)).toBeInTheDocument();
  });

  it('should open Export JSON modal when clicking Export JSON button', () => {
    render(<ManualTestBuilder />);
    const exportBtn = screen.getByTestId('export-json-btn');
    fireEvent.click(exportBtn);
    expect(screen.getByText(/Export Test as JSON/i)).toBeInTheDocument();
    expect(screen.getByText(/Download \.json/i)).toBeInTheDocument();
  });

  it('should allow launching the test', () => {
    const onLaunchMock = vi.fn();
    render(<ManualTestBuilder onLaunchTest={onLaunchMock} />);
    const launchBtn = screen.getByTestId('launch-test-btn');
    fireEvent.click(launchBtn);
    expect(onLaunchMock).toHaveBeenCalled();
  });
});
