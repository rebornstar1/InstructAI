import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle, 
  ChevronRight, 
  ChevronLeft,
  Award
} from "lucide-react";
import { completeQuiz } from "@/services/progressApi";

/**
 * EnhancedQuiz - Interactive quiz component with progress tracking
 * 
 * @param {Object} props - Component props
 * @param {string} props.moduleId - ID of the current module
 * @param {Object} props.quiz - Quiz data with questions
 * @param {Function} props.onClose - Callback when quiz is closed
 * @param {Function} props.onProgressUpdate - Callback when progress updates with progress data
 */
const EnhancedQuiz = ({ 
  moduleId, 
  quiz, 
  onClose,
  onProgressUpdate 
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [score, setScore] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(600); // 10 minutes by default
  const [showResults, setShowResults] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  const questions = quiz.questions || [];
  const totalQuestions = questions.length;
  const quizId = quiz.id || quiz.quizId;
  
  // Parse time limit and set timer
  useEffect(() => {
    let seconds = 600; // Default 10 minutes
    
    if (quiz.timeLimit) {
      // Try to parse time limit (e.g., "10 minutes", "1 hour")
      const minutesMatch = quiz.timeLimit.match(/(\d+)\s*minute/i);
      const hoursMatch = quiz.timeLimit.match(/(\d+)\s*hour/i);
      
      if (minutesMatch) {
        seconds = parseInt(minutesMatch[1]) * 60;
      } else if (hoursMatch) {
        seconds = parseInt(hoursMatch[1]) * 3600;
      }
    }
    
    setTimeRemaining(seconds);
  }, [quiz.timeLimit]);
  
  // Handle timer countdown
  useEffect(() => {
    if (quizCompleted || showResults) return;
    
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [quizCompleted, showResults]);
  
  // Format remaining time as mm:ss
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Handle answer selection
  const handleSelectAnswer = (questionIndex, answer) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [questionIndex]: answer
    });
  };
  
  // Navigate to next question
  const handleNextQuestion = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };
  
  // Navigate to previous question
  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };
  
  // Check if current question has been answered
  const isCurrentQuestionAnswered = () => {
    return selectedAnswers[currentQuestionIndex] !== undefined;
  };
  
  // Calculate progress percentage
  const calculateProgress = () => {
    const answeredCount = Object.keys(selectedAnswers).length;
    return Math.round((answeredCount / totalQuestions) * 100);
  };
  
  // Check if all questions have been answered
  const areAllQuestionsAnswered = () => {
    return Object.keys(selectedAnswers).length === totalQuestions;
  };
  
  // Get the correct answer text based on the correctAnswer value
  const getCorrectAnswerText = (question) => {
    // If correctAnswer is a direct index (0, 1, 2, 3) or letter (A, B, C, D)
    if (typeof question.correctAnswer === 'number' || 
        (typeof question.correctAnswer === 'string' && 
         question.correctAnswer.match(/^[A-D]$/i))) {
        
      // Convert letter to index if needed
      let correctIndex;
      if (typeof question.correctAnswer === 'string' && 
          question.correctAnswer.match(/^[A-D]$/i)) {
        correctIndex = question.correctAnswer.toUpperCase().charCodeAt(0) - 65; // A=0, B=1, etc.
      } else {
        correctIndex = Number(question.correctAnswer);
      }
      
      // Return the actual option text
      return question.options[correctIndex];
    }
    
    // If correctAnswer is already the full text
    return question.correctAnswer;
  };
  
  // Check if the selected answer is correct
  const isAnswerCorrect = (questionIndex, selectedAnswer) => {
    const question = questions[questionIndex];
    
    // If there's a direct match (the answer and correctAnswer are the same text)
    if (selectedAnswer === question.correctAnswer) {
      return true;
    }
    
    // If correctAnswer is a letter (A, B, C, D) or index
    if (typeof question.correctAnswer === 'string' && 
        question.correctAnswer.match(/^[A-D]$/i)) {
      const correctIndex = question.correctAnswer.toUpperCase().charCodeAt(0) - 65; // A=0, B=1, etc.
      return selectedAnswer === question.options[correctIndex];
    }
    
    // If correctAnswer is a numeric index
    if (typeof question.correctAnswer === 'number') {
      return selectedAnswer === question.options[question.correctAnswer];
    }
    
    return false;
  };
  
  // Submit quiz
  const handleSubmitQuiz = async () => {
    // Check if all questions have been answered
    if (!areAllQuestionsAnswered() && !showResults) {
      setErrorMessage('Please answer all questions before submitting');
      return;
    }
    
    setErrorMessage('');
    setIsSubmitting(true);
    
    try {
      // Calculate score
      let correctAnswers = 0;
      
      questions.forEach((question, index) => {
        if (isAnswerCorrect(index, selectedAnswers[index])) {
          correctAnswers++;
        }
      });
      
      const calculatedScore = Math.round((correctAnswers / totalQuestions) * 100);
      setScore(calculatedScore);
      
      // Show results first
      setShowResults(true);
      
      // Submit to API
      const progressData = await completeQuiz(moduleId, quizId, calculatedScore);
      setQuizCompleted(true);
      
      // Notify parent component
      if (onProgressUpdate && progressData) {
        setTimeout(() => {
          onProgressUpdate(progressData);
        }, 10000); // Delay to show results first
      }
    } catch (error) {
      console.error("Error submitting quiz:", error);
      setErrorMessage('Failed to submit quiz. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Render quiz results
  if (showResults) {
    const passingScore = quiz.passingScore || 60;
    const isPassed = score >= passingScore;
    
    return (
      <div className="space-y-8">
        <div className="text-center space-y-2">
          <div className={`inline-flex p-4 rounded-full ${
            isPassed 
              ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400" 
              : "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
          }`}>
            {isPassed ? (
              <CheckCircle className="h-12 w-12" />
            ) : (
              <XCircle className="h-12 w-12" />
            )}
          </div>
          
          <h2 className="text-2xl font-bold mt-4">
            {isPassed ? "Quiz Passed!" : "Not Passed"}
          </h2>
          
          <p className="text-gray-600 dark:text-gray-400">
            You scored {score}% (passing score: {passingScore}%)
          </p>
        </div>
        
        <Card className="overflow-hidden">
          <div className="bg-gray-50 dark:bg-gray-800 p-4 flex justify-between items-center border-b">
            <h3 className="font-bold">Quiz Results</h3>
            <div className="text-sm text-gray-500">
              {Object.keys(selectedAnswers).filter(
                index => isAnswerCorrect(Number(index), selectedAnswers[index])
              ).length} of {totalQuestions} correct
            </div>
          </div>
          <CardContent className="p-0">
            <div className="divide-y">
              {questions.map((question, index) => {
                const selected = selectedAnswers[index];
                const isCorrect = isAnswerCorrect(index, selected);
                const correctAnswerText = getCorrectAnswerText(question);
                
                return (
                  <div 
                    key={index} 
                    className={`p-4 ${
                      isCorrect 
                        ? "bg-green-50 dark:bg-green-900/10" 
                        : "bg-red-50 dark:bg-red-900/10"
                    }`}
                  >
                    <div className="flex gap-3">
                      <div className={`mt-0.5 p-1 rounded-full flex-shrink-0 ${
                        isCorrect 
                          ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400" 
                          : "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                      }`}>
                        {isCorrect ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <XCircle className="h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800 dark:text-gray-200">
                          {question.question}
                        </p>
                        <div className="mt-1 space-y-1 text-sm">
                          <p className={
                            isCorrect
                              ? "text-green-600 dark:text-green-400 font-medium"
                              : "text-red-600 dark:text-red-400 font-medium"
                          }>
                            Your answer: {selected || "No answer"}
                          </p>
                          
                          {!isCorrect && (
                            <p className="text-green-600 dark:text-green-400 font-medium">
                              Correct answer: {correctAnswerText}
                            </p>
                          )}
                          
                          {question.explanation && (
                            <p className="text-gray-600 dark:text-gray-400 mt-2 border-t border-gray-200 dark:border-gray-700 pt-2">
                              {question.explanation}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
        
        <div className="flex justify-between items-center mt-6">
          <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-700 dark:text-blue-400">
            <Award className="h-5 w-5" />
            <span>You earned <strong>{score}</strong> XP for this quiz!</span>
          </div>
          
          <Button onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    );
  }
  
  // Render quiz questions
  return (
    <div className="space-y-6">
      {/* Timer and progress */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mb-4">
        <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-700 dark:text-blue-400">
          <Clock className="h-4 w-4" />
          <span className="font-mono font-medium">{formatTime(timeRemaining)}</span>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <span>Question {currentQuestionIndex + 1} of {totalQuestions}</span>
          <Progress value={((currentQuestionIndex + 1) / totalQuestions) * 100} className="w-24 h-2" />
        </div>
      </div>
      
      {/* Error message */}
      {errorMessage && (
        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-700 dark:text-red-400">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
      
      {/* Current question */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-200">
          {questions[currentQuestionIndex]?.question}
        </h3>
        
        <RadioGroup 
          value={selectedAnswers[currentQuestionIndex] || ""}
          onValueChange={(value) => handleSelectAnswer(currentQuestionIndex, value)}
          className="space-y-3"
        >
          {questions[currentQuestionIndex]?.options?.map((option, idx) => (
            <div 
              key={idx} 
              className="flex items-center space-x-2 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer"
              onClick={() => handleSelectAnswer(currentQuestionIndex, option)}
            >
              <RadioGroupItem 
                value={option} 
                id={`option-${idx}`} 
                className="data-[state=checked]:border-blue-500 data-[state=checked]:text-blue-500" 
              />
              <Label 
                htmlFor={`option-${idx}`}
                className="w-full cursor-pointer flex-1 text-base font-medium"
              >
                {option}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>
      
      {/* Navigation buttons */}
      <div className="flex justify-between mt-6">
        <Button 
          variant="ghost" 
          onClick={handlePrevQuestion}
          disabled={currentQuestionIndex === 0}
          className="gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>
        
        <div className="flex gap-2">
          {currentQuestionIndex < totalQuestions - 1 ? (
            <Button 
              onClick={handleNextQuestion}
              disabled={!isCurrentQuestionAnswered()}
              className="gap-2"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button 
              onClick={handleSubmitQuiz}
              disabled={isSubmitting || !areAllQuestionsAnswered()}
              className="gap-2 bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? "Submitting..." : "Submit Quiz"}
            </Button>
          )}
        </div>
      </div>
      
      {/* Quiz progress */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
          <span>Completion</span>
          <span>{calculateProgress()}%</span>
        </div>
        <Progress value={calculateProgress()} className="h-2" />
        <p className="text-xs text-gray-500 mt-2">
          {areAllQuestionsAnswered() 
            ? "All questions answered, you can submit the quiz!" 
            : `${Object.keys(selectedAnswers).length} of ${totalQuestions} questions answered`}
        </p>
      </div>
    </div>
  );
};

export default EnhancedQuiz;