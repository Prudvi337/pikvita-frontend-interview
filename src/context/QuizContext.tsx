import { createContext, useState, useEffect, ReactNode } from 'react'
import { fetchQuizData } from '../api/quizApi'

// Define the shape of the context data
interface QuizQuestion {
  id: number;
  question: string;
  answers: { [key: string]: string | null };
  correct_answers: { [key: string]: string };
  multiple_correct_answers: string;
}

interface QuizContextType {
  questions: QuizQuestion[];
  currentQuestion: number;
  setCurrentQuestion: React.Dispatch<React.SetStateAction<number>>;
  userAnswers: { [key: number]: string[] };
  score: number;
  setUserAnswers: (questionId: number, answer: string) => void;
  nextQuestion: () => void;
  previousQuestion: () => void;
  calculateScore: () => void;
  isSubmitted: boolean;
  setIsSubmitted: (value: boolean) => void;
}

// Create the context with a default value
export const QuizContext = createContext<QuizContextType | undefined>(undefined)

// Create a provider component
export const QuizProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [userAnswers, setUserAnswers] = useState<{[key: number]: string[]}>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    const loadQuestions = async () => {
      const data = await fetchQuizData();
      setQuestions(data);
    };
    loadQuestions();
  }, []);

  const handleSetUserAnswers = (questionId: number, answer: string) => {
    
    if (isSubmitted) return;

    setUserAnswers(prev => {
      const currentAnswers = prev[questionId] || [];
      const isAlreadySelected = currentAnswers.includes(answer);
      
      if (questions[currentQuestion].multiple_correct_answers === "true") {
        // Multiple answers allowed
        return {
          ...prev,
          [questionId]: isAlreadySelected 
            ? currentAnswers.filter(a => a !== answer)
            : [...currentAnswers, answer]
        };
      } else {
        // Single answer only
        return {
          ...prev,
          [questionId]: [answer]
        };
      }
    });
  };

  const calculateScore = () => {
    let newScore = 0;
    questions.forEach((question) => {
      const userAnswerArray = userAnswers[question.id] || [];
      const correctAnswers = Object.keys(question.correct_answers).filter(
        (key) => question.correct_answers[key] === "true"
      );

      const isCorrect =
        userAnswerArray.length === correctAnswers.length &&
        userAnswerArray.every((answer) => correctAnswers.includes(`${answer}_correct`));

      if (isCorrect) newScore++;
    });
    setScore(newScore);
  };

  const value = {
    questions,
    currentQuestion,
    setCurrentQuestion,
    userAnswers,
    score,
    setUserAnswers: handleSetUserAnswers,
    nextQuestion: () => setCurrentQuestion(prev => Math.min(prev + 1, questions.length - 1)),
    previousQuestion: () => setCurrentQuestion(prev => Math.max(prev - 1, 0)),
    isSubmitted,
    setIsSubmitted,
    calculateScore
  };

  return <QuizContext.Provider value={value}>{children}</QuizContext.Provider>;
};