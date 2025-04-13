"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/use-toast";
import { Toaster } from "@/components/ui/toaster";
import {
  BookOpen,
  ChevronLeft,
  Info,
  Clock,
  Award,
  CheckCircle,
  UnlockIcon
} from "lucide-react";
import { Lock } from "lucide-react";

// Import our custom components
import CustomMarkdownRenderer from "../../../../../components/ui/CustomMarkdownRenderer";
import TermsList from "../components/TermsList";
import TermContent from "../components/TermContent";
import useTermController from "@/services/useTermController";

// Import API functions
import { fetchModule } from "@/services/api";
import { getModuleProgress, startModule } from "@/services/progressApi";

export default function ModuleDetailPage({ params }) {
  const { courseId, moduleId } = params;
  const [module, setModule] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("terms");
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
        
        // Fetch module data
        const moduleData = await fetchModule(moduleId);
        setModule(moduleData);
        
        // Initialize progress
        try {
          // First start the module if not already started
          await startModule(moduleId);
          
          // Fetch module progress
          const progress = await getModuleProgress(moduleId);
          setModuleProgress(progress);
        } catch (error) {
          console.error("Error initializing progress:", error);
        }
      } catch (error) {
        console.error("Error loading module:", error);
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
  
  // Handle term selection from the term list
  const handleTermSelect = async (termIndex) => {
    try {
      // Set active term and load its content
      const success = await termController.setActiveTerm(moduleId, termIndex);
      
      if (success) {
        // Switch to the content tab
        setActiveTab("content");
      }
    } catch (error) {
      console.error("Error selecting term:", error);
    }
  };
  
  // Handle resource completion
  const handleResourceComplete = async (moduleId, termIndex, resourceType, score = null) => {
    try {
      if (resourceType === "quiz" && score !== null) {
        // Complete quiz with score
        console.log(termController.termContent,"termController.termContent");
        await termController.completeQuiz(moduleId, termIndex, module.quizzes[termIndex].id, score);
      } else {
        // Complete other resource types
        await termController.completeResource(moduleId, termIndex, resourceType);
      }
      
      // Refresh module progress after completion
      const progress = await getModuleProgress(moduleId);
      setModuleProgress(progress);
    } catch (error) {
      console.error(`Error completing ${resourceType}:`, error);
    }
  };
  
  // Handle generating content for a term
  const handleGenerateContent = async () => {
    try {
      const success = await termController.generateTermContent(
        moduleId,
        termController.activeTermIndex
      );
      
      if (success) {
        // Refresh module progress after generation
        const progress = await getModuleProgress(moduleId);
        setModuleProgress(progress);
      }
    } catch (error) {
      console.error("Error generating term content:", error);
    }
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
        <div className="flex items-center gap-3 mb-4">
          <Badge className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0">
            Module {module.moduleId}
          </Badge>
          
          <Badge className={`
            ${moduleState === "COMPLETED" ? "bg-green-100 text-green-800 dark:bg-green-800/30 dark:text-green-400" : 
              moduleState === "IN_PROGRESS" ? "bg-blue-100 text-blue-800 dark:bg-blue-800/30 dark:text-blue-400" :
              "bg-yellow-100 text-yellow-800 dark:bg-yellow-800/30 dark:text-yellow-400"}
            border-none
          `}>
            {moduleState.replace("_", " ")}
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
          
          <div className="h-1 w-1 bg-gray-300 rounded-full"></div>
          <div className="flex items-center gap-1">
            <Award className="h-4 w-4 text-purple-500" />
            <span className="text-purple-600 font-medium">{earnedXP} XP</span>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="mt-6">
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
            <span>Progress</span>
            <span>{progressPercentage}%</span>
          </div>
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full ${
                moduleState === "COMPLETED" 
                  ? "bg-green-500 dark:bg-green-600" 
                  : "bg-blue-500 dark:bg-blue-600"
              }`}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      </motion.div>
      
      {/* Module Content Tabs */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        {/* Left sidebar with module navigation and key terms */}
        <div className="md:col-span-1 space-y-4">
          {/* Module Navigation */}
          <Card className="border-none shadow-md overflow-hidden">
            <div className="p-4 bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-900/50 dark:to-gray-800/50 border-b border-gray-200 dark:border-gray-700">
              <h2 className="font-bold text-lg text-gray-800 dark:text-gray-200">Module Navigation</h2>
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
                  <span>Module Overview</span>
                </div>
                {activeTab === "overview" && <ChevronLeft className="h-4 w-4" />}
              </button>
              
              <button
                className={`w-full px-4 py-3 flex items-center justify-between text-left transition-colors ${
                  activeTab === "terms" 
                    ? "bg-blue-50 text-blue-700"
                    : "hover:bg-gray-50 text-gray-700"
                }`}
                onClick={() => setActiveTab("terms")}
              >
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  <span>Key Terms</span>
                </div>
                {activeTab === "terms" && <ChevronLeft className="h-4 w-4" />}
              </button>
              
              <button
                className={`w-full px-4 py-3 flex items-center justify-between text-left transition-colors ${
                  activeTab === "content" 
                    ? "bg-blue-50 text-blue-700"
                    : "hover:bg-gray-50 text-gray-700"
                }`}
                onClick={() => setActiveTab("content")}
                disabled={!termController.termContent}
              >
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  <span>Term Content</span>
                </div>
                {activeTab === "content" && <ChevronLeft className="h-4 w-4" />}
              </button>
            </div>
          </Card>
          
          {/* Key Terms List */}
          <TermsList 
            terms={termController.terms}
            activeTermIndex={termController.activeTermIndex}
            onTermSelect={handleTermSelect}
          />
        </div>
        
        {/* Main content area */}
        <div className="md:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            {/* Overview Tab */}
            <TabsContent value="overview" className="m-0 mt-2">
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
                    <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-200">Module Description</h3>
                    <p className="text-gray-700 dark:text-gray-300">
                      {module.description}
                    </p>
                    
                    {module.content && (
                      <div className="mt-6">
                        <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-200">Module Content</h3>
                        <CustomMarkdownRenderer markdown={module.content} />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Key Terms Tab */}
            <TabsContent value="terms" className="m-0 mt-2">
              <Card className="shadow-lg overflow-hidden border-none">
                <div className="bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 border-b border-blue-200 dark:border-blue-800/50">
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                    <BookOpen className="h-6 w-6 text-blue-600" />
                    Key Terms
                  </h2>
                </div>
                <CardContent className="p-6">
                  <div className="space-y-6">
                    <p className="text-gray-600 dark:text-gray-400">
                      This module covers the following key terms. Click on a term to view its detailed content.
                    </p>
                    
                    <div className="grid grid-cols-1 gap-4">
                      {termController.terms.map((term) => {
                        const isUnlocked = term.unlocked;
                        const isCompleted = term.completed;
                        const isActive = termController.activeTermIndex === term.termIndex;
                        
                        return (
                          <div 
                            key={term.termIndex} 
                            className={`flex gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border ${
                              isCompleted 
                                ? "border-green-200 dark:border-green-800" 
                                : !isUnlocked
                                ? "border-gray-200 dark:border-gray-700 opacity-75"
                                : "border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-700"
                            } transition-colors cursor-pointer`}
                            onClick={() => isUnlocked && handleTermSelect(term.termIndex)}
                          >
                            <div className={`mt-1 h-8 w-8 flex items-center justify-center rounded-full ${
                              isCompleted
                                ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                                : !isUnlocked
                                ? "bg-gray-100 dark:bg-gray-900/30 text-gray-400 dark:text-gray-600"
                                : "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" 
                            } font-medium`}>
                              {isCompleted ? <CheckCircle className="h-5 w-5" /> : 
                                !isUnlocked ? <Lock className="h-5 w-5" /> : term.termIndex + 1}
                            </div>
                            <div className="flex-1">
                            <h3 className={`font-bold text-lg ${
                                !isUnlocked 
                                  ? "text-gray-400 dark:text-gray-600" 
                                  : "text-gray-800 dark:text-gray-200"
                              } mb-1`}>
                                {term.term}
                              </h3>
                              <p className={`${
                                !isUnlocked 
                                  ? "text-gray-400 dark:text-gray-600" 
                                  : "text-gray-600 dark:text-gray-400"
                              } text-sm line-clamp-2`}>
                                {term.definition}
                              </p>
                              
                              <div className="flex flex-wrap gap-2 mt-3">
                                {isCompleted && (
                                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-none">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Completed
                                  </Badge>
                                )}
                                
                                {!isUnlocked && (
                                  <Badge className="bg-gray-100 text-gray-600 dark:bg-gray-800/50 dark:text-gray-400 border-none">
                                    <Lock className="h-3 w-3 mr-1" />
                                    Locked
                                  </Badge>
                                )}
                                
                                {isUnlocked && !isCompleted && (
                                  <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-none">
                                    <UnlockIcon className="h-3 w-3 mr-1" />
                                    Unlocked
                                  </Badge>
                                )}
                                
                                {isActive && (
                                  <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 border-none">
                                    Current
                                  </Badge>
                                )}
                              </div>
                              
                              {/* Resource progress indicators */}
                              {isUnlocked && (
                                <div className="flex gap-2 mt-2">
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
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Term Content Tab */}
            <TabsContent value="content" className="m-0 mt-2">
              <TermContent
                moduleId={moduleId}
                termContent={termController.termContent}
                onResourceComplete={handleResourceComplete}
                isGenerating={termController.isGenerating}
                onGenerateContent={handleGenerateContent}
              />
            </TabsContent>
          </Tabs>
        </div>
      </motion.div>
      
      <Toaster />
    </div>
  );
}