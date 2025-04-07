"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Brain, 
  Star, 
  Book, 
  MessageCircle, 
  Home, 
  ChevronRight, 
  Sparkles,
  GraduationCap,
  LayoutDashboard,
  FileText,
  Settings,
  Loader2,
  BookOpen,
  ArrowRight,
  Check,
  Lightbulb
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { fetchWithAuth } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import CourseContentComponent from "./CourseContentComponent";
import AITutorChatComponent from "./AITutorChatComponent";

export default function Dashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [generatedCourse, setGeneratedCourse] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  
  const [userCourses, setUserCourses] = useState([]);
  const [courseCount, setCourseCount] = useState(0);
  
  const [messages, setMessages] = useState([
    {
      role: "ai",
      content:
        "Hello! I'm your AI tutor. Enter a prompt to generate a course on any topic you'd like to learn about.",
    },
  ]);

  // Function to calculate user level based on XP
  const calculateUserLevel = (xp) => {
    if (xp < 200) {
      return {
        level: 1,
        currentXP: xp,
        nextLevelXP: 200,
        progress: (xp / 200) * 100,
        title: "Novice"
      };
    } else if (xp < 500) {
      return {
        level: 2,
        currentXP: xp,
        nextLevelXP: 500,
        progress: ((xp - 200) / 300) * 100,
        title: "Apprentice"
      };
    } else if (xp < 1000) {
      return {
        level: 3,
        currentXP: xp,
        nextLevelXP: 1000,
        progress: ((xp - 500) / 500) * 100,
        title: "Adept"
      };
    } else if (xp < 2000) {
      return {
        level: 4,
        currentXP: xp,
        nextLevelXP: 2000,
        progress: ((xp - 1000) / 1000) * 100,
        title: "Expert"
      };
    } else {
      return {
        level: 5,
        currentXP: xp,
        nextLevelXP: null,
        progress: 100,
        title: "Master"
      };
    }
  };

  // Example raw course suggestions - will still be hardcoded for the UI
  const rawCourses = [
    {
      title: "Mathematics: Algebra Basics",
      description: "Learn the fundamentals of algebra, including solving equations and working with variables.",
      icon: "📐"
    },
    {
      title: "Mathematics: Geometry Essentials",
      description: "Discover the basics of geometry, shapes, theorems, and proofs.",
      icon: "📏"
    },
    {
      title: "Science: Physics Fundamentals",
      description: "Explore the fundamental principles of physics, including mechanics and energy.",
      icon: "🔭"
    },
    {
      title: "Science: Chemistry Essentials",
      description: "Understand the basics of chemistry, including elements, compounds, and reactions.",
      icon: "🧪"
    },
  ];

  // Fetch user profile data from the backend
  useEffect(() => {
    async function fetchUserProfile() {
      try {
        if (!user) return;
        setLoading(true);
        const response = await fetchWithAuth('/users/profile');
        
        if (!response.ok) {
          throw new Error('Failed to fetch user profile');
        }
        const data = await response.json();
        
        setUserProfile(data);
      } catch (err) {
        console.error('Error fetching user profile:', err);
        setError('Could not load user profile data');
      } finally {
        setLoading(false);
        setIsLoaded(true);
      }
    }

    fetchUserProfile();
  }, [user]);
  
  // Fetch courses from the backend
  useEffect(() => {
    async function fetchUserCourses() {
      try {
        const response = await fetch('http://localhost:8007/api/courses/simplified');
        
        if (!response.ok) {
          throw new Error('Failed to fetch user courses');
        }
        
        const data = await response.json();
        console.log("Fetched courses:", data);
        setUserCourses(data);
        setCourseCount(data.length);
      } catch (err) {
        console.error('Error fetching user courses:', err);
      }
    }

    fetchUserCourses();
  }, [user]);

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

  // Stats cards component - updated with XP level system
  const StatsCards = () => {
    // Calculate user level information
    const userXP = userProfile?.xp || 0;
    const levelInfo = calculateUserLevel(userXP);
    
    return (
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8"
      >
        <motion.div variants={itemVariants} className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-6 rounded-xl shadow-md">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-blue-100">Total XP</p>
              <h3 className="text-3xl font-bold mt-1">{userXP}</h3>
            </div>
            <div className="p-2 bg-white/20 rounded-lg">
              <Star className="h-6 w-6" />
            </div>
          </div>
          
          {/* Level indicator */}
          <div className="mt-4 bg-white/10 rounded-lg p-3">
            <div className="flex justify-between items-center mb-1">
              <span className="font-bold text-lg flex items-center">
                Level {levelInfo.level}
                <span className="ml-2 px-2 py-1 bg-yellow-500 text-yellow-900 text-xs font-bold rounded-md">
                  {levelInfo.title}
                </span>
              </span>
              {levelInfo.nextLevelXP && (
                <span className="text-xs text-blue-100">{levelInfo.currentXP}/{levelInfo.nextLevelXP} XP</span>
              )}
            </div>
            
            <div className="mt-2 bg-white/20 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-white h-full rounded-full" 
                style={{ width: `${levelInfo.progress}%` }}
              ></div>
            </div>
            
            {levelInfo.nextLevelXP ? (
              <p className="text-sm mt-2 text-blue-100">
                {levelInfo.progress.toFixed(0)}% to level {levelInfo.level + 1}
              </p>
            ) : (
              <p className="text-sm mt-2 text-blue-100">
                Maximum level reached!
              </p>
            )}
          </div>
        </motion.div>
        
        <motion.div variants={itemVariants} className="bg-white p-6 rounded-xl shadow-md border border-slate-200 hover:border-blue-200 hover:shadow-md transition-all hover:-translate-y-1">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-500">Your Learning Stats</p>
            </div>
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
              <GraduationCap className="h-6 w-6" />
            </div>
          </div>
          
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-700">Courses Started</p>
                  <h4 className="text-xl font-bold text-blue-900">{courseCount || 0}</h4>
                </div>
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                  <Book className="h-4 w-4" />
                </div>
              </div>
              <button 
                className="mt-2 text-xs text-blue-700 flex items-center font-medium"
                onClick={() => router.push('/courses')}
                suppressHydrationWarning
              >
                View all courses <ChevronRight className="h-3 w-3 ml-1" />
              </button>
            </div>
            
            <div className="bg-indigo-50 p-3 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-indigo-700">AI Tutor Chats</p>
                  <h4 className="text-xl font-bold text-indigo-900">12</h4>
                </div>
                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                  <MessageCircle className="h-4 w-4" />
                </div>
              </div>
              <button 
                className="mt-2 text-xs text-indigo-700 flex items-center font-medium"
                onClick={() => setActiveTab("chat")}
                suppressHydrationWarning
              >
                Continue conversation <ChevronRight className="h-3 w-3 ml-1" />
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    );
  };

  // Suggested courses component
  const SuggestedCourses = () => (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="mt-12"
    >
      <motion.div variants={itemVariants} className="text-center space-y-4 mb-8">
        <h2 className="text-2xl font-bold text-center flex items-center justify-center gap-2">
          <Sparkles className="h-5 w-5 text-blue-500" />
          <span>Recommended Courses</span>
          <Sparkles className="h-5 w-5 text-blue-500" />
        </h2>
        <p className="text-gray-500 max-w-2xl mx-auto">
          These courses are tailored to your learning history and goals
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {userCourses.length > 0 ? userCourses.map((course, index) => (
          <motion.div
            key={index}
            variants={itemVariants}
            whileHover="hover"
            whileTap={{ scale: 0.98 }}
            className="cursor-pointer"
          >
            <div 
              className="bg-white rounded-xl overflow-hidden border border-slate-200 hover:border-blue-200 hover:shadow-md transition-all hover:-translate-y-1"
              variants={cardHoverVariants}
              onClick={() => {
                setGeneratedCourse({
                  title: course.title,
                  description: course.description,
                  modules: course.modules || [{
                    title: "Introduction",
                    lessons: [{ title: "Getting Started" }]
                  }]
                });
                setActiveTab("course");
              }}
            >
              <div className="h-2 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
              <div className="p-6">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  {course.icon ? (
                    <span className="text-2xl">{course.icon}</span>
                  ) : (
                    <Book className="h-5 w-5 text-blue-500" />
                  )}
                  {course.courseMetadata.title}
                </h3>
                <p className="text-slate-600 mt-3 line-clamp-6">{course.courseMetadata.description}</p>
                <div className="mt-4 flex items-center text-blue-600 text-sm font-medium">
                  Start Course
                  <ChevronRight className="ml-1 h-4 w-4" />
                </div>
              </div>
            </div>
          </motion.div>
        )) : rawCourses.map((course, index) => (
          // Fallback to rawCourses if no courses from backend
          <motion.div
            key={index}
            variants={itemVariants}
            whileHover="hover"
            whileTap={{ scale: 0.98 }}
            className="cursor-pointer"
          >
            <div 
              className="bg-white rounded-xl overflow-hidden border border-slate-200 hover:border-blue-200 hover:shadow-md transition-all hover:-translate-y-1"
              variants={cardHoverVariants}
              onClick={() => {
                setGeneratedCourse({
                  title: course.title,
                  description: course.description,
                  modules: [{
                    title: "Introduction",
                    lessons: [{ title: "Getting Started" }]
                  }]
                });
                setActiveTab("course");
              }}
            >
              <div className="h-2 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
              <div className="p-6">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  {course.icon ? (
                    <span className="text-2xl">{course.icon}</span>
                  ) : (
                    <Book className="h-5 w-5 text-blue-500" />
                  )}
                  {course.title}
                </h3>
                <p className="text-slate-600 mt-3">{course.description}</p>
                <div className="mt-4 flex items-center text-blue-600 text-sm font-medium">
                  Start Course
                  <ChevronRight className="ml-1 h-4 w-4" />
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );

  // Update the XP badge in the navigation to show level too
  const XPBadge = () => {
    const userXP = userProfile?.xp || 0;
    const { level } = calculateUserLevel(userXP);
    
    return (
      <div className="flex items-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-3 py-1 rounded-full text-sm">
        <Star className="h-4 w-4 mr-1" />
        <span>{userXP} XP</span>
        <span className="ml-1 px-1.5 py-0.5 bg-yellow-500 text-yellow-900 text-xs font-bold rounded-md">Lv.{level}</span>
      </div>
    );
  };

  // Course Creation Component
  const CourseCreationComponent = ({
    rawCourses,
    setGeneratedCourse,
    setActiveTab,
    messages,
    setMessages,
  }) => {
    const [coursePrompt, setCoursePrompt] = useState("");
    const [difficultyLevel, setDifficultyLevel] = useState("Mixed");
    const [isFormValid, setIsFormValid] = useState(false);
    const [showValidationError, setShowValidationError] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [componentIsLoaded, setComponentIsLoaded] = useState(false);
    
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
      setComponentIsLoaded(true);
    }, []);

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
            animate={componentIsLoaded ? "visible" : "hidden"}
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
  };

  return (
    <div className="min-h-screen font-sans bg-gradient-to-b from-slate-50 to-white">
      {/* HEADER */}
      <nav className="fixed w-full z-50 backdrop-blur-sm bg-white/80 border-b border-slate-200">
        <div className="max-w-screen-xl mx-auto px-6 md:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link href="/">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="h-10 w-10 bg-blue-600 rounded-tl-2xl rounded-br-2xl rotate-12"></div>
                  <div className="absolute top-1 left-1 h-8 w-8 bg-indigo-500 rounded-tl-xl rounded-br-xl rotate-12 flex items-center justify-center">
                    <span className="text-white font-bold text-lg -rotate-12">C</span>
                  </div>
                </div>
                <span className="font-extrabold tracking-tight text-slate-800">
                  Instruct<span className="text-blue-600">AI</span>
                </span>
              </div>
            </Link>
            
            {/* Desktop navigation */}
            <div className="hidden md:flex items-center space-x-1">
              <NavLink href="#" active={activeTab === "dashboard"} onClick={() => setActiveTab("dashboard")}>Dashboard</NavLink>
              <NavLink href="#" active={activeTab === "course"} onClick={() => generatedCourse && setActiveTab("course")} disabled={!generatedCourse}>Courses</NavLink>
              <NavLink href="#" active={activeTab === "chat"} onClick={() => setActiveTab("chat")}>AI Tutor</NavLink>
              
              <div className="ml-8 flex items-center space-x-4">
                <XPBadge />
                <div className="h-10 w-10 bg-slate-200 rounded-full flex items-center justify-center">
                  <span className="font-medium text-slate-600">{userProfile?.username ? userProfile.username.slice(0, 2).toUpperCase() : "U"}</span>
                </div>
              </div>
            </div>
            
            {/* Mobile menu button */}
            <div className="md:hidden">
              <button className="text-slate-700 hover:text-blue-600 focus:outline-none" suppressHydrationWarning>
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <main className="pt-32 md:pt-32 pb-16 px-6 md:px-8 max-w-screen-xl mx-auto">
        <AnimatePresence mode="wait">
          {activeTab === "dashboard" && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="space-y-8"
            >
              <div className="flex flex-col gap-8 items-start">
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6 }}
                  className="w-full"
                >
                  <motion.div className="inline-block mb-3">
                    <div className="flex items-center">
                      <div className="h-0.5 w-10 bg-blue-600 mr-3"></div>
                      <span className="text-blue-600 font-medium">Your Learning Dashboard</span>
                    </div>
                  </motion.div>
                  
                  <h1 className="text-4xl font-bold text-slate-900 leading-tight mb-6">
                    Welcome back, <span className="relative">
                      <span className="relative z-10">{userProfile?.username}</span>
                      <span className="absolute bottom-1 left-0 w-full h-3 bg-blue-100 z-0"></span>
                    </span>
                  </h1>
                  
                  <p className="text-lg text-slate-600 mb-8 max-w-3xl">
                    Continue your learning journey, explore new courses, or chat with your AI tutor to enhance your skills.
                  </p>
                  
                  <StatsCards />
                </motion.div>
                
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="w-full"
                >
                  <CourseCreationComponent
                    rawCourses={rawCourses}
                    setGeneratedCourse={setGeneratedCourse}
                    setActiveTab={setActiveTab}
                    messages={messages}
                    setMessages={setMessages}
                  />
                </motion.div>
                
                <SuggestedCourses />
              </div>
            </motion.div>
          )}

          {activeTab === "course" && (
            <motion.div 
              key="course"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              <div className="inline-block mb-3">
                <div className="flex items-center">
                  <div className="h-0.5 w-10 bg-blue-600 mr-3"></div>
                  <span className="text-blue-600 font-medium">Course Content</span>
                </div>
              </div>
              
              <h1 className="text-4xl font-bold text-slate-900 leading-tight mb-6">
                {generatedCourse?.title || "Course Content"}
              </h1>
              
              <p className="text-lg text-slate-600 mb-8">
                {generatedCourse?.description || "Explore your course materials and track your progress."}
              </p>
              
              <div className="bg-white rounded-xl shadow-md p-8 border border-slate-200">
                <CourseContentComponent
                  generatedCourse={generatedCourse}
                  setMessages={setMessages}
                />
              </div>
            </motion.div>
          )}

          {activeTab === "chat" && (
            <motion.div 
              key="chat"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              <div className="inline-block mb-3">
                <div className="flex items-center">
                  <div className="h-0.5 w-10 bg-blue-600 mr-3"></div>
                  <span className="text-blue-600 font-medium">AI Tutor</span>
                </div>
              </div>
              
              <h1 className="text-4xl font-bold text-slate-900 leading-tight mb-6">
                Chat with Your AI Tutor
              </h1>
              
              <p className="text-lg text-slate-600 mb-8">
                Ask questions, get explanations, and deepen your understanding with your personal AI tutor.
              </p>
              
              <div className="bg-white rounded-xl shadow-md p-8 border border-slate-200">
                <AITutorChatComponent messages={messages} setMessages={setMessages} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* FOOTER */}
      <footer className="bg-slate-900 text-white">
        <div className="max-w-screen-xl mx-auto px-6 md:px-8">
          {/* Main footer content */}
          <div className="py-16 grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8">
            <div className="md:col-span-1">
              <div className="flex items-center space-x-3 mb-6">
                <div className="relative">
                  <div className="h-10 w-10 bg-blue-600 rounded-tl-2xl rounded-br-2xl rotate-12"></div>
                  <div className="absolute top-1 left-1 h-8 w-8 bg-indigo-500 rounded-tl-xl rounded-br-xl rotate-12 flex items-center justify-center">
                    <span className="text-white font-bold text-lg -rotate-12">C</span>
                  </div>
                </div>
                <span className="font-extrabold tracking-tight">
                  Instruct<span className="text-blue-500">AI</span>
                </span>
              </div>
              <p className="text-slate-400 mb-6">
                Revolutionizing personalized education through AI-powered learning experiences.
              </p>
              <div className="flex space-x-4">
                {['twitter', 'facebook', 'linkedin', 'instagram'].map(social => (
                  <a key={social} href="#" className="text-slate-500 hover:text-blue-400 transition">
                    <div className="w-8 h-8 rounded-full border border-slate-700 flex items-center justify-center">
                      <span className="sr-only">{social}</span>
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z"/>
                      </svg>
                    </div>
                  </a>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="font-bold text-lg mb-4">Product</h3>
              <ul className="space-y-2">
                {['Features', 'Pricing', 'Use Cases', 'Roadmap', 'Integrations'].map(link => (
                  <li key={link}>
                    <a href="#" className="text-slate-400 hover:text-white transition">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h3 className="font-bold text-lg mb-4">Resources</h3>
              <ul className="space-y-2">
                {['Documentation', 'Blog', 'Community', 'Support', 'Learning Center'].map(link => (
                  <li key={link}>
                    <a href="#" className="text-slate-400 hover:text-white transition">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h3 className="font-bold text-lg mb-4">Company</h3>
              <ul className="space-y-2">
                {['About Us', 'Careers', 'Press', 'Privacy Policy', 'Terms of Service'].map(link => (
                  <li key={link}>
                    <a href="#" className="text-slate-400 hover:text-white transition">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          {/* Bottom footer */}
          <div className="py-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center">
            <p className="text-slate-500 text-sm mb-4 md:mb-0">
              &copy; {new Date().getFullYear()} InstructAI, Inc. All rights reserved.
            </p>
            <div className="flex space-x-6">
              <a href="#" className="text-slate-500 hover:text-white transition text-sm">Privacy</a>
              <a href="#" className="text-slate-500 hover:text-white transition text-sm">Terms</a>
              <a href="#" className="text-slate-500 hover:text-white transition text-sm">Cookies</a>
              <a href="#" className="text-slate-500 hover:text-white transition text-sm">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Helper component for navigation links
const NavLink = ({ href, active, onClick, disabled, children }) => (
  <a 
    href={href} 
    onClick={(e) => {
      e.preventDefault();
      if (!disabled && onClick) onClick();
    }} 
    className={`px-3 py-2 rounded-md transition-colors relative group ${
      disabled ? 'text-slate-400 cursor-not-allowed' :
      active ? 'text-blue-700' : 'text-slate-700 hover:text-blue-600'
    }`}
  >
    {children}
    <span className={`absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 transform origin-left transition-transform ${
      active ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
    }`}></span>
  </a>
);

// Simple icon components for activity feed
const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
  </svg>
);

const PlayIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
  </svg>
);

const TrophyIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M6 3.75A2.75 2.75 0 018.75 1h2.5A2.75 2.75 0 0114 3.75v.443c.795.077 1.584.24 2.287.491a.75.75 0 11-.574 1.385c-.708-.25-1.466-.4-2.212-.465V6.75a2.75 2.75 0 01-2.75 2.75h-2.5A2.75 2.75 0 016 6.75v-3zm7.5 3V3.75A1.25 1.25 0 0012.25 2.5h-2.5A1.25 1.25 0 008.5 3.75v3a1.25 1.25 0 001.25 1.25h2.5A1.25 1.25 0 0013.5 6.75z" clipRule="evenodd" />
    <path d="M12.78 15.81l-3.214-4.018a.75.75 0 00-1.173 0L5.18 15.81a.75.75 0 001.173.938l2.147-2.683v3.684a.75.75 0 001.5 0v-3.684l2.147 2.683a.75.75 0 001.173-.938z" />
  </svg>
);