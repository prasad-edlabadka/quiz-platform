import type { QuizConfig } from '../types/quiz';

export const sampleQuiz: QuizConfig = {
  id: 'math-101',
  title: 'Calculus & Algebra Quiz',
  description: 'Test your knowledge of basic calculus and linear algebra concepts. Good luck!',
  globalTimeLimit: 300, // 5 minutes
  questions: [
    {
      id: 'q1',
      type: 'single_choice',
      content: 'What is the derivative of $f(x) = x^2$?',
      options: [
        { id: 'opt1', content: '$2x$', isCorrect: true },
        { id: 'opt2', content: '$x$', isCorrect: false },
        { id: 'opt3', content: '$2$', isCorrect: false },
        { id: 'opt4', content: '$x^2$', isCorrect: false },
      ],
      timeLimit: 30,
      justification: 'The power rule states that $\\frac{d}{dx}x^n = nx^{n-1}$. Here $n=2$, so the derivative is $2x^{2-1} = 2x$.'
    },
    {
      id: 'q2',
      type: 'multiple_choice',
      content: 'Which of the following are prime numbers?',
      options: [
        { id: 'opt1', content: '2', isCorrect: true },
        { id: 'opt2', content: '4', isCorrect: false },
        { id: 'opt3', content: '17', isCorrect: true },
        { id: 'opt4', content: '1', isCorrect: false },
      ]
    },
    {
        id: 'q3',
        type: 'single_choice',
        content: `
Evaluate this limit:
$$
\\lim_{x \\to 0} \\frac{\\sin(x)}{x}
$$
        `,
        options: [
            { id: 'opt1', content: '$0$', isCorrect: false },
            { id: 'opt2', content: '$1$', isCorrect: true },
            { id: 'opt3', content: '$\\infty$', isCorrect: false },
            { id: 'opt4', content: 'Does not exist', isCorrect: false }
        ],
        justification: 'This is a standard limit usage. Using L\'Hopital\'s rule: $\\lim_{x \\to 0} \\frac{\\cos(x)}{1} = 1$.'
    }
  ]
};
