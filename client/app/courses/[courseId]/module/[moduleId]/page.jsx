"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/components/ui/use-toast";
import { Toaster } from "@/components/ui/toaster";
import {
  BookOpen,
  ChevronLeft,
  Info,
  Clock,
  Award,
  CheckCircle,
  ArrowRight,
  Lock,
  Unlock,
  BookmarkCheck,
  Star
} from "lucide-react";

// Import our custom components
import CustomMarkdownRenderer from "@/components/ui/CustomMarkdownRenderer";
import useTermController from "@/services/useTermController";

// Import API functions
import { fetchModule } from "@/services/api";
import { getModuleProgress, startModule } from "@/services/progressApi";

export default function ModuleDetailPage({ params }) {
  const { courseId, moduleId } = params;
  const [module, setModule] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  
  // Use our term controller hook
  const termController = useTermController(moduleId);
  
  // Module progress state
  const [moduleProgress, setModuleProgress] = useState(null);
  
  // Load module data and initialize progress
  useEffect(() => {
    const loadModule = async () => {
      try {
        setIsLoading(true);
        
        // Since the module has already been started in navigateToModule,
        // we can focus on fetching the data we need
        
        // Step 1: Get the latest module progress
        const progress = await getModuleProgress(moduleId);
        setModuleProgress(progress);
        console.log("Module progress loaded:", progress);
        
        // Step 2: Fetch the module data
        const moduleData = await fetchModule(moduleId);
        setModule(moduleData);
        console.log("Module data loaded:", moduleData);
        
        // Verify we have key terms
        if (!moduleData.keyTerms || moduleData.keyTerms.length === 0) {
          console.warn("Module doesn't have key terms - check course generation");
        } else {
          console.log(`Module has ${moduleData.keyTerms.length} key terms available`);
        }
        
        // Double-check term unlock status
        if (progress && !progress.unlockedTerms?.includes(0)) {
          console.warn("First term not showing as unlocked - may need to restart module");
          
          // Optional: Force restart the module if first term isn't unlocked
          // This serves as a fallback mechanism
          try {
            console.log("Attempting to ensure module is properly started...");
            await startModule(moduleId);
            const refreshedProgress = await getModuleProgress(moduleId);
            setModuleProgress(refreshedProgress);
          } catch (restartError) {
            console.error("Error restarting module:", restartError);
          }
        }
      } catch (error) {
        console.error("Error loading module data:", error);
        toast({
          title: "Error",
          description: "Failed to load module data. Please try again.",
          variant: "destructive",
        });
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

  // Navigate to term detail page
  const navigateToTerm = (termIndex) => {
    router.push(`/courses/${courseId}/module/${moduleId}/terms/${termIndex}`);
  };
  
  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  // Error state
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
  
  // Calculate progress percentage
  const progressPercentage = moduleProgress ? moduleProgress.progressPercentage : 0;
  const moduleState = moduleProgress ? moduleProgress.state : "UNLOCKED";
  const earnedXP = moduleProgress ? moduleProgress.earnedXP : 0;
  
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

  // Count completed terms
  const completedTerms = termController.terms ? 
    termController.terms.filter(term => term.completed).length : 0;
  
  // Total terms
  const totalTerms = termController.terms ? termController.terms.length : 0;
  
  return (
    <div className="container mx-auto px-4 py-8">
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
        {/* Module Header */}
        <div className="relative overflow-hidden rounded-xl mb-10">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-800 opacity-90"></div>
          <div className="absolute inset-0 bg-[url('/path/to/pattern.svg')] opacity-10"></div>
          
          <div className="relative z-10 p-8 text-white">
            <div className="flex flex-col md:flex-row gap-6 items-center">
              <div className="h-20 w-20 bg-white/20 backdrop-blur-xl rounded-xl flex items-center justify-center border border-white/30">
                <BookOpen className="h-10 w-10 text-white" />
              </div>
              
              <div className="flex-1 text-center md:text-left">
                <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2">
                  <Badge className="bg-white/20 text-white border-none backdrop-blur-sm self-center md:self-start">
                    Module {module.moduleId}
                  </Badge>
                  
                  <Badge className={`backdrop-blur-sm self-center md:self-start ${
                    moduleState === "COMPLETED" 
                      ? "bg-green-500/20 text-white border-none"
                      : "bg-blue-500/20 text-white border-none"
                  }`}>
                    {moduleState.replace("_", " ")}
                  </Badge>
                </div>
                
                <h1 className="text-3xl font-bold mb-2">
                  {module.title}
                </h1>
                
                <p className="text-white/80 mb-4 max-w-3xl">
                  {module.description}
                </p>
                
                <div className="flex flex-wrap items-center gap-4 mt-2 text-sm">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{module.duration || "1-2 hours"}</span>
                  </div>
                  
                  {module.complexityLevel && (
                    <>
                      <div className="h-1 w-1 bg-white/30 rounded-full"></div>
                      <div className="flex items-center gap-1">
                        <Badge className="bg-white/20 text-white border-none">
                          {module.complexityLevel}
                        </Badge>
                      </div>
                    </>
                  )}
                  
                  <div className="h-1 w-1 bg-white/30 rounded-full"></div>
                  <div className="flex items-center gap-1">
                    <Award className="h-4 w-4 text-yellow-300" />
                    <span>{earnedXP} XP</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="mt-6">
              <div className="flex justify-between text-sm mb-2">
                <span>Progress</span>
                <span>{progressPercentage}%</span>
              </div>
              <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${
                    moduleState === "COMPLETED" 
                      ? "bg-green-500" 
                      : "bg-white"
                  }`}
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              
              <div className="mt-2 text-sm text-white/80 text-center">
                {completedTerms} of {totalTerms} terms completed
              </div>
            </div>
          </div>
        </div>

        {/* Module Overview */}
        <Card className="mb-8 border-none shadow-lg overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-100 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-b border-blue-200 dark:border-blue-800/50">
            <CardTitle className="text-xl flex items-center gap-2">
              <Info className="h-5 w-5 text-blue-600" />
              Module Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="prose max-w-none dark:prose-invert">
              {/* Learning Objectives */}
              <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-lg border border-blue-100 dark:border-blue-800/50 mb-6">
                <h3 className="text-lg font-bold mb-2 text-gray-800 dark:text-gray-200 flex items-center gap-2">
                  Learning Objectives
                </h3>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                  {module.learningObjectives ? (
                    module.learningObjectives.map((objective, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <div className="mt-1.5 p-1 bg-blue-200 dark:bg-blue-800 rounded-full text-blue-700 dark:text-blue-300">
                          <CheckCircle className="h-3.5 w-3.5" />
                        </div>
                        <span className="text-gray-700 dark:text-gray-300">{objective}</span>
                      </li>
                    ))
                  ) : (
                    ["Master the fundamental concepts", 
                      "Apply techniques to practical scenarios",
                      "Build critical analysis skills",
                      "Develop problem-solving approaches"].map((obj, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <div className="mt-1.5 p-1 bg-blue-200 dark:bg-blue-800 rounded-full text-blue-700 dark:text-blue-300">
                          <CheckCircle className="h-3.5 w-3.5" />
                        </div>
                        <span className="text-gray-700 dark:text-gray-300">{obj}</span>
                      </li>
                    ))
                  )}
                </ul>
              </div>
              
              {/* Module content if available */}
              {module.content && (
                <div className="mt-6">
                  <CustomMarkdownRenderer markdown={module.content} />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Key Terms Section */}
        <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-200 flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-blue-600" />
          Key Terms
        </h2>
        
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          This module covers the following key terms. Click on a term to begin studying its content.
        </p>

        <div className="grid grid-cols-1 gap-4">
          {termController.terms.map((term) => {
            const isUnlocked = term.unlocked;
            const isCompleted = term.completed;
            
            return (
              <motion.div 
                key={term.termIndex}
                variants={itemVariants}
                className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border p-0 overflow-hidden ${
                  isCompleted 
                    ? "border-green-200 dark:border-green-800" 
                    : !isUnlocked
                    ? "border-gray-200 dark:border-gray-700 opacity-75"
                    : "border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-700"
                } transition-all`}
              >
                <div className="flex flex-col md:flex-row md:items-center">
                  {/* Term status indicator */}
                  <div className={`w-full md:w-2 h-2 md:h-full ${
                    isCompleted
                      ? "bg-green-500" 
                      : isUnlocked
                      ? "bg-blue-500"
                      : "bg-gray-300 dark:bg-gray-700"
                  }`}></div>
                  
                  <div className="p-6 flex-1">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={`${
                            isCompleted
                              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                              : !isUnlocked
                              ? "bg-gray-100 text-gray-800 dark:bg-gray-800/50 dark:text-gray-400"
                              : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                          } border-none`}>
                            Term {term.termIndex + 1}
                          </Badge>
                          
                          {/* Term status badge */}
                          {isCompleted ? (
                            <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-none">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Completed
                            </Badge>
                          ) : !isUnlocked ? (
                            <Badge className="bg-gray-100 text-gray-600 dark:bg-gray-800/50 dark:text-gray-400 border-none">
                              <Lock className="h-3 w-3 mr-1" />
                              Locked
                            </Badge>
                          ) : (
                            <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-none">
                              <Unlock className="h-3 w-3 mr-1" />
                              Available
                            </Badge>
                          )}
                        </div>
                        
                        <h3 className={`text-xl font-bold ${
                          !isUnlocked 
                            ? "text-gray-400 dark:text-gray-600" 
                            : "text-gray-800 dark:text-gray-200"
                        } mb-2`}>
                          {term.term}
                        </h3>
                        
                        <p className={`${
                          !isUnlocked 
                            ? "text-gray-400 dark:text-gray-600" 
                            : "text-gray-600 dark:text-gray-400"
                        }`}>
                          {term.definition}
                        </p>
                        
                        {/* Resource indicators */}
                        {isUnlocked && (
                          <div className="flex gap-2 mt-4">
                            {term.articleAvailable && (
                              <Badge variant="outline" className={term.articleCompleted 
                                ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/10 dark:text-green-400 dark:border-green-800/50" 
                                : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700"}>
                                Article {term.articleCompleted ? "✓" : ""}
                              </Badge>
                            )}
                            
                            {term.videoAvailable && (
                              <Badge variant="outline" className={term.videoCompleted 
                                ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/10 dark:text-green-400 dark:border-green-800/50" 
                                : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700"}>
                                Video {term.videoCompleted ? "✓" : ""}
                              </Badge>
                            )}
                            
                            {term.quizAvailable && (
                              <Badge variant="outline" className={term.quizCompleted 
                                ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/10 dark:text-green-400 dark:border-green-800/50" 
                                : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700"}>
                                Quiz {term.quizCompleted ? "✓" : ""}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {/* Start/Continue Learning button */}
                      <div className="flex justify-end">
                        <Button
                          onClick={() => isUnlocked && navigateToTerm(term.termIndex)}
                          disabled={!isUnlocked}
                          className={`${
                            isCompleted 
                              ? "bg-green-600 hover:bg-green-700" 
                              : !isUnlocked
                              ? "bg-gray-300 dark:bg-gray-700 cursor-not-allowed"
                              : "bg-blue-600 hover:bg-blue-700"
                          } text-white`}
                        >
                          {isCompleted ? (
                            <>
                              <BookmarkCheck className="h-4 w-4 mr-2" />
                              Review
                            </>
                          ) : !isUnlocked ? (
                            <>
                              <Lock className="h-4 w-4 mr-2" />
                              Locked
                            </>
                          ) : (
                            <>
                              <ArrowRight className="h-4 w-4 mr-2" />
                              Start Learning
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Module completion status */}
        {moduleState === "COMPLETED" && (
          <div className="mt-8 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 rounded-lg p-6 text-center">
            <div className="inline-flex items-center justify-center p-4 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full mb-4">
              <Star className="h-10 w-10" />
            </div>
            <h3 className="text-2xl font-bold text-green-700 dark:text-green-400 mb-2">
              Congratulations! Module Completed
            </h3>
            <p className="text-green-600 dark:text-green-500 mb-4">
              You've successfully completed all learning materials for this module.
            </p>
            <div className="flex justify-center gap-3">
              <Badge className="px-3 py-1 text-sm bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-none">
                <Star className="h-3.5 w-3.5 mr-1" />
                {earnedXP} XP Earned
              </Badge>
            </div>
          </div>
        )}
      </motion.div>
      
      <Toaster />
    </div>
  );
}