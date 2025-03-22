"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Clock,
  Trophy,
  ChevronRight,
  RotateCcw,
  HelpCircle,
  BookOpen,
  CheckSquare,
  Award,
  BarChart
} from "lucide-react";

const QuizComponent = ({ quizzes = [], onComplete }) => {
  const [activeQuizIndex, setActiveQuizIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [userAnswers, setUserAnswers] = useState([]);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [timer, setTimer] = useState(0);
  const [quizStartTime, setQuizStartTime] = useState(null);
  const [quizResults, setQuizResults] = useState(null);

  const activeQuiz = quizzes[activeQuizIndex];
  const currentQuestion = activeQuiz?.questions[currentQuestionIndex];
  
  // Reset state when the active quiz changes
  useEffect(() => {
    resetQuiz();
  }, [activeQuizIndex]);

  // Timer functionality
  useEffect(() => {
    let interval;
    
    if (quizStartTime && !quizCompleted) {
      interval = setInterval(() => {
        const elapsedSeconds = Math.floor((Date.now() - quizStartTime) / 1000);
        setTimer(elapsedSeconds);
      }, 1000);
    }
    
    return () => clearInterval(interval);
  }, [quizStartTime, quizCompleted]);

  const resetQuiz = () => {
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setShowExplanation(false);
    setUserAnswers([]);
    setQuizCompleted(false);
    setTimer(0);
    setQuizStartTime(Date.now());
    setQuizResults(null);
  };

  const handleOptionSelect = (optionIndex) => {
    if (showExplanation) return; // Prevent selection after submitting
    
    const optionLetter = String.fromCharCode(65 + optionIndex); // Convert 0 to 'A', 1 to 'B', etc.
    setSelectedOption(optionLetter);
  };

  const handleSubmitAnswer = () => {
    if (!selectedOption || showExplanation) return;
    
    // Record the user's answer
    const newAnswers = [...userAnswers];
    newAnswers[currentQuestionIndex] = selectedOption;
    setUserAnswers(newAnswers);
    
    // Show explanation
    setShowExplanation(true);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < activeQuiz.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedOption(null);
      setShowExplanation(false);
    } else {
      // Calculate quiz results
      const correctCount = userAnswers.filter((answer, index) => 
        answer === activeQuiz.questions[index].correctAnswer
      ).length;
      
      const scorePercentage = Math.round((correctCount / activeQuiz.questions.length) * 100);
      const passed = scorePercentage >= activeQuiz.passingScore;
      
      setQuizResults({
        totalQuestions: activeQuiz.questions.length,
        correctAnswers: correctCount,
        scorePercentage,
        passed,
        timeSpent: timer,
      });
      
      setQuizCompleted(true);
      
      // Call the onComplete handler if provided
      if (onComplete) {
        onComplete({
          quizTitle: activeQuiz.quizTitle,
          score: scorePercentage,
          passed,
          timeSpent: timer
        });
      }
    }
  };

  const formatTime = (totalSeconds) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  // If no quizzes are available, display a placeholder
  if (!quizzes || quizzes.length === 0) {
    return (
      <Card className="w-full">
        <CardContent className="p-6 text-center">
          <HelpCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold mb-2">No Quizzes Available</h3>
          <p className="text-gray-500">Quizzes are being generated for this content.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="relative border-b">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">{activeQuiz.quizTitle}</CardTitle>
            <CardDescription className="mt-1">{activeQuiz.description}</CardDescription>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1 text-sm font-medium">
              <Clock className="h-4 w-4 text-gray-500" />
              <span>{activeQuiz.timeLimit}</span>
            </div>
            <div className="bg-primary/10 text-primary px-2 py-1 rounded text-sm">
              {activeQuiz.difficulty}
            </div>
          </div>
        </div>
        
        {!quizCompleted && (
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-1">
              <span>Question {currentQuestionIndex + 1} of {activeQuiz.questions.length}</span>
              <span className="flex items-center">
                <Clock className="h-4 w-4 mr-1 text-gray-500" />
                {formatTime(timer)}
              </span>
            </div>
            <Progress value={(currentQuestionIndex / activeQuiz.questions.length) * 100} className="h-2" />
          </div>
        )}
      </CardHeader>
      
      <CardContent className="p-6">
        {quizCompleted ? (
          <div className="space-y-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                {quizResults.passed ? (
                  <Trophy className="h-8 w-8 text-primary" />
                ) : (
                  <AlertCircle className="h-8 w-8 text-amber-500" />
                )}
              </div>
              <h3 className="text-2xl font-bold mb-1">
                {quizResults.passed ? "Quiz Passed!" : "Almost There"}
              </h3>
              <p className="text-gray-500">
                You scored {quizResults.correctAnswers} out of {quizResults.totalQuestions} questions
              </p>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3">
                  <div className="text-3xl font-bold text-primary mb-1">
                    {quizResults.scorePercentage}%
                  </div>
                  <div className="text-sm text-gray-500">Your Score</div>
                </div>
                <div className="text-center p-3">
                  <div className="text-3xl font-bold text-amber-500 mb-1">
                    {activeQuiz.passingScore}%
                  </div>
                  <div className="text-sm text-gray-500">Passing Score</div>
                </div>
                <div className="text-center p-3">
                  <div className="text-3xl font-bold text-indigo-500 mb-1">
                    {quizResults.correctAnswers}
                  </div>
                  <div className="text-sm text-gray-500">Correct Answers</div>
                </div>
                <div className="text-center p-3">
                  <div className="text-3xl font-bold text-cyan-500 mb-1">
                    {formatTime(quizResults.timeSpent)}
                  </div>
                  <div className="text-sm text-gray-500">Completion Time</div>
                </div>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 justify-center">
              <Button 
                variant="outline" 
                className="flex items-center gap-2"
                onClick={resetQuiz}
              >
                <RotateCcw className="h-4 w-4" />
                Restart Quiz
              </Button>
              
              {quizzes.length > 1 && activeQuizIndex < quizzes.length - 1 && (
                <Button 
                  className="flex items-center gap-2"
                  onClick={() => setActiveQuizIndex(activeQuizIndex + 1)}
                >
                  <BookOpen className="h-4 w-4" />
                  Try Next Quiz
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">{currentQuestion.question}</h3>
              
              <div className="space-y-3">
                {currentQuestion.options.map((option, index) => (
                  <div 
                    key={index}
                    className={`
                      p-4 rounded-lg border-2 cursor-pointer transition-colors
                      ${selectedOption === String.fromCharCode(65 + index) 
                        ? 'border-primary bg-primary/5' 
                        : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'}
                      ${showExplanation && String.fromCharCode(65 + index) === currentQuestion.correctAnswer
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
                        : ''}
                      ${showExplanation && selectedOption === String.fromCharCode(65 + index) && selectedOption !== currentQuestion.correctAnswer
                        ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                        : ''}
                    `}
                    onClick={() => handleOptionSelect(index)}
                  >
                    <div className="flex items-start">
                      <div className={`
                        flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mr-3 
                        ${selectedOption === String.fromCharCode(65 + index) 
                          ? 'bg-primary text-white' 
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}
                        ${showExplanation && String.fromCharCode(65 + index) === currentQuestion.correctAnswer
                          ? 'bg-green-500 text-white' 
                          : ''}
                        ${showExplanation && selectedOption === String.fromCharCode(65 + index) && selectedOption !== currentQuestion.correctAnswer
                          ? 'bg-red-500 text-white'
                          : ''}
                      `}>
                        {String.fromCharCode(65 + index)}
                      </div>
                      <div className="flex-1">
                        {option.replace(/^[A-D]\.\s*/, '')}
                      </div>
                      {showExplanation && (
                        <div className="flex-shrink-0 ml-2">
                          {String.fromCharCode(65 + index) === currentQuestion.correctAnswer ? (
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                          ) : (selectedOption === String.fromCharCode(65 + index) ? (
                            <XCircle className="h-5 w-5 text-red-500" />
                          ) : null)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {showExplanation && (
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <h4 className="font-semibold flex items-center mb-2">
                  <AlertCircle className="h-4 w-4 mr-2 text-blue-500" />
                  Explanation
                </h4>
                <p>{currentQuestion.explanation}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
      
      <CardFooter className="border-t p-4 flex justify-between">
        {!quizCompleted ? (
          <>
            {showExplanation ? (
              <Button 
                className="flex items-center gap-2"
                onClick={handleNextQuestion}
              >
                {currentQuestionIndex < activeQuiz.questions.length - 1 ? (
                  <>Next Question <ChevronRight className="h-4 w-4" /></>
                ) : (
                  <>Complete Quiz <CheckSquare className="h-4 w-4" /></>
                )}
              </Button>
            ) : (
              <Button 
                className="flex items-center gap-2"
                onClick={handleSubmitAnswer}
                disabled={!selectedOption}
              >
                Submit Answer
              </Button>
            )}
          </>
        ) : (
          <div className="w-full flex justify-between">
            {activeQuizIndex > 0 && (
              <Button 
                variant="outline" 
                onClick={() => setActiveQuizIndex(activeQuizIndex - 1)}
              >
                Previous Quiz
              </Button>
            )}
            {quizzes.length > 1 && (
              <Tabs 
                value={activeQuizIndex.toString()} 
                className="flex justify-center"
                onValueChange={(value) => setActiveQuizIndex(parseInt(value))}
              >
                <TabsList>
                  {quizzes.map((_, index) => (
                    <TabsTrigger 
                      key={index} 
                      value={index.toString()}
                      className="text-xs px-2 py-1"
                    >
                      Quiz {index + 1}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            )}
            {activeQuizIndex < quizzes.length - 1 && (
              <Button 
                onClick={() => setActiveQuizIndex(activeQuizIndex + 1)}
              >
                Next Quiz
              </Button>
            )}
          </div>
        )}
      </CardFooter>
    </Card>
  );
};

export default QuizComponent;