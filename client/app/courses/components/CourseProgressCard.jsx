import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Clock, 
  Award, 
  Star, 
  Users, 
  CheckCircle, 
  FileText, 
  BookOpen,
  Lock,
  Play
} from "lucide-react";
import { enrollInCourse } from "@/services/progressApi";
import { toast } from "@/components/ui/use-toast";

/**
 * CourseProgressCard - Displays course progress and enrollment options
 * 
 * @param {Object} props - Component props
 * @param {Object} props.course - Course data
 * @param {Object} props.progress - Course progress data
 * @param {Function} props.onEnroll - Callback when user enrolls
 * @param {boolean} props.isEnrolling - Whether enrollment is in progress
 */
const CourseProgressCard = ({ course, progress, onEnroll, isEnrolling }) => {
  const [loading, setLoading] = useState(isEnrolling || false);
  
  // Handle enrollment
  const handleEnroll = async () => {
    if (loading) return;
    
    setLoading(true);
    try {
      const progressData = await enrollInCourse(course.id);
      
      // Show success message
      toast({
        title: "Enrolled Successfully",
        description: "You have been enrolled in this course",
        variant: "success",
      });
      
      // Call parent callback
      if (onEnroll) {
        onEnroll(progressData);
      }
    } catch (error) {
      console.error("Error enrolling in course:", error);
      
      toast({
        title: "Enrollment Failed",
        description: "There was a problem enrolling in this course",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  // If not enrolled, show enrollment card
  if (!progress) {
    return (
      <Card className="overflow-hidden border-none shadow-lg">
        <div className="bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 border-b border-blue-200 dark:border-blue-800/50">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            Enroll in This Course
          </h2>
        </div>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full text-blue-600 dark:text-blue-400">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <div className="text-lg font-medium text-gray-800 dark:text-gray-200">
                  {course.modules?.length || 0} Modules
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Complete structured curriculum
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-4 bg-purple-50 dark:bg-purple-900/10 rounded-lg">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-full text-purple-600 dark:text-purple-400">
                <Award className="h-5 w-5" />
              </div>
              <div>
                <div className="text-lg font-medium text-gray-800 dark:text-gray-200">
                  Earn XP & Recognition
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Track your progress through the material
                </p>
              </div>
            </div>
            
            <div className="mt-6">
              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700"
                onClick={handleEnroll}
                disabled={loading}
              >
                {loading ? "Enrolling..." : "Enroll Now (Free)"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Course progress display
  const progressPercentage = progress.progressPercentage || 0;
  const earnedXP = progress.earnedXP || 0;
  const state = progress.state || "NOT_STARTED";
  const lastAccessed = new Date(progress.lastAccessedAt || Date.now()).toLocaleDateString();
  
  return (
    <Card className="overflow-hidden border-none shadow-lg">
      <div className={`p-6 border-b ${
        state === "COMPLETED" 
          ? "bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800/50"
          : "bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800/50"
      }`}>
        <div className="flex justify-between items-start">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-blue-600" />
            Your Progress
          </h2>
          
          <Badge className={`${
            state === "COMPLETED" 
              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" 
              : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
          } border-none`}>
            {state.replace("_", " ")}
          </Badge>
        </div>
      </div>
      <CardContent className="p-6">
        <div className="space-y-5">
          {/* Progress Bar */}
          <div>
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
              <span>Course Completion</span>
              <span>{progressPercentage}%</span>
            </div>
            <div className="h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full ${
                  state === "COMPLETED" 
                    ? "bg-green-500 dark:bg-green-600" 
                    : "bg-blue-500 dark:bg-blue-600"
                }`}
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
          
          {/* XP Earned */}
          <div className="flex items-center gap-3 p-4 bg-purple-50 dark:bg-purple-900/10 rounded-lg">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-full text-purple-600 dark:text-purple-400">
              <Star className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="text-lg font-medium text-gray-800 dark:text-gray-200">
                {earnedXP} XP Earned
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Continue learning to earn more
              </p>
            </div>
          </div>
          
          {/* Last Accessed */}
          <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-600 dark:text-gray-400">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
                Last accessed on {lastAccessed}
              </div>
            </div>
          </div>
          
          {/* Module Stats */}
          <div className="grid grid-cols-2 gap-3 mt-2">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                {course.modules?.filter((_, i) => {
                  // Check if module is unlocked in progress map
                  const moduleProgress = progress.moduleProgressMap?.[course.modules[i].id];
                  return moduleProgress && moduleProgress.state !== "LOCKED";
                }).length || 0}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Modules Unlocked
              </div>
            </div>
            
            <div className="p-3 bg-green-50 dark:bg-green-900/10 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-700 dark:text-green-400">
                {course.modules?.filter((_, i) => {
                  // Check if module is completed in progress map
                  const moduleProgress = progress.moduleProgressMap?.[course.modules[i].id];
                  return moduleProgress && moduleProgress.state === "COMPLETED";
                }).length || 0}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Modules Completed
              </div>
            </div>
          </div>
          
          {/* Continue Button */}
          {state !== "COMPLETED" && (
            <Button className="w-full mt-2 bg-blue-600 hover:bg-blue-700">
              <Play className="mr-2 h-4 w-4" />
              Continue Learning
            </Button>
          )}
          
          {state === "COMPLETED" && (
            <Button variant="outline" className="w-full mt-2 border-green-200 text-green-800 hover:bg-green-50">
              <CheckCircle className="mr-2 h-4 w-4" />
              Review Course
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CourseProgressCard;