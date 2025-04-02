"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BookOpen,
  ChevronLeft,
  Info,
  FileText,
  Clock,
  Brain,
  Loader2,
  Sparkles,
  Layers,
  CheckCircle,
  FileText as FileTextIcon,
  PlayCircle,
  HelpCircle,
  Share2,
  Download,
  ExternalLink,
  Award,
  X,
  Code,
  BookmarkPlus,
  ChevronRight
} from "lucide-react";
import CustomMarkdownRenderer from "@/components/ui/CustomMarkdownRenderer";
import { 
  fetchModule, 
  checkLearningResources, 
  generateLearningResources 
} from "@/services/api";

export default function ModuleDetailPage({ params }) {
  const { courseId, moduleId } = params;
  const [module, setModule] = useState(null);
  const [learningResource, setLearningResource] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingResource, setIsLoadingResource] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const router = useRouter();
  const contentRef = useRef(null);
  
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

// Inside the useEffect hook, modify the loadModule function
useEffect(() => {
  const loadModule = async () => {
    try {
      setIsLoading(true);
      
      // Fetch module data
      const moduleData = await fetchModule(moduleId);
      setModule(moduleData);
      
      // Check if learning resources already exist
      const resources = await checkLearningResources(moduleData.id);
      
      // Only set learning resources if they exist and have submodules
      if (resources && 
          ((resources.subModules && resources.subModules.length > 0) || 
           (resources.content && resources.content.trim() !== ""))) {
        setLearningResource(resources);
      } else {
        // No resources or empty resources - will trigger the generation UI
        setLearningResource(null);
      }
    } catch (error) {
      console.error("Error loading module data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (moduleId) {
    loadModule();
  }
}, [moduleId]);


  const navigateBack = () => {
    router.push(`/courses/${courseId}`);
  };

  const handleGenerateModuleResources = async () => {
    if (!module) return;
    setIsLoadingResource(true);
    
    try {
      const request = {
        moduleTitle: module.title,
        moduleId: module.id, 
        conceptTitle: module.title,
        format: "markdown",
        contentType: "comprehensive",
        detailLevel: 5,
        specificRequirements: [
          `Create a comprehensive guide for the module: ${module.title}`,
          "Include detailed explanations, diagrams, and code samples",
          "Structure content with clear sections and summaries",
          "Create at least 3-5 submodules with detailed articles",
        ],
      };
  
      // Include learning objectives if provided
      if (module.learningObjectives && module.learningObjectives.length > 0) {
        request.specificRequirements.push(
          `Address the following learning objectives: ${module.learningObjectives.join(", ")}`
        );
      }
  
      // Generate learning resources
      const data = await generateLearningResources(request);
      
      // Verify the generated data has submodules before setting
      if (data) {
        // Check if we received proper data with submodules or content
        if ((data.subModules && data.subModules.length > 0) || (data.content && data.content.trim() !== "")) {
          setLearningResource(data);
        } else {
          console.error("Generated resources do not contain submodules or content");
          // You might want to show an error message to the user here
        }
      }
    } catch (error) {
      console.error("Error generating module resources:", error);
      // You might want to show an error message to the user here
    } finally {
      setIsLoadingResource(false);
    }
  };

  // Article handling functions
  const handleOpenArticle = (subModule) => {
    setActiveArticle({ title: subModule.subModuleTitle, content: subModule.article });
    setShowArticleModal(true);
  };

  // Quiz handling functions
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

  // Helper: Convert YouTube watch URL to embed URL
  const convertToEmbedUrl = (url) => {
    if (!url) return "";
    return url.replace("watch?v=", "embed/");
  };

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

  // Reset scroll position when tabs change
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  }, [activeTab]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!module) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Module not found</h1>
        <Button onClick={navigateBack}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Course
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8" ref={contentRef}>
      <Button 
        variant="ghost" 
        onClick={navigateBack} 
        className="mb-6"
      >
        <ChevronLeft className="mr-2 h-4 w-4" />
        Back to Course
      </Button>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-4">
          <Badge className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0">
            Module {module.moduleId}
          </Badge>
        </div>
        
        <h1 className="text-3xl font-bold mb-3 text-gray-800 dark:text-gray-200">
          {module.title}
        </h1>
        
        <p className="text-gray-600 dark:text-gray-400 text-lg">
          {module.description}
        </p>
        
        <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-gray-500">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{module.duration || "1-2 hours"}</span>
          </div>
          {module.complexityLevel && (
            <>
              <div className="h-1 w-1 bg-gray-300 rounded-full"></div>
              <div className="flex items-center gap-1">
                <Badge className="bg-blue-100 text-blue-800 border-none">
                  {module.complexityLevel}
                </Badge>
              </div>
            </>
          )}
        </div>
      </motion.div>

      {/* Module Content */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Left Sidebar */}
        <div className="md:col-span-1 space-y-4">
          <Card className="border-none shadow-md overflow-hidden">
            <div className="p-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
              <h2 className="font-bold text-xl">Module Contents</h2>
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
              
              {learningResource && (
                <>
                  <button
                    className={`w-full px-4 py-3 flex items-center justify-between text-left transition-colors ${
                      activeTab === "content" 
                        ? "bg-blue-50 text-blue-700"
                        : "hover:bg-gray-50 text-gray-700"
                    }`}
                    onClick={() => setActiveTab("content")}
                  >
                    <div className="flex items-center gap-2">
                      <FileTextIcon className="h-4 w-4" />
                      <span>Main Content</span>
                    </div>
                    {activeTab === "content" && (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>
                  
                  {learningResource.subModules && learningResource.subModules.length > 0 && (
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
                  )}
                  
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
                      <span>Resources</span>
                    </div>
                    {activeTab === "resources" && (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>
                </>
              )}
            </div>
          </Card>
          
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
        </div>
        
        {/* Main Content Area */}
        <div className="md:col-span-3">
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
                  We're creating comprehensive content for "{module.title}". This may take a moment as we personalize materials to your learning objectives.
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
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card className="border-none shadow-lg overflow-hidden">
                <div className="aspect-video bg-gradient-to-br from-blue-600 to-indigo-800 relative overflow-hidden">
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
                      {module.learningObjectives ? (
                        module.learningObjectives.map((obj, idx) => (
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
                            Key Takeaways
                          </h3>
                          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                            {module.learningObjectives ? (
                              module.learningObjectives.map((obj, idx) => (
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
                        <p className="text-gray-700 dark:text-gray-300">
                          {module.description}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Module Structure Card */}
                  {learningResource.subModules && learningResource.subModules.length > 0 && (
                    <Card className="shadow-lg overflow-hidden border-none">
                      <div className="bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-900/50 dark:to-gray-800/50 p-6 border-b border-gray-200 dark:border-gray-700">
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                          <Layers className="h-6 w-6 text-blue-600" />
                          Module Structure
                        </h2>
                      </div>
                      <CardContent className="p-6">
                        <div className="space-y-4">
                          {learningResource.subModules.map((subModule, idx) => (
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
                                onClick={() => handleOpenArticle(subModule)}
                                className="shrink-0 h-8 w-8 p-0 rounded-full text-gray-500 hover:text-blue-600 hover:bg-blue-50"
                                aria-label={`Read article: ${subModule.subModuleTitle}`}
                              >
                                <ChevronRight className="h-4 w-4" />
                              </Button>
                              </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </motion.div>
              </TabsContent>
              
              <TabsContent value="content" className="m-0 mt-2">
                <Card className="shadow-lg overflow-hidden border-none">
                  <div className="bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-900/50 dark:to-gray-800/50 p-6 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                      <FileTextIcon className="h-6 w-6 text-blue-600" />
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {learningResource.subModules.map((subModule, idx) => (
                        <Card key={idx} className="shadow-lg overflow-hidden border-none">
                          <div className="bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 border-b border-blue-200 dark:border-blue-800/50">
                            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                              {subModule.subModuleTitle}
                            </h2>
                            <div className="flex flex-wrap gap-2 mt-2">
                              <div className="flex items-center text-sm text-gray-500">
                                <Clock className="h-4 w-4 mr-1" />
                                <span>{subModule.readingTime || "10-15 min"}</span>
                              </div>
                              
                              {subModule.tags?.map((tag, tagIdx) => (
                                <Badge 
                                  key={tagIdx}
                                  className="bg-blue-100 text-blue-800 hover:bg-blue-200 border-none"
                                >
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <CardContent className="p-6">
                            <div className="prose max-w-none dark:prose-invert">
                              <CustomMarkdownRenderer markdown={subModule.article} />
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </motion.div>
                )}
              </TabsContent>
              
              <TabsContent value="videos" className="m-0 mt-2">
                {learningResource.videoUrls && learningResource.videoUrls.length > 0 ? (
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
                              Video Lecture {index + 1}: {module.title} 
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 text-sm">
                              Comprehensive video tutorial covering key concepts and practical demonstrations for this module.
                            </p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="p-12 text-center">
                    <p className="text-gray-500">No video content available for this module.</p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="quizzes" className="m-0 mt-2">
                {learningResource.quizzes && learningResource.quizzes.length > 0 ? (
                  <div className="space-y-6">
                    {learningResource.quizzes.map((quiz, index) => (
                      <Card key={index} className="shadow-lg overflow-hidden border-none">
                        <div className="bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-purple-900/20 dark:to-indigo-900/20 p-6 border-b border-purple-200 dark:border-purple-800/50">
                          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                            <HelpCircle className="h-6 w-6 text-purple-600" />
                            {quiz.quizTitle}
                          </h2>
                          <p className="text-gray-600 dark:text-gray-400 mt-2">
                            {quiz.description}
                          </p>
                          <div className="flex flex-wrap gap-2 mt-3">
                            <Badge className="bg-purple-100 text-purple-800 border-none">
                              {quiz.difficulty || "Mixed"}
                            </Badge>
                            <Badge className="bg-blue-100 text-blue-800 border-none">
                              {quiz.timeLimit || "10 minutes"}
                            </Badge>
                            <Badge className="bg-green-100 text-green-800 border-none">
                              Passing: {quiz.passingScore || 60}%
                            </Badge>
                          </div>
                        </div>
                        <CardContent className="p-6">
                          <p className="text-gray-700 dark:text-gray-300 mb-4">
                            This quiz contains {quiz.questions?.length || 0} questions to test your understanding of the module content.
                          </p>
                          <Button 
                            className="bg-purple-600 hover:bg-purple-700"
                            onClick={() => handleOpenQuiz(quiz)}
                          >
                            <PlayCircle className="mr-2 h-4 w-4" />
                            Take Quiz
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="p-12 text-center">
                    <p className="text-gray-500">No quizzes available for this module.</p>
                  </div>
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
                                  <ExternalLink className="h-5 w-5" />
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
                      onClick={() => {
                        setQuizAnswers({});
                        setQuizSubmitted(false);
                        setPassedQuiz(false);
                        setQuizScore(0);
                      }}
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