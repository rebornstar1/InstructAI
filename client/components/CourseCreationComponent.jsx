"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Brain, Loader2, BookOpen, ArrowRight, Check, Sparkles, ChevronRight, Lightbulb } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function CourseCreationComponent({
  rawCourses,
  setGeneratedCourse,
  setActiveTab,
  messages,
  setMessages,
}) {
  const [coursePrompt, setCoursePrompt] = useState("");
  const [difficultyLevel, setDifficultyLevel] = useState("Mixed");
  const [isFormValid, setIsFormValid] = useState(false);
  const [showValidationError, setShowValidationError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Interactive flow states
  const [interactiveMode, setInteractiveMode] = useState(false);
  const [currentQuestions, setCurrentQuestions] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [userAnswers, setUserAnswers] = useState({});
  const [interactiveStep, setInteractiveStep] = useState(1);
  const [totalSteps, setTotalSteps] = useState(3); // Assuming 3 steps in the flow

  useEffect(() => {
    setIsFormValid(coursePrompt.trim() !== "");
  }, [coursePrompt]);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        duration: 0.5,
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    },
    exit: {
      opacity: 0,
      y: 20,
      transition: { duration: 0.3 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  const cardHoverVariants = {
    hover: { 
      scale: 1.02, 
      boxShadow: "0 10px 30px rgba(0, 0, 0, 0.1)",
      transition: { duration: 0.2 }
    }
  };

  const handleSelectRawCourse = async (rawCourse) => {
    setCoursePrompt(rawCourse.title);
    await handleStartInteractiveFlow({ preventDefault: () => {} });
  };

  // Start the interactive course creation flow
  const handleStartInteractiveFlow = async (event) => {
    event.preventDefault();
    if (!isFormValid) {
      setShowValidationError(true);
      return;
    }
    
    setIsLoading(true);
    setInteractiveMode(true);
    
    try {
      const response = await fetch("http://localhost:8007/api/courses/simplified/interactive/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: coursePrompt,
        }),
      });
      
      const data = await response.json();
      setCurrentQuestions(data);
      setSessionId(data.sessionId);
      setUserAnswers({});
      setInteractiveStep(1);
      
      // Add message to the chat
      setMessages((prev) => [
        ...prev,
        { role: "user", content: `Generate a course about: ${coursePrompt}` },
        {
          role: "ai",
          content: `I'd like to create a personalized course on "${coursePrompt}" for you. To make it perfect for your needs, I have a few questions.`,
        },
      ]);
      
    } catch (error) {
      console.error("Error starting interactive flow:", error);
      setInteractiveMode(false);
      setMessages((prev) => [
        ...prev,
        { role: "user", content: `Generate a course about: ${coursePrompt}` },
        {
          role: "ai",
          content: "There was an error starting the interactive course creation. Let's try the standard approach instead.",
        },
      ]);
      // Fall back to non-interactive mode
      handleGenerateCourse({ preventDefault: () => {} });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle submitting answers and proceeding to the next step
  const handleSubmitAnswers = async () => {
    if (Object.keys(userAnswers).length < currentQuestions.questions.length) {
      alert("Please answer all questions before proceeding.");
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await fetch(`http://localhost:8007/api/courses/simplified/interactive/continue?sessionId=${sessionId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userAnswers),
      });
      
      const data = await response.json();
      
      // Add the current answers to the chat
      const answerSummary = Object.entries(userAnswers)
        .map(([id, answer]) => {
          const question = currentQuestions.questions.find(q => q.id === id);
          return `${question ? question.question : id}: ${answer}`;
        })
        .join("\n");
        
      setMessages((prev) => [
        ...prev,
        { role: "user", content: answerSummary },
        {
          role: "ai",
          content: data.complete 
            ? "Thanks for all your answers! I'll generate your personalized course now."
            : "Thanks for that information. I have a few more questions to make your course perfect.",
        },
      ]);
      
      if (data.complete) {
        // If the flow is complete, generate the final course
        await finalizeCourse();
      } else {
        // Otherwise, move to the next set of questions
        setCurrentQuestions(data.nextQuestions);
        setUserAnswers({});
        setInteractiveStep(interactiveStep + 1);
      }
      
    } catch (error) {
      console.error("Error continuing interactive flow:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          content: "There was an error processing your answers. Let's try to generate the course with what we have so far.",
        },
      ]);
      // Attempt to finalize the course with what we have
      await finalizeCourse();
    } finally {
      setIsLoading(false);
    }
  };
  
  // Finalize and generate the course
  const finalizeCourse = async () => {
    setIsLoading(true);
    
    try {
      const response = await fetch(`http://localhost:8007/api/courses/simplified/interactive/finalize?sessionId=${sessionId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      
      const data = await response.json();
      console.log("Generated Interactive Course Structure:", data);
      
      // Set the generated course and switch to the course tab
      setGeneratedCourse(data);
      setActiveTab("course");
      
      // Count modules by complexity level for informative message
      const complexityLevels = {};
      data.modules.forEach(module => {
        const level = module.complexityLevel || "Unspecified";
        complexityLevels[level] = (complexityLevels[level] || 0) + 1;
      });
      
      const complexitySummary = Object.entries(complexityLevels)
        .map(([level, count]) => `${count} ${level}`)
        .join(", ");
      
      // Add final message about the generated course
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          content: `I've created a personalized course for you on "${coursePrompt}" with ${data.modules.length} modules (${complexitySummary}). The modules are arranged in a logical progression based on your specific needs and goals. Check out the Course Content tab to explore your customized curriculum.`,
        },
      ]);
      
      // Reset interactive mode
      setInteractiveMode(false);
      
    } catch (error) {
      console.error("Error finalizing course:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          content: "There was an error generating your personalized course. Let's try the standard approach instead.",
        },
      ]);
      // Fall back to non-interactive mode
      handleGenerateCourse({ preventDefault: () => {} });
    } finally {
      setIsLoading(false);
    }
  };

  // Original non-interactive course generation
  const handleGenerateCourse = async (event) => {
    event.preventDefault();
    if (!isFormValid) {
      setShowValidationError(true);
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch("http://localhost:8007/api/courses/simplified/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: coursePrompt,
          difficultyLevel: difficultyLevel
        }),
      });
      const data = await response.json();
      console.log("Generated Course Structure:", data);
      setGeneratedCourse(data);
      setActiveTab("course");
      
      // Count modules by complexity level for informative message
      const complexityLevels = {};
      data.modules.forEach(module => {
        const level = module.complexityLevel || "Unspecified";
        complexityLevels[level] = (complexityLevels[level] || 0) + 1;
      });
      
      const complexitySummary = Object.entries(complexityLevels)
        .map(([level, count]) => `${count} ${level}`)
        .join(", ");
      
      setMessages((prev) => [
        ...prev,
        { role: "user", content: `Generate a course about: ${coursePrompt}` },
        {
          role: "ai",
          content: `I've generated a comprehensive course structure for "${coursePrompt}" with ${data.modules.length} modules (${complexitySummary}). The modules are arranged in a logical progression from foundational to advanced concepts. Check out the Course Content tab to explore the full curriculum.`,
        },
      ]);
    } catch (error) {
      console.error("Error generating course:", error);
      setMessages((prev) => [
        ...prev,
        { role: "user", content: `Generate a course about: ${coursePrompt}` },
        {
          role: "ai",
          content: "There was an error generating your course. Please try a different topic.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle changing an answer in the interactive flow
  const handleAnswerChange = (questionId, value) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  // Render the interactive questions
  const renderInteractiveQuestions = () => {
    if (!currentQuestions) return null;
    
    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="space-y-6"
      >
        <motion.div variants={itemVariants} className="text-center space-y-2">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-transparent bg-clip-text">{currentQuestions.title}</h2>
          <p className="text-gray-500">{currentQuestions.description}</p>
          <div className="flex items-center justify-center mt-4 space-x-2">
            {Array.from({length: totalSteps}, (_, i) => (
              <div key={i} className="flex flex-col items-center">
                <div 
                  className={`h-3 w-3 rounded-full ${i < interactiveStep ? 'bg-blue-600' : i === interactiveStep ? 'ring-2 ring-blue-400 bg-white' : 'bg-gray-200'}`}
                />
                <div 
                  className={`h-1 w-16 ${i < totalSteps - 1 ? (i < interactiveStep - 1 ? 'bg-blue-600' : 'bg-gray-200') : 'bg-transparent'}`}
                  style={{transform: "translateY(1px)"}}
                />
              </div>
            ))}
          </div>
          <motion.div 
            variants={itemVariants}
            className="inline-flex items-center justify-center mt-1 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-sm font-medium"
          >
            Step {interactiveStep} of {totalSteps}
          </motion.div>
        </motion.div>
        
        {currentQuestions.questions.map((question, index) => (
          <motion.div
            key={question.id}
            variants={itemVariants}
            whileHover={{ y: -2 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="w-full overflow-hidden border border-gray-200 shadow-md">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-b border-gray-100">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-blue-500" />
                  {question.question}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <RadioGroup
                  value={userAnswers[question.id] || ""}
                  onValueChange={(value) => handleAnswerChange(question.id, value)}
                  className="space-y-3"
                >
                  <AnimatePresence>
                    {question.options.map((option, optIndex) => (
                      <motion.div 
                        key={optIndex}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, delay: optIndex * 0.05 }}
                      >
                        <div className={`flex items-center space-x-2 p-3 rounded-lg border ${userAnswers[question.id] === option ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 hover:border-gray-300 dark:border-gray-700'}`}>
                          <RadioGroupItem value={option} id={`${question.id}-${optIndex}`} />
                          <Label htmlFor={`${question.id}-${optIndex}`} className="flex-1 cursor-pointer">{option}</Label>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </RadioGroup>
              </CardContent>
            </Card>
          </motion.div>
        ))}
        
        <motion.div variants={itemVariants}>
          <Button 
            onClick={handleSubmitAnswers} 
            disabled={isLoading || Object.keys(userAnswers).length < currentQuestions.questions.length} 
            className="w-full py-6 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl"
          >
            {isLoading ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-center"
              >
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Processing...
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-center"
              >
                {interactiveStep < totalSteps ? (
                  <>
                    <ArrowRight className="mr-2 h-5 w-5" />
                    Continue to Next Step
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-5 w-5" />
                    Generate My Personalized Course
                  </>
                )}
              </motion.div>
            )}
          </Button>
        </motion.div>
      </motion.div>
    );
  };

  return (
    <AnimatePresence mode="wait">
      {!interactiveMode ? (
        <motion.div 
          className="mx-auto max-w-6xl space-y-8"
          variants={containerVariants}
          initial="hidden"
          animate={isLoaded ? "visible" : "hidden"}
          exit="exit"
          key="course-creation-form"
        >
          <motion.div 
            variants={itemVariants} 
            className="text-center space-y-4"
          >
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-transparent bg-clip-text">
              Welcome to Your Learning Journey
            </h1>
            <p className="text-gray-500 max-w-2xl mx-auto">
              Generate a personalized, dynamically structured course on any topic you'd like to learn about, 
              tailored to your specific learning goals and preferences.
            </p>
          </motion.div>

          {/* Suggested Courses Section */}
          <motion.div variants={itemVariants} className="space-y-4">
            <h2 className="text-2xl font-bold text-center flex items-center justify-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-500" />
              <span>Suggested Courses</span>
              <Sparkles className="h-5 w-5 text-blue-500" />
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {rawCourses.map((course, idx) => (
                <motion.div
                  key={idx}
                  variants={itemVariants}
                  whileHover="hover"
                  whileTap={{ scale: 0.98 }}
                >
                  <Card
                    className="cursor-pointer h-full overflow-hidden border-gray-200 transition-all"
                    variants={cardHoverVariants}
                    onClick={() => handleSelectRawCourse(course)}
                  >
                    <div className="h-2 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
                    <CardContent className="p-6">
                      <h3 className="text-xl font-bold flex items-center gap-2">
                        {course.icon ? (
                          <span className="text-2xl">{course.icon}</span>
                        ) : (
                          <BookOpen className="h-5 w-5 text-blue-500" />
                        )}
                        {course.title}
                      </h3>
                      <p className="text-gray-600 mt-3">{course.description}</p>
                      <div className="mt-4 flex items-center text-blue-600 text-sm font-medium">
                        Start Course
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Generate New Course Section */}
          <motion.div variants={itemVariants}>
            <Card className="w-full overflow-hidden border-gray-200 shadow-lg">
              <div className="h-2 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
              <CardContent className="p-8">
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Brain className="h-6 w-6 text-blue-600" />
                    </div>
                    <label htmlFor="coursePrompt" className="text-xl font-semibold">
                      Generate a New Course
                    </label>
                  </div>
                  
                  <p className="text-gray-500 text-sm pl-12">
                    Enter a topic and we'll ask you a series of questions to create a perfectly tailored course just for you.
                  </p>
                  
                  <div className="relative mt-2">
                    <Input
                      id="coursePrompt"
                      placeholder="e.g., Machine Learning, Web Development, Blockchain"
                      value={coursePrompt}
                      onChange={(e) => setCoursePrompt(e.target.value)}
                      className={`w-full text-lg py-6 pl-4 pr-12 rounded-lg transition-all ${
                        showValidationError && !coursePrompt.trim() 
                          ? "border-red-500 focus-visible:ring-red-500" 
                          : "border-gray-300 focus-visible:ring-blue-500"
                      }`}
                    />
                    {coursePrompt && (
                      <motion.span 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2"
                      >
                        <Check className="h-5 w-5 text-green-500" />
                      </motion.span>
                    )}
                  </div>
                  
                  {showValidationError && !coursePrompt.trim() && (
                    <motion.p 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-sm text-red-500 pl-4"
                    >
                      Please enter a topic for your course
                    </motion.p>
                  )}
                  
                  <motion.div
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Button 
                      onClick={handleStartInteractiveFlow} 
                      disabled={isLoading} 
                      className="w-full mt-6 py-6 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl"
                    >
                      {isLoading ? (
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="flex items-center justify-center"
                        >
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Starting Your Personal Course Creation...
                        </motion.div>
                      ) : (
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="flex items-center justify-center"
                        >
                          <Sparkles className="mr-2 h-5 w-5" />
                          Start Interactive Course Creation
                        </motion.div>
                      )}
                    </Button>
                  </motion.div>
                  
                  <motion.div 
                    variants={itemVariants}
                    className="flex items-center justify-center gap-2 pt-2"
                  >
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 px-3 py-1">
                      Personalized Learning
                    </Badge>
                    <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 px-3 py-1">
                      AI-Powered
                    </Badge>
                    <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 px-3 py-1">
                      Interactive
                    </Badge>
                  </motion.div>
                </div>
              </CardContent>
              <CardFooter className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-800/30 p-4 border-t border-gray-200">
                <p className="text-xs text-gray-500 text-center w-full">
                  We'll ask you a few questions to understand your exact needs and create a perfectly tailored course.
                </p>
              </CardFooter>
            </Card>
          </motion.div>
        </motion.div>
      ) : (
        // Show the interactive questions when in interactive mode
        <motion.div 
          key="interactive-questions"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {renderInteractiveQuestions()}
        </motion.div>
      )}
    </AnimatePresence>
  );
}