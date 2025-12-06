# Quiz Platform

A modern, functional, and aesthetically pleasing quiz platform built with React, Vite, and TailwindCSS. This platform allows you to create and run quizzes defined entirely by a JSON configuration.

## Key Features

-   **JSON-Driven**: Define quizzes (questions, options, timing, theming) using a simple JSON structure.
-   **Rich Content**: Full support for Markdown and LaTeX (Math) in questions, options, and explanations.
-   **Flexible Question Types**: Single and Multiple choice support.
-   **Time Management**: Configurable global quiz timers and per-question time limits.
-   **Navigation & Progress**: 
    -   Quick "Question Map" drawer for easy navigation.
    -   Mini-map on the navbar for at-a-glance status (Attempted, Flagged, Unattempted).
    -   Ability to flag questions for review.
-   **Detailed Results**:
    -   Instant scoring and feedback.
    -   Detailed explanations/justifications for answers.
    -   Time tracking metrics (Total time, per-question time).
    -   **PDF Export** of results.
-   **State Persistence**: Progress is saved automatically to local storage, so you don't lose your place if you reload.

## Tech Stack

-   **Framework**: React (Vite)
-   **Styling**: TailwindCSS (v4)
-   **State Management**: Zustand (with persistence)
-   **Rendering**: `react-markdown`, `katex` (for Math), `lucide-react` (icons)
-   **Animation**: `framer-motion`

## Local Setup

To run this project locally:

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/prasad-edlabadka/quiz-platform.git
    cd quiz-platform
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Run the development server:**
    ```bash
    npm run dev
    ```

4.  **Open in Browser:**
    Navigate to `http://localhost:5173` (or the URL shown in your terminal).

## JSON Configuration Structure

The entire quiz is verified against this JSON structure. You can load a quiz by pasting a JSON object matching this schema into the application.

### Root Object (`QuizConfig`)

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | `string` | Unique identifier for the quiz. |
| `title` | `string` | Title of the quiz. |
| `description` | `string` | (Optional) Brief description. |
| `globalTimeLimit` | `number` | (Optional) Total quiz duration in seconds. |
| `shuffleQuestions` | `boolean` | (Optional) Whether to shuffle questions. |
| `theme` | `object` | (Optional) Custom theme colors. |
| `questions` | `Question[]` | Array of Question objects. |

### Theme Object

| Field | Type | Description |
| :--- | :--- | :--- |
| `primaryColor` | `string` | Primary accent color (hex code). |
| `backgroundColor` | `string` | Background color (hex code). |

### Question Object

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | `string` | Unique identifier for the question. |
| `type` | `"single_choice" \| "multiple_choice"` | Type of question. |
| `content` | `string` | Question text. Supports **Markdown** and **LaTeX** (e.g., `$E=mc^2$`). |
| `points` | `number` | (Optional) Points/Score for this question (default: 1). |
| `timeLimit` | `number` | (Optional) Time limit for this specific question (seconds). |
| `imageUrl` | `string` | (Optional) URL for an embedded image. |
| `justification` | `string` | (Optional) Explanation/Solution text shown in results. |
| `options` | `Option[]` | Array of answer options. |

### Option Object

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | `string` | Unique identifier for the option. |
| `content` | `string` | Option text. Supports Markdown/LaTeX. |
| `isCorrect` | `boolean` | `true` if this option is correct, `false` otherwise. |

### Example JSON

```json
{
  "id": "math_quiz_01",
  "title": "Calculus Basics",
  "description": "A short quiz on derivatives and limits.",
  "globalTimeLimit": 600,
  "theme": {
    "primaryColor": "#4F46E5",
    "backgroundColor": "#F3F4F6"
  },
  "questions": [
    {
      "id": "q1",
      "type": "single_choice",
      "content": "What is the derivative of $x^2$?",
      "options": [
        { "id": "opt1", "content": "$x$", "isCorrect": false },
        { "id": "opt2", "content": "$2x$", "isCorrect": true },
        { "id": "opt3", "content": "$2$", "isCorrect": false }
      ],
      "justification": "Power rule: $d/dx(x^n) = nx^{n-1}$"
    }
  ]
}
```
