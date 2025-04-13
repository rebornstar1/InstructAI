"use client";

import { useState, useEffect, useRef } from "react";
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
  ChevronRight,
  Lock,
  UnlockIcon,
  BookOpen as BookOpenIcon
} from "lucide-react";
import CustomMarkdownRenderer from "@/components/ui/CustomMarkdownRenderer";
import { 
  fetchModule, 
  generateTermContent
} from "@/services/api";

// Import our progress components
import ArticleProgressTracker from "../components/ArticleProgressTracker";
import VideoProgressTracker from "../components/VideoProgressTracker";
import EnhancedQuiz from "../components/EnhancedQuiz";

// Import progress API functions
import {
  getModuleProgress,
  startModule,
  completeSubmodule,
  completeQuiz,
  completeKeyTerm,
  initializeStepProgress
} from "@/services/progressApi";

export default function ModuleDetailPage({ params }) {
  const { courseId, moduleId } = params;
  const [module, setModule] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [activeKeyTerm, setActiveKeyTerm] = useState(null);
  const router = useRouter();
  const contentRef = useRef(null);
  
  // Term completion states
  const [completedTerms, setCompletedTerms] = useState({});
  const [termProgress, setTermProgress] = useState({});
  const [unlockedTerms, setUnlockedTerms] = useState([]);
  
  // Current active term and its resources
  const [termResources, setTermResources] = useState({});
  const [isGeneratingTerm, setIsGeneratingTerm] = useState(false);
  
  // Article Modal State
  const [showArticleModal, setShowArticleModal] = useState(false);
  const [activeArticle, setActiveArticle] = useState({ title: "", content: "" });

  // Quiz Modal & related states
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [activeQuiz, setActiveQuiz] = useState(null);

  // Progress tracking state
  const [moduleProgress, setModuleProgress] = useState(null);
  const [completedArticles, setCompletedArticles] = useState({});
  const [completedVideos, setCompletedVideos] = useState({});
  const [quizzesTaken, setQuizzesTaken] = useState({});

  // Load module data and progress
 // Update to ModuleDetailPage useEffect for loading module data

 useEffect(() => {
  const loadModule = async () => {
    try {
      setIsLoading(true);
      
      // Fetch module data
      const moduleData = await fetchModule(moduleId);
      setModule(moduleData);

      console.log("moduleData", moduleData);
      
      // Initialize step progress tracking for this module
      try {
        // First initialize the step progress tracker
        
        // Then fetch module progress data
        const progress = await getModuleProgress(moduleId);
        setModuleProgress(progress);

        // Set up initial unlocked terms (first term + any completed terms)
        const initialUnlocked = progress?.unlockedTerms || [0]; // At minimum, unlock the first term
        setUnlockedTerms(initialUnlocked);
        
        // Set up completed terms tracking
        const completed = {};
        if (progress?.completedTerms) {
          progress.completedTerms.forEach(termIndex => {
            completed[termIndex] = true;
          });
        }
        setCompletedTerms(completed);
        
        // If progress has active term data, load it
        let activeTermIndex = 0; // Default to first term
        
        if (progress?.activeTerm !== undefined && progress.activeTerm !== null) {
          activeTermIndex = progress.activeTerm;
          
          // Load resources for the active term if available in progress
          if (progress.termResources && progress.termResources[progress.activeTerm]) {
            setTermResources({
              ...progress.termResources[progress.activeTerm],
              index: progress.activeTerm
            });
            // Set active tab to content to show it immediately
            setActiveTab("content");
          }
        }
        
        setActiveKeyTerm(activeTermIndex);
        
        // Auto-load content if it exists for the active term
        // Check if the module has existing content for this term
        if (moduleData.subModules && moduleData.subModules.length > activeTermIndex && moduleData.subModules[activeTermIndex]) {
          
            const existingSubModule = moduleData.subModules[activeTermIndex];
          
            // Find corresponding quiz if it exists
            const correspondingQuiz = moduleData.quizzes && moduleData.quizzes.length > activeTermIndex ? 
            moduleData.quizzes[activeTermIndex] : null;

            const correspondingVideo = moduleData.videoUrls && moduleData.videoUrls.length > activeTermIndex ? 
            moduleData.videoUrls[activeTermIndex] : null;
          
          // Create a data structure similar to what generateTermContent would return
          const existingData = {
            index: activeTermIndex,
            subModule: existingSubModule,
            subModuleId: existingSubModule.id,
            quiz: correspondingQuiz,
            quizId: correspondingQuiz ? correspondingQuiz.id : null,
            videoUrl: correspondingVideo
          };
          
          // Update term resources with existing data
          setTermResources(existingData);
          
          // Update progress tracking
          setTermProgress(prev => ({
            ...prev,
            [activeTermIndex]: {
              ...prev[activeTermIndex],
              generated: true,
              subModuleId: existingSubModule.id,
              quizId: correspondingQuiz ? correspondingQuiz.id : null
            }
          }));
          
          console.log("Auto-loaded existing content for term:", moduleData.keyTerms[activeTermIndex]);
          
          // Set active tab to content to show the loaded content immediately
          setActiveTab("content");
        }
        
        // If module is not started yet, start it now
        if (!progress || progress.state === "UNLOCKED") {
          startModule(moduleId);
        }
      } catch (error) {
        console.error("Error initializing step progress or fetching module progress:", error);
        // Default to first term if no progress data
        setActiveKeyTerm(0);
        setUnlockedTerms([0]);
        
        // Still try to auto-load content for first term if available
        if (moduleData.subModules && moduleData.subModules.length > 0 && moduleData.subModules[0]) {
          const existingSubModule = moduleData.subModules[0];
          
          // Find corresponding quiz if it exists
          const correspondingQuiz = moduleData.quizzes && moduleData.quizzes.length > 0 ? 
            moduleData.quizzes[0] : null;
          
          // Create a data structure similar to what generateTermContent would return
          const existingData = {
            index: 0,
            subModule: existingSubModule,
            subModuleId: existingSubModule.id,
            quiz: correspondingQuiz,
            quizId: correspondingQuiz ? correspondingQuiz.id : null
          };
          
          // Update term resources with existing data
          setTermResources(existingData);
          
          // Update progress tracking
          setTermProgress(prev => ({
            ...prev,
            [0]: {
              ...prev[0],
              generated: true,
              subModuleId: existingSubModule.id,
              quizId: correspondingQuiz ? correspondingQuiz.id : null
            }
          }));
          
          console.log("Auto-loaded existing content for first term");
          
          // Set active tab to content to show the loaded content immediately
          setActiveTab("content");
        }
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

  const handleGenerateTermContent = async (termIndex) => {
    if (!module || !module.keyTerms || termIndex >= module.keyTerms.length) return;
    
    const term = module.keyTerms[termIndex];
    const definition = module.definitions[termIndex];
    
    setIsGeneratingTerm(true);
    setActiveKeyTerm(termIndex);
    
    try {
      // Check if there's already a submodule for this term
      if (module.subModules && module.subModules.length > termIndex && module.subModules[termIndex]) {
        // Use existing content instead of generating new content
        const existingSubModule = module.subModules[termIndex];
        
        // Find corresponding quiz if it exists
        const correspondingQuiz = module.quizzes && module.quizzes.length > termIndex ? 
          module.quizzes[termIndex] : null;

          const correspondingVideo = module.videoUrls && module.videoUrls.length > termIndex ? 
          module.videoUrls[termIndex] : null;
        
        // Create a data structure similar to what generateTermContent would return
        const existingData = {
          index: termIndex,
          subModule: existingSubModule,
          subModuleId: existingSubModule.id,
          quiz: correspondingQuiz,
          quizId: correspondingQuiz ? correspondingQuiz.id : null,
          videoUrl: correspondingVideo // Add the video URL
        };
        
        
        // Update term resources with existing data
        setTermResources(existingData);
        
        // Update progress tracking
        setTermProgress(prev => ({
          ...prev,
          [termIndex]: {
            ...prev[termIndex],
            generated: true,
            subModuleId: existingSubModule.id,
            quizId: correspondingQuiz ? correspondingQuiz.id : null
          }
        }));
        
        // Track that this term's resources have been used
        updateModuleProgressAfterGeneration(termIndex, existingSubModule.id, correspondingQuiz ? correspondingQuiz.id : null);
        
        toast({
          title: "Content Loaded",
          description: `Existing learning materials for "${term}" have been loaded.`,
          variant: "success",
        });
        
        console.log("Used existing content for term:", term);
        
      } else {
        // No existing content found, generate new content
        const request = {
          term: term,
          definition: definition,
          moduleId: module.id,
          contextTitle: module.title,
          saveContent: true
        };
  
        // Generate term resources
        const data = await generateTermContent(request);
  
        await initializeStepProgress(moduleId);
        console.log("Step progress initialized for module:", moduleId);
        
        if (data) {
          // Store the submodule ID and quiz ID with the term resources
          const enhancedTermResources = {
            ...data,
            index: termIndex,
            subModule: {
              ...data.subModule,
              id: data.subModuleId || `${termIndex}` // Use returned ID or fallback
            },
            quiz: data.quiz ? {
              ...data.quiz,
              id: data.quizId || `${termIndex}` // Use returned ID or fallback
            } : null
          };
          
          // Update term resources with enhanced data that includes IDs
          setTermResources(enhancedTermResources);
          
          // Log the ID values for debugging
          console.log("Term resources updated with IDs:", {
            subModuleId: data.subModuleId,
            quizId: data.quizId
          });
          
          // Update progress tracking
          setTermProgress(prev => ({
            ...prev,
            [termIndex]: {
              ...prev[termIndex],
              generated: true,
              subModuleId: data.subModuleId, // Store the submodule ID in progress state
              quizId: data.quizId // Store the quiz ID in progress state
            }
          }));
          
          // Track that this term's resources have been generated
          updateModuleProgressAfterGeneration(termIndex, data.subModuleId, data.quizId);
          
          toast({
            title: "Content Generated",
            description: `Learning materials for "${term}" have been created.`,
            variant: "success",
          });
        }
      }
    } catch (error) {
      console.error("Error handling term content:", error);
      toast({
        title: "Error",
        description: "Failed to handle learning materials. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingTerm(false);
    }
  };

  const updateModuleProgressAfterGeneration = async (termIndex, subModuleId, quizId) => {
    // In a real implementation, this would likely call an API to update the backend
    console.log(`Generated resources for term at index ${termIndex} with subModuleId: ${subModuleId}, quizId: ${quizId}`);
    
    // For demo purposes, we'll simulate the progress update
    const updatedProgress = { ...termProgress };
    updatedProgress[termIndex] = {
      ...updatedProgress[termIndex],
      generated: true,
      subModuleId: subModuleId,
      quizId: quizId
    };
    setTermProgress(updatedProgress);
  };

  const handleKeyTermClick = async (termIndex) => {
    // Can't click locked terms
    if (unlockedTerms.indexOf(termIndex) === -1) {
      toast({
        title: "Term Locked",
        description: "Complete the previous term to unlock this one.",
        variant: "warning",
      });
      return;
    }
    
    setActiveKeyTerm(termIndex);
    
    // Check if term resources already exist
    const termHasResources = termProgress[termIndex]?.generated || 
                             (termResources?.index === termIndex && termResources?.subModule);
    
    // If no resources exist, check if module has existing content for this term
    if (!termHasResources) {
      // Check if there's already a submodule for this term in the module data
      if (module.subModules && module.subModules.length > termIndex && module.subModules[termIndex]) {
        // Use existing content 
        const existingSubModule = module.subModules[termIndex];
        
        // Find corresponding quiz if it exists
        const correspondingQuiz = module.quizzes && module.quizzes.length > termIndex ? 
          module.quizzes[termIndex] : null;
        
        // Create a data structure similar to what generateTermContent would return
        const existingData = {
          index: termIndex,
          subModule: existingSubModule,
          subModuleId: existingSubModule.id,
          quiz: correspondingQuiz,
          quizId: correspondingQuiz ? correspondingQuiz.id : null
        };
        
        // Update term resources with existing data
        setTermResources(existingData);
        
        // Update progress tracking
        setTermProgress(prev => ({
          ...prev,
          [termIndex]: {
            ...prev[termIndex],
            generated: true,
            subModuleId: existingSubModule.id,
            quizId: correspondingQuiz ? correspondingQuiz.id : null
          }
        }));
        
        // Track that this term's resources have been used
        updateModuleProgressAfterGeneration(termIndex, existingSubModule.id, correspondingQuiz ? correspondingQuiz.id : null);
        
        // Set active tab to content to show the loaded content immediately
        setActiveTab("content");
        
        toast({
          title: "Content Loaded",
          description: `Existing learning materials for "${module.keyTerms[termIndex]}" have been loaded.`,
          variant: "success",
        });
        
        console.log("Used existing content for term:", module.keyTerms[termIndex]);
      } else {
        // No pre-existing content found, generate new content
        handleGenerateTermContent(termIndex);
      }
    } else {
      // If resources exist but aren't loaded, load them
      console.log(`Loading resources for term at index ${termIndex}`);
      
      // Set active tab to content when changing terms
      setActiveTab("content");
    }
  };

  const handleTermCompletion = async (termIndex) => {
    // In a real app, this would call the API to mark the term as completed
    try {
      // Simulate API call
      await completeKeyTerm(module.id, termIndex);
      
      // Mark the term as completed
      setCompletedTerms(prev => ({
        ...prev,
        [termIndex]: true
      }));
      
      // Unlock the next term (if it exists)
      const nextTermIndex = termIndex + 1;
      if (nextTermIndex < module.keyTerms.length && !unlockedTerms.includes(nextTermIndex)) {
        setUnlockedTerms(prev => [...prev, nextTermIndex]);
        
        toast({
          title: "Term Completed!",
          description: `You've completed "${module.keyTerms[termIndex]}" and unlocked the next term.`,
          variant: "success",
        });
      } else {
        toast({
          title: "Term Completed!",
          description: `You've completed "${module.keyTerms[termIndex]}".`,
          variant: "success",
        });
      }
      
      // If this was the last term, update module progress
      if (nextTermIndex >= module.keyTerms.length) {
        console.log("idhar Hora hai update chizze");
        updateModuleProgress();
      }
      
      // Automatically move to the next term if it exists
      if (nextTermIndex < module.keyTerms.length) {
        handleKeyTermClick(nextTermIndex);
      }
    } catch (error) {
      console.error("Error completing term:", error);
      toast({
        title: "Error",
        description: "Failed to update progress. Please try again.",
        variant: "destructive",
      });
    }
  };

  const updateModuleProgress = () => {
    // In a real app, this would call the API to update the module progress
    setModuleProgress(prev => ({
      ...prev,
      progressPercentage: 100,
      state: "COMPLETED",
      earnedXP: prev.earnedXP + 50
    }));
    
    toast({
      title: "Module Completed!",
      description: "Congratulations! You've completed all terms in this module.",
      variant: "success",
    });
  };

  // Progress tracking handlers
  const handleArticleProgressUpdate = (subModuleId, progressData) => {
    // Update local state
    setCompletedArticles(prev => ({
      ...prev,
      [subModuleId]: true
    }));
    
    // Update module progress
    if (progressData) {
      setModuleProgress(progressData);
    }

    // Check if all resources for this term are completed
    checkTermCompletion();

    toast({
      title: "Progress Updated",
      description: "Your progress has been saved",
    });
  };

  const handleVideoProgressUpdate = (videoId, progressData) => {
    // Update local state
    setCompletedVideos(prev => ({
      ...prev,
      [videoId]: true
    }));
    
    // Update module progress
    if (progressData) {
      setModuleProgress(progressData);
    }

    // Check if all resources for this term are completed
    checkTermCompletion();

    toast({
      title: "Video Completed",
      description: "Your progress has been saved",
    });
  };

  const handleQuizProgressUpdate = (quizId, progressData) => {
    // Update local state
    setQuizzesTaken(prev => ({
      ...prev,
      [quizId]: true
    }));
    
    // Update module progress
    if (progressData) {
      setModuleProgress(progressData);
    }

    // Check if all resources for this term are completed
    checkTermCompletion();

    setShowQuizModal(false);
  };

  const checkTermCompletion = () => {    
    if (!termResources || termResources.index !== activeKeyTerm) return;
    
    const currentSubModule = termResources.subModule;
    const currentQuiz = termResources.quiz;
    const hasVideo = !!termResources.videoUrl;
    
    if (!currentSubModule) return;
    
    const subModuleId = currentSubModule.id || `${activeKeyTerm}`;
    const quizId = currentQuiz?.id || `${activeKeyTerm}`;
    const videoId = hasVideo ? `${activeKeyTerm}` : null;
    
    const isArticleCompleted = completedArticles[subModuleId];
    const isQuizCompleted = !currentQuiz || quizzesTaken[quizId];
    const isVideoCompleted = !hasVideo || completedVideos[videoId];

    console.log("isArticleCompleted", isArticleCompleted);
    console.log("isQuizCompleted",isQuizCompleted);
    console.log("isVideoCompleted",isVideoCompleted);
    
    if (isArticleCompleted && isQuizCompleted && isVideoCompleted) {
      // All required components are completed - mark term as complete
      if (!completedTerms[activeKeyTerm]) {
        handleTermCompletion(activeKeyTerm);
      }
    }
  };

  // Article handling functions
  const handleOpenArticle = (subModule) => {
    setActiveArticle({ 
      title: subModule.subModuleTitle, 
      content: subModule.article,
      id: subModule.id || `${activeKeyTerm}`
    });
    setShowArticleModal(true);
  };

  // Quiz handling functions
  const handleOpenQuiz = (quiz) => {
    setActiveQuiz({
      ...quiz,
      id: quiz.id || `${activeKeyTerm}`
    });
    setShowQuizModal(true);
  };

  const handleCloseQuizModal = () => {
    setShowQuizModal(false);
    setActiveQuiz(null);
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

  // Calculate progress percentage
  const calculateModuleProgress = () => {
    if (!module || !module.keyTerms) return 0;
    
    const totalTerms = module.keyTerms.length;
    const completedCount = Object.keys(completedTerms).length;
    
    return Math.round((completedCount / totalTerms) * 100);
  };

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

  // Determine progress stats
  const moduleState = moduleProgress ? moduleProgress.state : "UNLOCKED";
  const progressPercentage = moduleProgress ? moduleProgress.progressPercentage : calculateModuleProgress();
  const earnedXP = moduleProgress ? moduleProgress.earnedXP : 0;

  // Get current term data
  const currentTermTitle = module.keyTerms && activeKeyTerm !== null ? 
    module.keyTerms[activeKeyTerm] : "Key Term";
  const currentTermDefinition = module.definitions && activeKeyTerm !== null ? 
    module.definitions[activeKeyTerm] : "";

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
          
          <Badge className={`
            ${moduleState === "COMPLETED" ? "bg-green-100 text-green-800 dark:bg-green-800/30 dark:text-green-400" : 
              moduleState === "IN_PROGRESS" ? "bg-blue-100 text-blue-800 dark:bg-blue-800/30 dark:text-blue-400" :
              "bg-yellow-100 text-yellow-800 dark:bg-yellow-800/30 dark:text-yellow-400"}
            border-none
          `}>
{moduleState && moduleState.replace("_", " ")}

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

      {/* Module Content */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Left Sidebar */}
        <div className="md:col-span-1 space-y-4">
          <Card className="border-none shadow-md overflow-hidden">
            <div className="p-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
              <h2 className="font-bold text-xl">Key Terms</h2>
            </div>
            
            <div className="divide-y divide-gray-100">
              {module.keyTerms && module.keyTerms.map((term, index) => {
                const isUnlocked = unlockedTerms.includes(index);
                const isCompleted = completedTerms[index];
                const isActive = activeKeyTerm === index;
                
                return (
                  <button
                    key={index}
                    className={`w-full px-4 py-3 flex items-center justify-between text-left transition-colors ${
                      isActive 
                        ? "bg-blue-50 text-blue-700"
                        : isCompleted
                        ? "bg-green-50 text-green-700 hover:bg-green-100"
                        : !isUnlocked
                        ? "bg-gray-50 text-gray-400 cursor-not-allowed"
                        : "hover:bg-gray-50 text-gray-700"
                    }`}
                    onClick={() => isUnlocked && handleKeyTermClick(index)}
                    disabled={!isUnlocked}
                  >
                    <div className="flex items-center gap-2">
                      {isCompleted ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : !isUnlocked ? (
                        <Lock className="h-4 w-4 text-gray-400" />
                      ) : (
                        <BookOpenIcon className="h-4 w-4" />
                      )}
                      <span className={!isUnlocked ? "text-gray-400" : ""}>
                        {term}
                      </span>
                    </div>
                    {isActive && (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>
                );
              })}
            </div>
          </Card>
          
          {/* Current Term Info Card */}
          {activeKeyTerm !== null && module.keyTerms && (
            <Card className="border-none shadow-md overflow-hidden">
              <CardContent className="p-0">
                <div className="p-4 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20">
                  <h3 className="font-bold text-lg text-gray-800 dark:text-gray-200">Current Term</h3>
                  <h4 className="font-semibold text-blue-700 dark:text-blue-400">{currentTermTitle}</h4>
                </div>
                <div className="p-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {currentTermDefinition}
                  </p>
                  
                  {isGeneratingTerm ? (
                    <div className="mt-3 flex justify-center">
                      <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                    </div>
                  ) : !termResources?.subModule ? (
                    <Button 
                      onClick={() => handleGenerateTermContent(activeKeyTerm)} 
                      className="w-full mt-3 bg-blue-600 hover:bg-blue-700"
                    >
                      <Brain className="h-4 w-4 mr-2" />
                      Generate Content
                    </Button>
                  ) : completedTerms[activeKeyTerm] ? (
                    <Badge className="w-full justify-center mt-3 bg-green-100 text-green-800 py-1">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Completed
                    </Badge>
                  ) : (
                    <div className="space-y-2 mt-3">
                      <Button
                        variant="outline"
                        className="w-full justify-between"
                        onClick={() => setActiveTab("content")}
                      >
                        <span className="flex items-center">
                          <FileText className="h-4 w-4 mr-2" />
                          View Content
                        </span>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Module Navigation Card */}
          <Card className="border-none shadow-md overflow-hidden">
            <div className="p-4 bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-900/50 dark:to-gray-800/50 border-b border-gray-200 dark:border-gray-700">
              <h2 className="font-bold text-lg text-gray-800 dark:text-gray-200">Navigation</h2>
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
                {activeTab === "overview" && (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
              
              {termResources && termResources.subModule && (
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
                  
                  {termResources.videoUrl && (
                    <button
                      className={`w-full px-4 py-3 flex items-center justify-between text-left transition-colors ${
                        activeTab === "video" 
                          ? "bg-blue-50 text-blue-700"
                          : "hover:bg-gray-50 text-gray-700"
                      }`}
                      onClick={() => setActiveTab("video")}
                    >
                      <div className="flex items-center gap-2">
                        <PlayCircle className="h-4 w-4" />
                        <span>Video Lecture</span>
                      </div>
                      {activeTab === "video" && (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                  )}
                  
                  {termResources.quiz && (
                    <button
                      className={`w-full px-4 py-3 flex items-center justify-between text-left transition-colors ${
                        activeTab === "quiz" 
                          ? "bg-blue-50 text-blue-700"
                          : "hover:bg-gray-50 text-gray-700"
                      }`}
                      onClick={() => setActiveTab("quiz")}
                    >
                      <div className="flex items-center gap-2">
                        <HelpCircle className="h-4 w-4" />
                        <span>Knowledge Check</span>
                      </div>
                      {activeTab === "quiz" && (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                  )}
                </>
              )}
            </div>
          </Card>
        </div>
        
        {/* Main Content Area */}
        <div className="md:col-span-3">
          {/* Loading State */}
          {isGeneratingTerm && (
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
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">Generating learning materials</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  We're creating comprehensive content for "{currentTermTitle}". This may take a moment as we personalize materials for your learning.
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

          {/* No Generated Content Yet - Show only if no term is being generated */}
          {!isGeneratingTerm && activeKeyTerm !== null && module.keyTerms && 
           (!termResources || !termResources.subModule) && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card className="border-none shadow-lg overflow-hidden">
                <div className="aspect-video bg-gradient-to-br from-blue-600 to-indigo-800 relative overflow-hidden">
                  <div className="absolute inset-0 bg-[url('/path/to/pattern.svg')] opacity-10"></div>
                  
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-8 text-center">
                    <div className="p-4 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 mb-6">
                      <Brain className="h-16 w-16 text-white" />
                    </div>
                    <h2 className="text-3xl font-bold mb-4">Learn About {currentTermTitle}</h2>
                    <p className="max-w-xl text-white/80 mb-8">
                      Generate comprehensive learning materials for this key term, including detailed 
                      article, quiz, and supporting video content.
                    </p>
                    <Button 
                      onClick={() => handleGenerateTermContent(activeKeyTerm)} 
                      className="bg-white text-blue-700 hover:bg-white/90 hover:text-blue-800 shadow-lg px-8 py-6"
                    >
                      <Sparkles className="h-5 w-5 mr-2" />
                      Generate Term Resources
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
                        In-Depth Article
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400 text-sm">
                        Comprehensive explanation with detailed examples
                      </p>
                    </div>
                    
                    <div className="flex flex-col items-center p-6 text-center">
                      <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl mb-4">
                        <PlayCircle className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <h3 className="font-bold text-lg mb-2 text-gray-800 dark:text-gray-200">
                        Video Resource
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400 text-sm">
                        Visual explanations to enhance understanding
                      </p>
                    </div>
                    
                    <div className="flex flex-col items-center p-6 text-center">
                      <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-2xl mb-4">
                        <HelpCircle className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                      </div>
                      <h3 className="font-bold text-lg mb-2 text-gray-800 dark:text-gray-200">
                        Knowledge Check
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400 text-sm">
                        Interactive quiz to test your understanding
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800">
                    <h3 className="font-bold text-lg mb-4 text-gray-800 dark:text-gray-200">Key Term Definition</h3>
                    <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-lg border border-blue-100 dark:border-blue-800/50">
                      <p className="text-gray-700 dark:text-gray-300">{currentTermDefinition}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Content Tabs */}
          {termResources && termResources.subModule && (
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
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Module Structure Card */}
                  {module.keyTerms && module.keyTerms.length > 0 && (
                    <Card className="shadow-lg overflow-hidden border-none">
                      <div className="bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-900/50 dark:to-gray-800/50 p-6 border-b border-gray-200 dark:border-gray-700">
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                          <Layers className="h-6 w-6 text-blue-600" />
                          Key Terms
                        </h2>
                      </div>
                      <CardContent className="p-6">
                        <div className="space-y-4">
                          {module.keyTerms.map((term, idx) => {
                            const isUnlocked = unlockedTerms.includes(idx);
                            const isCompleted = completedTerms[idx];
                            
                            return (
                              <div 
                                key={idx} 
                                className={`flex gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border ${
                                  isCompleted 
                                    ? "border-green-200 dark:border-green-800" 
                                    : !isUnlocked
                                    ? "border-gray-200 dark:border-gray-700 opacity-75"
                                    : "border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-700"
                                } transition-colors`}
                              >
                                <div className={`mt-1 h-8 w-8 flex items-center justify-center rounded-full ${
                                  isCompleted
                                    ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                                    : !isUnlocked
                                    ? "bg-gray-100 dark:bg-gray-900/30 text-gray-400 dark:text-gray-600"
                                    : "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" 
                                } font-medium`}>
                                  {isCompleted ? <CheckCircle className="h-5 w-5" /> : 
                                    !isUnlocked ? <Lock className="h-5 w-5" /> : idx + 1}
                                </div>
                                <div className="flex-1">
                                  <h3 className={`font-bold text-lg ${
                                    !isUnlocked 
                                      ? "text-gray-400 dark:text-gray-600" 
                                      : "text-gray-800 dark:text-gray-200"
                                  } mb-1`}>
                                    {term}
                                  </h3>
                                  <p className={`${
                                    !isUnlocked 
                                      ? "text-gray-400 dark:text-gray-600" 
                                      : "text-gray-600 dark:text-gray-400"
                                  } text-sm line-clamp-2`}>
                                    {module.definitions[idx]}
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
                                  </div>
                                </div>
                                
                                <Button 
                                  variant="ghost" 
                                  onClick={() => isUnlocked && handleKeyTermClick(idx)}
                                  disabled={!isUnlocked}
                                  className={`shrink-0 h-8 w-8 p-0 rounded-full ${
                                    !isUnlocked 
                                      ? "text-gray-300 cursor-not-allowed" 
                                      : "text-gray-500 hover:text-blue-600 hover:bg-blue-50"
                                  }`}
                                  aria-label={`View term: ${term}`}
                                >
                                  <ChevronRight className="h-4 w-4" />
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </motion.div>
              </TabsContent>
              
              <TabsContent value="content" className="m-0 mt-2">
                <Card className="shadow-lg overflow-hidden border-none">
                  <div className="bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 border-b border-blue-200 dark:border-blue-800/50 sticky top-0 z-10">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                      <FileTextIcon className="h-6 w-6 text-blue-600" />
                      {termResources?.subModule?.subModuleTitle || currentTermTitle}
                    </h2>
                  </div>
                  <CardContent className="p-6">
                    <div className="prose max-w-none dark:prose-invert">
                      <CustomMarkdownRenderer markdown={termResources?.subModule?.article || ""} />
                    </div>
                    
                    {/* Add Article Progress Tracker */}
                    {termResources?.subModule && (
                      <ArticleProgressTracker
                        moduleId={module.id}
                        subModule={{ 
                          subModuleTitle: termResources.subModule.subModuleTitle, 
                          id: termResources.subModule.id || `${activeKeyTerm}` 
                        }}
                        isCompleted={completedArticles[termResources.subModule.id || `${activeKeyTerm}`]}
                        onProgressUpdate={(progressData) => handleArticleProgressUpdate(
                          termResources.subModule.id || `${activeKeyTerm}`, 
                          progressData
                        )}
                      />
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="video" className="m-0 mt-2">
                {termResources?.videoUrl ? (
                  <Card className="shadow-lg overflow-hidden border-none">
                    <div className="bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900/20 dark:to-purple-900/20 p-6 border-b border-indigo-200 dark:border-indigo-800/50">
                      <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                        <PlayCircle className="h-6 w-6 text-indigo-600" />
                        Video Lecture: {currentTermTitle}
                      </h2>
                    </div>
                    <CardContent className="p-6">
                      <div className="space-y-6">
                        <div className="aspect-video overflow-hidden rounded-lg shadow-md">
                          <iframe
                            title={`Video Lecture: ${currentTermTitle}`}
                            className="w-full h-full"
                            src={convertToEmbedUrl(termResources.videoUrl)}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          ></iframe>
                        </div>
                        
                        <div>
                          <h3 className="text-xl font-bold mb-2 text-gray-800 dark:text-gray-200">
                            {currentTermTitle} - Video Explanation
                          </h3>
                          <p className="text-gray-600 dark:text-gray-400">
                            This video provides a comprehensive explanation of {currentTermTitle}, 
                            demonstrating key concepts and practical applications.
                          </p>
                        </div>
                        
                        {/* Video Progress Tracker */}
                        <VideoProgressTracker
                          moduleId={module.id}
                          videoIndex={activeKeyTerm}
                          videoUrl={termResources.videoUrl}
                          isCompleted={completedVideos[`${activeKeyTerm}`]}
                          onProgressUpdate={(progressData) => handleVideoProgressUpdate(
                            `${activeKeyTerm}`, 
                            progressData
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="p-12 text-center">
                    <p className="text-gray-500">No video content available for this term.</p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="quiz" className="m-0 mt-2">
                {termResources?.quiz ? (
                  <Card className="shadow-lg overflow-hidden border-none">
                    <div className="bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-purple-900/20 dark:to-indigo-900/20 p-6 border-b border-purple-200 dark:border-purple-800/50">
                      <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                        <HelpCircle className="h-6 w-6 text-purple-600" />
                        {termResources.quiz.quizTitle || `${currentTermTitle} Quiz`}
                      </h2>
                    </div>
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <p className="text-gray-700 dark:text-gray-300">
                          {termResources.quiz.description || 
                            `Test your understanding of ${currentTermTitle} with this knowledge check.`}
                        </p>
                        
                        <div className="flex flex-wrap gap-3">
                          <Badge className="bg-purple-100 text-purple-800 border-none">
                            {termResources.quiz.difficulty || "Intermediate"}
                          </Badge>
                          <Badge className="bg-blue-100 text-blue-800 border-none">
                            {termResources.quiz.timeLimit || "5 minutes"}
                          </Badge>
                          <Badge className="bg-green-100 text-green-800 border-none">
                            Passing: {termResources.quiz.passingScore || 70}%
                          </Badge>
                          
                          {quizzesTaken[termResources.quiz.id || `${activeKeyTerm}`] && (
                            <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-none">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Completed
                            </Badge>
                          )}
                        </div>
                        
                        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                          <h3 className="font-bold text-lg mb-2 text-gray-800 dark:text-gray-200">Quiz Details</h3>
                          <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                            <li className="flex items-start gap-2">
                              <div className="mt-1 text-purple-600">•</div>
                              <span>{termResources.quiz.questions?.length || 5} multiple-choice questions</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <div className="mt-1 text-purple-600">•</div>
                              <span>Comprehensive explanations for each answer</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <div className="mt-1 text-purple-600">•</div>
                              <span>Tests understanding of various aspects of {currentTermTitle}</span>
                            </li>
                          </ul>
                        </div>
                        
                        <Button 
                          className={quizzesTaken[termResources.quiz.id || `${activeKeyTerm}`] 
                            ? "bg-green-600 hover:bg-green-700" 
                            : "bg-purple-600 hover:bg-purple-700"
                          }
                          onClick={() => handleOpenQuiz(termResources.quiz)}
                        >
                          {quizzesTaken[termResources.quiz.id || `${activeKeyTerm}`] ? (
                            <>
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Retake Quiz
                            </>
                          ) : (
                            <>
                              <PlayCircle className="mr-2 h-4 w-4" />
                              Take Quiz
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="p-12 text-center">
                    <p className="text-gray-500">No quiz available for this term.</p>
                  </div>
                )}
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
                
                {/* Add Article Progress Tracker in modal */}
                {activeArticle && activeArticle.id && (
                  <ArticleProgressTracker
                    moduleId={module.id}
                    subModule={{ subModuleTitle: activeArticle.title, id: activeArticle.id }}
                    isCompleted={completedArticles[activeArticle.id]}
                    onProgressUpdate={(progressData) => {
                      handleArticleProgressUpdate(activeArticle.id, progressData);
                      setShowArticleModal(false);
                    }}
                  />
                )}
              </div>
            </div>
            
            <div className="sticky bottom-0 bg-white dark:bg-gray-900 px-6 py-4 border-t border-gray-200 dark:border-gray-800 flex justify-between">
              <Button variant="outline" onClick={() => setShowArticleModal(false)}>
                Close
              </Button>
              <Button 
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => {
                  handleArticleProgressUpdate(activeArticle.id, null);
                  setShowArticleModal(false);
                }}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark as Completed
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
                {/* Use EnhancedQuiz component */}
                <EnhancedQuiz 
                  moduleId={module.id} 
                  quiz={activeQuiz} 
                  onClose={handleCloseQuizModal}
                  onProgressUpdate={(progressData) => handleQuizProgressUpdate(activeQuiz.id, progressData)}
                />
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
      <Toaster />
    </div>
  );
}