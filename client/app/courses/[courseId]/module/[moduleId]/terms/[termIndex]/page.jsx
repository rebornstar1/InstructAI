"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ChevronLeft,
  BookOpen,
  PlayCircle, 
  HelpCircle,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  FileText,
  BookmarkCheck
} from "lucide-react";

// Import our components

import CustomMarkdownRenderer from "@/components/ui/CustomMarkdownRenderer";

import UpdatedArticleProgressTracker from "../../../components/ArticleProgressTracker";
import UpdatedVideoProgressTracker from "../../../components/VideoProgressTracker";
import UpdatedEnhancedQuiz from "../../../components/EnhancedQuiz";
import useTermController from "@/services/useTermController";

// Import API functions
import { fetchModule } from "@/services/api";
import { getModuleProgress } from "@/services/progressApi";

export default function TermDetailPage({ params }) {
  const { courseId, moduleId, termIndex } = params;
  const [activeContent, setActiveContent] = useState("article");
  const [isLoading, setIsLoading] = useState(true);
  const [module, setModule] = useState(null);
  const router = useRouter();
  
  // Parse termIndex as number
  const currentTermIndex = parseInt(termIndex, 10);
  
  // Use term controller hook
  const termController = useTermController(moduleId);

  // Load module and term data
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        
        // Load module data
        const moduleData = await fetchModule(moduleId);
        setModule(moduleData);
        
        // Set active term in controller
        await termController.setActiveTerm(moduleId, currentTermIndex);
        
        // Load module progress
        await getModuleProgress(moduleId);
      } catch (error) {
        console.error("Error loading term data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (moduleId && termIndex !== undefined) {
      loadData();
    }
  }, [moduleId, termIndex]);

  // Navigate back to module page
  const navigateToModule = () => {
    router.push(`/courses/${courseId}/module/${moduleId}`);
  };

  // Navigate to next or previous term
  const navigateToTerm = (index) => {
    router.push(`/courses/${courseId}/module/${moduleId}/terms/${index}`);
  };

  // Handle resource completion
  const handleResourceComplete = async (moduleId, termIndex, resourceType, score = null) => {
    try {
      if (resourceType === "quiz" && score !== null) {
        // Complete quiz with score
        await termController.completeQuiz(moduleId, termIndex, module.quizzes[termIndex].id, score);
      } else {
        // Complete other resource types
        await termController.completeResource(moduleId, termIndex, resourceType);
      }
    } catch (error) {
      console.error(`Error completing ${resourceType}:`, error);
    }
  };

  // Handle generating content for a term
  const handleGenerateContent = async () => {
    try {
      await termController.generateTermContent(moduleId, currentTermIndex);
    } catch (error) {
      console.error("Error generating term content:", error);
    }
  };

  // Helper to convert YouTube watch URL to embed URL
  const convertToEmbedUrl = (url) => {
    if (!url) return "";
    
    // If it's already an embed URL, return it
    if (url.includes('embed')) {
      return url;
    }
    
    // Convert regular watch URL to embed URL
    return url.replace("watch?v=", "embed/");
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Get current term content
  const termContent = termController.termContent;
  
  // Get next and previous term data
  const availableTerms = termController.terms || [];
  const previousTerm = availableTerms.find(t => t.termIndex === currentTermIndex - 1 && t.unlocked);
  const nextTerm = availableTerms.find(t => t.termIndex === currentTermIndex + 1 && t.unlocked);
  
  // Current term data
  const currentTerm = availableTerms.find(t => t.termIndex === currentTermIndex);
  
  // Check completion status
  const isArticleCompleted = currentTerm?.articleCompleted || false;
  const isVideoCompleted = currentTerm?.videoCompleted || false;
  const isQuizCompleted = currentTerm?.quizCompleted || false;
  const allCompleted = isArticleCompleted && 
    (isVideoCompleted || !termContent?.videoUrl) && 
    (isQuizCompleted || !termContent?.quiz);
  
  // If term not found
  if (!currentTerm) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h1 className="text-2xl font-bold mb-4">Term not found</h1>
        <Button onClick={navigateToModule}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Module
        </Button>
      </div>
    );
  }

  // If need to generate content
  if (!termContent && !termController.isGenerating) {
    return (
      <div className="min-h-screen flex flex-col">
        {/* Top navigation bar */}
        <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 py-4 px-6 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={navigateToModule}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Module
            </Button>
            
            <div className="flex items-center">
              <Badge className="mr-2 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-none">
                Term {currentTermIndex + 1}
              </Badge>
              <h1 className="text-xl font-bold text-gray-800 dark:text-gray-200">
                {currentTerm.term}
              </h1>
            </div>
            
            <div className="w-[88px]"></div> {/* Placeholder for balance */}
          </div>
        </div>
        
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center max-w-md">
            <div className="bg-blue-100 dark:bg-blue-900/20 p-6 rounded-full inline-flex mb-6">
              <BookOpen className="h-12 w-12 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-200">
              Generate Learning Content
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Generate comprehensive learning materials for "{currentTerm.term}", including an interactive article, 
              quiz, and supporting video content.
            </p>
            <Button 
              onClick={handleGenerateContent} 
              className="bg-blue-600 hover:bg-blue-700 text-white"
              size="lg"
            >
              Generate Content
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // If generating content
  if (termController.isGenerating) {
    return (
      <div className="min-h-screen flex flex-col">
        {/* Top navigation bar */}
        <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 py-4 px-6 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={navigateToModule}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Module
            </Button>
            
            <div className="flex items-center">
              <Badge className="mr-2 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-none">
              Term {currentTermIndex + 1}
              </Badge>
              <h1 className="text-xl font-bold text-gray-800 dark:text-gray-200">
                {currentTerm.term}
              </h1>
            </div>
            
            <div className="w-[88px]"></div> {/* Placeholder for balance */}
          </div>
        </div>
        
        <div className="flex-1 flex items-center justify-center p-8">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center justify-center py-20 text-center space-y-4"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-blue-600/20 rounded-full blur-2xl opacity-70"></div>
              <div className="relative">
                <div className="h-16 w-16 animate-spin text-blue-600 border-4 border-blue-600 border-t-transparent rounded-full"></div>
              </div>
            </div>
            <div className="max-w-md">
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">
                Generating learning materials
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                We're creating comprehensive content for "{currentTerm.term}". This may take a moment as we personalize 
                materials for your learning.
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
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Top navigation bar */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 py-4 px-6 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={navigateToModule}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Module
          </Button>
          
          <div className="flex items-center">
            <Badge className="mr-2 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-none">
              Term {currentTermIndex + 1}
            </Badge>
            <h1 className="text-xl font-bold text-gray-800 dark:text-gray-200">
              {currentTerm.term}
            </h1>
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => previousTerm && navigateToTerm(previousTerm.termIndex)}
              disabled={!previousTerm}
              className="h-9 px-3"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <Button 
              variant="outline" 
              onClick={() => nextTerm && navigateToTerm(nextTerm.termIndex)}
              disabled={!nextTerm}
              className="h-9 px-3"
            >
              Next
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>
      
      {/* Content navigation tabs */}
      <div className="container mx-auto px-4 py-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6 p-1 inline-flex">
          <Button 
            variant={activeContent === "article" ? "default" : "ghost"}
            onClick={() => setActiveContent("article")}
            className={`gap-2 ${activeContent === "article" ? "" : "text-gray-600 dark:text-gray-400"}`}
          >
            <FileText className="h-4 w-4" />
            Article
            {isArticleCompleted && <CheckCircle className="h-3 w-3 text-green-500" />}
          </Button>
          
          {termContent?.videoUrl && (
            <Button 
              variant={activeContent === "video" ? "default" : "ghost"}
              onClick={() => setActiveContent("video")}
              className={`gap-2 ${activeContent === "video" ? "" : "text-gray-600 dark:text-gray-400"}`}
            >
              <PlayCircle className="h-4 w-4" />
              Video
              {isVideoCompleted && <CheckCircle className="h-3 w-3 text-green-500" />}
            </Button>
          )}
          
          {termContent?.quiz && (
            <Button 
              variant={activeContent === "quiz" ? "default" : "ghost"}
              onClick={() => setActiveContent("quiz")}
              className={`gap-2 ${activeContent === "quiz" ? "" : "text-gray-600 dark:text-gray-400"}`}
            >
              <HelpCircle className="h-4 w-4" />
              Quiz
              {isQuizCompleted && <CheckCircle className="h-3 w-3 text-green-500" />}
            </Button>
          )}
        </div>
        
        {/* Progress bar */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
          <div className="flex items-center justify-between mb-2 text-sm text-gray-500 dark:text-gray-400">
            <span>Term Progress</span>
            <div className="flex items-center gap-2">
              {isArticleCompleted ? (
                <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-none">
                  <FileText className="h-3 w-3 mr-1" />
                  Article: Complete
                </Badge>
              ) : (
                <Badge className="bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border-none">
                  <FileText className="h-3 w-3 mr-1" />
                  Article
                </Badge>
              )}
              
              {termContent?.videoUrl && (
                isVideoCompleted ? (
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-none">
                    <PlayCircle className="h-3 w-3 mr-1" />
                    Video: Complete
                  </Badge>
                ) : (
                  <Badge className="bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border-none">
                    <PlayCircle className="h-3 w-3 mr-1" />
                    Video
                  </Badge>
                )
              )}
              
              {termContent?.quiz && (
                isQuizCompleted ? (
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-none">
                    <HelpCircle className="h-3 w-3 mr-1" />
                    Quiz: Complete
                  </Badge>
                ) : (
                  <Badge className="bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border-none">
                    <HelpCircle className="h-3 w-3 mr-1" />
                    Quiz
                  </Badge>
                )
              )}
            </div>
          </div>
          
          {/* Calculate progress percentage */}
          {(() => {
            let totalItems = 1; // Article is always there
            let completedItems = isArticleCompleted ? 1 : 0;
            
            if (termContent?.videoUrl) {
              totalItems++;
              if (isVideoCompleted) completedItems++;
            }
            
            if (termContent?.quiz) {
              totalItems++;
              if (isQuizCompleted) completedItems++;
            }
            
            const progressPercentage = Math.round((completedItems / totalItems) * 100);
            
            return (
              <Progress value={progressPercentage} className="h-2" />
            );
          })()}
        </div>
      
        {/* Main content area */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <AnimatePresence mode="wait">
            {/* Article Content */}
            {activeContent === "article" && (
              <motion.div
                key="article"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                {termContent?.article && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                      {termContent.article.subModuleTitle || termContent.term}
                    </h2>
                    
                    <div className="prose max-w-none dark:prose-invert">
                      <CustomMarkdownRenderer markdown={termContent.article.article || ""} />
                    </div>
                    
                    {/* Article Progress Tracker */}
                    <UpdatedArticleProgressTracker
                      moduleId={moduleId}
                      termIndex={termContent.termIndex}
                      article={termContent.article}
                      isCompleted={isArticleCompleted}
                      resourceProgress={termContent.resourceProgress}
                      onComplete={() => {
                        handleResourceComplete(moduleId, currentTermIndex, "article");
                      }}
                    />
                  </div>
                )}
              </motion.div>
            )}
            
            {/* Video Content */}
            {activeContent === "video" && termContent?.videoUrl && (
              <motion.div
                key="video"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                    Video: {termContent.term}
                  </h2>
                  
                  <div className="aspect-video overflow-hidden rounded-lg shadow-md mb-6">
                    <iframe
                      title={`Video: ${termContent.term}`}
                      className="w-full h-full"
                      src={convertToEmbedUrl(termContent.videoUrl)}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  </div>
                  
                  <div>
                    <h3 className="text-xl font-bold mb-2 text-gray-800 dark:text-gray-200">
                      {termContent.term} - Video Explanation
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      This video provides a comprehensive explanation of {termContent.term}, 
                      demonstrating key concepts and practical applications.
                    </p>
                  </div>
                  
                  {/* Video Progress Tracker */}
                  <UpdatedVideoProgressTracker
                    moduleId={moduleId}
                    termIndex={termContent.termIndex}
                    videoUrl={termContent.videoUrl}
                    isCompleted={isVideoCompleted}
                    resourceProgress={termContent.resourceProgress}
                    onComplete={() => {
                      handleResourceComplete(moduleId, currentTermIndex, "video");
                    }}
                  />
                </div>
              </motion.div>
            )}
            
            {/* Quiz Content */}
            {activeContent === "quiz" && termContent?.quiz && (
              <motion.div
                key="quiz"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                    {termContent.quiz.quizTitle || `${termContent.term} Quiz`}
                  </h2>
                  
                  <UpdatedEnhancedQuiz
                    moduleId={moduleId}
                    termIndex={termContent.termIndex}
                    quiz={termContent.quiz}
                    isCompleted={isQuizCompleted}
                    resourceProgress={termContent.resourceProgress}
                    onComplete={(score) => {
                      handleResourceComplete(moduleId, currentTermIndex, "quiz", score);
                    }}
                    onClose={() => {
                      // Handle quiz close if needed
                    }}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* Term completion status banner */}
        {allCompleted && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mt-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 rounded-lg p-6 text-center"
          >
            <div className="inline-flex items-center justify-center p-4 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full mb-4">
              <BookmarkCheck className="h-10 w-10" />
            </div>
            <h3 className="text-2xl font-bold text-green-700 dark:text-green-400 mb-2">
              Congratulations! Term Completed
            </h3>
            <p className="text-green-600 dark:text-green-500 mb-4">
              You've successfully completed all learning materials for this term.
            </p>
            
            <div className="flex justify-center gap-4 mt-6">
              {previousTerm && (
                <Button 
                  variant="outline" 
                  onClick={() => navigateToTerm(previousTerm.termIndex)}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Previous Term
                </Button>
              )}
              
              {nextTerm ? (
                <Button 
                  onClick={() => navigateToTerm(nextTerm.termIndex)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Continue to Next Term
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button 
                  onClick={navigateToModule}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  Complete Module
                  <CheckCircle className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </motion.div>
        )}
        
        {/* Navigation footer - show if not all completed */}
        {!allCompleted && (
          <div className="flex justify-between mt-6">
            <Button 
              variant="outline" 
              onClick={() => previousTerm && navigateToTerm(previousTerm.termIndex)}
              disabled={!previousTerm}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous Term
            </Button>
            
            <Button 
              variant="outline" 
              onClick={navigateToModule}
            >
              Back to Module
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => nextTerm && navigateToTerm(nextTerm.termIndex)}
              disabled={!nextTerm}
            >
              Next Term
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}