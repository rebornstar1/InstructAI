"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  ArrowRight, 
  ArrowLeft,
  Trophy,
  RefreshCw,
  HelpCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Enhanced Quiz component integrated with the new term-based progress API
 * 
 * @param {Object} props
 * @param {string|number} props.moduleId - The ID of the module
 * @param {number} props.termIndex - The index of the term this quiz belongs to
 * @param {Object} props.quiz - The quiz object containing questions
 * @param {Function} props.onClose - Callback when quiz is closed
 * @param {Function} props.onComplete - Callback when quiz is completed
 * @param {boolean} props.isCompleted - Whether the quiz is already completed
 * @param {Object} props.resourceProgress - Progress information for this resource
 */
export default function UpdatedEnhancedQuiz({ 
  moduleId, 
  termIndex,
  quiz, 
  onClose,
  onComplete,
  isCompleted = false,
  resourceProgress = {}
}) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [score, setScore] = useState(resourceProgress.quizScore || 0);
  const [quizComplete, setQuizComplete] = useState(isCompleted);
  const [userAnswers, setUserAnswers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);
  
  const questions = quiz.questions || [];
  const totalQuestions = questions.length;
  const passingScore = quiz.passingScore || 70;
  
  // Set initial state from props if provided
  useEffect(() => {
    if (isCompleted) {
      setQuizComplete(true);
    }
  }, [isCompleted]);
  
  // Initialize user answers with empty array
  useEffect(() => {
    if (questions.length > 0) {
      setUserAnswers(new Array(questions.length).fill(null));
    }
  }, [questions]);

  const handleOptionSelect = (optionIndex) => {
    if (quizComplete) return;
    
    // Update selected options
    const newSelectedOptions = [...selectedOptions];
    newSelectedOptions[currentQuestionIndex] = optionIndex;
    setSelectedOptions(newSelectedOptions);
    
    // Update user answers
    const newUserAnswers = [...userAnswers];
    const currentQuestion = questions[currentQuestionIndex];
    const optionText = currentQuestion.options[optionIndex];
    const optionLetter = String.fromCharCode(65 + optionIndex); // Convert 0-based index to A, B, C, etc.
    
    newUserAnswers[currentQuestionIndex] = {
      questionIndex: currentQuestionIndex,
      question: currentQuestion.question,
      selectedOption: optionText,
      selectedLetter: optionLetter,
      correctLetter: currentQuestion.correctAnswer,
      isCorrect: optionLetter === currentQuestion.correctAnswer,
      explanation: currentQuestion.explanation,
    };
    
    setUserAnswers(newUserAnswers);
  };

  const goToNextQuestion = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      finishQuiz();
    }
  };

  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const finishQuiz = async () => {
    // Calculate score
    const answeredQuestions = userAnswers.filter(answer => answer !== null);
    const correctAnswers = answeredQuestions.filter(answer => answer.isCorrect);
    const calculatedScore = Math.round((correctAnswers.length / totalQuestions) * 100);
    
    setScore(calculatedScore);
    setQuizComplete(true);
    setAttemptCount(attemptCount + 1);
    
    // Report progress to the server
    setLoading(true);
    try {
      if (onComplete) {
        await onComplete(calculatedScore);
      }
    } catch (error) {
      console.error("Error updating quiz progress:", error);
    } finally {
      setLoading(false);
    }
  };

  const restartQuiz = () => {
    setCurrentQuestionIndex(0);
    setSelectedOptions([]);
    setUserAnswers(new Array(questions.length).fill(null));
    setQuizComplete(false);
  };

  if (questions.length === 0) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold mb-2">No Questions Available</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          This quiz does not contain any questions yet.
        </p>
        <Button onClick={onClose}>Close</Button>
      </div>
    );
  }

  // Quiz Results Screen
  if (quizComplete) {
    const isPassed = score >= passingScore;
    const answeredQuestions = userAnswers.filter(answer => answer !== null);
    const unansweredCount = totalQuestions - answeredQuestions.length;
    
    return (
      <div className="space-y-6">
        <div className="text-center">
          {isPassed ? (
            <div className="inline-flex items-center justify-center p-4 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full mb-4">
              <Trophy className="h-10 w-10" />
            </div>
          ) : (
            <div className="inline-flex items-center justify-center p-4 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full mb-4">
              <AlertCircle className="h-10 w-10" />
            </div>
          )}
          
          <h2 className="text-2xl font-bold mb-2">
            {isPassed ? "Congratulations!" : "Quiz Completed"}
          </h2>
          
          <p className="text-gray-600 dark:text-gray-400 mb-2">
            {isPassed 
              ? "You've successfully passed the quiz!" 
              : "You didn't reach the passing score. Consider reviewing the material and try again."}
          </p>
          
          <div className="flex justify-center gap-2 mt-4 mb-6">
            <Badge className={`px-3 py-1 text-sm ${
              isPassed 
                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" 
                : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
            }`}>
              Score: {score}%
            </Badge>
            
            <Badge className="px-3 py-1 text-sm bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
              Passing: {passingScore}%
            </Badge>
            
            {attemptCount > 1 && (
              <Badge className="px-3 py-1 text-sm bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                Attempt: {attemptCount}
              </Badge>
            )}
          </div>
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 mb-6">
          <h3 className="font-bold mb-2">Quiz Summary</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded-full bg-green-500"></div>
              <span>Correct: {answeredQuestions.filter(a => a?.isCorrect).length}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded-full bg-red-500"></div>
              <span>Incorrect: {answeredQuestions.filter(a => a && !a.isCorrect).length}</span>
            </div>
            {unansweredCount > 0 && (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded-full bg-gray-300 dark:bg-gray-600"></div>
                <span>Unanswered: {unansweredCount}</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="space-y-4">
          <h3 className="font-bold text-lg">Question Review</h3>
          
          {userAnswers.map((answer, index) => {
            if (!answer) return null;
            
            return (
              <div 
                key={index}
                className={`p-4 rounded-lg border ${
                  answer.isCorrect 
                    ? "bg-green-50 border-green-200 dark:bg-green-900/10 dark:border-green-900/30" 
                    : "bg-red-50 border-red-200 dark:bg-red-900/10 dark:border-red-900/30"
                }`}
              >
                <div className="flex items-start gap-2">
                  {answer.isCorrect ? (
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-500 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600 dark:text-red-500 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className="font-medium mb-1">Question {index + 1}: {answer.question}</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                      Your answer: {answer.selectedLetter}. {answer.selectedOption}
                    </p>
                    {!answer.isCorrect && (
                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                        Correct answer: {answer.correctLetter}
                      </p>
                    )}
                    <div className="text-sm bg-white dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-700">
                      <p className="font-medium mb-1">Explanation:</p>
                      <p className="text-gray-600 dark:text-gray-400">{answer.explanation}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="flex gap-3 justify-between mt-6">
          <Button 
            variant="outline" 
            onClick={onClose}
          >
            Close
          </Button>
          
          <Button 
            onClick={restartQuiz}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            {isPassed ? "Take Quiz Again" : "Retry Quiz"}
          </Button>
        </div>
      </div>
    );
  }

  // Current question display
  const currentQuestion = questions[currentQuestionIndex];
  const selectedOption = selectedOptions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === totalQuestions - 1;
  const canNavigateNext = selectedOption !== undefined;
  
  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      <div className="flex justify-between items-center mb-6">
        <Badge className="bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400 border-none">
          Question {currentQuestionIndex + 1} of {totalQuestions}
        </Badge>
        
        <div className="flex-1 mx-4">
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-indigo-600 rounded-full transition-all duration-300"
              style={{ width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%` }}
            />
          </div>
        </div>
        
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {Math.round(((currentQuestionIndex + 1) / totalQuestions) * 100)}%
        </span>
      </div>
      
      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestionIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-4">{currentQuestion.question}</h2>
            
            <div className="space-y-3">
              {currentQuestion.options.map((option, index) => {
                const optionLetter = String.fromCharCode(65 + index); // A, B, C, D...
                const isSelected = selectedOption === index;
                
                return (
                  <button
                    key={index}
                    className={`w-full p-4 rounded-lg border text-left transition-all ${
                      isSelected 
                        ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 dark:border-indigo-600" 
                        : "border-gray-200 dark:border-gray-700 hover:border-indigo-200 dark:hover:border-indigo-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    }`}
                    onClick={() => handleOptionSelect(index)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        isSelected 
                          ? "bg-indigo-500 text-white" 
                          : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                      }`}>
                        {optionLetter}
                      </div>
                      <span>{option}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
      
      {/* Navigation buttons */}
      <div className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={goToPreviousQuestion}
          disabled={currentQuestionIndex === 0}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>
        
        <Button 
          onClick={goToNextQuestion}
          disabled={!canNavigateNext || loading}
          className="bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          {loading ? (
            <>
              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Loading...
            </>
          ) : (
            <>
              {isLastQuestion ? "Finish Quiz" : "Next Question"}
              <ArrowRight className="h-4 w-4 ml-2" />
            </>
          )}
        </Button>
      </div>
      
      {/* Help text */}
      <div className="text-center mt-4">
        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center justify-center gap-1">
          <HelpCircle className="h-3 w-3" />
          Select an answer and click Next to continue
        </p>
      </div>
    </div>
  );
}