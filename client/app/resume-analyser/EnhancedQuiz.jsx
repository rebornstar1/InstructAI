import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle, 
  ChevronRight, 
  ChevronLeft,
  Award,
  HelpCircle,
  BarChart4,
  CheckCheck
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * EnhancedQuiz - Interactive quiz component with enhanced design and progress tracking.
 *
 * Props:
 *  - moduleId: ID of the current module.
 *  - quiz: Quiz data with questions.
 *  - onClose: Callback to close the quiz.
 *  - onProgressUpdate: Callback when progress updates.
 *  - onQuizFail: Callback that receives an array of topics when the user's score is below the passing score.
 *  - onQuizComplete: Callback that receives quiz result data when quiz is completed.
 */
const EnhancedQuiz = ({ 
  moduleId, 
  quiz, 
  onClose,
  onProgressUpdate,
  onQuizFail,
  onQuizComplete
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [score, setScore] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(600); // default 10 minutes
  const [showResults, setShowResults] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isTimeWarning, setIsTimeWarning] = useState(false);
  const [reviewMode, setReviewMode] = useState(false);
  
  const questions = quiz.questions || [];
  const totalQuestions = questions.length;
  const currentQuestion = questions[currentQuestionIndex];
  const quizTitle = quiz.quizTitle || 'Quiz';
  
  // Parse time limit from quiz if provided.
  useEffect(() => {
    let seconds = 600;
    if (quiz.timeLimit) {
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
  
  // Start timer countdown.
  useEffect(() => {
    if (quizCompleted || showResults) return;
    
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= Math.floor(600 * 0.2) && !isTimeWarning) {
          setIsTimeWarning(true);
        }
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [quizCompleted, showResults, isTimeWarning]);
  
  // Format time as mm:ss.
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Handle answer selection.
  const handleSelectAnswer = (questionIndex, answer) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionIndex]: answer
    }));
    
    // Clear error message when an answer is selected
    if (errorMessage) {
      setErrorMessage('');
    }
  };
  
  // Navigation functions.
  const handleNextQuestion = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };
  
  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };
  
  const isCurrentQuestionAnswered = () => {
    return selectedAnswers[currentQuestionIndex] !== undefined;
  };
  
  const calculateProgress = () => {
    const answeredCount = Object.keys(selectedAnswers).length;
    return Math.round((answeredCount / totalQuestions) * 100);
  };
  
  const areAllQuestionsAnswered = () => {
    return Object.keys(selectedAnswers).length === totalQuestions;
  };

  const getUnansweredQuestions = () => {
    return Array.from({ length: totalQuestions }, (_, i) => i)
      .filter(idx => selectedAnswers[idx] === undefined);
  };
  
  const getCorrectAnswerText = (question) => {
    if (
      typeof question.correctAnswer === 'number' ||
      (typeof question.correctAnswer === 'string' && 
       question.correctAnswer.match(/^[A-D]$/i))
    ) {
      let correctIndex;
      if (
        typeof question.correctAnswer === 'string' && 
        question.correctAnswer.match(/^[A-D]$/i)
      ) {
        correctIndex = question.correctAnswer.toUpperCase().charCodeAt(0) - 65;
      } else {
        correctIndex = Number(question.correctAnswer);
      }
      return question.options[correctIndex];
    }
    return question.correctAnswer;
  };
  
  const isAnswerCorrect = (questionIndex, selectedAnswer) => {
    const question = questions[questionIndex];
    if (selectedAnswer === question.correctAnswer) {
      return true;
    }
    if (
      typeof question.correctAnswer === 'string' &&
      question.correctAnswer.match(/^[A-D]$/i)
    ) {
      const correctIndex = question.correctAnswer.toUpperCase().charCodeAt(0) - 65;
      return selectedAnswer === question.options[correctIndex];
    }
    if (typeof question.correctAnswer === 'number') {
      return selectedAnswer === question.options[question.correctAnswer];
    }
    return false;
  };
  
  // Jump to a specific question by index.
  const jumpToQuestion = (index) => {
    if (index >= 0 && index < totalQuestions) {
      setCurrentQuestionIndex(index);
    }
  };
  
  // Submit quiz: compute score locally and trigger callbacks.
  const handleSubmitQuiz = () => {
    if (!areAllQuestionsAnswered() && !showResults) {
      const unansweredQuestions = getUnansweredQuestions();
      setErrorMessage(`Please answer all questions before submitting. You have ${unansweredQuestions.length} unanswered question(s).`);
      return;
    }
    
    setErrorMessage('');
    setIsSubmitting(true);
    
    let correctAnswers = 0;
    questions.forEach((question, index) => {
      if (isAnswerCorrect(index, selectedAnswers[index])) {
        correctAnswers++;
      }
    });
    
    const calculatedScore = Math.round((correctAnswers / totalQuestions) * 100);
    const passingScore = quiz.passingScore || 60;
    const isPassed = calculatedScore >= passingScore;
    
    setScore(calculatedScore);
    setShowResults(true);
    setQuizCompleted(true);
    
    const resultData = {
      quizId: quiz.id || quiz.quizId || moduleId,
      quizTitle: quizTitle,
      score: calculatedScore,
      totalQuestions,
      correctAnswers,
      passed: isPassed,
      timeSpent: 600 - timeRemaining, // time spent in seconds
      timestamp: new Date().toISOString(),
      answers: selectedAnswers
    };
    
    if (!isPassed && onQuizFail) {
      const topicsToFail = (quiz.topics && quiz.topics.length > 0) ? quiz.topics : [quizTitle];
      onQuizFail(topicsToFail);
    }
    
    if (onQuizComplete) {
      onQuizComplete(resultData);
    }
    
    if (onProgressUpdate) {
      onProgressUpdate({
        score: calculatedScore,
        completed: true,
        passed: isPassed
      });
    }
    
    setIsSubmitting(false);
  };

  const toggleReviewMode = () => {
    setReviewMode(!reviewMode);
  };

  if (showResults) {
    const passingScore = quiz.passingScore || 60;
    const isPassed = score >= passingScore;
    const correctAnswersCount = Object.keys(selectedAnswers).filter(
      index => isAnswerCorrect(Number(index), selectedAnswers[index])
    ).length;
    
    return (
      <div className="space-y-8 max-w-4xl mx-auto animate-fadeIn">
        <div className="text-center space-y-4">
          <div 
            className={cn(
              "inline-flex p-5 rounded-full shadow-md transition-transform duration-700 transform hover:scale-105",
              isPassed 
                ? "bg-gradient-to-br from-green-50 to-green-100 text-green-600 dark:from-green-900/30 dark:to-green-800/30 dark:text-green-400" 
                : "bg-gradient-to-br from-red-50 to-red-100 text-red-600 dark:from-red-900/30 dark:to-red-800/30 dark:text-red-400"
            )}>
            {isPassed ? (
              <CheckCircle className="h-16 w-16 md:h-20 md:w-20" />
            ) : (
              <XCircle className="h-16 w-16 md:h-20 md:w-20" />
            )}
          </div>
          <h2 className="text-2xl md:text-3xl font-bold mt-4">
            {isPassed ? "Quiz Passed!" : "Quiz Not Passed"}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
            {isPassed 
              ? "Great job! You've successfully completed this quiz." 
              : "Don't worry! Review your answers and try again for a better score."}
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 max-w-2xl mx-auto">
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-xl p-4 shadow-sm flex flex-col items-center">
              <BarChart4 className="h-8 w-8 text-blue-500 mb-2" />
              <span className="text-2xl font-bold">{score}%</span>
              <span className="text-gray-500 text-sm">Your Score</span>
              <span className="text-xs mt-1 text-gray-500">(Passing: {passingScore}%)</span>
            </div>
            
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-xl p-4 shadow-sm flex flex-col items-center">
              <CheckCheck className="h-8 w-8 text-green-500 mb-2" />
              <span className="text-2xl font-bold">{correctAnswersCount}/{totalQuestions}</span>
              <span className="text-gray-500 text-sm">Correct Answers</span>
            </div>
            
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-xl p-4 shadow-sm flex flex-col items-center">
              <Clock className="h-8 w-8 text-purple-500 mb-2" />
              <span className="text-2xl font-bold">{formatTime(600 - timeRemaining)}</span>
              <span className="text-gray-500 text-sm">Time Spent</span>
            </div>
          </div>
        </div>
        
        <Card className="overflow-hidden shadow-lg border-0 rounded-xl">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-b px-6 py-5">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
              <div>
                <Badge variant={reviewMode ? "secondary" : "outline"} className="mb-2">
                  {reviewMode ? "Review Mode" : "Results"}
                </Badge>
                <CardTitle>{quizTitle}</CardTitle>
              </div>
              <Button 
                variant="outline" 
                onClick={toggleReviewMode}
                className="transition-all duration-300"
              >
                {reviewMode ? "Hide Explanations" : "Show Explanations"}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {questions.map((question, index) => {
                const selected = selectedAnswers[index];
                const isCorrect = isAnswerCorrect(index, selected);
                const correctAnswerText = getCorrectAnswerText(question);
                return (
                  <div 
                    key={index} 
                    className={cn(
                      "p-5 md:p-6 transition-all duration-500",
                      isCorrect 
                        ? "bg-green-50 dark:bg-green-900/10" 
                        : "bg-red-50 dark:bg-red-900/10"
                    )}
                  >
                    <div className="flex gap-3">
                      <div className={cn(
                        "mt-0.5 p-2 rounded-full flex-shrink-0 shadow-sm",
                        isCorrect 
                          ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400" 
                          : "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                      )}>
                        {isCorrect ? (
                          <CheckCircle className="h-5 w-5" />
                        ) : (
                          <XCircle className="h-5 w-5" />
                        )}
                      </div>
                      <div className="space-y-3 flex-1">
                        <p className="font-medium text-gray-800 dark:text-gray-200 text-base md:text-lg leading-relaxed">
                          {question.question}
                        </p>
                        <div className="space-y-2 text-sm md:text-base">
                          <div className={cn(
                            "p-3 rounded-lg border",
                            isCorrect
                              ? "bg-green-100 border-green-200 dark:border-green-800"
                              : "bg-red-100 border-red-200 dark:border-red-800"
                          )}>
                            <p className={cn(
                              "font-medium flex items-center",
                              isCorrect
                                ? "text-green-700 dark:text-green-400"
                                : "text-red-700 dark:text-red-400"
                            )}>
                              <span className="inline-block w-28">Your answer:</span> 
                              <span className="bg-white dark:bg-gray-800 px-3 py-1 rounded-md ml-2 shadow-sm">
                                {selected || "No answer"}
                              </span>
                            </p>
                            {!isCorrect && (
                              <p className="text-green-700 dark:text-green-400 font-medium mt-2 flex items-center">
                                <span className="inline-block w-28">Correct:</span>
                                <span className="bg-white dark:bg-gray-800 px-3 py-1 rounded-md ml-2 shadow-sm">
                                  {correctAnswerText}
                                </span>
                              </p>
                            )}
                          </div>
                        </div>
                        {reviewMode && question.explanation && (
                          <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700 animate-fadeIn">
                            <h4 className="font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2 mb-2">
                              <AlertCircle className="h-4 w-4 text-blue-500" />
                              Explanation:
                            </h4>
                            <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg">
                              {question.explanation}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row justify-between items-center gap-4 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
            <div className="flex items-center gap-2 p-4 bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-lg text-blue-700 dark:text-blue-300 shadow-sm w-full sm:w-auto">
              <Award className="h-6 w-6" />
              <span className="font-medium">
                You earned <strong>{score}</strong> XP for this quiz!
              </span>
            </div>
            <Button 
              onClick={onClose} 
              size="lg" 
              className="w-full sm:w-auto transition-transform hover:scale-105 shadow-md bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
            >
              Complete & Continue
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Quiz header */}
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 pt-7">{quizTitle}</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Complete all {totalQuestions} questions to pass this quiz
        </p>
      </div>
      
      {/* Timer and progress */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4 px-5">
        <div className={cn(
          "flex items-center gap-2 p-3 rounded-lg shadow-lg border transition-all duration-300",
          isTimeWarning 
            ? "bg-gradient-to-r from-red-200 to-red-100 text-red-700 dark:from-red-900 dark:to-red-800 animate-pulse" 
            : "bg-gradient-to-r from-blue-100 to-blue-50 text-blue-700 dark:from-blue-900 dark:to-blue-800"
        )}>
          <Clock className="h-5 w-5" />
          <span className="font-mono font-semibold text-lg">{formatTime(timeRemaining)}</span>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
            Question {currentQuestionIndex + 1} of {totalQuestions}
          </div>
          <Progress 
            value={((currentQuestionIndex + 1) / totalQuestions) * 100} 
            className="w-full sm:w-36 h-2 bg-gray-200 dark:bg-gray-700" 
            aria-label="Question progress"
          />
        </div>
      </div>
      
      {/* Navigation pills */}
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 overflow-x-auto shadow-sm border border-gray-100 dark:border-gray-700 transition-all">
        <div className="flex gap-2 flex-wrap justify-center">
          {Array.from({ length: totalQuestions }, (_, i) => (
            <button
              key={i}
              onClick={() => jumpToQuestion(i)}
              aria-label={`Go to question ${i + 1}`}
              className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center text-sm font-medium transition-transform duration-300 shadow",
                i === currentQuestionIndex 
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white ring-2 ring-blue-300 dark:ring-blue-700 transform scale-110' 
                  : selectedAnswers[i] !== undefined
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-400 hover:scale-105' 
                    : 'bg-white text-gray-700 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:scale-105'
              )}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>
      
      {/* Error message */}
      {errorMessage && (
        <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/10 rounded-lg text-red-700 dark:text-red-400 animate-fadeIn shadow border border-red-200 dark:border-red-800/50">
          <AlertCircle className="h-6 w-6" />
          <div className="flex-1">
            <p className="font-medium">{errorMessage}</p>
            {!areAllQuestionsAnswered() && (
              <div className="mt-2 flex flex-wrap gap-1">
                <span className="text-sm font-medium">Unanswered questions: </span>
                <div className="flex flex-wrap gap-1">
                  {getUnansweredQuestions().map((idx) => (
                    <button 
                      key={idx}
                      onClick={() => jumpToQuestion(idx)}
                      className="text-sm bg-red-200 dark:bg-red-800/50 px-2 py-0.5 rounded-md hover:bg-red-300 transition-colors"
                    >
                      {idx + 1}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Question card */}
      <Card className="shadow-xl border-0 rounded-xl overflow-hidden transition-transform duration-500 hover:scale-[1.01]">
        <CardHeader className="border-b pb-5 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700">
          <Badge className="mb-2" variant="outline">Question {currentQuestionIndex + 1}</Badge>
          <CardTitle className="text-xl font-bold text-gray-800 dark:text-gray-200">
            {currentQuestion?.question}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="pt-6 pb-8 bg-white dark:bg-gray-900">
          <RadioGroup 
            value={selectedAnswers[currentQuestionIndex] || ""}
            onValueChange={(value) => handleSelectAnswer(currentQuestionIndex, value)}
            className="space-y-3"
          >
            {currentQuestion?.options?.map((option, idx) => (
              <div 
                key={idx} 
                className={cn(
                  "flex items-center space-x-3 p-4 rounded-lg border-2 shadow-sm transition-all duration-300 cursor-pointer",
                  selectedAnswers[currentQuestionIndex] === option
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/10 dark:border-blue-500 transform scale-[1.02]"
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                )}
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
        </CardContent>
        
        <CardFooter className="flex flex-col sm:flex-row justify-between items-center pt-5 pb-5 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 gap-4">
          <Button 
            variant="outline" 
            onClick={handlePrevQuestion}
            disabled={currentQuestionIndex === 0}
            className="gap-2 w-full sm:w-auto order-2 sm:order-1 shadow-sm transition-transform hover:scale-105"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          
          <div className="flex gap-2 w-full sm:w-auto order-1 sm:order-2">
            {currentQuestionIndex < totalQuestions - 1 ? (
              <Button 
                onClick={handleNextQuestion}
                disabled={!isCurrentQuestionAnswered()}
                className="gap-2 w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 shadow-md transition-transform hover:scale-105"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button 
                onClick={handleSubmitQuiz}
                disabled={isSubmitting}
                className="gap-2 w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 shadow-md transition-transform hover:scale-105"
              >
                {isSubmitting ? "Submitting..." : "Submit Quiz"}
                <CheckCheck className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
      
      
    </div>
  );
};

export default EnhancedQuiz;