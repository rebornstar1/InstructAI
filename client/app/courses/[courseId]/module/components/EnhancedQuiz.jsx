"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { CheckCircle, X, HelpCircle, Award } from "lucide-react";
import { completeQuiz } from "@/services/progressApi";
import { toast } from "@/components/ui/use-toast"; // Fixed import
import { Badge } from "@/components/ui/badge"; // Added missing Badge import

/**
 * Enhanced Quiz component that submits quiz results to the API
 */
export default function EnhancedQuiz({ 
  moduleId, 
  quiz, 
  onClose, 
  onProgressUpdate 
}) {
  const [quizAnswers, setQuizAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [passedQuiz, setPassedQuiz] = useState(false);

  const handleQuizAnswerChange = (questionIndex, option) => {
    setQuizAnswers((prev) => ({ ...prev, [questionIndex]: option }));
  };

  const handleSubmitQuiz = async () => {
    if (!quiz || !quiz.questions) return;
    
    try {
      setSubmitting(true);
      
      // Calculate the score
      let correctCount = 0;
      quiz.questions.forEach((q, idx) => {
        const userAnswer = quizAnswers[idx];
        if (userAnswer && userAnswer === q.correctAnswer) {
          correctCount++;
        }
      });
      
      const scorePercentage = Math.round((correctCount / quiz.questions.length) * 100);
      const passingScore = quiz.passingScore || 60;
      const passed = scorePercentage >= passingScore;
      
      // Parse moduleId to a number (Long in Java)
      const moduleIdNumber = typeof moduleId === 'string' ? parseInt(moduleId, 10) : moduleId;
      
      // Submit the quiz score to the API
      const progressData = await completeQuiz(moduleIdNumber, scorePercentage);
      
      // Update local state
      setQuizScore(scorePercentage);
      setQuizSubmitted(true);
      setPassedQuiz(passed);
      
      // Show toast notification
      toast({
        title: passed ? "Quiz Passed!" : "Quiz Submitted",
        description: `You scored ${scorePercentage}% and earned ${scorePercentage} XP.`,
        variant: passed ? "default" : "destructive",
      });
      
      // Notify parent component of progress update
      if (onProgressUpdate) {
        onProgressUpdate(progressData);
      }
    } catch (error) {
      console.error("Error submitting quiz:", error);
      toast({
        title: "Error",
        description: "Failed to submit quiz. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetakeQuiz = () => {
    setQuizAnswers({});
    setQuizSubmitted(false);
    setPassedQuiz(false);
    setQuizScore(0);
  };

  return (
    <div className="space-y-8">
      {!quizSubmitted ? (
        <div className="space-y-8">
          {quiz.questions?.map((q, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.1 }}
              className="bg-indigo-50 dark:bg-indigo-900/20 p-6 rounded-xl shadow-sm border border-indigo-100 dark:border-indigo-800/50"
            >
              <div className="flex items-start gap-3 mb-4">
                <div className="bg-indigo-600 text-white h-7 w-7 rounded-full flex items-center justify-center text-sm font-bold shrink-0">
                  {idx + 1}
                </div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                  {q.question}
                </h3>
              </div>
              
              <div className="space-y-3 mt-4">
                {q.options.map((option, optionIdx) => {
                  const optionLetter = option.charAt(0);
                  
                  return (
                    <motion.div
                      key={optionIdx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2, delay: 0.1 + optionIdx * 0.05 }}
                      whileHover={{ x: 3 }}
                    >
                      <label 
                        className={`flex items-center gap-3 p-4 rounded-lg cursor-pointer transition-all ${
                          quizAnswers[idx] === optionLetter 
                            ? "bg-indigo-100 dark:bg-indigo-800/50 border border-indigo-300 dark:border-indigo-700 shadow-sm" 
                            : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-indigo-200 dark:hover:border-indigo-700"
                        }`}
                      >
                        <div className={`h-6 w-6 rounded-full flex items-center justify-center shrink-0 ${
                          quizAnswers[idx] === optionLetter 
                            ? "bg-indigo-600 text-white border-2 border-indigo-200 dark:border-indigo-700" 
                            : "border-2 border-gray-300 dark:border-gray-600"
                        }`}>
                          {quizAnswers[idx] === optionLetter && (
                            <CheckCircle className="h-4 w-4" />
                          )}
                        </div>
                        <input
                          type="radio"
                          name={`question-${idx}`}
                          value={optionLetter}
                          checked={quizAnswers[idx] === optionLetter}
                          onChange={() => handleQuizAnswerChange(idx, optionLetter)}
                          className="sr-only"
                        />
                        <span className="text-gray-700 dark:text-gray-300">{option}</span>
                      </label>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          ))}

          <div className="flex justify-between items-center mt-8">
            {onClose && (
              <Button 
                variant="outline" 
                onClick={onClose}
              >
                Cancel
              </Button>
            )}
            
            <Button 
              className="bg-indigo-600 hover:bg-indigo-700"
              onClick={handleSubmitQuiz}
              disabled={submitting || Object.keys(quizAnswers).length < (quiz.questions?.length || 0)}
            >
              {submitting ? "Submitting..." : "Submit Quiz"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className={`p-8 rounded-xl shadow-sm ${
              passedQuiz ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800" : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
            }`}
          >
            <div className="flex items-center gap-6">
              <div className={`p-4 rounded-full ${passedQuiz ? "bg-green-100 dark:bg-green-800/50" : "bg-red-100 dark:bg-red-800/50"}`}>
                {passedQuiz 
                  ? <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
                  : <X className="h-12 w-12 text-red-600 dark:text-red-400" />
                }
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-2 text-gray-800 dark:text-gray-200">
                  {passedQuiz ? "Congratulations!" : "Quiz Results"}
                </h3>
                <div className="flex items-center gap-2">
                  <div className="text-xl font-bold">
                    Score: <span className={passedQuiz ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>{quizScore}%</span>
                  </div>
                  <div className="h-5 w-px bg-gray-300 dark:bg-gray-700"></div>
                  <div className="text-gray-600 dark:text-gray-400">
                    Passing score: {quiz.passingScore || 60}%
                  </div>
                </div>
                <div className="mt-2">
                  <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 border-none">
                    <Award className="h-3.5 w-3.5 mr-1" />
                    +{quizScore} XP
                  </Badge>
                </div>
              </div>
            </div>
            <div className="mt-6 pt-6 border-t border-dashed border-gray-200 dark:border-gray-700">
              {passedQuiz ? (
                <p className="text-green-700 dark:text-green-400">
                  You've successfully completed this knowledge check! Your solid understanding of the material will help you as you continue through the course.
                </p>
              ) : (
                <p className="text-red-700 dark:text-red-400">
                  You didn't reach the passing score. Review the material in this module and try again to strengthen your understanding of the key concepts.
                </p>
              )}
            </div>
          </motion.div>
          
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">Question Summary</h3>
            {quiz.questions?.map((q, idx) => {
              const isCorrect = quizAnswers[idx] === q.correctAnswer;
              
              return (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.1 }}
                  className={`p-4 rounded-lg border ${
                    isCorrect 
                      ? "bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800" 
                      : "bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 p-1 rounded-full text-white ${isCorrect ? "bg-green-600" : "bg-red-600"}`}>
                      {isCorrect ? <CheckCircle className="h-4 w-4" /> : <X className="h-4 w-4" />}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-800 dark:text-gray-200">
                        {q.question}
                      </p>
                      <div className="mt-2 text-sm">
                        <p className={isCorrect ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"}>
                          Your answer: {quizAnswers[idx] ? q.options.find(opt => opt.startsWith(quizAnswers[idx])) : "Not answered"}
                        </p>
                        {!isCorrect && (
                          <p className="text-gray-600 dark:text-gray-400 mt-1">
                            Correct answer: {q.options.find(opt => opt.startsWith(q.correctAnswer))}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <div className="flex justify-between items-center mt-8">
            <Button 
              variant="outline" 
              onClick={handleRetakeQuiz}
            >
              <HelpCircle className="h-4 w-4 mr-2" />
              Retake Quiz
            </Button>
            
            {onClose && (
              <Button 
                className="bg-indigo-600 hover:bg-indigo-700"
                onClick={onClose}
              >
                Continue Learning
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}