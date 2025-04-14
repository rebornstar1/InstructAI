"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/components/ui/use-toast";
import { Toaster } from "@/components/ui/toaster";
import {
  ChevronLeft,
  BookOpen,
  PlayCircle,
  HelpCircle,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  FileText,
  BookmarkCheck,
  Info,
  Clock,
  Award,
  Lock,
  Unlock,
  Star
} from "lucide-react";

import CustomMarkdownRenderer from "@/components/ui/CustomMarkdownRenderer";
import UpdatedArticleProgressTracker from "../../../components/ArticleProgressTracker";
import UpdatedVideoProgressTracker from "../../../components/VideoProgressTracker";
import UpdatedEnhancedQuiz from "../../../components/EnhancedQuiz";
import useTermController from "@/services/useTermController";

import { fetchModule } from "@/services/api";
import { getModuleProgress } from "@/services/progressApi";

export default function TermDetailPage({ params }) {
  const { courseId, moduleId, termIndex } = params;
  const [activeContent, setActiveContent] = useState("article");
  const [isLoading, setIsLoading] = useState(true);
  const [module, setModule] = useState(null);
  const router = useRouter();
  const isGeneratingRef = useRef(false); // Track generation to prevent duplicates

  const currentTermIndex = parseInt(termIndex, 10);
  const termController = useTermController(moduleId);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        setIsLoading(true);

        // Load module data
        const moduleData = await fetchModule(moduleId);
        if (!isMounted) return;
        setModule(moduleData);
        console.log("moduleData", moduleData);

        // Set active term in controller
        await termController.setActiveTerm(moduleId, currentTermIndex);
        if (!isMounted) return;

        // Load module progress
        await getModuleProgress(moduleId);
      } catch (error) {
        console.error("Error loading term data:", error);
        toast({
          title: "Error",
          description: "Failed to load term data. Please try again.",
          variant: "destructive",
        });
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    if (moduleId && termIndex !== undefined) {
      loadData();
    }

    return () => {
      isMounted = false;
    };
  }, [moduleId, currentTermIndex]);

  const navigateToModule = () => {
    router.push(`/courses/${courseId}/module/${moduleId}`);
  };

  const navigateToTerm = (index) => {
    router.push(`/courses/${courseId}/module/${moduleId}/terms/${index}`);
  };

  const handleResourceComplete = async (
    moduleId,
    termIndex,
    resourceType,
    score = null
  ) => {
    try {
      if (resourceType === "quiz" && score !== null) {
        await termController.completeQuiz(
          moduleId,
          termIndex,
          module.quizzes[termIndex].id,
          score
        );
        toast({
          title: "Quiz completed!",
          description: `You scored ${score}%. Great job!`,
          variant: "success",
        });
      } else {
        await termController.completeResource(moduleId, termIndex, resourceType);
        toast({
          title: `${resourceType.charAt(0).toUpperCase() + resourceType.slice(1)} completed!`,
          description: "Your progress has been saved.",
          variant: "success",
        });
      }
    } catch (error) {
      console.error(`Error completing ${resourceType}:`, error);
      toast({
        title: "Error",
        description: `Failed to record ${resourceType} completion.`,
        variant: "destructive",
      });
    }
  };

  const handleGenerateContent = async () => {
    if (isGeneratingRef.current) {
      console.log("Content generation already in progress, skipping...");
      return;
    }

    isGeneratingRef.current = true;
    try {
      toast({
        title: "Generating content",
        description: "Please wait while we prepare your learning materials...",
      });
      console.log(
        `Generating content for moduleId: ${moduleId}, termIndex: ${currentTermIndex}`
      );
      await termController.generateTermContent(moduleId, currentTermIndex);
    } catch (error) {
      console.error("Error generating term content:", error);
      toast({
        title: "Error",
        description: "Failed to generate content. Please try again.",
        variant: "destructive",
      });
    } finally {
      isGeneratingRef.current = false;
    }
  };

  const convertToEmbedUrl = (url) => {
    if (!url) return "";
    if (url.includes("embed")) {
      return url;
    }
    return url.replace("watch?v=", "embed/");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="relative">
          <div className="absolute inset-0 bg-blue-600/20 rounded-full blur-2xl opacity-70"></div>
          <div className="relative">
            <div className="h-16 w-16 animate-spin text-blue-600 border-4 border-blue-600 border-t-transparent rounded-full"></div>
          </div>
        </div>
      </div>
    );
  }

  const termContent = termController.termContent;
  const availableTerms = termController.terms || [];
  const previousTerm = availableTerms.find(
    (t) => t.termIndex === currentTermIndex - 1 && t.unlocked
  );
  const nextTerm = availableTerms.find(
    (t) => t.termIndex === currentTermIndex + 1 && t.unlocked
  );
  const currentTerm = availableTerms.find(
    (t) => t.termIndex === currentTermIndex
  );

  const isArticleCompleted = currentTerm?.articleCompleted || false;
  const isVideoCompleted = currentTerm?.videoCompleted || false;
  const isQuizCompleted = currentTerm?.quizCompleted || false;
  const allCompleted =
    isArticleCompleted &&
    (isVideoCompleted || !termContent?.videoUrl) &&
    (isQuizCompleted || !termContent?.quiz);

  if (!currentTerm) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-2xl font-bold mb-4">Term not found</h1>
          <Button onClick={navigateToModule}>
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Module
          </Button>
        </motion.div>
      </div>
    );
  }

  if (!termContent && !termController.isGenerating) {
    return (
      <div className="min-h-screen flex flex-col">
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
            <div className="w-[88px]"></div>
          </div>
        </div>
        <div className="container mx-auto flex-1 flex items-center justify-center p-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-md"
          >
            <div className="bg-blue-100 dark:bg-blue-900/20 p-6 rounded-full inline-flex mb-6">
              <BookOpen className="h-12 w-12 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-200">
              Generate Learning Content
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Generate comprehensive learning materials for "{currentTerm.term}",
              including an interactive article, quiz, and supporting video content.
            </p>
            <Button
              onClick={handleGenerateContent}
              className="bg-blue-600 hover:bg-blue-700 text-white"
              size="lg"
              disabled={isGeneratingRef.current}
            >
              {isGeneratingRef.current
                ? "Generating..."
                : "Generate Content"}
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  if (termController.isGenerating) {
    return (
      <div className="min-h-screen flex flex-col">
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
            <div className="w-[88px]"></div>
          </div>
        </div>
        <div className="container mx-auto flex-1 flex items-center justify-center p-8">
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
                We're creating comprehensive content for "{currentTerm.term}".
                This may take a moment as we personalize materials for your
                learning.
              </p>
            </div>
            <div className="w-full max-w-md mt-4">
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-600"
                  initial={{ width: "10%" }}
                  animate={{ width: ["10%", "30%", "50%", "70%", "90%"] }}
                  transition={{
                    duration: 3,
                    ease: "easeInOut",
                    repeat: Infinity,
                    repeatType: "reverse",
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
              onClick={() =>
                previousTerm && navigateToTerm(previousTerm.termIndex)
              }
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
      
      <div className="container mx-auto px-4 py-6">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          
          {/* Content Navigation Tabs */}
          <motion.div variants={itemVariants} className="mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-1 inline-flex">
              <Button
                variant={activeContent === "article" ? "default" : "ghost"}
                onClick={() => setActiveContent("article")}
                className={`gap-2 ${
                  activeContent === "article"
                    ? ""
                    : "text-gray-600 dark:text-gray-400"
                }`}
              >
                <FileText className="h-4 w-4" />
                Article
                {isArticleCompleted && (
                  <CheckCircle className="h-3 w-3 text-green-500" />
                )}
              </Button>
              {termContent?.videoUrl && (
                <Button
                  variant={activeContent === "video" ? "default" : "ghost"}
                  onClick={() => setActiveContent("video")}
                  className={`gap-2 ${
                    activeContent === "video" ? "" : "text-gray-600 dark:text-gray-400"
                  }`}
                >
                  <PlayCircle className="h-4 w-4" />
                  Video
                  {isVideoCompleted && (
                    <CheckCircle className="h-3 w-3 text-green-500" />
                  )}
                </Button>
              )}
              {termContent?.quiz && (
                <Button
                  variant={activeContent === "quiz" ? "default" : "ghost"}
                  onClick={() => setActiveContent("quiz")}
                  className={`gap-2 ${
                    activeContent === "quiz" ? "" : "text-gray-600 dark:text-gray-400"
                  }`}
                >
                  <HelpCircle className="h-4 w-4" />
                  Quiz
                  {isQuizCompleted && (
                    <CheckCircle className="h-3 w-3 text-green-500" />
                  )}
                </Button>
              )}
            </div>
          </motion.div>

          {/* Content Card */}
          <motion.div variants={itemVariants}>
            <Card className="border-none shadow-lg overflow-hidden mb-6">
              <CardHeader className={`bg-gradient-to-r ${
                activeContent === "article" 
                  ? "from-blue-100 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20" 
                  : activeContent === "video"
                  ? "from-purple-100 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20"
                  : "from-amber-100 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20"
              } border-b border-blue-200 dark:border-blue-800/50`}>
                <CardTitle className="text-xl flex items-center gap-2">
                  {activeContent === "article" ? (
                    <>
                      <FileText className="h-5 w-5 text-blue-600" />
                      Article: {termContent.term}
                    </>
                  ) : activeContent === "video" ? (
                    <>
                      <PlayCircle className="h-5 w-5 text-purple-600" />
                      Video: {termContent.term}
                    </>
                  ) : (
                    <>
                      <HelpCircle className="h-5 w-5 text-amber-600" />
                      Quiz: {termContent.quiz?.quizTitle || `${termContent.term} Quiz`}
                    </>
                  )}
                </CardTitle>
              </CardHeader>
              
              <CardContent className="p-6">
                <AnimatePresence mode="wait">
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
                          <div className="prose max-w-none dark:prose-invert">
                            <CustomMarkdownRenderer
                              markdown={termContent.article.article || ""}
                            />
                          </div>
                          <UpdatedArticleProgressTracker
                            moduleId={moduleId}
                            termIndex={termContent.termIndex}
                            article={termContent.article}
                            isCompleted={isArticleCompleted}
                            resourceProgress={termContent.resourceProgress}
                            onComplete={() => {
                              handleResourceComplete(
                                moduleId,
                                currentTermIndex,
                                "article"
                              );
                            }}
                          />
                        </div>
                      )}
                    </motion.div>
                  )}
                  {activeContent === "video" && termContent?.videoUrl && (
                    <motion.div
                      key="video"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="space-y-6">
                        <div className="aspect-video overflow-hidden rounded-lg shadow-md mb-6">
                          <iframe
                            title={`Video: ${termContent.term}`}
                            className="w-4/5 h-screen items-center justify-center"
                            src={convertToEmbedUrl(termContent.videoUrl)}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          ></iframe>
                        </div>
                        <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-lg border border-blue-100 dark:border-blue-800/50">
                          <h3 className="text-lg font-bold mb-2 text-gray-800 dark:text-gray-200 flex items-center gap-2">
                            <Info className="h-5 w-5 text-blue-600" />
                            About This Video
                          </h3>
                          <p className="text-gray-600 dark:text-gray-400">
                            This video provides a comprehensive explanation of{" "}
                            {termContent.term}, demonstrating key concepts and practical
                            applications to enhance your understanding.
                          </p>
                        </div>
                        <UpdatedVideoProgressTracker
                          moduleId={moduleId}
                          termIndex={termContent.termIndex}
                          videoUrl={termContent.videoUrl}
                          isCompleted={isVideoCompleted}
                          resourceProgress={termContent.resourceProgress}
                          onComplete={() => {
                            handleResourceComplete(
                              moduleId,
                              currentTermIndex,
                              "video"
                            );
                          }}
                        />
                      </div>
                    </motion.div>
                  )}
                  {activeContent === "quiz" && termContent?.quiz && (
                    <motion.div
                      key="quiz"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="space-y-6">
                        <div className="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-lg border border-amber-100 dark:border-amber-800/50 mb-4">
                          <h3 className="text-lg font-bold mb-2 text-gray-800 dark:text-gray-200 flex items-center gap-2">
                            <Info className="h-5 w-5 text-amber-600" />
                            Quiz Instructions
                          </h3>
                          <p className="text-gray-600 dark:text-gray-400">
                            Test your knowledge of {termContent.term} with this quiz. 
                            Select the best answer for each question and submit when complete.
                          </p>
                        </div>
                        <UpdatedEnhancedQuiz
                          moduleId={moduleId}
                          termIndex={termContent.termIndex}
                          quiz={termContent.quiz}
                          isCompleted={isQuizCompleted}
                          resourceProgress={termContent.resourceProgress}
                          onComplete={(score) => {
                            handleResourceComplete(
                              moduleId,
                              currentTermIndex,
                              "quiz",
                              score
                            );
                          }}
                          onClose={() => {}}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>

          {/* Completion Status */}
          {allCompleted && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mt-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 rounded-lg p-6 text-center"
            >
              <div className="inline-flex items-center justify-center p-4 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full mb-4">
                <Star className="h-10 w-10" />
              </div>
              <h3 className="text-2xl font-bold text-green-700 dark:text-green-400 mb-2">
                Congratulations! Term Completed
              </h3>
              <p className="text-green-600 dark:text-green-500 mb-4">
                You've successfully completed all learning materials for this term.
              </p>
              <div className="flex justify-center gap-3 mb-6">
                <Badge className="px-3 py-1 text-sm bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-none">
                  <Star className="h-3.5 w-3.5 mr-1" />
                  XP Earned
                </Badge>
              </div>
              <div className="flex justify-center gap-4">
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
          
          {/* Navigation Footer */}
          {!allCompleted && (
            <motion.div 
              variants={itemVariants}
              className="flex justify-between mt-6"
            >
              <Button
                variant="outline"
                onClick={() =>
                  previousTerm && navigateToTerm(previousTerm.termIndex)
                }
                disabled={!previousTerm}
                className="border-gray-200 dark:border-gray-700"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous Term
              </Button>
              <Button 
                variant="outline" 
                onClick={navigateToModule}
                className="border-gray-200 dark:border-gray-700"
              >
                Back to Module
              </Button>
              <Button
                variant="outline"
                onClick={() => nextTerm && navigateToTerm(nextTerm.termIndex)}
                disabled={!nextTerm}
                className="border-gray-200 dark:border-gray-700"
              >
                Next Term
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </motion.div>
          )}
        </motion.div>
      </div>
      
      <Toaster />
    </div>
  );
}