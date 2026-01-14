
export enum ResourceType {
  TEXTBOOK = 'TEXTBOOK',
  SPECIFICATION = 'SPECIFICATION',
  SAMPLE = 'SAMPLE'
}

export interface Resource {
  id: string;
  type: ResourceType;
  content: string; // Base64 for images/PDFs, raw text for text inputs
  mimeType: string;
  name: string;
  isBinary: boolean; // True for PDF and Images
}

export interface MatchingPair {
  left: string;
  right: string;
}

export interface Question {
  id: string;
  text: string;
  type: 'multiple_choice' | 'short_answer' | 'essay' | 'true_false' | 'fill_blank' | 'matching' | 'ordering';
  options?: string[]; // For multiple choice and true/false
  matchingPairs?: MatchingPair[]; // For matching questions
  orderedItems?: string[]; // For ordering questions (the correct sequence)
  correctAnswer: string;
  explanation: string;
  marks: number;
  sourceReference?: string;
}

export interface Exam {
  id: string;
  title: string;
  description: string;
  questions: Question[];
  durationMinutes: number;
  totalMarks: number;
  createdAt?: string;
}

export interface ExamHistoryItem {
  id: string;
  title: string;
  date: string;
  exam: Exam;
}

export interface ExamConfig {
  numQuestions: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  focusTopics: string;
}
