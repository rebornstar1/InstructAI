"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BookOpen,
  ChevronRight,
  ChevronLeft,
  Info,
  Award,
  Clock,
  Layers,
  CheckCircle,
  Star,
  Lock,
  Unlock
} from "lucide-react";
import { toast } from "@/components/ui/use-toast"; 

// Import our components and API functions
import CourseProgressCard from "../components/CourseProgressCard";
import EnrollmentModal from "../components/EnrollmentModal";
import { getCourseWithProgress, enrollInCourse } from "../../../services/progressApi";
import { extractKeyTerms, saveKeyTermsToModule } from "../../../services/KeyTermService";

export default function CourseDetailPage({ params }) {
  const { courseId } = params;
  const [course, setCourse] = useState(null);
  const [courseProgress, setCourseProgress] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        setIsLoading(true);
        
        // Try to get course with progress data using our new API service
        try {
          const enhancedData = await getCourseWithProgress(courseId);
          setCourse(enhancedData.course);
          setCourseProgress(enhancedData.courseProgress);
          
          // If course is found and has progress, check if we need to sync module progress
          if (enhancedData.course && enhancedData.courseProgress) {
            const moduleProgressMap = enhancedData.moduleProgressMap || {};
            
            // Store module progress map for use in rendering
            setCourseProgress(prev => ({
              ...prev,
              moduleProgressMap
            }));
          }
        } catch (err) {
          console.error("Error fetching progress data, falling back to basic course data:", err);
          
          // Fallback to basic course data if not logged in or other error
          const response = await fetch(`/api/courses/simplified/${courseId}`);
          
          if (!response.ok) {
            throw new Error("Failed to fetch course");
          }
          
          const data = await response.json();
          setCourse(data);
        }
      } catch (error) {
        console.error("Error fetching course:", error);
      } finally {
        setIsLoading(false);
      }
    };
  
    if (courseId) {
      fetchCourse();
    }
  }, [courseId]);
  

 // Enhanced navigateToModule function with integrated module starting

const navigateToModule = async (moduleId) => {
  try {
    // Find the module to get its data
    const module = getModules().find(m => (m.id || m.moduleId) === moduleId);
    console.log(`Preparing to navigate to module: ${module?.title || moduleId}`);
    
    // Show loading indicator
    setIsNavigating(true);
    
    // Step 1: Start the module first to ensure terms are unlocked
    console.log(`Starting module ${moduleId} before navigation...`);
    await startModule(moduleId);
    console.log(`Module ${moduleId} successfully started`);
    
    // Step 2: Get the module progress to confirm initialization
    const progress = await getModuleProgress(moduleId);
    console.log(`Module progress retrieved:`, progress);
    
    // Verify first term is unlocked
    if (!progress?.unlockedTerms?.includes(0)) {
      console.warn("Warning: First term may not be showing as unlocked!");
    } else {
      console.log("Confirmed: First term is unlocked");
    }
    
    // Step 3: Navigate to the module
    console.log(`Navigating to module ${moduleId}...`);
    router.push(`/courses/${courseId}/module/${moduleId}`);
    
  } catch (error) {
    console.error("Error preparing module for navigation:", error);
    
    // Show error message but continue navigation anyway
    toast({
      title: "Navigation Warning",
      description: "Module may not be fully prepared, but navigation will continue.",
      variant: "warning",
    });
    
    // Navigate anyway in case of error
    router.push(`/courses/${courseId}/module/${moduleId}`);
  } finally {
    // Hide loading indicator
    setIsNavigating(false);
  }
};

  const navigateBack = () => {
    router.push("/courses");
  };

  const handleEnrollSuccess = (progress) => {
    setCourseProgress(progress);
    setShowEnrollModal(false);
    setIsEnrolling(false);
  };

  const handleEnrollClick = async () => {
    try {
      setIsEnrolling(true);
      
      // Call the enrollInCourse API function
      const progressData = await enrollInCourse(courseId);
      
      // Update state with new progress data
      setCourseProgress(progressData);
      
      // Show success message
      toast({
        title: "Successfully enrolled!",
        description: "You have been enrolled in this course.",
      });
    } catch (error) {
      console.error("Error enrolling in course:", error);
      
      toast({
        title: "Enrollment failed",
        description: "There was an error enrolling in this course. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsEnrolling(false);
    }
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Course not found</h1>
        <Button onClick={navigateBack}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Courses
        </Button>
      </div>
    );
  }

  // Helper function to get course metadata from different structures
  const getCourseMetadata = (key, defaultValue = "") => {
    return course?.courseMetadata?.[key] || defaultValue;
  };

  // Helper function to get modules from different structures
  const getModules = () => {
    return course?.modules || [];
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Button 
        variant="ghost" 
        onClick={navigateBack} 
        className="mb-6"
      >
        <ChevronLeft className="mr-2 h-4 w-4" />
        Back to Courses
      </Button>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
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
                    {getCourseMetadata('difficultyLevel', 'Course')}
                  </Badge>
                  
                  {/* Add enrollment status badge if available */}
                  {courseProgress && (
                    <Badge className={`backdrop-blur-sm self-center md:self-start ${
                      courseProgress.state === "COMPLETED" 
                        ? "bg-green-500/20 hover:bg-green-500/30 text-white border-none"
                        : "bg-blue-500/20 hover:bg-blue-500/30 text-white border-none"
                    }`}>
                      {courseProgress.state === "COMPLETED" 
                        ? <CheckCircle className="h-3.5 w-3.5 mr-1" />
                        : <Star className="h-3.5 w-3.5 mr-1" />
                      }
                      {courseProgress.state.replace("_", " ")}
                    </Badge>
                  )}
                </div>
                
                <h1 className="text-3xl md:text-4xl font-bold mb-3">
                  {getCourseMetadata('title', 'Course Title')}
                </h1>
                
                <p className="text-white/80 text-lg mb-6">
                  {getCourseMetadata('description', 'Course description not available.')}
                </p>
                
                <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                  <Badge className="bg-white/10 text-white hover:bg-white/20 border-none backdrop-blur-sm px-3 py-1.5">
                    <Layers className="h-3.5 w-3.5 mr-1" />
                    {getModules().length} Modules
                  </Badge>
                  <Badge className="bg-white/10 text-white hover:bg-white/20 border-none backdrop-blur-sm px-3 py-1.5">
                    <Award className="h-3.5 w-3.5 mr-1" />
                    {getCourseMetadata('difficultyLevel', 'Mixed')}
                  </Badge>
                  
                  {/* Add XP badge if enrolled */}
                  {courseProgress && (
                    <Badge className="bg-purple-500/20 text-white hover:bg-purple-500/30 border-none backdrop-blur-sm px-3 py-1.5">
                      <Star className="h-3.5 w-3.5 mr-1" />
                      {courseProgress.earnedXP} XP
                    </Badge>
                  )}
                </div>
                
                {/* Add Enroll/Continue button */}
                {!courseProgress && (
                  <Button 
                    className="mt-6 bg-white text-blue-700 hover:bg-white/90 px-6 py-5"
                    onClick={handleEnrollClick}
                    disabled={isEnrolling}
                  >
                    {isEnrolling ? "Enrolling..." : "Enroll in Course"}
                  </Button>
                )}
                
                {courseProgress && courseProgress.state !== "COMPLETED" && (
                  <Button 
                    className="mt-6 bg-white text-blue-700 hover:bg-white/90 px-6 py-5"
                    onClick={() => {
                      if (courseProgress.lastAccessedModuleId) {
                        navigateToModule(courseProgress.lastAccessedModuleId);
                      } else {
                        // Navigate to first module if no last accessed
                        const firstModule = getModules()[0];
                        if (firstModule) {
                          navigateToModule(firstModule.id || firstModule.moduleId);
                        }
                      }
                    }}
                  >
                    Continue Learning
                  </Button>
                )}
              </div>
            </motion.div>
          </div>
        </div>
        
        {/* Course Tabs */}
        <motion.div variants={itemVariants}>
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="mb-8">
              <TabsTrigger value="overview" className="text-base py-2 px-4">Overview</TabsTrigger>
              <TabsTrigger value="curriculum" className="text-base py-2 px-4">Curriculum & Progress</TabsTrigger>
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
                          {getCourseMetadata('description', 'This course provides comprehensive instruction on the subject matter, covering fundamental concepts and advanced techniques. Through interactive lessons, practical exercises, and knowledge checks, you will develop a strong understanding of the material and be able to apply it in real-world scenarios.')}
                        </p>
                        
                        <h3 className="text-lg font-bold mt-6 mb-3 text-gray-800 dark:text-gray-200">Learning Objectives</h3>
                        <ul className="space-y-2">
                          {getModules().length > 0 && getModules()[0].learningObjectives ? (
                            getModules()[0].learningObjectives.map((objective, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                                <div className="mt-1.5 h-2 w-2 bg-blue-600 rounded-full flex-shrink-0"></div>
                                <span>{objective}</span>
                              </li>
                            ))
                          ) : (
                            <li className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                              <div className="mt-1.5 h-2 w-2 bg-blue-600 rounded-full flex-shrink-0"></div>
                              <span>Master the key concepts in this subject area</span>
                            </li>
                          )}
                        </ul>
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
                        {(getCourseMetadata('prerequisites', ['No prerequisites required'])).map((prereq, index) => (
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
                  {/* Course Progress/Enrollment Card */}
                  <CourseProgressCard 
                    course={course} 
                    progress={courseProgress}
                    onEnroll={handleEnrollSuccess}
                    isEnrolling={isEnrolling}
                  />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="curriculum" className="mt-0">
              <div className="space-y-6">
                {/* Course Progress Summary (shown when enrolled) */}
                {courseProgress && (
                  <Card className="overflow-hidden border-none shadow-lg mb-6">
                    <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
                      <CardTitle className="text-xl">Your Learning Journey</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="space-y-6">
                        {/* Course completion progress */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold text-gray-800 dark:text-gray-200">Course Completion</h3>
                            <span className="font-medium">{courseProgress.progressPercentage}%</span>
                          </div>
                          <Progress value={courseProgress.progressPercentage} className="h-2" />
                        </div>
                        
                        {/* XP earned */}
                        <div className="flex justify-between items-center bg-blue-50 dark:bg-blue-900/10 p-4 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 dark:bg-blue-800/50 rounded-full">
                              <Star className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-800 dark:text-gray-200">Experience Earned</h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400">Keep learning to gain more XP and level up</p>
                            </div>
                          </div>
                          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                            {courseProgress.earnedXP} XP
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Modules with Progress */}
                <Card className="overflow-hidden border-none shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 border-b">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-blue-600" />
                        Course Curriculum
                      </CardTitle>
                      <div className="text-sm text-gray-500">
                        {getModules().length} modules
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0 divide-y">
                  {getModules().map((module, index) => {
                    // Get module progress data if available
                    const moduleProgress = courseProgress && courseProgress.moduleProgressMap 
                      ? courseProgress.moduleProgressMap[module.id || module.moduleId]
                      : null;
                    
                    // Determine module state for UI
                    const moduleState = moduleProgress ? moduleProgress.state : null;
                    const isLocked = moduleState === "LOCKED";
                    const isCompleted = moduleState === "COMPLETED";
                    const isInProgress = moduleState === "IN_PROGRESS";
                    const progressPercentage = moduleProgress ? moduleProgress.progressPercentage : 0;
                    const earnedXP = moduleProgress ? moduleProgress.earnedXP : 0;
                    
                    return (
                      <motion.div 
                        key={module.moduleId || module.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className={`group hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors ${
                          isLocked ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                        }`}
                      >
                        <div className="p-5">
                          <div className="flex flex-col space-y-4">
                            {/* Module header with title and status */}
                            <div 
                              className="flex justify-between items-center"
                              onClick={() => !isLocked && navigateToModule(module.id || module.moduleId)}
                            >
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  {/* Module status icon */}
                                  {isCompleted && (
                                    <div className="p-1 bg-green-100 dark:bg-green-900/30 rounded-full text-green-600 dark:text-green-400">
                                      <CheckCircle className="h-4 w-4" />
                                    </div>
                                  )}
                                  
                                  {isInProgress && (
                                    <div className="p-1 bg-blue-100 dark:bg-blue-900/30 rounded-full text-blue-600 dark:text-blue-400">
                                      <Clock className="h-4 w-4" />
                                    </div>
                                  )}
                                  
                                  {isLocked && (
                                    <div className="p-1 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-500">
                                      <Lock className="h-4 w-4" />
                                    </div>
                                  )}
                                  
                                  <h3 className={`text-lg font-medium group-hover:text-blue-700 transition-colors ${
                                    isCompleted ? "text-green-700 dark:text-green-400" : 
                                    isInProgress ? "text-blue-700 dark:text-blue-400" :
                                    "text-gray-800 dark:text-gray-200"
                                  }`}>
                                    {module.title}
                                  </h3>
                                  
                                  {/* Module status badge */}
                                  {moduleProgress && (
                                    <Badge className={`
                                      ${isCompleted ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" : 
                                        isInProgress ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" :
                                        moduleState === "UNLOCKED" ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" :
                                        "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400"}
                                      border-none ml-2
                                    `}>
                                      {moduleState?.replace("_", " ") || "Not Started"}
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                                  <div className="flex items-center">
                                    <Clock className="h-4 w-4 mr-1" />
                                    <span>{module.duration || "1-2 hours"}</span>
                                  </div>
                                  {module.complexityLevel && (
                                    <>
                                      <div className="h-1 w-1 bg-gray-300 rounded-full"></div>
                                      <span>{module.complexityLevel}</span>
                                    </>
                                  )}
                                  
                                  {/* XP indicator if enrolled */}
                                  {moduleProgress && moduleProgress.earnedXP > 0 && (
                                    <>
                                      <div className="h-1 w-1 bg-gray-300 rounded-full"></div>
                                      <div className="flex items-center">
                                      <Star className="h-4 w-4 mr-1 text-yellow-500" />
                                        <span>{moduleProgress.earnedXP} XP</span>
                                      </div>
                                    </>
                                  )}
                                </div>
                                <p className="text-gray-600 mt-2 line-clamp-2">
                                  {module.description}
                                </p>
                              </div>
                              <div className={`text-blue-600 group-hover:translate-x-1 transition-transform ${
                                isLocked ? "opacity-50" : ""
                              }`}>
                                <ChevronRight className="h-5 w-5" />
                              </div>
                            </div>
                            
                            {/* Progress bar for module (only if enrolled) */}
                            {moduleProgress && (
                              <div className="pt-2">
                                <div className="flex justify-between items-center text-sm mb-1">
                                  <span className="text-gray-600 dark:text-gray-400">Progress</span>
                                  <span className="font-medium">{progressPercentage}%</span>
                                </div>
                                <Progress value={progressPercentage} className="h-1.5" />
                                
                                {/* Additional module stats if in progress */}
                                {isInProgress && moduleProgress.lastAccessed && (
                                  <div className="flex justify-end mt-2">
                                    <Badge variant="outline" className="bg-transparent text-xs text-gray-500">
                                      <Clock className="h-3 w-3 mr-1" />
                                      Last studied: {new Date(moduleProgress.lastAccessed).toLocaleDateString()}
                                    </Badge>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </motion.div>
      
      {/* Enrollment Modal */}
      <AnimatePresence>
        {showEnrollModal && (
          <EnrollmentModal 
            isOpen={showEnrollModal}
            onClose={() => setShowEnrollModal(false)}
            course={course}
            onSuccess={handleEnrollSuccess}
          />
        )}
      </AnimatePresence>
    </div>
  );
}