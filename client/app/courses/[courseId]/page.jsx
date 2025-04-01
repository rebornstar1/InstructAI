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
  Users,
  Award,
  Clock,
  Layers,
  CheckCircle,
  Star,
  Brain
} from "lucide-react";

export default function CourseDetailPage({ params }) {
  const { courseId } = params;
  const [course, setCourse] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const router = useRouter();

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`http://localhost:8007/api/courses/simplified/${courseId}`);
        
        if (!response.ok) {
          throw new Error("Failed to fetch course");
        }
        
        const data = await response.json();
        setCourse(data);
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

  const navigateToModule = (moduleId) => {
    router.push(`/courses/${courseId}/module/${moduleId}`);
  };

  const navigateBack = () => {
    router.push("/");
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
          Back to Home
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

  // Calculate course completion percentage (placeholder)
  const calculateCompletion = () => {
    const totalModules = getModules().length;
    const completedModules = 0; // This would come from user progress data
    return totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Button 
        variant="ghost" 
        onClick={navigateBack} 
        className="mb-6"
      >
        <ChevronLeft className="mr-2 h-4 w-4" />
        Back to Home
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
                    <Award className="h-3.5 w-3.5 mr-1" />
                    {getCourseMetadata('difficultyLevel', 'Mixed')}
                  </Badge>
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
                  {/* Course Progress Card */}
                  <Card className="overflow-hidden border-none shadow-lg">
                    <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6">
                      <CardTitle className="text-xl flex items-center gap-2">
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
                            <p className="text-xl font-bold text-blue-600">0/{getModules().length}</p>
                            <p className="text-gray-500">Modules</p>
                          </div>
                          <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                            <p className="text-gray-500 mb-1">Time Spent</p>
                            <p className="text-xl font-bold text-blue-600">0h 0m</p>
                            <p className="text-gray-500">Learning</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    <CardContent className="bg-gray-50 dark:bg-gray-800 p-6 border-t">
                      <Button className="w-full bg-blue-600 hover:bg-blue-700 gap-2">
                        Start Learning
                      </Button>
                    </CardContent>
                  </Card>
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
                        {getModules().length} modules
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0 divide-y">
                    {getModules().map((module, index) => (
                      <motion.div 
                        key={module.moduleId || module.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className="group hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors"
                      >
                        <div 
                          className="p-5 cursor-pointer"
                          onClick={() => navigateToModule(module.moduleId || module.id)}
                        >
                          <div className="flex justify-between items-center">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 group-hover:text-blue-700 transition-colors">
                                  {module.title}
                                </h3>
                              </div>
                              <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                                <div className="flex items-center gap-1">
                                  <Clock className="h-4 w-4" />
                                  <span>{module.duration || "1-2 hours"}</span>
                                </div>
                                {module.complexityLevel && (
                                  <>
                                    <div className="h-1 w-1 bg-gray-300 rounded-full"></div>
                                    <span>{module.complexityLevel}</span>
                                  </>
                                )}
                              </div>
                              <p className="text-gray-600 mt-2 line-clamp-2">
                                {module.description}
                              </p>
                            </div>
                            <div className="text-blue-600 group-hover:translate-x-1 transition-transform">
                              <ChevronRight className="h-5 w-5" />
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </motion.div>
    </div>
  );
}