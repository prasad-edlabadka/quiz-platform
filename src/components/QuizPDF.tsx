import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';
import type { QuizConfig } from '../types/quiz';

// Register a standard font
Font.register({
  family: 'Roboto',
  fonts: [
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf' },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf', fontWeight: 'bold' },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-italic-webfont.ttf', fontStyle: 'italic' },
  ],
});

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Roboto',
    fontSize: 12,
    color: '#333',
  },
  header: {
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    textAlign: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#1a1a1a',
  },
  score: {
    fontSize: 18,
    color: '#4f46e5', // Indigo-600
    marginBottom: 5,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 15,
    fontSize: 10,
    color: '#666',
  },
  section: {
    marginBottom: 15,
  },
  questionContainer: {
    marginBottom: 20,
    padding: 10,
    backgroundColor: '#f9fafb',
    borderRadius: 4,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  questionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    width: '85%',
  },
  points: {
    fontSize: 10,
    color: '#666',
  },
  content: {
    marginBottom: 10,
    lineHeight: 1.5,
  },
  status: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 5,
    marginTop: 5,
  },
  statusCorrect: {
    color: '#16a34a', // Green-600
  },
  statusIncorrect: {
    color: '#dc2626', // Red-600
  },
  answerSection: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#fff',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  label: {
    fontSize: 9,
    fontWeight: 'bold',
    marginBottom: 2,
    color: '#6b7280',
    textTransform: 'uppercase',
  },
  answerText: {
    fontSize: 11,
    marginLeft: 5,
  },
  explanation: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
});

interface QuizPDFProps {
  config: QuizConfig;
  answers: Record<string, string[]>;
  scores: {
    correctCount: number;
    totalScore: number;
    maxScore: number;
    percentage: number;
    totalTimeSpent: number;
  };
  questionTimeTaken: Record<string, number>;
}

export const QuizPDF: React.FC<QuizPDFProps> = ({ config, answers, scores, questionTimeTaken }) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const cleanText = (md: string) => {
    // Very basic markdown stripping for PDF readability
    // In a real app complexity, we might parse this to different Text nodes
    return md.replace(/[*_`]/g, '');
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>{config.title || 'Quiz Results'}</Text>
          <Text style={styles.score}>
            Score: {scores.percentage}% ({scores.totalScore}/{scores.maxScore})
          </Text>
          <View style={styles.stats}>
            <Text>Correct: {scores.correctCount}/{config.questions.length}</Text>
            <Text>Time: {formatTime(scores.totalTimeSpent)}</Text>
          </View>
        </View>

        {config.questions.map((q, idx) => {
           const selected = answers[q.id] || [];
            let isCorrect = false;
            let selectedOpts: any[] = [];
            let correctOpts: any[] = [];
            
            if (q.type === 'text') {
                // For text questions, simple logic: if answered, we mark as "Completed" or similar
                // We'll just show the text answer.
                isCorrect = selected.length > 0 && selected[0].length > 0;
            } else if (q.options) {
                const correctOptions = q.options.filter(o => o.isCorrect).map(o => o.id);
                isCorrect = selected.length === correctOptions.length && 
                            selected.every(id => correctOptions.includes(id));
                selectedOpts = q.options.filter(o => selected.includes(o.id));
                correctOpts = q.options.filter(o => o.isCorrect);
            }

             // Helper to render option item
             const renderOptionItem = (o: any) => {
               const letter = String.fromCharCode(65 + (q.options?.findIndex(opt => opt.id === o.id) || 0));
               return (
               <View key={o.id} style={{ marginBottom: 4 }}>
                  {o.imageUrl && (
                    <Image 
                      src={o.imageUrl} 
                      style={{ width: 100, height: 60, objectFit: 'contain', marginLeft: 10, marginBottom: 2 }} 
                    />
                  )}
                  <Text style={styles.answerText}>{letter}. {cleanText(o.content)}</Text>
               </View>
               );
             };

            return (
              <View key={q.id} style={styles.questionContainer} break={idx > 0 && idx % 3 === 0}>
                <View style={styles.questionHeader}>
                   <Text style={styles.questionTitle}>Q{idx + 1}: {cleanText(q.content)}</Text>
                   <Text style={styles.points}>[{q.points || 1} pts]</Text>
                </View>

                <Text style={[styles.status, isCorrect ? styles.statusCorrect : styles.statusIncorrect]}>
                  {q.type === 'text' 
                    ? (isCorrect ? '✓ Submitted' : '⚠ No Answer') 
                    : (isCorrect ? '✓ Correct' : '✗ Incorrect')
                  } 
                  {' '}· {formatTime(questionTimeTaken[q.id] || 0)}
                </Text>

                {/* Answer Section */}
                <View style={[styles.answerSection, { marginTop: 8 }]}>
                    <Text style={styles.label}>Your Answer:</Text>
                    {q.type === 'text' ? (
                       <Text style={styles.answerText}>{selected[0] ? cleanText(selected[0]) : 'No answer selected'}</Text>
                    ) : (
                       !isCorrect && (
                           selectedOpts.length > 0 ? (
                              selectedOpts.map(o => renderOptionItem(o))
                           ) : (
                              <Text style={[styles.answerText, { fontStyle: 'italic', color: '#999' }]}>No answer selected</Text>
                           )
                       )
                    )}
                </View>

                {/* Correct Answer Section (Only for objective or if we want to show model answer for text) */}
                {q.type !== 'text' && (
                    <View style={[styles.answerSection, !isCorrect ? { borderTopWidth: 0, marginTop: 0 } : {}]}>
                       <Text style={styles.label}>Correct Answer:</Text>
                       {correctOpts.map(o => renderOptionItem(o))}
                    </View>
                )}

               {q.justification && (
                  <View style={styles.explanation}>
                    <Text style={[styles.label, { color: '#4f46e5' }]}>Explanation:</Text>
                    <Text style={{ fontSize: 10, color: '#4b5563' }}>{cleanText(q.justification)}</Text>
                  </View>
               )}
             </View>
           );
        })}
      </Page>
    </Document>
  );
};
