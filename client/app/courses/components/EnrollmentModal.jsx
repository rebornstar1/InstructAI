"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen, 
  X, 
  CheckCircle, 
  Award, 
  Clock, 
  Layers, 
  Sparkles 
} from "lucide-react";
import { enrollInCourse } from "@/services/progressApi";

const EnrollmentModal = ({ isOpen, onClose, course, onSuccess }) => {
  const [enrollingState, setEnrollingState] = useState("idle"); // idle, enrolling, success, error
  const [loadingProgress, setLoadingProgress] = useState(0);
  
  if (!isOpen || !course) return null;
  
  const handleEnroll = async () => {
    setEnrollingState("enrolling");
    setLoadingProgress(0);
    
    // Simulate progressive loading
    const progressInterval = setInterval(() => {
      setLoadingProgress(prev => {
        const newValue = prev + Math.random() * 15;
        return newValue > 90 ? 90 : newValue;
      });
    }, 300);
    
    try {
      const progress = await enrollInCourse(course.id);
      clearInterval(progressInterval);
      setLoadingProgress(100);
      setEnrollingState("success");
      
      // After a successful animation, inform the parent component
      setTimeout(() => {
        if (onSuccess) onSuccess(progress);
      }, 1500);
    } catch (error) {
      clearInterval(progressInterval);
      setLoadingProgress(100);
      setEnrollingState("error");
      console.error("Error enrolling in course:", error);
    }
  };
  
  const resetAndClose = () => {
    onClose();
    // Reset the state after animation completes
    setTimeout(() => {
      setEnrollingState("idle");
      setLoadingProgress(0);
    }, 300);
  };
  
  // Calculate total duration based on modules
  const calculateTotalDuration = (modules) => {
    if (!modules || modules.length === 0) return "Self-paced";
    
    let totalMinutes = 0;
    
    modules.forEach(module => {
      const duration = module.duration || "";
      
      // Extract hours
      const hoursMatch = duration.match(/(\d+(\.\d+)?)\s*hour/i);
      if (hoursMatch) {
        totalMinutes += parseFloat(hoursMatch[1]) * 60;
      }
      
      // Extract minutes
      const minutesMatch = duration.match(/(\d+)\s*minute/i);
      if (minutesMatch) {
        totalMinutes += parseInt(minutesMatch[1]);
      }
    });
    
    if (totalMinutes === 0) return "Self-paced";
    
    // Convert back to hours and minutes
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    if (hours === 0) return `${minutes} minutes`;
    if (minutes === 0) return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
    return `${hours} ${hours === 1 ? 'hour' : 'hours'}, ${minutes} minutes`;
  };
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-white dark:bg-gray-900 rounded-xl max-w-xl w-full overflow-hidden shadow-xl"
      >
        {/* Header */}
        <div className="relative">
          <div className="h-2 bg-gradient-to-r from-blue-600 to-indigo-600 w-full absolute top-0 left-0 z-10"></div>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 z-10 bg-white/80 hover:bg-white dark:bg-gray-800/80 dark:hover:bg-gray-800 rounded-full"
            onClick={resetAndClose}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>
          
          {/* Course Image/Banner */}
          <div className="bg-gradient-to-br from-blue-600 to-indigo-800 h-32 flex items-center justify-center relative">
            <div className="absolute inset-0 bg-[url('/path/to/pattern.svg')] opacity-10"></div>
            <div className="relative z-10 p-8">
              <div className="h-16 w-16 bg-white/20 backdrop-blur-xl rounded-xl flex items-center justify-center">
                <BookOpen className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>
        </div>
        
        {/* Content */}
        {enrollingState === "idle" && (
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-2 text-gray-800 dark:text-gray-200">
              {course.courseMetadata?.title || "Course"}
            </h2>
            
            <div className="flex flex-wrap gap-2 mb-4">
              <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-none">
                <Award className="h-3.5 w-3.5 mr-1" />
                {course.courseMetadata?.difficultyLevel || "Mixed"}
              </Badge>
              
              {course.modules && (
                <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200 border-none">
                  <Layers className="h-3.5 w-3.5 mr-1" />
                  {course.modules.length} modules
                </Badge>
              )}
              
              <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-200 border-none">
                <Clock className="h-3.5 w-3.5 mr-1" />
                {calculateTotalDuration(course.modules)}
              </Badge>
            </div>
            
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {course.courseMetadata?.description || "No description available."}
            </p>
            
            <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-lg mb-6 border border-blue-100 dark:border-blue-800">
              <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2 flex items-center">
                <Sparkles className="h-4 w-4 text-blue-600 mr-2" />
                What you'll get
              </h3>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <span className="text-gray-700 dark:text-gray-300">Track your progress through modules and quizzes</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <span className="text-gray-700 dark:text-gray-300">Earn XP and level up as you complete content</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <span className="text-gray-700 dark:text-gray-300">Access all learning materials and resources</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <span className="text-gray-700 dark:text-gray-300">Receive a certificate upon completion</span>
                </li>
              </ul>
            </div>
            
            <Button
              className="w-full bg-blue-600 hover:bg-blue-700 py-6 text-lg"
              onClick={handleEnroll}
            >
              Enroll in this Course
            </Button>
          </div>
        )}
        
        {/* Enrolling State */}
        {enrollingState === "enrolling" && (
          <div className="p-8 flex flex-col items-center justify-center text-center">
            <div className="relative w-20 h-20 mb-6">
              <div className="absolute inset-0 rounded-full border-4 border-t-blue-600 border-blue-100 animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <BookOpen className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            
            <h3 className="text-xl font-bold mb-2 text-gray-800 dark:text-gray-200">
              Enrolling in Course
            </h3>
            
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Please wait while we set up your course and prepare your learning materials...
            </p>
            
            <div className="w-full mb-2">
              <Progress value={loadingProgress} className="h-2" />
            </div>
            <p className="text-sm text-gray-500">{Math.round(loadingProgress)}%</p>
          </div>
        )}
        
        {/* Success State */}
        {enrollingState === "success" && (
          <div className="p-8 flex flex-col items-center justify-center text-center">
            <div className="bg-green-100 dark:bg-green-900/30 p-4 rounded-full mb-6">
              <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
            </div>
            
            <h3 className="text-xl font-bold mb-2 text-gray-800 dark:text-gray-200">
              Successfully Enrolled!
            </h3>
            
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              You're now enrolled in this course. Your progress will be tracked, and you'll earn XP as you complete modules and quizzes.
            </p>
            
            <Button 
              className="bg-green-600 hover:bg-green-700"
              onClick={resetAndClose}
            >
              Start Learning
            </Button>
          </div>
        )}
        
        {/* Error State */}
        {enrollingState === "error" && (
          <div className="p-8 flex flex-col items-center justify-center text-center">
            <div className="bg-red-100 dark:bg-red-900/30 p-4 rounded-full mb-6">
              <X className="h-12 w-12 text-red-600 dark:text-red-400" />
            </div>
            
            <h3 className="text-xl font-bold mb-2 text-gray-800 dark:text-gray-200">
              Enrollment Failed
            </h3>
            
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              There was an issue enrolling you in this course. Please try again or contact support if the problem persists.
            </p>
            
            <div className="flex gap-3">
              <Button 
                variant="outline"
                onClick={resetAndClose}
              >
                Close
              </Button>
              
              <Button 
                className="bg-blue-600 hover:bg-blue-700"
                onClick={handleEnroll}
              >
                Try Again
              </Button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default EnrollmentModal;