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
      justification: 'Power rule: $d/dx(x^n) = nx^{n-1}$',
      imageUrl: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&q=80&w=600', // Calculus/Math generic image
      points: 2
    },
    {
      id: 'q2',
      type: 'multiple_choice',
      content: 'Which of the following are prime numbers?\n\n![Prime Numbers Grid](https://images.unsplash.com/photo-1611348586804-61bf6c080437?auto=format&fit=crop&q=80&w=600)',
      options: [
        { id: 'opt1', content: '$17$', isCorrect: true },
        { id: 'opt2', content: '4', isCorrect: false, imageUrl: 'https://images.unsplash.com/photo-1599508704512-2f19efd1e35f?auto=format&fit=crop&q=80&w=200' },
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
    },
    {
      id: 'q4',
      type: 'single_choice',
      content: `
Complete the table:

| x | f(x) |
|---|------|
| 1 | 2    |
| 2 | 4    |
| 3 | ?    |

If $f(x) = 2x$, what is $f(3)$?
      `,
      options: [
        { id: 'opt1', content: '5', isCorrect: false },
        { id: 'opt2', content: '6', isCorrect: true },
        { id: 'opt3', content: '8', isCorrect: false },
        { id: 'opt4', content: '9', isCorrect: false },
      ],
      points: 2
    },
    {
      id: 'q5',
      type: 'text',
      content: 'Explain the concept of limits in calculus and provide an example using the visual math editor.',
      points: 5,
    }
  ]
};
