import type { TestConfig, Question, Option, TestSection, IBCriterion } from '../../types/test';

export const createEmptyOption = (index: number): Option => ({
  id: `opt-${Date.now()}-${index + 1}`,
  content: `Option ${String.fromCharCode(65 + index)}`,
  isCorrect: index === 0,
});

export const createEmptyQuestion = (index: number, sectionId?: string): Question => ({
  id: `q${index + 1}`,
  type: 'single_choice',
  content: `### Question ${index + 1}\n\nType your question prompt here... Supports math like $f(x) = x^2$ and markdown.`,
  points: 1,
  sectionId: sectionId || undefined,
  options: [
    { id: `opt-${Date.now()}-1`, content: 'Option A', isCorrect: true },
    { id: `opt-${Date.now()}-2`, content: 'Option B', isCorrect: false },
    { id: `opt-${Date.now()}-3`, content: 'Option C', isCorrect: false },
    { id: `opt-${Date.now()}-4`, content: 'Option D', isCorrect: false },
  ],
  justification: 'Add an explanation of the correct answer for students.',
});

export const createEmptySection = (index: number): TestSection => ({
  id: `section-${index + 1}`,
  title: `Section ${index + 1}: Reading Passage`,
  content: `### Passage / Background Context\n\nProvide the background information, reading passage, or case study here that applies to questions in this section.\n\n$$\\text{LaTeX formulas and markdown are supported!}$$`,
});

export const createEmptyIBCriterion = (letter: string = 'A'): IBCriterion => ({
  criterion: `Criterion ${letter}: Knowledge & Understanding`,
  points: 2,
  expectation: 'Demonstrates comprehensive understanding of the core concepts and methods.',
});

export const createDefaultTestConfig = (): TestConfig => ({
  id: `test-${Date.now()}`,
  title: 'New Custom Test',
  description: 'A custom exam created using Revise Test Builder.',
  globalTimeLimit: 1800, // 30 minutes default
  shuffleQuestions: false,
  questions: [createEmptyQuestion(0)],
});

export interface ValidationError {
  type: 'error' | 'warning';
  message: string;
  questionIndex?: number;
  sectionIndex?: number;
}

export const validateTestConfig = (config: TestConfig): ValidationError[] => {
  const errors: ValidationError[] = [];

  if (!config.title?.trim()) {
    errors.push({ type: 'error', message: 'Test title is required.' });
  }

  if (!config.questions || config.questions.length === 0) {
    errors.push({ type: 'error', message: 'Test must contain at least one question.' });
    return errors;
  }

  config.questions.forEach((q, idx) => {
    if (!q.content?.trim()) {
      errors.push({
        type: 'error',
        message: `Question ${idx + 1} has empty content.`,
        questionIndex: idx,
      });
    }

    if (q.type === 'single_choice' || q.type === 'multiple_choice') {
      if (!q.options || q.options.length === 0) {
        errors.push({
          type: 'error',
          message: `Question ${idx + 1} (${q.type === 'single_choice' ? 'Single Choice' : 'Multiple Choice'}) must have at least 2 options.`,
          questionIndex: idx,
        });
      } else {
        const correctCount = q.options.filter((o) => o.isCorrect).length;
        if (correctCount === 0) {
          errors.push({
            type: 'error',
            message: `Question ${idx + 1} does not have any correct option selected.`,
            questionIndex: idx,
          });
        } else if (q.type === 'single_choice' && correctCount > 1) {
          errors.push({
            type: 'warning',
            message: `Question ${idx + 1} is single choice but has multiple correct options. Only one will be expected.`,
            questionIndex: idx,
          });
        }
      }
    }

    if (q.ibCriteria && q.ibCriteria.length > 0) {
      const criteriaSum = q.ibCriteria.reduce((sum, c) => sum + (c.points || 0), 0);
      if (typeof q.points === 'number' && criteriaSum !== q.points) {
        errors.push({
          type: 'warning',
          message: `Question ${idx + 1}: Sum of IB criteria points (${criteriaSum}) doesn't match total question points (${q.points}).`,
          questionIndex: idx,
        });
      }
    }
  });

  return errors;
};

export const sanitizeAndCleanTestConfig = (config: TestConfig): TestConfig => {
  return {
    id: config.id || `test-${Date.now()}`,
    title: config.title?.trim() || 'Untitled Test',
    description: config.description?.trim() || undefined,
    globalTimeLimit: config.globalTimeLimit && config.globalTimeLimit > 0 ? config.globalTimeLimit : undefined,
    shuffleQuestions: !!config.shuffleQuestions,
    theme: config.theme && (config.theme.primaryColor || config.theme.backgroundColor) ? config.theme : undefined,
    sections: config.sections && config.sections.length > 0
      ? config.sections.filter(s => s.content?.trim()).map(s => ({
          id: s.id,
          title: s.title?.trim() || undefined,
          content: s.content.trim(),
        }))
      : undefined,
    questions: config.questions.map((q, idx) => {
      const cleaned: Question = {
        id: q.id || `q${idx + 1}`,
        type: q.type || 'single_choice',
        content: q.content?.trim() || `Question ${idx + 1}`,
        points: typeof q.points === 'number' && q.points >= 0 ? q.points : 1,
        sectionId: q.sectionId || undefined,
        timeLimit: q.timeLimit && q.timeLimit > 0 ? q.timeLimit : undefined,
        imageUrl: q.imageUrl?.trim() || undefined,
        justification: q.justification?.trim() || undefined,
        requiresDiagram: !!q.requiresDiagram,
        diagram: q.diagram?.trim() || undefined,
        diagramType: q.diagramType || (q.diagram ? 'mermaid' : undefined),
        ibCriteria: q.ibCriteria && q.ibCriteria.length > 0
          ? q.ibCriteria.map(c => ({
              criterion: c.criterion.trim(),
              points: Number(c.points) || 1,
              expectation: c.expectation.trim(),
            }))
          : undefined,
        options: q.type !== 'text'
          ? (q.options || []).map((opt, oIdx) => ({
              id: opt.id || `opt-${q.id || idx + 1}-${oIdx + 1}`,
              content: opt.content?.trim() || `Option ${oIdx + 1}`,
              isCorrect: !!opt.isCorrect,
              imageUrl: opt.imageUrl?.trim() || undefined,
            }))
          : undefined,
      };
      return cleaned;
    }),
  };
};
