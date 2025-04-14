"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain,
  Clock,
  ChevronRight,
  Layers,
  Loader2,
  PlayCircle,
  Sparkles,
  Download,
  BookmarkPlus,
  X,
  Calendar,
  CheckCircle,
  Award,
  BookOpen,
  ArrowRight,
  Check,
  Users,
  ExternalLink,
  Star,
  ChevronLeft,
  Info,
  FileText,
  Share2,
  BarChart,
  Globe,
  Menu,
  HelpCircle,
  Code,
  Lock,
  Zap,
} from "lucide-react";
import LearningProgressTracker from "./LearningProgressTracker";
import CustomMarkdownRenderer from "./ui/CustomMarkdownRenderer";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8007';

export default function CourseContentComponent({ generatedCourse, setMessages }) {
  const [selectedModule, setSelectedModule] = useState(null);
  const [learningResource, setLearningResource] = useState(null);
  const [isLoadingResource, setIsLoadingResource] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [showSidebar, setShowSidebar] = useState(true);

  // Article Modal State
  const [showArticleModal, setShowArticleModal] = useState(false);
  const [activeArticle, setActiveArticle] = useState({ title: "", content: "" });

  // Quiz Modal & related states
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizScore, setQuizScore] = useState(0);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [passedQuiz, setPassedQuiz] = useState(false);
  
  // UI enhancement states
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);

  const resourceRef = useRef(null);
  const contentRef = useRef(null);

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

  // Set isLoaded to true after component mounts for animation purposes
  useEffect(() => {
    setIsLoaded(true);
    
    // Add scroll listener for header transparency
    const handleScroll = () => {
      if (contentRef.current) {
        const scrollTop = contentRef.current.scrollTop;
        setIsScrolled(scrollTop > 50);
        
        // Calculate scroll progress
        const scrollHeight = contentRef.current.scrollHeight - contentRef.current.clientHeight;
        if (scrollHeight > 0) {
          setScrollProgress((scrollTop / scrollHeight) * 100);
        }
      }
    };
    
    const currentRef = contentRef.current;
    if (currentRef) {
      currentRef.addEventListener('scroll', handleScroll);
    }
    
    return () => {
      if (currentRef) {
        currentRef.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

  // Reset scroll position when new resource is loaded
  useEffect(() => {
    if (resourceRef.current && learningResource) {
      resourceRef.current.scrollTop = 0;
    }
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  }, [learningResource, selectedModule]);

  // Helper: Convert YouTube watch URL to embed URL
  const convertToEmbedUrl = (url) => {
    if (!url) return "";
    return url.replace("watch?v=", "embed/");
  };

  const handleModuleSelect = (module) => {
    setSelectedModule(module);
    setLearningResource(null);
    setActiveTab("overview");
  };

  const handleBackToCourse = () => {
    setSelectedModule(null);
    setLearningResource(null);
  };

  const handleGenerateModuleResources = async () => {
    if (!selectedModule) return;
    setIsLoadingResource(true);
    try {
      const request = {
        moduleTitle: selectedModule.title,
        moduleId: selectedModule.id, 
        format: "markdown",
        contentType: "comprehensive",
        detailLevel: 5,
        specificRequirements: [
          `Create a comprehensive guide for the module: ${selectedModule.title}`,
          "Include detailed explanations, diagrams, and code samples",
          "Structure content with clear sections and summaries",
        ],
      };

      // Set topic if available
      if (generatedCourse?.courseStructure?.courseMetadata?.title) {
        request.topic = generatedCourse.courseStructure.courseMetadata.title;
      } else if (generatedCourse?.courseMetadata?.title) {
        request.topic = generatedCourse.courseMetadata.title;
      }

      // Include learning objectives if provided
      if (selectedModule.learningObjectives && selectedModule.learningObjectives.length > 0) {
        request.specificRequirements.push(
          `Address the following learning objectives: ${selectedModule.learningObjectives.join(", ")}`
        );
      }

      const response = await fetch(`${API_URL}/api/learning-resources/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });
      if (!response.ok) throw new Error(`API responded with status: ${response.status}`);
      const data = await response.json();
      setLearningResource(data);
      console.log("LearningResourceData",data);
      setMessages((prev) => [
        ...prev,
        {
          role: "user",
          content: `Generate comprehensive materials for the entire "${selectedModule.title}" module`,
        },
        {
          role: "ai",
          content: `Detailed learning materials for "${selectedModule.title}" module generated.`,
        },
      ]);
    } catch (error) {
      console.error("Error generating module resources:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "user",
          content: `Generate comprehensive materials for the entire "${selectedModule.title}" module`,
        },
        {
          role: "ai",
          content: "There was an error generating the module resources. Please try again later.",
        },
      ]);
    } finally {
      setIsLoadingResource(false);
    }
  };

  const handleOpenArticle = (subModule) => {
    setMessages((prev) => [
      ...prev,
      { role: "user", content: `Show me content for "${subModule.subModuleTitle}"` },
      { role: "ai", content: `Displaying content for "${subModule.subModuleTitle}".` },
    ]);
    setActiveArticle({ title: subModule.subModuleTitle, content: subModule.article });
    setShowArticleModal(true);
  };

  const handleOpenQuiz = (quiz) => {
    setActiveQuiz(quiz);
    setShowQuizModal(true);
    setQuizAnswers({});
    setQuizScore(0);
    setQuizSubmitted(false);
    setPassedQuiz(false);
  };

  const handleQuizAnswerChange = (questionIndex, option) => {
    setQuizAnswers((prev) => ({ ...prev, [questionIndex]: option }));
  };

  const handleSubmitQuiz = () => {
    if (!activeQuiz || !activeQuiz.questions) return;
    let correctCount = 0;
    activeQuiz.questions.forEach((q, idx) => {
      const userAnswer = quizAnswers[idx];
      if (userAnswer && userAnswer === q.correctAnswer) {
        correctCount++;
      }
    });
    const scorePercentage = Math.round((correctCount / activeQuiz.questions.length) * 100);
    setQuizScore(scorePercentage);
    setQuizSubmitted(true);
    const passingScore = activeQuiz.passingScore || 60;
    setPassedQuiz(scorePercentage >= passingScore);
  };

  const handleCloseQuizModal = () => {
    setShowQuizModal(false);
    setActiveQuiz(null);
    setQuizAnswers({});
    setQuizSubmitted(false);
    setPassedQuiz(false);
    setQuizScore(0);
  };

  // Get course metadata from nested structure
  const getCourseMetadata = (key, defaultValue = "") => {
    return generatedCourse?.courseStructure?.courseMetadata?.[key] ||
           generatedCourse?.courseMetadata?.[key] ||
           defaultValue;
  };

  // Get modules from nested structure
  const getModules = () => {
    return generatedCourse?.courseStructure?.modules || 
           generatedCourse?.modules || 
           [];
  };

  // Calculate course completion percentage
  const calculateCompletion = () => {
    const totalModules = getModules().length;
    const completedModules = 2; // Placeholder - would be dynamic in real app
    return Math.round((completedModules / totalModules) * 100);
  };

  if (!generatedCourse) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="relative">
          <div className="absolute inset-0 bg-blue-600/20 rounded-full blur-xl"></div>
          <div className="h-20 w-20 mb-6 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center relative z-10">
            <BookOpen className="h-10 w-10 text-white" />
          </div>
        </div>
        <h2 className="text-2xl font-bold mb-3 text-gray-800">No Course Selected</h2>
        <p className="text-gray-500 max-w-md mb-6">
          Please create a new course from the Dashboard or select an existing course to view its content.
        </p>
        <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md px-6 py-6">Create a Course</Button>
      </div>
    );
  }

  return (
    <div className="relative h-full" ref={contentRef}>
      {/* Progress bar at top of page */}
      <div className={`fixed top-0 left-0 w-full h-1 bg-gray-200 z-50 transition-opacity duration-300 ${isScrolled ? 'opacity-100' : 'opacity-0'}`}>
        <div 
          className="h-full bg-gradient-to-r from-blue-600 to-indigo-600"
          style={{ width: `${scrollProgress}%` }}
        ></div>
      </div>

      {/* Course and Module View */}
      {!selectedModule ? (
        // Course Overview
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate={isLoaded ? "visible" : "hidden"}
          exit="exit"
          className="space-y-8 pb-12"
        >
          {/* Course Header with Background and Overlay */}
          <div className="relative overflow-hidden rounded-xl mb-10">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-800 opacity-90"></div>
            <div className="absolute inset-0 bg-[url('/path/to/pattern.svg')] opacity-10"></div>
            
            <div className="relative z-10 p-12 text-white">
              <motion.div 
                variants={itemVariants}
                className="flex flex-col md:flex-row gap-8 items-center"
              >
                <div className="h-24 w-24 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/30 shadow-xl">
                  <BookOpen className="h-12 w-12 text-white" />
                </div>
                
                <div className="flex-1 text-center md:text-left">
                  <div className="flex flex-col md:flex-row md:items-center gap-3 mb-3">
                    <Badge className="bg-white/20 hover:bg-white/30 text-white border-none backdrop-blur-sm self-center md:self-start">
                      {getCourseMetadata('category', 'Course')}
                    </Badge>
                    <div className="hidden md:block h-1 w-1 bg-white/50 rounded-full"></div>
                    <div className="flex items-center gap-2 justify-center md:justify-start">
                      <Star className="h-4 w-4 text-yellow-300 fill-yellow-300" />
                      <Star className="h-4 w-4 text-yellow-300 fill-yellow-300" />
                      <Star className="h-4 w-4 text-yellow-300 fill-yellow-300" />
                      <Star className="h-4 w-4 text-yellow-300 fill-yellow-300" />
                      <Star className="h-4 w-4 text-white/50" />
                      <span className="text-sm text-white/70">(120 ratings)</span>
                    </div>
                  </div>
                  
                  <h1 className="text-3xl md:text-4xl font-bold mb-3">
                    {getCourseMetadata('title', 'Course Title')}
                  </h1>
                  
                  <p className="text-white/80 text-lg mb-6 max-w-3xl">
                    {getCourseMetadata('description', 'Course description not available.')}
                  </p>
                  
                  <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                    <Badge className="bg-white/10 text-white hover:bg-white/20 border-none backdrop-blur-sm px-3 py-1.5">
                      <Layers className="h-3.5 w-3.5 mr-1" />
                      {getModules().length} Modules
                    </Badge>
                    <Badge className="bg-white/10 text-white hover:bg-white/20 border-none backdrop-blur-sm px-3 py-1.5">
                      <Clock className="h-3.5 w-3.5 mr-1" />
                      {getCourseMetadata('duration', 'Self-paced')}
                    </Badge>
                    <Badge className="bg-white/10 text-white hover:bg-white/20 border-none backdrop-blur-sm px-3 py-1.5">
                      <Users className="h-3.5 w-3.5 mr-1" />
                      120 Students
                    </Badge>
                    <Badge className="bg-white/10 text-white hover:bg-white/20 border-none backdrop-blur-sm px-3 py-1.5">
                      <Award className="h-3.5 w-3.5 mr-1" />
                      {getCourseMetadata('difficultyLevel', 'Mixed')}
                    </Badge>
                  </div>
                </div>
              </motion.div>
              
              <motion.div variants={itemVariants} className="flex flex-col md:flex-row gap-4 mt-8">
                <div className="flex-1 bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <Clock className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white">Last Updated</h3>
                      <p className="text-white/70 text-sm">2 days ago</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex-1 bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <Globe className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white">Language</h3>
                      <p className="text-white/70 text-sm">English</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex-1 bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <Users className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white">Instructor</h3>
                      <p className="text-white/70 text-sm">AI Tutor</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
          
          {/* Course Tabs */}
          <motion.div variants={itemVariants}>
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="mb-8">
                <TabsTrigger value="overview" className="text-base py-2 px-4">Overview</TabsTrigger>
                <TabsTrigger value="curriculum" className="text-base py-2 px-4">Curriculum</TabsTrigger>
                <TabsTrigger value="instructor" className="text-base py-2 px-4">Instructor</TabsTrigger>
                <TabsTrigger value="reviews" className="text-base py-2 px-4">Reviews</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="mt-0">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-6">
                    {/* Course Description Card */}
                    <Card className="overflow-hidden border-none shadow-lg">
                      <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 border-b">
                        <CardTitle className="text-xl flex items-center gap-2">
                          <Info className="h-5 w-5 text-blue-600" />
                          About This Course
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-6">
                        <div className="prose max-w-none dark:prose-invert">
                          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                            {getCourseMetadata('longDescription', getCourseMetadata('description', 'This course provides comprehensive instruction on the subject matter, covering fundamental concepts and advanced techniques. Through interactive lessons, practical exercises, and knowledge checks, you will develop a strong understanding of the material and be able to apply it in real-world scenarios.'))}
                          </p>
                          
                          <h3 className="text-lg font-bold mt-6 mb-3 text-gray-800 dark:text-gray-200">Who This Course Is For</h3>
                          <ul className="space-y-2">
                            {(getCourseMetadata('targetAudience', ['Students interested in the subject', 'Professionals looking to expand their knowledge', 'Anyone curious about the topic'])).map((audience, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                                <div className="mt-1.5 h-2 w-2 bg-blue-600 rounded-full flex-shrink-0"></div>
                                <span>{audience}</span>
                              </li>
                            ))}
                          </ul>
                          
                          <h3 className="text-lg font-bold mt-6 mb-3 text-gray-800 dark:text-gray-200">What You'll Learn</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {(getCourseMetadata('learningOutcomes', ['Apply concepts to real-world scenarios', 'Complete projects independently', 'Understand core principles', 'Develop critical thinking skills'])).map((outcome, idx) => (
                              <div key={idx} className="flex items-start gap-2">
                                <div className="mt-1 p-1 bg-blue-100 dark:bg-blue-900/30 rounded-full text-blue-600 dark:text-blue-400">
                                  <CheckCircle className="h-3.5 w-3.5" />
                                </div>
                                <span className="text-gray-700 dark:text-gray-300">{outcome}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    {/* Prerequisites Card */}
                    <Card className="overflow-hidden border-none shadow-lg">
                      <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 border-b">
                        <CardTitle className="text-xl flex items-center gap-2">
                          <CheckCircle className="h-5 w-5 text-blue-600" />
                          Prerequisites
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-6">
                        <ul className="space-y-3">
                          {(getCourseMetadata('prerequisites', ['Basic understanding of the subject', 'Curiosity and willingness to learn'])).map((prereq, index) => (
                            <li key={index} className="flex items-start gap-3 p-3 bg-blue-50/50 dark:bg-blue-900/10 rounded-lg">
                              <div className="mt-0.5 p-1 bg-blue-100 dark:bg-blue-900/30 rounded-full text-blue-600 dark:text-blue-400">
                                <CheckCircle className="h-4 w-4" />
                              </div>
                              <span className="text-gray-700 dark:text-gray-300">{prereq}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  </div>
                  
                  {/* Sidebar */}
                  <div className="space-y-6">
                    {/* Course Progress Card */}
                    <Card className="overflow-hidden border-none shadow-lg">
                      <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6">
                        <CardTitle className="text-xl flex items-center gap-2">
                          <BarChart className="h-5 w-5" />
                          Your Progress
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-6">
                        <div className="space-y-4">
                          <div>
                            <div className="flex justify-between mb-2 text-sm">
                              <span className="text-gray-500">Progress</span>
                              <span className="font-medium">{calculateCompletion()}%</span>
                            </div>
                            <Progress value={calculateCompletion()} className="h-2" />
                          </div>
                          
                          <div className="pt-4 grid grid-cols-2 gap-4 text-center text-sm">
                            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                              <p className="text-gray-500 mb-1">Completed</p>
                              <p className="text-xl font-bold text-blue-600">2/{getModules().length}</p>
                              <p className="text-gray-500">Modules</p>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                              <p className="text-gray-500 mb-1">Time Spent</p>
                              <p className="text-xl font-bold text-blue-600">1h 45m</p>
                              <p className="text-gray-500">Learning</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="bg-gray-50 dark:bg-gray-800 p-6 border-t">
                        <Button className="w-full bg-blue-600 hover:bg-blue-700 gap-2">
                          <PlayCircle className="h-4 w-4" />
                          Continue Learning
                        </Button>
                      </CardFooter>
                    </Card>
                    
                    {/* Course Features */}
                    <Card className="overflow-hidden border-none shadow-lg">
                      <CardContent className="p-6">
                        <h3 className="font-bold text-lg mb-4 text-gray-800 dark:text-gray-200">Course Features</h3>
                        <ul className="space-y-3">
                          <li className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                            <div className="p-1 bg-blue-100 dark:bg-blue-900/30 rounded-full text-blue-600 dark:text-blue-400">
                              <FileText className="h-4 w-4" />
                            </div>
                            <span>Comprehensive curriculum</span>
                          </li>
                          <li className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                            <div className="p-1 bg-blue-100 dark:bg-blue-900/30 rounded-full text-blue-600 dark:text-blue-400">
                              <Brain className="h-4 w-4" />
                            </div>
                            <span>AI-powered personalization</span>
                          </li>
                          <li className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                            <div className="p-1 bg-blue-100 dark:bg-blue-900/30 rounded-full text-blue-600 dark:text-blue-400">
                              <Award className="h-4 w-4" />
                            </div>
                            <span>Interactive quizzes & projects</span>
                          </li>
                          <li className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                            <div className="p-1 bg-blue-100 dark:bg-blue-900/30 rounded-full text-blue-600 dark:text-blue-400">
                              <Clock className="h-4 w-4" />
                            </div>
                            <span>Lifetime access</span>
                          </li>
                          <li className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                            <div className="p-1 bg-blue-100 dark:bg-blue-900/30 rounded-full text-blue-600 dark:text-blue-400">
                              <Download className="h-4 w-4" />
                            </div>
                            <span>Downloadable resources</span>
                          </li>
                        </ul>
                      </CardContent>
                    </Card>
                    
                    {/* Share Button */}
                    <Button variant="outline" className="w-full gap-2 py-6">
                      <Share2 className="h-4 w-4" />
                      Share This Course
                    </Button>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="curriculum" className="mt-0">
                <div className="space-y-6">
                  <Card className="overflow-hidden border-none shadow-lg">
                    <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 border-b">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-xl flex items-center gap-2">
                          <BookOpen className="h-5 w-5 text-blue-600" />
                          Course Curriculum
                        </CardTitle>
                        <div className="text-sm text-gray-500">
                          {getModules().length} modules • {getCourseMetadata('duration', 'Self-paced')}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0 divide-y">
                      {getModules().map((module, index) => (
                        <motion.div 
                          key={module.moduleId}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                          className="group hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors"
                        >
                          <div 
                            className="p-5 cursor-pointer"
                            onClick={() => handleModuleSelect(module)}
                          >
                            <div className="flex justify-between items-center">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 group-hover:text-blue-700 transition-colors">
                                    {module.title}
                                  </h3>
                                  {module.moduleId === 1 && (
                                    <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      Completed
                                    </Badge>
                                  )}
                                  {module.moduleId === 2 && (
                                    <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                                      <Clock className="h-3 w-3 mr-1" />
                                      In Progress
                                    </Badge>
                                  )}
                                  {module.moduleId > 2 && (
                                    <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200">
                                      <Lock className="h-3 w-3 mr-1" />
                                      Locked
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-4 w-4" />
                                    <span>{module.duration || "1-2 hours"}</span>
                                  </div>
                                  <div className="h-1 w-1 bg-gray-300 rounded-full"></div>
                                  <div className="flex items-center gap-1">
                                    <Layers className="h-4 w-4" />
                                    <span>{module.subModules?.length || "4-6"} lessons</span>
                                  </div>
                                </div>
                              </div>
                              <div className="text-blue-600 group-hover:translate-x-1 transition-transform">
                                <ChevronRight className="h-5 w-5" />
                              </div>
                              </div>
                            
                            {index === 0 && (
                              <div className="px-5 pb-5">
                                <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                                  {["Introduction to Concepts", "Key Principles", "Fundamental Techniques", "Practical Exercise"].map((lesson, idx) => (
                                    <div 
                                      key={idx}
                                      className="flex items-center gap-2 px-3 py-2 text-sm rounded-md bg-green-50 text-green-800 border border-green-100"
                                    >
                                      <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                                      <span>{lesson}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {index === 1 && (
                              <div className="px-5 pb-5">
                                <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                                  {["Advanced Concepts", "Case Studies", "Problem Solving", "Implementation Strategies"].map((lesson, idx) => (
                                    <div 
                                      key={idx}
                                      className={`flex items-center gap-2 px-3 py-2 text-sm rounded-md ${
                                        idx < 2 
                                          ? "bg-green-50 text-green-800 border border-green-100" 
                                          : "bg-blue-50 text-blue-800 border border-blue-100"
                                      }`}
                                    >
                                      {idx < 2 ? (
                                        <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                                      ) : (
                                        <Clock className="h-3.5 w-3.5 text-blue-600" />
                                      )}
                                      <span>{lesson}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>


   
              
              <TabsContent value="instructor" className="mt-0">
                <Card className="overflow-hidden border-none shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 border-b">
                    <CardTitle className="text-xl flex items-center gap-2">
                      <Users className="h-5 w-5 text-blue-600" />
                      Meet Your Instructor
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row gap-6">
                      <div className="md:w-1/4 flex flex-col items-center">
                        <Avatar className="h-32 w-32 mb-4">
                          <AvatarImage src="/path-to-instructor-image.jpg" alt="AI Tutor" />
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-2xl text-white">AI</AvatarFallback>
                        </Avatar>
                        <h3 className="text-xl font-bold text-center mb-1 text-gray-800 dark:text-gray-200">AI Tutor</h3>
                        <p className="text-gray-500 text-center mb-3">Advanced Learning Assistant</p>
                        <div className="flex gap-2 justify-center">
                          <div className="flex items-center gap-1 text-gray-500 text-sm">
                            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                            <span>4.9</span>
                          </div>
                          <div className="h-4 w-0.5 bg-gray-200"></div>
                          <div className="flex items-center gap-1 text-gray-500 text-sm">
                            <Users className="h-4 w-4" />
                            <span>5,000+ students</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="md:w-3/4">
                        <div className="prose max-w-none dark:prose-invert">
                          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                            Your AI Tutor is an advanced learning assistant designed to provide personalized education across a wide range of subjects. With expertise in multiple disciplines, your AI Tutor crafts custom learning experiences tailored to your specific needs and learning style.
                          </p>
                          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                            Drawing from extensive knowledge and pedagogical principles, your AI Tutor creates comprehensive courses that balance theoretical understanding with practical application. Each module is carefully structured to build your skills progressively, with interactive elements to reinforce your learning.
                          </p>
                          <h3 className="text-lg font-bold mt-6 mb-3 text-gray-800 dark:text-gray-200">Teaching Philosophy</h3>
                          <ul className="space-y-2">
                            <li className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                              <div className="mt-1.5 h-2 w-2 bg-blue-600 rounded-full flex-shrink-0"></div>
                              <span>Personalized learning paths adapted to your goals</span>
                            </li>
                            <li className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                              <div className="mt-1.5 h-2 w-2 bg-blue-600 rounded-full flex-shrink-0"></div>
                              <span>Balancing theory with practical, hands-on exercises</span>
                            </li>
                            <li className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                              <div className="mt-1.5 h-2 w-2 bg-blue-600 rounded-full flex-shrink-0"></div>
                              <span>Regular knowledge checks to reinforce learning</span>
                            </li>
                            <li className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                              <div className="mt-1.5 h-2 w-2 bg-blue-600 rounded-full flex-shrink-0"></div>
                              <span>Immediate, constructive feedback on your progress</span>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="reviews" className="mt-0">
                <Card className="overflow-hidden border-none shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 border-b">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl flex items-center gap-2">
                        <Star className="h-5 w-5 text-blue-600" />
                        Student Reviews
                      </CardTitle>
                      <div className="text-sm text-gray-500">
                        4.9 out of 5 • 120 reviews
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row gap-8">
                      <div className="md:w-1/3">
                        <div className="bg-blue-50 dark:bg-blue-900/10 rounded-xl p-6 text-center">
                          <h3 className="text-5xl font-bold text-gray-800 dark:text-gray-200 mb-2">4.9</h3>
                          <div className="flex justify-center gap-1 mb-3">
                            <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                            <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                            <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                            <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                            <Star className="h-5 w-5 text-yellow-500 fill-yellow-500 opacity-50" />
                          </div>
                          <p className="text-gray-500 text-sm">Course Rating</p>
                          
                          <div className="mt-6 space-y-2">
                            <div>
                              <div className="flex items-center justify-between text-sm mb-1">
                                <div className="flex items-center">
                                  <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500 mr-1" />
                                  <span className="text-gray-700 dark:text-gray-300">5</span>
                                </div>
                                <span className="text-gray-500">85%</span>
                              </div>
                              <Progress value={85} className="h-1.5" />
                            </div>
                            <div>
                              <div className="flex items-center justify-between text-sm mb-1">
                                <div className="flex items-center">
                                  <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500 mr-1" />
                                  <span className="text-gray-700 dark:text-gray-300">4</span>
                                </div>
                                <span className="text-gray-500">10%</span>
                              </div>
                              <Progress value={10} className="h-1.5" />
                            </div>
                            <div>
                              <div className="flex items-center justify-between text-sm mb-1">
                                <div className="flex items-center">
                                  <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500 mr-1" />
                                  <span className="text-gray-700 dark:text-gray-300">3</span>
                                </div>
                                <span className="text-gray-500">3%</span>
                              </div>
                              <Progress value={3} className="h-1.5" />
                            </div>
                            <div>
                              <div className="flex items-center justify-between text-sm mb-1">
                                <div className="flex items-center">
                                  <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500 mr-1" />
                                  <span className="text-gray-700 dark:text-gray-300">2</span>
                                </div>
                                <span className="text-gray-500">1%</span>
                              </div>
                              <Progress value={1} className="h-1.5" />
                            </div>
                            <div>
                              <div className="flex items-center justify-between text-sm mb-1">
                                <div className="flex items-center">
                                  <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500 mr-1" />
                                  <span className="text-gray-700 dark:text-gray-300">1</span>
                                </div>
                                <span className="text-gray-500">1%</span>
                              </div>
                              <Progress value={1} className="h-1.5" />
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="md:w-2/3">
                        <div className="space-y-6">
                          {[
                            {
                              name: "Sarah J.",
                              date: "3 weeks ago",
                              rating: 5,
                              comment: "This course exceeded my expectations! The content is well-structured and the interactive elements really helped solidify my understanding. The AI tutor was responsive and provided helpful guidance throughout."
                            },
                            {
                              name: "Michael T.",
                              date: "1 month ago",
                              rating: 5,
                              comment: "I've taken several online courses before, but this one stands out for its personalized approach. The way the material adapts to your learning pace is impressive. Highly recommended for anyone looking to master this subject."
                            },
                            {
                              name: "Elena R.",
                              date: "2 months ago",
                              rating: 4,
                              comment: "Great course with comprehensive content. The quizzes and practical exercises were particularly valuable. Would appreciate even more real-world examples, but overall an excellent learning experience."
                            }
                          ].map((review, idx) => (
                            <div key={idx} className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                              <div className="flex justify-between mb-2">
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-10 w-10">
                                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-sm text-white">
                                      {review.name.split(' ').map(part => part[0]).join('')}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <h4 className="font-semibold text-gray-800 dark:text-gray-200">{review.name}</h4>
                                    <p className="text-gray-500 text-sm">{review.date}</p>
                                  </div>
                                </div>
                                <div className="flex items-center">
                                  {Array(review.rating).fill(0).map((_, i) => (
                                    <Star key={i} className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                                  ))}
                                  {Array(5 - review.rating).fill(0).map((_, i) => (
                                    <Star key={i} className="h-4 w-4 text-gray-300" />
                                  ))}
                                </div>
                              </div>
                              <p className="text-gray-700 dark:text-gray-300 mt-2">{review.comment}</p>
                            </div>
                          ))}
                          
                          <Button variant="outline" className="w-full">
                            View All Reviews
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </motion.div>
        </motion.div>
      ) : (
        // Module Details View
        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar navigation - shown on larger screens */}
          {showSidebar && (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="hidden md:block w-72 lg:w-80 shrink-0 h-[calc(100vh-11rem)] overflow-auto sticky top-24"
            >
              <div className="pr-4 space-y-4">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleBackToCourse} 
                  className="flex items-center gap-2 mb-4 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back to Course
                </Button>
                
                <div className="rounded-xl overflow-hidden shadow-md border border-gray-100">
                  <div className="p-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
                    <h2 className="font-bold text-xl">Module Contents</h2>
                    <p className="text-sm text-white/80 mt-1">
                      {selectedModule.title}
                    </p>
                  </div>
                  
                  <div className="divide-y divide-gray-100">
                    <button
                      className={`w-full px-4 py-3 flex items-center justify-between text-left transition-colors ${
                        activeTab === "overview" 
                          ? "bg-blue-50 text-blue-700"
                          : "hover:bg-gray-50 text-gray-700"
                      }`}
                      onClick={() => setActiveTab("overview")}
                    >
                      <div className="flex items-center gap-2">
                        <Info className="h-4 w-4" />
                        <span>Overview</span>
                      </div>
                      {activeTab === "overview" && (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                    
                    {learningResource && learningResource.subModules && (
                      <div className="divide-y divide-gray-100">
                        <button
                          className={`w-full px-4 py-3 flex items-center justify-between text-left transition-colors ${
                            activeTab === "content" 
                              ? "bg-blue-50 text-blue-700"
                              : "hover:bg-gray-50 text-gray-700"
                          }`}
                          onClick={() => setActiveTab("content")}
                        >
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            <span>Main Content</span>
                          </div>
                          {activeTab === "content" && (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </button>
                        
                        <button
                          className={`w-full px-4 py-3 flex items-center justify-between text-left transition-colors ${
                            activeTab === "articles" 
                              ? "bg-blue-50 text-blue-700"
                              : "hover:bg-gray-50 text-gray-700"
                          }`}
                          onClick={() => setActiveTab("articles")}
                        >
                          <div className="flex items-center gap-2">
                            <BookOpen className="h-4 w-4" />
                            <span>Detailed Articles</span>
                          </div>
                          {activeTab === "articles" && (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </button>
                        
                        {learningResource.videoUrls && learningResource.videoUrls.length > 0 && (
                          <button
                            className={`w-full px-4 py-3 flex items-center justify-between text-left transition-colors ${
                              activeTab === "videos" 
                                ? "bg-blue-50 text-blue-700"
                                : "hover:bg-gray-50 text-gray-700"
                            }`}
                            onClick={() => setActiveTab("videos")}
                          >
                            <div className="flex items-center gap-2">
                              <PlayCircle className="h-4 w-4" />
                              <span>Video Lectures</span>
                            </div>
                            {activeTab === "videos" && (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </button>
                        )}
                        
                        {learningResource.quizzes && learningResource.quizzes.length > 0 && (
                          <button
                            className={`w-full px-4 py-3 flex items-center justify-between text-left transition-colors ${
                              activeTab === "quizzes" 
                                ? "bg-blue-50 text-blue-700"
                                : "hover:bg-gray-50 text-gray-700"
                            }`}
                            onClick={() => setActiveTab("quizzes")}
                          >
                            <div className="flex items-center gap-2">
                              <HelpCircle className="h-4 w-4" />
                              <span>Knowledge Checks</span>
                            </div>
                            {activeTab === "quizzes" && (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </button>
                        )}
                        
                        <button
                          className={`w-full px-4 py-3 flex items-center justify-between text-left transition-colors ${
                            activeTab === "resources" 
                              ? "bg-blue-50 text-blue-700"
                              : "hover:bg-gray-50 text-gray-700"
                          }`}
                          onClick={() => setActiveTab("resources")}
                        >
                          <div className="flex items-center gap-2">
                            <Download className="h-4 w-4" />
                            <span>Additional Resources</span>
                          </div>
                          {activeTab === "resources" && (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                
                {!learningResource && !isLoadingResource && (
                  <Card className="border-none shadow-md overflow-hidden">
                    <CardContent className="p-0">
                      <div className="p-4 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20">
                        <Sparkles className="h-8 w-8 text-blue-600 mb-2" />
                        <h3 className="font-bold text-lg text-gray-800 dark:text-gray-200">Generate Materials</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          Create comprehensive learning materials for this module
                        </p>
                      </div>
                      <div className="p-4">
                        <Button 
                          onClick={handleGenerateModuleResources} 
                          className="w-full bg-blue-600 hover:bg-blue-700"
                        >
                          <Brain className="h-4 w-4 mr-2" />
                          Generate Now
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                {/* Module Progress Card */}
                <Card className="border-none shadow-md overflow-hidden">
                  <CardContent className="p-0">
                    <div className="p-4 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20">
                      <BarChart className="h-6 w-6 text-green-600 mb-2" />
                      <h3 className="font-bold text-lg text-gray-800 dark:text-gray-200">Module Progress</h3>
                    </div>
                    <div className="p-4">
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between mb-2 text-sm">
                            <span className="text-gray-500">Completion</span>
                            <span className="font-medium">0%</span>
                          </div>
                          <Progress value={0} className="h-2" />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 text-center text-sm">
                          <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded-md">
                            <p className="text-gray-500 text-xs">Lessons</p>
                            <p className="font-semibold text-gray-800 dark:text-gray-200">0/4</p>
                          </div>
                          <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded-md">
                            <p className="text-gray-500 text-xs">Quizzes</p>
                            <p className="font-semibold text-gray-800 dark:text-gray-200">0/2</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          )}
          
          {/* Mobile sidebar toggle */}
          <div className="md:hidden sticky top-2 z-30 flex items-center justify-between bg-white dark:bg-gray-800 p-3 rounded-lg shadow-md mb-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleBackToCourse} 
              className="flex items-center gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>
            
            <div className="font-semibold text-gray-800 dark:text-gray-200 truncate max-w-[16rem]">
              {selectedModule.title}
            </div>
            
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowSidebar(!showSidebar)}
              className="md:hidden"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
          
          {/* Main Content Area */}
          <div className="flex-1">
            {/* Module Header */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={isLoaded ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5 }}
              className="mb-8"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="hidden md:flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                  {selectedModule.moduleId}
                </div>
                <Badge className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0">
                  Module {selectedModule.moduleId}
                </Badge>
              </div>
              
              <h1 className="text-3xl font-bold mb-3 text-gray-800 dark:text-gray-200">
                {selectedModule.title}
              </h1>
              
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                {selectedModule.description}
              </p>
              
              <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{selectedModule.duration || "1-2 hours"}</span>
                </div>
                <div className="h-1 w-1 bg-gray-300 rounded-full"></div>
                <div className="flex items-center gap-1">
                  <Layers className="h-4 w-4" />
                  <span>{selectedModule.subModules?.length || 4} lessons</span>
                </div>
                <div className="h-1 w-1 bg-gray-300 rounded-full"></div>
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-4 w-4" />
                  <span>0% Complete</span>
                </div>
              </div>
            </motion.div>
            
            {/* Mobile sidebar (conditional rendering) */}
            {showSidebar && (
              <div className="md:hidden mb-6">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="w-full grid grid-cols-4 h-auto bg-gray-100 p-1 rounded-xl">
                    <TabsTrigger value="overview" className="h-auto py-2">
                      <Info className="h-4 w-4" />
                    </TabsTrigger>
                    <TabsTrigger value="content" className="h-auto py-2">
                      <FileText className="h-4 w-4" />
                    </TabsTrigger>
                    <TabsTrigger value="articles" className="h-auto py-2">
                      <BookOpen className="h-4 w-4" />
                    </TabsTrigger>
                    <TabsTrigger value="quizzes" className="h-auto py-2">
                      <HelpCircle className="h-4 w-4" />
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            )}
            
            {/* Loading State */}
            {isLoadingResource && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col items-center justify-center py-20 text-center space-y-4"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-blue-600/20 rounded-full blur-2xl opacity-70"></div>
                  <div className="relative">
                    <Loader2 className="h-16 w-16 animate-spin text-blue-600" />
                  </div>
                </div>
                <div className="max-w-md">
                  <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">Generating your learning materials</h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    We're creating comprehensive content for "{selectedModule.title}". This may take a moment as we personalize materials to your learning objectives.
                  </p>
                </div>
                <div className="w-full max-w-md mt-4">
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-blue-500 to-indigo-600"
                      initial={{ width: "10%" }}
                      animate={{ 
                        width: ["10%", "30%", "50%", "70%", "90%"],
                      }}
                      transition={{ 
                        duration: 3, 
                        ease: "easeInOut",
                        repeat: Infinity,
                        repeatType: "reverse"
                      }}
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* No Generated Content Yet */}
            {!learningResource && !isLoadingResource && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={isLoaded ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Card className="border-none shadow-lg overflow-hidden">
                  <div className="aspect-video bg-gradient-to-br from-blue-600 to-indigo-800 relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('/path/to/pattern.svg')] opacity-10"></div>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-8 text-center">
                      <div className="p-4 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 mb-6">
                        <Brain className="h-16 w-16 text-white" />
                      </div>
                      <h2 className="text-3xl font-bold mb-4">Generate Learning Materials</h2>
                      <p className="max-w-xl text-white/80 mb-8">
                        Create comprehensive learning materials for this module, including articles, quizzes, 
                        and interactive resources tailored to your learning objectives.
                      </p>
                      <Button 
                        onClick={handleGenerateModuleResources} 
                        className="bg-white text-blue-700 hover:bg-white/90 hover:text-blue-800 shadow-lg px-8 py-6"
                      >
                        <Sparkles className="h-5 w-5 mr-2" />
                        Generate Module Resources
                      </Button>
                    </div>
                  </div>
                  
                  <CardContent className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="flex flex-col items-center p-6 text-center">
                        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-2xl mb-4">
                          <FileText className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h3 className="font-bold text-lg mb-2 text-gray-800 dark:text-gray-200">
                          In-Depth Articles
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">
                          Comprehensive explanations and detailed examples to build your understanding
                        </p>
                      </div>
                      
                      <div className="flex flex-col items-center p-6 text-center">
                        <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl mb-4">
                          <PlayCircle className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <h3 className="font-bold text-lg mb-2 text-gray-800 dark:text-gray-200">
                          Video Resources
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">
                          Curated video content to support visual learning and reinforce concepts
                        </p>
                      </div>
                      
                      <div className="flex flex-col items-center p-6 text-center">
                        <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-2xl mb-4">
                          <HelpCircle className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                        </div>
                        <h3 className="font-bold text-lg mb-2 text-gray-800 dark:text-gray-200">
                          Knowledge Checks
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">
                          Interactive quizzes to test your understanding and reinforce learning
                        </p>
                      </div>
                    </div>
                    
                    <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800">
                      <h3 className="font-bold text-lg mb-4 text-gray-800 dark:text-gray-200">Module Learning Objectives</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {selectedModule.learningObjectives ? (
                          selectedModule.learningObjectives.map((obj, idx) => (
                            <div key={idx} className="flex items-start gap-2">
                              <div className="mt-1 p-1 bg-blue-100 dark:bg-blue-900/30 rounded-full text-blue-600 dark:text-blue-400">
                                <CheckCircle className="h-4 w-4" />
                              </div>
                              <span className="text-gray-700 dark:text-gray-300">{obj}</span>
                            </div>
                          ))
                        ) : (
                          ["Understand key concepts and principles", 
                           "Apply theoretical knowledge to practical scenarios", 
                           "Analyze complex problems and develop solutions", 
                           "Evaluate approaches and methodologies in the field"].map((obj, idx) => (
                            <div key={idx} className="flex items-start gap-2">
                              <div className="mt-1 p-1 bg-blue-100 dark:bg-blue-900/30 rounded-full text-blue-600 dark:text-blue-400">
                                <CheckCircle className="h-4 w-4" />
                              </div>
                              <span className="text-gray-700 dark:text-gray-300">{obj}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Content Tabs */}
            {learningResource && (
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsContent value="overview" className="m-0 mt-2">
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="space-y-6"
                  >
                    {/* Module Overview Card */}
                    <Card className="shadow-lg overflow-hidden border-none">
                      <div className="bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 border-b border-blue-200 dark:border-blue-800/50">
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                          <Info className="h-6 w-6 text-blue-600" />
                          Module Overview
                        </h2>
                      </div>
                      <CardContent className="p-6">
                        <div className="prose max-w-none dark:prose-invert">
                          <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-lg border border-blue-100 dark:border-blue-800/50 mb-6">
                            <h3 className="text-lg font-bold mb-2 text-gray-800 dark:text-gray-200 flex items-center gap-2">
                              <Zap className="h-5 w-5 text-blue-600" />
                              Key Takeaways
                            </h3>
                            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                              {selectedModule.learningObjectives ? (
                                selectedModule.learningObjectives.map((obj, idx) => (
                                  <li key={idx} className="flex items-start gap-2">
                                    <div className="mt-1 p-1 bg-blue-200 dark:bg-blue-800 rounded-full text-blue-700 dark:text-blue-300">
                                      <CheckCircle className="h-3.5 w-3.5" />
                                    </div>
                                    <span className="text-gray-700 dark:text-gray-300">{obj}</span>
                                  </li>
                                ))
                              ) : (
                                ["Master the fundamental concepts", 
                                "Apply techniques to practical scenarios",
                                "Build critical analysis skills",
                                "Develop problem-solving approaches"].map((obj, idx) => (
                                  <li key={idx} className="flex items-start gap-2">
                                    <div className="mt-1 p-1 bg-blue-200 dark:bg-blue-800 rounded-full text-blue-700 dark:text-blue-300">
                                      <CheckCircle className="h-3.5 w-3.5" />
                                    </div>
                                    <span className="text-gray-700 dark:text-gray-300">{obj}</span>
                                  </li>
                                ))
                              )}
                            </ul>
                          </div>
                          <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-200">Module Summary</h3>
                          <CustomMarkdownRenderer markdown={learningResource.content.split('##')[0] || learningResource.content} />
                        </div>
                      </CardContent>
                    </Card>
                    
                    {/* Module Structure Card */}
                    <Card className="shadow-lg overflow-hidden border-none">
                      <div className="bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-900/50 dark:to-gray-800/50 p-6 border-b border-gray-200 dark:border-gray-700">
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                          <Layers className="h-6 w-6 text-blue-600" />
                          Module Structure
                        </h2>
                      </div>
                      <CardContent className="p-6">
                        <div className="space-y-4">
                          {learningResource.subModules && learningResource.subModules.map((subModule, idx) => (
                            <div 
                              key={idx} 
                              className="flex gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-700 transition-colors"
                            >
                              <div className="mt-1 h-8 w-8 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium">
                                {idx + 1}
                              </div>
                              <div className="flex-1">
                                <h3 className="font-bold text-lg text-gray-800 dark:text-gray-200 mb-1">{subModule.subModuleTitle}</h3>
                                <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2">
                                  {subModule.article.split('\n\n')[0].replace(/[#*]/g, '')}
                                </p>
                                <div className="flex flex-wrap gap-2 mt-3">
                                  <div className="flex items-center text-xs text-gray-500">
                                    <Clock className="h-3.5 w-3.5 mr-1" />
                                    <span>{subModule.readingTime || "10-15 min"}</span>
                                  </div>
                                  
                                  {subModule.tags?.map((tag, tagIdx) => (
                                    <Badge 
                                      key={tagIdx} 
                                      variant="outline"
                                      className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100"
                                    >
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                              <Button 
                                variant="ghost" 
                                className="shrink-0 h-8 w-8 p-0 rounded-full text-gray-500 hover:text-blue-600 hover:bg-blue-50"
                                onClick={() => handleOpenArticle(subModule)}
                                aria-label={`Read article: ${subModule.subModuleTitle}`}
                              >
                                <ChevronRight className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                    
                    {/* Supplementary Resources Card */}
                    <Card className="shadow-lg overflow-hidden border-none">
                      <div className="bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-900/50 dark:to-gray-800/50 p-6 border-b border-gray-200 dark:border-gray-700">
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                          <Download className="h-6 w-6 text-blue-600" />
                          Supplementary Resources
                        </h2>
                      </div>
                      <CardContent className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <Button variant="outline" className="justify-start p-4 h-auto flex-col items-start hover:bg-blue-50 hover:border-blue-200 transition-colors shadow-sm" aria-label="Download Materials">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg mb-3">
                              <Download className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="text-left">
                              <h3 className="font-medium text-gray-800 dark:text-gray-200">Module PDF</h3>
                              <p className="text-xs text-gray-500 mt-1">Offline access to all content</p>
                            </div>
                          </Button>
                          
                          <Button variant="outline" className="justify-start p-4 h-auto flex-col items-start hover:bg-blue-50 hover:border-blue-200 transition-colors shadow-sm" aria-label="Code Samples">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg mb-3">
                              <Code className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="text-left">
                              <h3 className="font-medium text-gray-800 dark:text-gray-200">Code Samples</h3>
                              <p className="text-xs text-gray-500 mt-1">Practical implementation examples</p>
                            </div>
                          </Button>
                          
                          <Button variant="outline" className="justify-start p-4 h-auto flex-col items-start hover:bg-blue-50 hover:border-blue-200 transition-colors shadow-sm" aria-label="External Resources">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg mb-3">
                              <ExternalLink className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="text-left">
                              <h3 className="font-medium text-gray-800 dark:text-gray-200">References</h3>
                              <p className="text-xs text-gray-500 mt-1">Additional learning materials</p>
                            </div>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </TabsContent>
                
                <TabsContent value="content" className="m-0 mt-2">
                  <Card className="shadow-lg overflow-hidden border-none">
                    <div className="bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-900/50 dark:to-gray-800/50 p-6 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
                      <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                        <FileText className="h-6 w-6 text-blue-600" />
                        Main Content
                      </h2>
                    </div>
                    <CardContent className="p-6">
                      <div className="prose max-w-none dark:prose-invert">
                        <CustomMarkdownRenderer markdown={learningResource.content} />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="articles" className="m-0 mt-2">
                  {learningResource.subModules && learningResource.subModules.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                      className="space-y-6"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {learningResource.subModules.map((subModule, idx) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.3, delay: idx * 0.1 }}
                            whileHover={{ y: -5 }}
                            className="group"
                          >
                            <Card className="h-full overflow-hidden border-none shadow-lg cursor-pointer">
                              <div className="h-3 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
                              <CardContent className="p-6 flex flex-col h-full">
                                <div className="mb-4 pb-4 border-b border-gray-100 dark:border-gray-800">
                                  <h3 className="text-xl font-bold mb-2 text-gray-800 dark:text-gray-200 group-hover:text-blue-700 transition-colors">
                                    {subModule.subModuleTitle}
                                  </h3>
                                  <div className="flex flex-wrap gap-2">
                                    <div className="flex items-center text-sm text-gray-500">
                                      <Clock className="h-4 w-4 mr-1" />
                                      <span>{subModule.readingTime || "10-15 min"}</span>
                                    </div>
                                    
                                    {subModule.tags && subModule.tags[0] && (
                                      <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 border-none">
                                        {subModule.tags[0]}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                
                                <div className="flex-1">
                                  <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-4">
                                    {subModule.article.split('\n\n')[0].replace(/[#*]/g, '')}...
                                  </p>
                                </div>
                                
                                <Button 
                                  className="mt-6 justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors"
                                  variant="outline"
                                  onClick={() => handleOpenArticle(subModule)}
                                >
                                  <BookOpen className="h-4 w-4 mr-2" />
                                  Read Article
                                </Button>
                              </CardContent>
                            </Card>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </TabsContent>
                
                <TabsContent value="videos" className="m-0 mt-2">
                  {learningResource.videoUrls && learningResource.videoUrls.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                    >
                      <Card className="shadow-lg overflow-hidden border-none">
                        <div className="bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-900/50 dark:to-gray-800/50 p-6 border-b border-gray-200 dark:border-gray-700">
                          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                            <PlayCircle className="h-6 w-6 text-blue-600" />
                            Video Lectures
                          </h2>
                        </div>
                        <CardContent className="p-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {learningResource.videoUrls.map((videoUrl, index) => (
                              <div key={index} className="space-y-3">
                                <div className="aspect-video overflow-hidden rounded-lg shadow-md">
                                  <iframe
                                    title={`Video Lecture ${index + 1}`}
                                    className="w-full h-full"
                                    src={convertToEmbedUrl(videoUrl)}
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                  ></iframe>
                                </div>
                                <h3 className="font-bold text-lg text-gray-800 dark:text-gray-200">
                                  Video Lecture {index + 1}: {selectedModule.title} 
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 text-sm">
                                  Comprehensive video tutorial covering key concepts and practical demonstrations for this module.
                                </p>
                                <div className="flex items-center gap-4 text-sm">
                                  <div className="flex items-center text-gray-500">
                                    <Clock className="h-4 w-4 mr-1" />
                                    <span>12:34 mins</span>
                                  </div>
                                  <Badge className="bg-red-100 text-red-800 hover:bg-red-200 border-none">
                                    Video Tutorial
                                  </Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                          {learningResource.transcript && (
                            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                              <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-lg text-gray-800 dark:text-gray-200">Transcript</h3>
                                <Button variant="outline" size="sm" className="text-xs">
                                  <Download className="h-3 w-3 mr-1" />
                                  Download
                                </Button>
                              </div>
                              <div className="max-h-80 overflow-y-auto bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400 prose-sm">
                                <CustomMarkdownRenderer markdown={learningResource.transcript} />
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}
                </TabsContent>
                
                <TabsContent value="quizzes" className="m-0 mt-2">
                  {learningResource.quizzes && learningResource.quizzes.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                      className="space-y-6"
                    >
                      <Card className="shadow-lg overflow-hidden border-none">
                        <div className="bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-900/50 dark:to-gray-800/50 p-6 border-b border-gray-200 dark:border-gray-700">
                          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                            <HelpCircle className="h-6 w-6 text-blue-600" />
                            Knowledge Checks
                          </h2>
                        </div>
                        <CardContent className="p-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {learningResource.quizzes.map((quiz, idx) => (
                              <motion.div
                                key={idx}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.3, delay: idx * 0.1 }}
                                whileHover={{ y: -5 }}
                              >
                                <Card className="border border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all group cursor-pointer h-full overflow-hidden">
                                  <div className="h-3 bg-gradient-to-r from-indigo-600 to-purple-600"></div>
                                  <CardContent className="p-6">
                                    <h3 className="text-xl font-bold mb-2 text-gray-800 dark:text-gray-200 group-hover:text-indigo-700 transition-colors">
                                      {quiz.quizTitle}
                                    </h3>
                                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                                      {quiz.description}
                                    </p>
                                    
                                    <div className="flex flex-wrap gap-3 mb-6">
                                      <Badge className="bg-indigo-100 text-indigo-800 hover:bg-indigo-200 border-none">
                                        <Award className="h-3 w-3 mr-1" />
                                        {quiz.difficulty || "Intermediate"}
                                      </Badge>
                                      <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 border-none">
                                        <Clock className="h-3 w-3 mr-1" />
                                        {quiz.timeLimit || "10 minutes"}
                                      </Badge>
                                      <Badge className="bg-green-100 text-green-800 hover:bg-green-200 border-none">
                                        <CheckCircle className="h-3 w-3 mr-1" />
                                        Pass: {quiz.passingScore || "60"}%
                                      </Badge>
                                    </div>
                                    
                                    <div className="border-t border-gray-100 dark:border-gray-800 pt-4 mt-auto">
                                      <div className="flex justify-between items-center mb-4">
                                        <div className="text-sm text-gray-500">
                                          {quiz.questions?.length || 0} questions
                                        </div>
                                        <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200 border-none">
                                          Not Started
                                        </Badge>
                                      </div>
                                      
                                      <Button 
                                        className="w-full justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors"
                                        variant="outline"
                                        onClick={() => handleOpenQuiz(quiz)}
                                      >
                                        <PlayCircle className="h-4 w-4 mr-2" />
                                        Take Quiz
                                      </Button>
                                    </div>
                                  </CardContent>
                                </Card>
                              </motion.div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}
                </TabsContent>
                
                <TabsContent value="resources" className="m-0 mt-2">
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <Card className="shadow-lg overflow-hidden border-none">
                      <div className="bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-900/50 dark:to-gray-800/50 p-6 border-b border-gray-200 dark:border-gray-700">
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                          <Download className="h-6 w-6 text-blue-600" />
                          Additional Resources
                        </h2>
                      </div>
                      <CardContent className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <Card className="border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 transition-all group cursor-pointer h-full overflow-hidden">
                            <div className="h-2 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
                            <CardContent className="p-6">
                              <div className="flex flex-col items-center">
                                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl mb-4">
                                  <FileText className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                                </div>
                                <h3 className="text-lg font-bold mb-2 text-center text-gray-800 dark:text-gray-200">
                                  Module PDF
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 text-sm text-center mb-4">
                                  Complete module content in PDF format for offline access and printing
                                </p>
                                <Button className="mt-auto w-full justify-center">
                                  <Download className="h-4 w-4 mr-2" />
                                  Download PDF
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                          
                          <Card className="border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 transition-all group cursor-pointer h-full overflow-hidden">
                            <div className="h-2 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
                            <CardContent className="p-6">
                              <div className="flex flex-col items-center">
                                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl mb-4">
                                  <Code className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                                </div>
                                <h3 className="text-lg font-bold mb-2 text-center text-gray-800 dark:text-gray-200">
                                  Code Examples
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 text-sm text-center mb-4">
                                  Sample code and implementation examples to reinforce concepts
                                </p>
                                <Button className="mt-auto w-full justify-center">
                                  <Download className="h-4 w-4 mr-2" />
                                  Download ZIP
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                          
                          <Card className="border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 transition-all group cursor-pointer h-full overflow-hidden">
                            <div className="h-2 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
                            <CardContent className="p-6">
                              <div className="flex flex-col items-center">
                                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl mb-4">
                                  <ExternalLink className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                                </div>
                                <h3 className="text-lg font-bold mb-2 text-center text-gray-800 dark:text-gray-200">
                                  External Resources
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 text-sm text-center mb-4">
                                  Curated links to additional resources, readings, and tools
                                </p>
                                <Button className="mt-auto w-full justify-center">
                                  <ExternalLink className="h-4 w-4 mr-2" />
                                  View Resources
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                        
                        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                          <h3 className="font-bold text-lg mb-4 text-gray-800 dark:text-gray-200">Reading List</h3>
                          <div className="space-y-3">
                            {[
                              {
                                title: "Comprehensive Guide to the Subject",
                                author: "Jane Smith",
                                type: "Book",
                                link: "#"
                              },
                              {
                                title: "Advanced Techniques and Methodologies",
                                author: "Robert Johnson",
                                type: "Academic Paper",
                                link: "#"
                              },
                              {
                                title: "Practical Applications in Modern Contexts",
                                author: "Maria Garcia",
                                type: "Article",
                                link: "#"
                              }
                            ].map((resource, idx) => (
                              <div 
                                key={idx}
                                className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-700 transition-colors"
                              >
                                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full text-blue-600 dark:text-blue-400">
                                  {resource.type === "Book" ? (
                                    <BookOpen className="h-5 w-5" />
                                  ) : resource.type === "Academic Paper" ? (
                                    <FileText className="h-5 w-5" />
                                  ) : (
                                    <Globe className="h-5 w-5" />
                                  )}
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-semibold text-gray-800 dark:text-gray-200">{resource.title}</h4>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    By {resource.author} • {resource.type}
                                  </p>
                                </div>
                                <Button variant="ghost" size="sm" className="text-blue-600 h-8 w-8 p-0 rounded-full">
                                  <ExternalLink className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </TabsContent>
              </Tabs>
            )}
          </div>
        </div>
      )}

      {/* ARTICLE MODAL */}
      {showArticleModal && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50" 
          role="dialog" 
          aria-modal="true"
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="bg-white dark:bg-gray-900 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-xl relative flex flex-col"
          >
            <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">{activeArticle.title}</h2>
              <button 
                className="bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full p-2 transition-colors" 
                onClick={() => setShowArticleModal(false)}
                aria-label="Close article"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            
            <div className="flex-1 overflow-auto">
              <div className="px-6 py-5">
                <div className="prose max-w-full dark:prose-invert">
                  <CustomMarkdownRenderer markdown={activeArticle.content} />
                </div>
              </div>
            </div>
            
            <div className="sticky bottom-0 bg-white dark:bg-gray-900 px-6 py-4 border-t border-gray-200 dark:border-gray-800 flex justify-between">
              <Button variant="outline" onClick={() => setShowArticleModal(false)}>
                Close
              </Button>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <BookmarkPlus className="h-4 w-4 mr-2" />
                Save Article
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* QUIZ MODAL */}
      {showQuizModal && activeQuiz && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50" 
          role="dialog" 
          aria-modal="true"
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="bg-white dark:bg-gray-900 rounded-xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-xl relative flex flex-col"
          >
            <div className="sticky top-0 z-10 bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 text-white flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold">{activeQuiz.quizTitle}</h2>
                <p className="text-sm text-white/80">{activeQuiz.description}</p>
              </div>
              <button 
                className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full p-2 transition-colors" 
                onClick={handleCloseQuizModal}
                aria-label="Close quiz"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
            
            <div className="flex-1 overflow-auto">
              <div className="px-6 py-5">
                {!quizSubmitted ? (
                  <div className="space-y-8">
                    {activeQuiz.questions?.map((q, idx) => (
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
                                      <motion.div 
                                        initial={{ scale: 0 }} 
                                        animate={{ scale: 1 }} 
                                        transition={{ duration: 0.2 }}
                                      >
                                        <Check className="h-4 w-4" />
                                      </motion.div>
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
                    
                    <div className="sticky bottom-0 bg-white dark:bg-gray-900 py-4 border-t border-gray-200 dark:border-gray-800">
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-500">
                          <p>{Object.keys(quizAnswers).length} of {activeQuiz.questions?.length || 0} questions answered</p>
                        </div>
                        <Button 
                          className="bg-indigo-600 hover:bg-indigo-700"
                          onClick={handleSubmitQuiz}
                          disabled={Object.keys(quizAnswers).length < (activeQuiz.questions?.length || 0)}
                        >
                          Submit Quiz
                        </Button>
                      </div>
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
                              Passing score: {activeQuiz.passingScore || 60}%
                            </div>
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
                      {activeQuiz.questions?.map((q, idx) => {
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
                  </div>
                )}
              </div>
            </div>
            
            <div className="sticky bottom-0 bg-white dark:bg-gray-900 px-6 py-4 border-t border-gray-200 dark:border-gray-800 flex justify-between">
              {!quizSubmitted ? (
                <>
                  <Button variant="outline" onClick={handleCloseQuizModal}>
                    Cancel
                  </Button>
                  <Button 
                    className="bg-indigo-600 hover:bg-indigo-700"
                    onClick={handleSubmitQuiz}
                    disabled={Object.keys(quizAnswers).length < (activeQuiz.questions?.length || 0)}
                  >
                    Submit Quiz
                  </Button>
                </>
              ) : (
                <>
                  <Button 
                    variant="outline" 
                    onClick={() => handleOpenQuiz(activeQuiz)}
                  >
                    <PlayCircle className="h-4 w-4 mr-2" />
                    Retake Quiz
                  </Button>
                  <Button 
                    className="bg-indigo-600 hover:bg-indigo-700"
                    onClick={handleCloseQuizModal}
                  >
                    Continue Learning
                  </Button>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}